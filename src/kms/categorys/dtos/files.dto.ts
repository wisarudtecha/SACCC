export type FileBlockKey = "list" | "tree";

export type FileDataSource = "mock" | "api";

export type FileExtension =
  | "pdf"
  | "xls"
  | "xlsx"
  | "psd"
  | "zip"
  | "txt"
  | "png"
  | "jpg"
  | "jpeg"
  | "docx"
  | "doc"
  | "csv"
  | "mp4"
  | "mov"
  | "other";

export interface FileItem {
  id: string;
  name: string;
  extension: FileExtension;
  /** Bytes */
  size: number;
  /** Human-readable size, e.g. "2.00 GB" */
  sizeLabel: string;
  /** MinIO object key, e.g. "documents/contracts/NDA.pdf" */
  path: string;
  mimeType: string;
  lastModifiedAt: string;
  /** Relative label, e.g. "1 hour ago" */
  lastModifiedLabel: string;
}

export interface FolderItem {
  id: string;
  name: string;
  /** MinIO prefix, e.g. "documents/contracts/" */
  path: string;
  fileCount: number;
  sizeLabel: string;
}

export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "folder";
  extension?: FileExtension;
  fileCount?: number;
  children?: FileTreeNode[];
}

export interface FileListResult {
  recent: FileItem[];
  folders: FolderItem[];
  files: FileItem[];
  currentPath: string;
}

export interface FileBlockDataMap {
  list: FileListResult;
  tree: FileTreeNode[];
}

export interface FileBlockMeta {
  key: FileBlockKey;
  endpoint: string;
  source: FileDataSource;
}

export interface FileBlockResponse<TData> {
  data: TData;
  meta: FileBlockMeta;
}

export interface FileUploadInput {
  name: string;
  size: number;
  mimeType: string;
  /** Destination path prefix, e.g. "documents/contracts/" */
  destPath: string;
}

export interface FilePresignedUrl {
  uploadUrl: string;
  objectKey: string;
  expiresIn: number;
}
