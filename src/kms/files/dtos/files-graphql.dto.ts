export interface KBFileListGraphQLData {
  statusCode: number;
  success: boolean;
  message: string;
  data?: {
    data?: {
      recent: unknown[];
      folders: unknown[];
      files: unknown[];
      currentPath: string;
      totalFiles: number;
      totalFolders: number;
    };
    meta?: {
      key: string;
      endpoint: string;
      source: string;
    };
  };
}
