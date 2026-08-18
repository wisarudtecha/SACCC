import { BroadcastEndpoints, General, GraphQL/*, MODE*/ } from "@/kms/constant";
import { graphqlRequest } from "@/kms/common/graphql.service";
import {
  LooseRecord,
 // isRecord,
  pickFirst,
  toNumber,
  toStringValue,
  extractArrayPayload,
  formatISODateTime,
 // wait,
} from "@/kms/common/common.transform.service";
import type {
  KBBroadcastGraphQLData,
  KBBroadcastListItem,
  KBBroadcastPopupItem,
} from "@/kms/broadcast/dtos/broadcast-graphql.dto";
import {
  BroadcastBlockDataMap,
  BroadcastBlockKey,
  BroadcastBlockResponse,
 // BroadcastEntryNotice,
  //BroadcastEntryNoticeItem,
  BroadcastItem,
  BroadcastListResult,
  BroadcastLogItem,
  BroadcastMutationInput,
  BroadcastStatus,
  BroadcastSummaryItem,
} from "@/kms/broadcast/dtos/broadcast.dto";

type BlockValue<K extends BroadcastBlockKey> = BroadcastBlockDataMap[K];

const normalizeStatus = (value: unknown): BroadcastStatus => {
  const rawValue = toStringValue(value, "draft");

  switch (rawValue) {
    case "all":
    case "scheduled":
    case "published":
    case "expired":
    case "draft":
      return rawValue;
    default:
      return "draft";
  }
};

const mapSummaryItem = (rawItem: LooseRecord): BroadcastSummaryItem => ({
  id: normalizeStatus(
    pickFirst(rawItem.id, rawItem.status, rawItem.key, rawItem.code, "draft"),
  ),
  count: toNumber(
    pickFirst(rawItem.count, rawItem.total, rawItem.value, rawItem.amount),
    0,
  ),
});

const mapBroadcastItem = (rawItem: LooseRecord): BroadcastItem => ({
  id: toStringValue(
    pickFirst(rawItem.id, rawItem.broadcastId, rawItem.uuid),
    "item",
  ),
  title: toStringValue(
    pickFirst(
      rawItem.title,
      rawItem.name,
      rawItem.subject,
      rawItem.messageTitle,
    ),
    "",
  ),
  message: toStringValue(
    pickFirst(
      rawItem.message,
      rawItem.description,
      rawItem.body,
      rawItem.content,
      rawItem.detail,
    ),
    "",
  ),
  status: normalizeStatus(
    pickFirst(rawItem.status, rawItem.broadcastStatus, rawItem.state, "draft"),
  ) as BroadcastItem["status"],
  startDate: toStringValue(
    pickFirst(
      rawItem.startDate,
      rawItem.start_at,
      rawItem.fromDate,
      rawItem.sendAt,
    ),
    "",
  ),
  endDate: toStringValue(
    pickFirst(
      rawItem.endDate,
      rawItem.end_at,
      rawItem.toDate,
      rawItem.expireAt,
    ),
    "",
  ),
});

const mapBroadcastLogItem = (rawItem: LooseRecord): BroadcastLogItem => ({
  ...mapBroadcastItem(rawItem),
  publishedAt: toStringValue(
    pickFirst(
      rawItem.publishedAt,
      rawItem.published_at,
      rawItem.sentAt,
      rawItem.sent_at,
    ),
    "",
  ),
  audience: toStringValue(
    pickFirst(
      rawItem.audience,
      rawItem.targetGroup,
      rawItem.recipients,
      rawItem.segment,
    ),
    "",
  ),
});

// const mapBroadcastEntryNotice = (
//   rawItem: LooseRecord,
// ): BroadcastEntryNotice => ({
//   id: toStringValue(
//     pickFirst(rawItem.id, rawItem.noticeId, rawItem.key),
//     "broadcast-entry-notice",
//   ),
//   title: toStringValue(
//     pickFirst(rawItem.title, rawItem.name, rawItem.subject),
//     "Broadcast notice",
//   ),
//   items: mapBroadcastEntryNoticeItems(rawItem),
// });

// const mapBroadcastEntryNoticeItems = (
//   rawItem: LooseRecord,
// ): BroadcastEntryNoticeItem[] => {
//   const candidate = pickFirst(
//     rawItem.items,
//     rawItem.sections,
//     rawItem.messages,
//     rawItem.details,
//   );

