import {
    General,
    //MODE,
} from "@/kms/constant";
import {
    isRecord,
    pickFirst,
    toNumber,
    toStringValue,
    LooseRecord,
    //wait,
} from "@/kms/common/common.transform.service";
import { graphqlRequest } from "@/kms/common/graphql.service";
import type {
    KBFileListGraphQLData,
    GetCategoryArticleList,
    CategoryArticleListParams,
} from "@/kms/categorys/dtos/category-article-graphql.dto";
import {
    FileBlockDataMap,
    FileBlockKey,
    FileBlockResponse,
    FileExtension,
    FileTreeNode,
} from "@/kms/categorys/dtos/files.dto";

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

 



// ─── API fetch: GraphQL ───────────────────────────────────────────────────────


const keepFoldersOnly = (nodes: FileTreeNode[]): FileTreeNode[] =>
    nodes
        .filter((n) => n.type === "folder")
        .map((n) => ({ ...n, children: n.children ? keepFoldersOnly(n.children) : undefined }));

const fetchTreeFromGraphQL = async (): Promise<FileTreeNode[]> => {
    const query = `query { KBCategory { GetCategoryTree  { statusCode success message data } } }`;
    const res = await graphqlRequest<{ KBCategory: { GetCategoryTree: KBFileListGraphQLData } }>({ query });
    const gqlResult = res.data?.KBCategory?.GetCategoryTree;
    if (!gqlResult?.success) throw new Error(gqlResult?.message ?? "GetCategoryTree failed");
    const outerData = isRecord(gqlResult.data) ? gqlResult.data : { count: 0, items: [] };
    const nodes = Array.isArray(outerData.items) ? outerData.items : [];
    const mapped = keepFoldersOnly(nodes.filter(isRecord).map(mapFileTreeNode));
    return mapped;
};



export const fetchCategoryArticleList = async (
    params: CategoryArticleListParams,
): Promise<GetCategoryArticleList> => {
    const {
        search = '',
        categoryId,
        limit = 10,
        cursor,
    } = params;
 
    const input = `
    search: ${JSON.stringify(search)}
    ${categoryId !== undefined ? `categoryId: ${categoryId}` : ''}
    limit: ${limit}
    ${cursor ? `cursor: ${JSON.stringify(cursor)}` : ''}
  `;

    const query = `
    query { KBCategory {
      GetCategoryArticleList(
        input: {
          ${input}
        }
      ) {
        statusCode
        success
        message
        data
      }
    }
  }
  `;

    const res = await graphqlRequest<{
        KBCategory: { GetCategoryArticleList: GetCategoryArticleList }  ;
    }>({
        query,
    });

 
    const gqlResult = res.data?.KBCategory.GetCategoryArticleList;

    if (!gqlResult?.success) {
        throw new Error(
            gqlResult?.message ?? 'CategoryArticleList failed',
        );
    }

    return gqlResult;
};


 

const fetchApiBlock = async <K extends FileBlockKey>(
): Promise<BlockValue<K>> => {
    return fetchTreeFromGraphQL() as Promise<BlockValue<K>>;

};

 

export const getCategoryTree = async <K extends FileBlockKey>(
): Promise<FileBlockResponse<BlockValue<K>>> => {
    const source = General.FILE_DATA_SOURCE;
    const endpoint = '';
    const data = await fetchApiBlock<K>();
    return { data, meta: { key: 'tree', endpoint, source } };
};

export const fetchApiCategoryArticle = async (
    params: CategoryArticleListParams,
): Promise<GetCategoryArticleList> => {
    return fetchCategoryArticleList(params);
};






