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
  // Keys removed from the mutation input before it is sent. GraphQL input types are
  // curated server-side subsets of the record, and callers build bodies from read-model
  // spreads that can carry fields the input type does not define (e.g. customerId on
  // CaseUpdateInput - customer linking goes through its own mutation). REST bodies are
  // untouched; this only applies to the GraphQL mapping layer.
  //
  // Dotted paths reach into nested objects/arrays (e.g. "attachments.orgId" removes
  // orgId from every item of input.attachments) for nested input types that are
  // stricter than the record's read model (AttachmentInput accepts only
  // id/type/attId/attName/attUrl).
  omitInputFields?: string[];
};