//   if (Array.isArray(candidate)) {
//     const mappedItems = candidate
//       .filter(isRecord)
//       .map((entry, index) => ({
//         title: toStringValue(
//           pickFirst(entry.title, entry.label, entry.name),
//           `Notice ${index + 1}`,
//         ),
//         message: toStringValue(
//           pickFirst(
//             entry.message,
//             entry.description,
//             entry.body,
//             entry.content,
//             entry.detail,
//             entry.value,
//           ),
//           "",
//         ),
//       }))
//       .filter((entry) => entry.message.trim().length > 0);

//     if (mappedItems.length > 0) {
//       return mappedItems;
//     }
//   }

//   const fallbackMessage = toStringValue(
//     pickFirst(
//       rawItem.message,
//       rawItem.description,
//       rawItem.body,
//       rawItem.content,
//       rawItem.detail,
//     ),
//     "",
//   );

//   return fallbackMessage
//     ? [
//       {
//         title: toStringValue(
//           pickFirst(
//             rawItem.messageTitle,
//             rawItem.sectionTitle,
//             rawItem.label,
//           ),
//           "Message",
//         ),
//         message: fallbackMessage,
//       },
//     ]
//     : [];
// };

// const extractRecordPayload = (input: unknown): LooseRecord | null => {
//   if (!isRecord(input)) {
//     return null;
//   }

//   const candidate = pickFirst(
//     input.data,
//     input.item,
//     input.result,
//     input.notice,
//   );

//   if (isRecord(candidate)) {
//     return candidate;
//   }

//   return input;
// };


//const cloneItem = (item: BroadcastItem): BroadcastItem => ({ ...item });


const buildEndpoint = (block: BroadcastBlockKey, status?: BroadcastStatus) => {
  const endpoint = BroadcastEndpoints[block];

  if (block !== "list" || !status || status === "all") {
    return endpoint;
  }

  const searchParams = new URLSearchParams({ status });
  return `${endpoint}?${searchParams.toString()}`;
};

