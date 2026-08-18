import {
  FileEndpoints,
  General,
  //MODE,
} from "@/kms/constant";
import {
  isRecord,
  pickFirst,
  toNumber,
  toStringValue,
  formatBytes,
  LooseRecord,
  //wait,
} from "@/kms/common/common.transform.service";
import { graphqlRequest } from "@/kms/common/graphql.service";
import type { KBFileListGraphQLData } from "@/kms/files/dtos/files-graphql.dto";
import {
  FileBlockDataMap,
  FileBlockKey,
  FileBlockResponse,
  FileExtension,
  FileItem,
  FileListResult,
  FileTreeNode,
  FolderItem,
} from "../dtos/files.dto";

type BlockValue<K extends FileBlockKey> = FileBlockDataMap[K];

// ─── helpers ────────────────────────────────────────────────────────────────

const normalizeExtension = (name: string): FileExtension => {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const known: FileExtension[] = [
    "pdf", "xls", "xlsx", "psd", "zip", "txt",
    "png", "jpg", "jpeg", "docx", "doc", "csv", "mp4", "mov",
  ];
  return known.includes(ext as FileExtension) ? (ext as FileExtension) : "other";
};

// ─── mappers ─────────────────────────────────────────────────────────────────

const mapFileItem = (raw: LooseRecord): FileItem => {
  const name = toStringValue(
    pickFirst(raw.name, raw.fileName, raw.objectName, raw.key),
    "unknown",
  );
  const size = toNumber(pickFirst(raw.size, raw.contentLength, raw.fileSize), 0);
  return {
    id: toStringValue(pickFirst(raw.id, raw.objectKey, raw.key, raw.etag), name),
    name,
    extension: normalizeExtension(name),
    size,
    sizeLabel: toStringValue(pickFirst(raw.sizeLabel, raw.humanSize), formatBytes(size)),
    path: toStringValue(pickFirst(raw.path, raw.objectKey, raw.key), name),
    mimeType: toStringValue(
      pickFirst(raw.mimeType, raw.contentType, raw.type),
      "application/octet-stream",
    ),
    lastModifiedAt: toStringValue(
      pickFirst(raw.lastModifiedAt, raw.lastModified, raw.updatedAt, raw.modified),
      "",
    ),
    lastModifiedLabel: toStringValue(
      pickFirst(raw.lastModifiedLabel, raw.modifiedLabel, raw.timeAgo),
      "",
    ),
  };
};

const mapFolderItem = (raw: LooseRecord): FolderItem => {
  const name = toStringValue(pickFirst(raw.name, raw.folderName, raw.prefix), "folder");
  const totalSize = toNumber(pickFirst(raw.totalSize, raw.size), 0);
  return {
    id: toStringValue(pickFirst(raw.id, raw.path, raw.prefix), name),
    name,
    path: toStringValue(pickFirst(raw.path, raw.prefix), name + "/"),
    fileCount: toNumber(pickFirst(raw.fileCount, raw.count, raw.total), 0),
    sizeLabel: toStringValue(pickFirst(raw.sizeLabel, raw.humanSize), formatBytes(totalSize)),
  };
};

const mapFileTreeNode = (raw: LooseRecord): FileTreeNode => {
  const name = toStringValue(pickFirst(raw.name, raw.key), "");
  const type = toStringValue(pickFirst(raw.type), "file") as "file" | "folder";
  const children = Array.isArray(raw.children)
    ? raw.children.filter(isRecord).map(mapFileTreeNode)
    : undefined;
  return {
    id: toStringValue(pickFirst(raw.id, raw.path), name),
    name,
    path: toStringValue(pickFirst(raw.path, raw.prefix), ""),
    type,
    extension: type === "file" ? normalizeExtension(name) : undefined,
    fileCount: toNumber(pickFirst(raw.fileCount, raw.count), 0),
    children: children && children.length > 0 ? children : undefined,
  };
};

