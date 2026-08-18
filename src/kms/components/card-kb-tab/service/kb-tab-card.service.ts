import { General, GraphQL, KbTabCardEndpoints } from  "@/kms/constant";
import { graphqlRequest } from "@/kms/common/graphql.service";
import {
  type LooseRecord,
  pickFirst,
  toNumber,
  toStringValue,
  extractArrayPayload,
  // wait,
  // formatDateDMY_N,
  formatISODateTime
} from "@/kms/common/common.transform.service";
import type { KBTabCardGraphQLData } from "@/kms/components/card-kb-tab/dtos/kb-tab-card-graphql.dto"
import type {
  KbTabCard,
  KbTabCardBlockResponse,
  KbTabCardDataSource,
  KbTabCardFilter,
  KbTabCardListResult,
  KbTabCardScore,
  // KbTabCardTab,
} from "@/kms/components/card-kb-tab/dtos/kb-tab-card.dto";

// ─── Raw mock data ────────────────────────────────────────────────────────────
 

// ─── Mapper ──────────────────────────────────────────────────────────────────

const mapKbTabCard = (raw: LooseRecord): KbTabCard => ({
  id: toStringValue(
    pickFirst(raw.id, raw.artId, raw.articleId, raw.slug),
    "article",
  ),
  title: toStringValue(
    pickFirst(raw.title, raw.articleTitle, raw.name),
    "Untitled",
  ),
  description: toStringValue(
    pickFirst(raw.description, raw.summary, raw.excerpt, raw.detail),
    "",
  ),
  category: toStringValue(
    pickFirst(raw.category, raw.categoryName, raw.categoryLabel),
    "",
  ),
  categoryFullPath: toStringValue(
    pickFirst(raw.categoryFullPath, raw.fullPath, raw.category),
    "",
  ),

  score: raw.score as KbTabCardScore | undefined,
  tags: Array.isArray(raw.tags)
    ? (raw.tags as unknown[]).map((t) => toStringValue(t))
    : [],
  views: toNumber(pickFirst(raw.views, raw.viewCount, raw.totalViews), 0),
  likes: toNumber(pickFirst(raw.likes, raw.likeCount, raw.hearts), 0),
  updatedAt: formatISODateTime(
    toStringValue(
      pickFirst(
        raw.updatedAt,
        raw.updatedDate,
        raw.lastUpdated,
        raw.modifiedAt,
      ),
      "",
    ),
  ),
  url: raw.url ? toStringValue(raw.url) : undefined,
});

// ─── Data source resolver ─────────────────────────────────────────────────────

const resolveDataSource = (): KbTabCardDataSource =>
  General.KB_TAB_CARD_DATA_SOURCE ?? "mock";

// ─── Mock fetch ───────────────────────────────────────────────────────────────
 
// ─── GraphQL queries ──────────────────────────────────────────────────────────

const GET_LIST_QUERY = `
  query KBTabCardGetList($input: KBTabCardListInput) {
    KBTabCard {
      GetList(input: $input) {
        statusCode
        success
        message
        data
      }
    }
  }
`;

// ─── API fetch ────────────────────────────────────────────────────────────────

const fetchApi = async (
  filter: KbTabCardFilter,
): Promise<KbTabCardListResult> => {
  const res = await graphqlRequest<KBTabCardGraphQLData>({
    query: GET_LIST_QUERY,
    variables: { input: filter },
  });

  const { count, items, tabs } = res.data.KBTabCard.GetList.data;
  const rawItems = extractArrayPayload({ items });

  return {
    items: rawItems.map(mapKbTabCard),
    total: count,
    page: filter.page ?? 1,
    pageSize: filter.pageSize ?? 20,
    tabs: tabs.map((t) => ({
      key: toStringValue(t.key),
      label_th: toStringValue(t.label_th),
        label_en: toStringValue(t.label_en),
      count: toNumber(t.count),
    })),
  };
};

// ─── Public API ───────────────────────────────────────────────────────────────

export const getKbTabCardList = async (
  filter: KbTabCardFilter = {},
): Promise<KbTabCardBlockResponse<KbTabCardListResult>> => {
  const source = resolveDataSource();

  const data = await fetchApi(filter)

  return {
    data,
    meta: {
      key: "list",
      endpoint: source === "api" ? GraphQL.URL : KbTabCardEndpoints.list,
      source,
    },
  };
};