const fetchBlockFromApi = async <K extends BroadcastBlockKey>(
  block: K,
  status?: BroadcastStatus,
): Promise<BlockValue<K>> => {
  const endpoint = buildEndpoint(block, status);
  const response = await fetch(`${General.API_BASE_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error(`Unable to fetch broadcast block: ${block}`);
  }

  const payload = await response.json();

  if (block === "summary") {
    return extractArrayPayload(payload).map(mapSummaryItem) as BlockValue<K>;
  }

  if (block === "log") {
    return extractArrayPayload(payload).map(
      mapBroadcastLogItem,
    ) as BlockValue<K>;
  }

  return extractArrayPayload(payload).map(mapBroadcastItem) as BlockValue<K>;
};



const normalizeStatusFromKey = (
  key: number,
): Exclude<BroadcastStatus, "all"> => {
  switch (key) {
    case 1:
      return "scheduled";
    case 3:
      return "published";
    case 4:
      return "expired";
    default:
      return "draft";
  }
};

const escapeGQL = (s: string) => s.replace(/"/g, '\\"').replace(/\n/g, "\\n");

const mapAPIItem = (item: KBBroadcastListItem): BroadcastItem => ({
  id: String(item.broadcastId),
  title: item.title,
  message: item.description ?? "",
  status: normalizeStatusFromKey(item.status),
  startDate: formatISODateTime(item.startDate),
  endDate: formatISODateTime(item.endDate),
  createdDate: item.createdDate ? formatISODateTime(item.createdDate) : undefined,
  updatedDate: item.updatedDate ? formatISODateTime(item.updatedDate) : undefined,
});

const FALLBACK_STATUS_FILTER_MAP: Record<BroadcastStatus, string> = {
  all: "",
  scheduled: "1",
  draft: "2",
  published: "3",
  expired: "4",
};

let cachedStatusFilterMap: Record<BroadcastStatus, string> | null = null;

const fetchStatusFilterMap = async (): Promise<Record<BroadcastStatus, string>> => {
  if (cachedStatusFilterMap) return cachedStatusFilterMap;

  try {
    const res = await graphqlRequest<KBBroadcastGraphQLData>({
      query: GET_BROADCAST_STATUS_OVERVIEW_QUERY,
    });

    const { items } = res.data.KBBroadcast.GetBroadcastStatusOverviewList.data;

    const map: Partial<Record<BroadcastStatus, string>> = { all: "" };
    for (const item of items) {
      const status = normalizeStatus(item.label.toLowerCase());
      if (status !== "all") {
        map[status] = String(item.key);
      }
    }

    if (map.scheduled && map.draft && map.published && map.expired) {
      cachedStatusFilterMap = map as Record<BroadcastStatus, string>;
      return cachedStatusFilterMap;
    }
  } catch {
    // fall through to fallback
  }

  return FALLBACK_STATUS_FILTER_MAP;
};

const buildBroadcastListQuery = (
  page: number,
  limit: number,
  status: BroadcastStatus,
  statusFilterMap: Record<BroadcastStatus, string>,
): string =>
  `query { KBBroadcast { GetBroadcastList(input:{ page: ${page}, limit: ${limit}, statusFilter: "${statusFilterMap[status]}", pageType: "setup" }) { statusCode success message data } } }`;

const fetchBroadcastListFromGraphQL = async (
  page: number,
  limit: number,
  status: BroadcastStatus,
): Promise<BroadcastListResult> => {
  const statusFilterMap = await fetchStatusFilterMap();
  const res = await graphqlRequest<KBBroadcastGraphQLData>({
    query: buildBroadcastListQuery(page, limit, status, statusFilterMap),
  });

  const { items, totalCount, totalPage } =
    res.data.KBBroadcast.GetBroadcastList.data;

  return {
    items: items.map(mapAPIItem),
    pagination: { page, limit, totalCount, totalPage },
    meta: { endpoint: GraphQL.URL, source: "api" },
  };
};



export const getBroadcastList = async (
  page: number,
  limit: number,
  status: BroadcastStatus,
): Promise<BroadcastListResult> => {
  return fetchBroadcastListFromGraphQL(page, limit, status);


};

const GET_BROADCAST_STATUS_OVERVIEW_QUERY =
  "query { KBBroadcast { GetBroadcastStatusOverviewList { statusCode success message data } } }";

const fetchStatusOverviewFromGraphQL =
  async (): Promise<BroadcastSummaryItem[]> => {
    const res = await graphqlRequest<KBBroadcastGraphQLData>({
      query: GET_BROADCAST_STATUS_OVERVIEW_QUERY,
    });

    const { items } =
      res.data.KBBroadcast.GetBroadcastStatusOverviewList.data;

    return items.map((item) => ({
      id: normalizeStatus(item.label.toLowerCase()),
      count: item.count,
    }));
  };

export const getBroadcastStatusOverview =
  async (): Promise<BroadcastSummaryItem[]> => {
    return fetchStatusOverviewFromGraphQL();
  };

const fetchBroadcastHistoryFromGraphQL = async (
  page: number,
  limit: number,
  status: BroadcastStatus,
): Promise<BroadcastListResult> => {
  const statusFilterMap = await fetchStatusFilterMap();
  const query = `query { KBBroadcast { GetBroadcastList(input:{ page: ${page}, limit: ${limit}, statusFilter: "${statusFilterMap[status]}", pageType: "history" }) { statusCode success message data } } }`;
  const res = await graphqlRequest<KBBroadcastGraphQLData>({ query });
  const { items, totalCount, totalPage } = res.data.KBBroadcast.GetBroadcastList.data;

  return {
    items: items.map(mapAPIItem),
    pagination: { page, limit, totalCount, totalPage },
    meta: { endpoint: GraphQL.URL, source: "api" },
  };
};

export const getBroadcastHistoryList = async (
  page: number,
  limit: number,
  status: BroadcastStatus,
): Promise<BroadcastListResult> => {
  return fetchBroadcastHistoryFromGraphQL(page, limit, status);
};

const gqlDate = (date: string | null): string =>
  date ? `"${date}"` : "null";

const buildAddBroadcastQuery = (input: BroadcastMutationInput): string =>
  `query { KBBroadcast { AddBroadcast(input:{title:"${escapeGQL(input.title)}", startDate: ${gqlDate(input.startDate)}, endDate: ${gqlDate(input.endDate)}, statusBroadcastId:${input.statusBroadcastId}, description: "${escapeGQL(input.message)}" }) { statusCode success message data } } }`;

const buildUpdateBroadcastQuery = (
  id: string,
  input: BroadcastMutationInput,
): string =>
  `query { KBBroadcast { UpdateBroadcast(input:{id: ${Number(id)}, title:"${escapeGQL(input.title)}", startDate: ${gqlDate(input.startDate)}, endDate: ${gqlDate(input.endDate)}, statusBroadcastId:${input.statusBroadcastId}, description: "${escapeGQL(input.message)}" }) { statusCode success message data } } }`;

const addBroadcastFromGraphQL = async (
  input: BroadcastMutationInput,
): Promise<BroadcastItem> => {
  const res = await graphqlRequest<KBBroadcastGraphQLData>({
    query: buildAddBroadcastQuery(input),
  });

  const result = res.data.KBBroadcast.AddBroadcast;

  if (!result.success) {
    throw new Error(result.message ?? "Failed to create broadcast");
  }

  return mapAPIItem(result.data);
};

const updateBroadcastFromGraphQL = async (
  id: string,
  input: BroadcastMutationInput,
): Promise<BroadcastItem> => {
  const res = await graphqlRequest<KBBroadcastGraphQLData>({
    query: buildUpdateBroadcastQuery(id, input),
  });

  const result = res.data.KBBroadcast.UpdateBroadcast;

  if (!result.success) {
    throw new Error(result.message ?? "Failed to update broadcast");
  }

  return mapAPIItem(result.data);
};



// const updateMockBroadcast = async (
//   id: string,
//   input: BroadcastMutationInput,
// ): Promise<BroadcastItem> => {
//   if (General.MODE === MODE.LOCAL) {
//     await wait(120);
//   }

//   let updatedItem: BroadcastItem | null = null;



//   if (!updatedItem) {
//     throw new Error(`Broadcast item not found: ${id}`);
//   }

//   return cloneItem(updatedItem);
// };





const buildDeleteBroadcastQuery = (id: string): string =>
  `query { KBBroadcast { DeleteBroadcast(input:{ id: ${Number(id)}}) { statusCode success message data } } }`;

const deleteApiBroadcast = async (id: string): Promise<void> => {
  const res = await graphqlRequest<KBBroadcastGraphQLData>({
    query: buildDeleteBroadcastQuery(id),
  });

  const result = res.data.KBBroadcast.DeleteBroadcast;

  if (!result.success) {
    throw new Error(result.message ?? "Failed to delete broadcast");
  }
};


const getApiBroadcastDetail = async (id: string): Promise<BroadcastItem> => {
  const response = await fetch(
    `${General.API_BASE_URL}${BroadcastEndpoints.list}/${id}`,
  );

  if (!response.ok) {
    throw new Error("Unable to load broadcast detail");
  }

  return mapBroadcastItem((await response.json()) as LooseRecord);
};



 

export const getBroadcastBlock = async <K extends BroadcastBlockKey>(
  block: K,
  options?: { status?: BroadcastStatus },
): Promise<BroadcastBlockResponse<BlockValue<K>>> => {
  const status = options?.status;
  const source = General.BROADCAST_DATA_SOURCE;
  const endpoint = buildEndpoint(block, status);

  if (source === "api" && block === "summary") {
    const data = await fetchStatusOverviewFromGraphQL();
    return {
      data: data as BlockValue<K>,
      meta: { key: block, endpoint: GraphQL.URL, source },
    };
  }

  const data = await fetchBlockFromApi(block, status)

  return {
    data,
    meta: {
      key: block,
      endpoint,
      source,
    },
  };
};

export const createBroadcastItem = async (
  input: BroadcastMutationInput,
): Promise<BroadcastItem> => {
  return addBroadcastFromGraphQL(input);
};

export const updateBroadcastItem = async (
  id: string,
  input: BroadcastMutationInput,
): Promise<BroadcastItem> => {
  return updateBroadcastFromGraphQL(id, input);
};

export const deleteBroadcastItem = async (id: string): Promise<void> => {
  return deleteApiBroadcast(id);
};

export const getBroadcastItemDetail = async (
  id: string,
): Promise<BroadcastItem> => {
  return getApiBroadcastDetail(id);
};

 
const GET_POPUP_LIST_QUERY =
  "query { KBBroadcast { GetPopupList { statusCode success message data } } }";

const buildAcceptBroadcastQuery = (broadcastIds: number[]): string =>
  `query { KBBroadcast { AcceptBroadcast(input:{ broadcastIds: [${broadcastIds.join(", ")}] }) { statusCode success message data } } }`;

export const acceptBroadcastItems = async (broadcastIds: number[]): Promise<void> => {
  if (!broadcastIds.length) return;
  await graphqlRequest<KBBroadcastGraphQLData>({
    query: buildAcceptBroadcastQuery(broadcastIds),
  });
};

export const getBroadcastPopupList = async (): Promise<KBBroadcastPopupItem[]> => {
  const res = await graphqlRequest<KBBroadcastGraphQLData>({
    query: GET_POPUP_LIST_QUERY,
  });

  const result = res.data.KBBroadcast.GetPopupList;

  if (!result.success || !result.data?.items?.length) {
    return [];
  }

  return result.data.items;
};