const mapFileListResult = (raw: LooseRecord, currentPath: string): FileListResult => {
  const recent = Array.isArray(raw.recent)
    ? raw.recent.filter(isRecord).map(mapFileItem)
    : [];
  const folders = Array.isArray(raw.folders)
    ? raw.folders.filter(isRecord).map(mapFolderItem)
    : [];
  const files = Array.isArray(raw.files)
    ? raw.files.filter(isRecord).map(mapFileItem)
    : [];
  return { recent, folders, files, currentPath };
};




// ─── API fetch: GraphQL ───────────────────────────────────────────────────────

const fetchListFromGraphQL = async (prefix: string): Promise<FileListResult> => {
  const folder = prefix || "";
  const query = `query { KBArticlefile { GetFileList(input:{ folder:"${folder}" }) { statusCode success message data } } }`;

  const res = await graphqlRequest<{ KBArticlefile: { GetFileList: KBFileListGraphQLData } }>({ query });

  const gqlResult = res.data?.KBArticlefile?.GetFileList;
  if (!gqlResult?.success) {
    throw new Error(gqlResult?.message ?? "GetFileList failed");
  }

  // response.data.data contains { recent, folders, files, currentPath, ... }
  const outerData = isRecord(gqlResult.data) ? gqlResult.data : {};
  const listData = isRecord(outerData.data) ? outerData.data : outerData;

  return mapFileListResult(listData as LooseRecord, prefix);
};

const keepFoldersOnly = (nodes: FileTreeNode[]): FileTreeNode[] =>
  nodes
    .filter((n) => n.type === "folder")
    .map((n) => ({ ...n, children: n.children ? keepFoldersOnly(n.children) : undefined }));

const fetchTreeFromGraphQL = async (): Promise<FileTreeNode[]> => {
  const query = `query { KBArticlefile { GetFileTree(input:{}) { statusCode success message data } } }`;
  const res = await graphqlRequest<{ KBArticlefile: { GetFileTree: KBFileListGraphQLData } }>({ query });
  const gqlResult = res.data?.KBArticlefile?.GetFileTree;
  if (!gqlResult?.success) throw new Error(gqlResult?.message ?? "GetFileTree failed");
  const outerData = isRecord(gqlResult.data) ? gqlResult.data : {};
  const nodes = Array.isArray(outerData.data) ? outerData.data : [];
  const mapped = keepFoldersOnly(nodes.filter(isRecord).map(mapFileTreeNode));
  // if (mapped.length === 1 && mapped[0].path === "") 
  //   return mapped[0].children ?? [];
  return mapped;
};

// ─── mock block router ────────────────────────────────────────────────────────



const fetchApiBlock = async <K extends FileBlockKey>(
  block: K,
  prefix?: string,
): Promise<BlockValue<K>> => {
  if (block === "tree") return fetchTreeFromGraphQL() as Promise<BlockValue<K>>;
  return fetchListFromGraphQL(prefix ?? "") as Promise<BlockValue<K>>;
};

// ─── mutation: delete ─────────────────────────────────────────────────────────



const deleteApiFile = async (objectKey: string): Promise<void> => {
  const query = `query { KBArticlefile { DeleteFile(input:{ key:"${objectKey}" }) { statusCode success message } } }`;
  const res = await graphqlRequest<{ KBArticlefile: { DeleteFile: KBMutationResult } }>({ query });
  const result = res.data?.KBArticlefile?.DeleteFile;
  if (!result?.success) throw new Error(result?.message ?? "DeleteFile failed");
};

// ─── GraphQL result types ─────────────────────────────────────────────────────

interface KBMutationResult {
  statusCode: number;
  success: boolean;
  message: string;
}

// ─── mutation: presign via GraphQL ───────────────────────────────────────────

interface KBPresignResult {
  statusCode: number;
  success: boolean;
  message: string;
  data?: { url?: string; viewUrl?: string; key?: string; expiresIn?: number; fileName?: string };
}

