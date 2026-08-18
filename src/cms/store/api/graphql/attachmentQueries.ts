// src/cms/store/api/graphql/attachmentQueries.ts
// Maps REST-style keys to GraphQL operation configs for the Attachment domain
// Source: curl example - Attachment.UploadFileCRM (multipart file upload)

const UPLOAD_FILE_MUTATION = {
  operationName: "UploadFileCRM",
  root: "Attachment",
  inputType: "UploadFileInput!",
  fields: `status msg data`,
  mutation: true,
  upload: {
    enabled: true,
    fileField: "file"
  },
  // CMS-domain upload paths route to UploadFileCMS; everything else (e.g. "customer",
  // "sparepart", "product") falls back to the default UploadFileCRM operation above.
  operationNameByPathParam: {
    param: "path",
    map: {
      case: "UploadFileCMS",
      close: "UploadFileCMS",
      profile: "UploadFileCMS",
      dynamicForm: "UploadFileCMS"
    }
  }
};

// ─── Registration Map ─────────────────────────────────────────────────────────

export const GQL_ATTACHMENT = {
  "/upload/:path": UPLOAD_FILE_MUTATION,
};
