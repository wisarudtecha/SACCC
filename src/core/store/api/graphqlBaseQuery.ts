// src/core/store/api/graphqlBaseQuery.ts
import { BaseQueryFn } from "@reduxjs/toolkit/query";
import { containsFile, extractFiles, replaceFilesWithNull } from "@/core/utils/gqlUtils";
import { TokenManager } from "@/core/utils/tokenManager";

interface GraphQLArgs {
  body: string;
  variables?: Record<string, unknown>;
}

interface SerializedError {
  status: string;
  message: string;
}

// GraphQL multipart request spec (https://github.com/jaydenseric/graphql-multipart-request-spec)
// used whenever `variables` carries a File/Blob (RTK/fetch can't JSON-serialize those)
const buildUploadFormData = (query: string, variables: Record<string, unknown>) => {
  const files = extractFiles(variables, "variables");
  const formData = new FormData();

  formData.append("operations", JSON.stringify({
    query,
    variables: replaceFilesWithNull(variables)
  }));
  formData.append("map", JSON.stringify(
    Object.fromEntries(files.map(({ key, path }) => [key, [path]]))
  ));
  files.forEach(({ key, file }) => formData.append(key, file));

  return formData;
};

export const graphqlBaseQuery = (baseUrl: string): BaseQueryFn<GraphQLArgs, unknown, unknown> => async ({ body, variables }) => {
  try {
    const token = TokenManager.getToken();
    const hasUpload = containsFile(variables);

    const result = await fetch(baseUrl, {
      method: "POST",
      headers: {
        ...(hasUpload
          ? { "apollo-require-preflight": "true" }
          : { "Content-Type": "application/json" }),
        ...(token && {
          Authorization: `Bearer ${token}`
        })
      },
      body: hasUpload
        ? buildUploadFormData(body, variables!)
        : JSON.stringify({
            query: body,
            variables
          })
    });

    const json = await result.json();

    if (json.errors) {
      console.error("🚀 ~ graphqlBaseQuery ~ json.errors:", json.errors);

      return {
        // error: json.errors
        error: {
          status: "GRAPHQL_ERROR",
          errors: json.errors
        }
      };
    }

    return {
      data: json.data
    };
  }
  catch (error) {
    console.error("🚀 ~ graphqlBaseQuery ~ error:", error);

    return {
      // error
      error: {
        status: "FETCH_ERROR",
        message: error instanceof Error ? error.message : "An unknown error occurred"
      } satisfies SerializedError
    };
  }
};