const fetchPresignGQL = async (
  operation: "GetFilePreview" | "GetFileDownload",
  key: string,
): Promise<string> => {
  const query = `query { KBArticlefile { ${operation}(input:{ key:"${key}" }) { statusCode success message data } } }`;
  const res = await graphqlRequest<{ KBArticlefile: Record<string, KBPresignResult> }>({ query });
  const result = res.data?.KBArticlefile?.[operation];
  if (!result?.success || !result.data?.url) {
    throw new Error(result?.message ?? `${operation} failed`);
  }
  return result.data.url;
};



const getApiDownloadUrl = (objectKey: string): Promise<string> =>
  fetchPresignGQL("GetFileDownload", objectKey);

const getApiPreviewUrl = (objectKey: string): Promise<string> =>
  fetchPresignGQL("GetFilePreview", objectKey);

const getApiCopyUrl = async (objectKey: string): Promise<string> => {
  const query = `query { KBArticlefile { GetCopyUrl(input:{ key:"${objectKey}" }) { statusCode success message data } } }`;
  const res = await graphqlRequest<{ KBArticlefile: { GetCopyUrl: KBPresignResult } }>({ query });
  const result = res.data?.KBArticlefile?.GetCopyUrl;
  if (!result?.success || !result.data?.viewUrl) {
    throw new Error(result?.message ?? "GetCopyUrl failed");
  }
  return result.data.viewUrl;
};



const createApiFolder = async (folderPath: string): Promise<void> => {
  const clean = (folderPath.endsWith("/") ? folderPath.slice(0, -1) : folderPath);
  const parts = clean.split("/").filter(Boolean);
  const folderName = parts.pop() ?? folderPath;
  const folder = parts.length > 0 ? `${parts.join("/")}/` : "";
  const query = `query { KBArticlefile { CreateFolder(input:{ folder:"${folder}", folderName:"${folderName}" }) { statusCode success message } } }`;
  const res = await graphqlRequest<{ KBArticlefile: { CreateFolder: KBMutationResult } }>({ query });
  const result = res.data?.KBArticlefile?.CreateFolder;
  if (!result?.success) throw new Error(result?.message ?? "CreateFolder failed");
};



const deleteApiFolder = async (folderPath: string): Promise<void> => {
  const query = `query { KBArticlefile { DeleteFolder(input:{ folder:"${folderPath}" }) { statusCode success message } } }`;
  const res = await graphqlRequest<{ KBArticlefile: { DeleteFolder: KBMutationResult } }>({ query });
  const result = res.data?.KBArticlefile?.DeleteFolder;
  if (!result?.success) throw new Error(result?.message ?? "DeleteFolder failed");
};

// ─── public API ───────────────────────────────────────────────────────────────

export const getFileBlock = async <K extends FileBlockKey>(
  block: K,
  options?: { prefix?: string },
): Promise<FileBlockResponse<BlockValue<K>>> => {
  const source = General.FILE_DATA_SOURCE;
  const prefix = options?.prefix ?? "";
  const endpoint =
    block === "tree"
      ? FileEndpoints.tree
      : `${FileEndpoints.list}${prefix ? `?prefix=${encodeURIComponent(prefix)}` : ""}`;

  const data = await fetchApiBlock(block, prefix)

  return { data, meta: { key: block, endpoint, source } };
};

export const deleteFile = async (objectKey: string): Promise<void> => deleteApiFile(objectKey)

const isFullUrl = (s: string) => /^https?:\/\//i.test(s);

export const getFilePreviewUrl = async (objectKey: string): Promise<string> => {
  if (isFullUrl(objectKey)) return objectKey;
  return getApiPreviewUrl(objectKey)
};

export const getFileDownloadUrl = async (objectKey: string): Promise<string> => {
  if (isFullUrl(objectKey)) return objectKey;
  return getApiDownloadUrl(objectKey)
};

export const getFileCopyUrl = async (objectKey: string): Promise<string> => {
  if (isFullUrl(objectKey)) return objectKey;
  return getApiCopyUrl(objectKey)
};

export const createFolder = async (folderPath: string): Promise<void> => createApiFolder(folderPath)

export const deleteFolder = async (folderPath: string): Promise<void> => deleteApiFolder(folderPath)

