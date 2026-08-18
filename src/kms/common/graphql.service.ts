import { GraphQL } from "../constant";

export interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

export interface GraphQLRequestOptions<TInput = Record<string, unknown>> {
  query: string;
  variables?: TInput;
  formData?: FormData;
}

const getAuthToken = (): string =>
  localStorage.getItem(GraphQL.AUTH_TOKEN_KEY) ?? "";

export const graphqlRequest = async <
  TResponse,
  TInput = Record<string, unknown>,
>(
  options: GraphQLRequestOptions<TInput>,
): Promise<GraphQLResponse<TResponse>> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    Authorization: token ? `Bearer ${token}` : "",
  };

  let body: BodyInit;

  if (options.formData) {
    body = options.formData;
  } else {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify({
      query: options.query,
      variables: options.variables,
    });
  }

  const response = await fetch(GraphQL.URL, {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status}`);
  }

  return response.json() as Promise<GraphQLResponse<TResponse>>;
};
