export interface KBGetTabCardScore {
  value: number;
  min: number;
  max: number;
}

export interface KBGetTabCardItem {
  artId: number;
  title: string;
  description: string;
  category: string;
  categoryFullPath: string;
  tags: string[];
  views: number;
  likes: number;
  score: KBGetTabCardScore;
  updatedDate: string;
  url?: string;
}

export interface KBGetTabCardTab {
  key: string;
  label_th: string;
  label_en: string;
  count: number;
}

export interface KBGetTabCardListData {
  count: number;
  items: KBGetTabCardItem[];
  tabs: KBGetTabCardTab[];
}

export interface KBGetTabCardListResult {
  statusCode: number;
  success: boolean;
  message: string;
  data: KBGetTabCardListData;
}

export interface KBTabCardGraphQLData {
  KBTabCard: {
    GetList: KBGetTabCardListResult;
  };
}
