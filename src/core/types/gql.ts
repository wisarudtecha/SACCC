// src/core/types/gql.ts
export type ExtractedFile = {
  key: string;
  file: File | Blob;
  path: string;
};

export type GqlMapConfig = {
  operationName: string;
  root: string;
  inputType?: string;
  fields: string;
  mutation?: boolean;
  upload?: {
    enabled: boolean;
    // default: "file"
    fileField?: string;
    // support nested field path
    variablePath?: string;
  };
  // Pick a different operationName based on a resolved :param value
  // e.g. "/upload/:path" with path="case" -> UploadFileCMS, otherwise the default operationName
  operationNameByPathParam?: {
    param: string;
    map: Record<string, string>;
  };
};