// ─── multipart upload ─────────────────────────────────────────────────────────

export const CHUNK_SIZE = 50 * 1024 * 1024; // 50 MB

export interface UploadTask {
  id: string;
  name: string;
  folder: string;
  totalBytes: number;
  bytesUploaded: number;
  speed: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

const uploadChunkXHR = (
  url: string,
  chunk: Blob,
  onProgress: (loaded: number) => void,
): Promise<string> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) onProgress(e.loaded);
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const raw = xhr.getResponseHeader("ETag") ?? xhr.getResponseHeader("etag") ?? "";
        resolve(raw.replace(/"/g, ""));
      } else {
        reject(new Error(`Part upload HTTP ${xhr.status}`));
      }
    });
    xhr.addEventListener("error", () => reject(new Error("Part upload network error")));
    xhr.open("PUT", url);
    xhr.send(chunk);
  });

export const uploadFileMultipart = async (
  file: File,
  folder: string,
  onProgress: (update: Pick<UploadTask, "bytesUploaded" | "speed">) => void,
): Promise<void> => {
  const totalParts = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
  const mimeType = file.type || "application/octet-stream";

  // 1. initiate
  const initRes = await graphqlRequest<{ KBArticlefile: { InitiateMultipart: KBMutationResult & { data?: { uploadId: string; key: string } } } }>({
    query: `query { KBArticlefile { InitiateMultipart(input:{ folder:"${folder}", fileName:"${file.name}", mimeType:"${mimeType}", totalParts:${totalParts} }) { statusCode success message data } } }`,
  });
  const initData = initRes.data?.KBArticlefile?.InitiateMultipart;
  if (!initData?.success) throw new Error(initData?.message ?? "Initiate failed");
  const { uploadId, key } = initData.data!;

  const parts: Array<{ partNumber: number; etag: string }> = [];
  let totalUploaded = 0;
  const startTime = Date.now();

  try {
    for (let i = 0; i < totalParts; i++) {
      const partNumber = i + 1;
      const start = i * CHUNK_SIZE;
      const chunk = file.slice(start, Math.min(start + CHUNK_SIZE, file.size));

      // 2. presign part
      const presignRes = await graphqlRequest<{ KBArticlefile: { PresignPart: KBMutationResult & { data?: { url: string } } } }>({
        query: `query { KBArticlefile { PresignPart(input:{ key:"${key}", uploadId:"${uploadId}", partNumber:${partNumber} }) { statusCode success message data } } }`,
      });
      const presignData = presignRes.data?.KBArticlefile?.PresignPart;
      if (!presignData?.success) throw new Error(presignData?.message ?? "Presign part failed");
      const partUrl = presignData.data!.url;

      // 3. XHR PUT chunk
      const chunkBase = totalUploaded;
      const etag = await uploadChunkXHR(partUrl, chunk, (loaded) => {
        const now = chunkBase + loaded;
        const elapsed = (Date.now() - startTime) / 1000;
        onProgress({ bytesUploaded: now, speed: elapsed > 0 ? now / elapsed : 0 });
      });

      parts.push({ partNumber, etag });
      totalUploaded += chunk.size;
    }

    // 4. complete
    const completeRes = await graphqlRequest<{ KBArticlefile: { CompleteMultipart: KBMutationResult } }>({
      query: `query CompleteMultipart($key:String!,$uploadId:String!,$parts:[CompletePartInput!]!){
        KBArticlefile { CompleteMultipart(input:{key:$key,uploadId:$uploadId,parts:$parts}){statusCode success message} }
      }`,
      variables: { key, uploadId, parts },
    });
    const completeData = completeRes.data?.KBArticlefile?.CompleteMultipart;
    if (!completeData?.success) throw new Error(completeData?.message ?? "Complete failed");
  } catch (err) {
    // abort on error (best effort)
    graphqlRequest({
      query: `query { KBArticlefile { AbortMultipart(input:{ key:"${key}", uploadId:"${uploadId}" }) { statusCode success message } } }`,
    }).catch(() => { });
    throw err;
  }
};
