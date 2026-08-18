import { General/*, MODE*/ } from "@/kms/constant";
import { graphqlRequest } from "@/kms/common/graphql.service";
import {
  LooseRecord,
  isRecord,
  pickFirst,
  toNumber,
  toStringValue,
  toNullableString,
  extractArrayPayload,
  formatISODateTime,
} from "@/kms/common/common.transform.service";
import type { KBSourceGraphQLData } from "@/kms/source/dtos/source-graphql.dto";
import type {
  SourceItem,
  SourceMutationInput,
  SourcePagination,
} from "@/kms/source/dtos/source.dto";

const mapSourceItem = (raw: LooseRecord): SourceItem => ({
  id: toStringValue(pickFirst(raw.sourceId, raw.id), ""),
  name_th: toStringValue(
    pickFirst(raw.sourceNameTh, raw.name_th, raw.nameTh),
    "",
  ),
  name_en: toStringValue(
    pickFirst(raw.sourceNameEn, raw.name_en, raw.nameEn),
    "",
  ),
  name: toStringValue(pickFirst(raw.sourceName, raw.name), ""),
  parentId: toNullableString(
    raw.parentId !== null && raw.parentId !== undefined ? raw.parentId : null,
  ),
  parentNameTh: toNullableString(
    raw.parentNameTh !== null && raw.parentNameTh !== undefined
      ? raw.parentNameTh
      : null,
  ),
  parentNameEn: toNullableString(
    raw.parentNameEn !== null && raw.parentNameEn !== undefined
      ? raw.parentNameEn
      : null,
  ),
  parentName: toNullableString(
    raw.parentName !== null && raw.parentName !== undefined
      ? raw.parentName
      : null,
  ),
  seq: toNumber(raw.seq, 1),
  totalArticle: toNumber(raw.totalArticle, 0),
  createdDate: formatISODateTime(toStringValue(raw.createdDate)),
  updatedDate: formatISODateTime(toStringValue(raw.updatedDate)),
});

 

 
const escapeGQL = (str: string): string =>
  str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");

const buildSourceListQuery = (page: number, limit: number): string =>
  `query { KBSource { GetSourceList(input:{ page:${page}, limit:${limit}}) { statusCode success message data } } }`;

const buildAddSourceQuery = (input: SourceMutationInput): string =>
  `query { KBSource { AddSource(input:{ name_th: "${escapeGQL(input.name_th)}", name_en: "${escapeGQL(input.name_en)}", parentId: null, seq: ${input.seq} }) { statusCode success message data } } }`;

const buildUpdateSourceQuery = (id: string, input: SourceMutationInput): string =>
  `query { KBSource { UpdateSource(input:{ id: ${id}, name_th: "${escapeGQL(input.name_th)}", name_en: "${escapeGQL(input.name_en)}", parentId: null, seq: ${input.seq} }) { statusCode success message data } } }`;

const buildDeleteSourceQuery = (id: string): string =>
  `query { KBSource { DeleteSource(input:{ id: ${id} }) { statusCode success message data } } }`;

const fetchSourceListFromGraphQL = async (page: number, limit: number) => {
  const res = await graphqlRequest<KBSourceGraphQLData>({
    query: buildSourceListQuery(page, limit),
  });
  const listResponse = res.data?.KBSource?.GetSourceList;
  if (!isRecord(listResponse) || !listResponse.success) {
    throw new Error("Failed to fetch source list");
  }
  const rawData = isRecord(listResponse.data) ? listResponse.data : {};
  const items = extractArrayPayload(listResponse.data).map(mapSourceItem);
  const pagination: SourcePagination = {
    page: toNumber(rawData.page, page),
    limit: toNumber(rawData.limit, limit),
    totalPage: toNumber(rawData.totalPage, 1),
    count: toNumber(rawData.count, items.length),
  };
  return { items, pagination };
};

 

const createSourceFromGraphQL = async (
  input: SourceMutationInput,
): Promise<SourceItem> => {
  const res = await graphqlRequest<KBSourceGraphQLData>({
    query: buildAddSourceQuery(input),
  });
  const addResponse = res.data?.KBSource?.AddSource;
  if (!isRecord(addResponse) || !addResponse.success) {
    throw new Error("Failed to create source");
  }
  const raw = isRecord(addResponse.data) ? addResponse.data : {};
  return mapSourceItem(raw);
};

 

const updateSourceFromGraphQL = async (
  id: string,
  input: SourceMutationInput,
): Promise<SourceItem> => {
  const res = await graphqlRequest<KBSourceGraphQLData>({
    query: buildUpdateSourceQuery(id, input),
  });
  const updateResponse = res.data?.KBSource?.UpdateSource;
  if (!isRecord(updateResponse) || !updateResponse.success) {
    throw new Error("Failed to update source");
  }
  const raw = isRecord(updateResponse.data) ? updateResponse.data : {};
  return mapSourceItem(raw);
};

 

const deleteSourceFromGraphQL = async (id: string): Promise<void> => {
  const res = await graphqlRequest<KBSourceGraphQLData>({
    query: buildDeleteSourceQuery(id),
  });
  const deleteResponse = res.data?.KBSource?.DeleteSource;
  if (!isRecord(deleteResponse) || !deleteResponse.success) {
    throw new Error("Failed to delete source");
  }
};

 

export const getSourceList = async (page: number, limit: number) => {
  const source = General.SOURCE_DATA_SOURCE;
  const result = await fetchSourceListFromGraphQL(page, limit)
  return { ...result, meta: { source } };
};

export const createSourceItem = (
  input: SourceMutationInput,
): Promise<SourceItem> =>  createSourceFromGraphQL(input)

export const updateSourceItem = (
  id: string,
  input: SourceMutationInput,
): Promise<SourceItem> => updateSourceFromGraphQL(id, input)

export const deleteSourceItem = (id: string): Promise<void> => deleteSourceFromGraphQL(id)
