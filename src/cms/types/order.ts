export interface Order {
  orderId: string;
  requestBy: string;
  shipBy: string;
  billTo: string;
  billAddr: string;
  shipTo: string;
  shipAddr: string;
  returnAddr: string;
  createdAt: string;
  updatedAt: string;
  wfId: string;
  totalItems: number;
  totalQty: number;
  items: string[];
  history: string[];
  title?: string;
  orderStatusMeta: {
    statusId: string
    active: boolean
    th: string
    en: string
  }
}


export interface insertOrder {
  billTo: string,
  requestBy?: string,
  billAddr: string,
  items: [{
    active: true
    partId: string,
    productId: string,
    quantity: number
  }]
  shipTo: string,
  shipBy: string,
  title: string,
  shipAddr: string,
}

export interface OrderUpdateInfo {
  billAddr: string;
  billTo: string;
  shipAddr: string;
  shipBy: string;
  shipTo: string;
  title: string;
}


export interface OrderData {
  orderId: string;
  statusId: string;
  requestBy: string;
  shipBy: string;
  billTo: string;
  billAddr: string;
  shipTo: string;
  shipAddr: string;
  returnAddr: string;
  editable: boolean
  title?: string;
  workflow: {
    data: {
      nodes: Array<{
        id: string;
        type: string;
        data: {
          label: string;
          config: {
            action: string;
            group: string[] | null;
            pic: string[] | null;
            sla: string;
          };
        };
      }>;
      connections: Array<{
        source: string;
        target: string;
        label: string;
      }>;
      metadata?: Record<string, unknown>;
    };
  };
  createdAt: string;
  updatedAt: string;
  wfId: string;
  totalItems: number;
  totalQty: number;
  items: OrderItem[] | null;
  currentNode: OrderCurrentNode;
  nextNode: OrderNextNode[]
  history: OrderHistory[] | null;
  orderStatusMeta?: {
    statusId: string;
    en: string;
    th: string;
    active: boolean;
  };
}

interface Meta {
  en: string;
  th: string;
  active: boolean;
}

interface CategoryMeta extends Meta {
  categoryId: string;
  type: string;
}

interface BrandMeta extends Meta {
  brandId: string;
  type: string;
}

interface PartMeta extends Meta {
  partId: string;
  warranty: number;
  price: number;
  brandId: string;
  categoryId: string;
  productId: string;
  mfd: string;
  categoryMeta: CategoryMeta;
  brandMeta: BrandMeta;
}

interface ProductMeta extends Meta {
  productId: string;
  categoryId: string;
  brandId: string;
  productCode: string;
  warranty: number;
  price: number;
  mfd: string;
  categoryMeta: CategoryMeta;
  brandMeta: BrandMeta;
}

export interface OrderItem {
  id: number;
  requestId: string;
  orderId: string;
  partId: string;
  productId: string;
  quantity: number;
  statusId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  stockQty: number;
  isEnoughStock: boolean;
  partMeta: PartMeta;
  productMeta: ProductMeta;
}

export interface OrderCurrentNode {
  config: OrderNodeConfig;
  label: string;
}

export interface OrderNextNode {
  type: string
  data: {
    label: string
    config: {
      action: string
      sla: string
    }
  }
}

export interface OrderNodeConfig {
  action: string;
  group: string[];
  pic: string[];
  sla: string;
}

export interface OrderHistory {
  id: number;
  orderId: string;
  nodeId: string;
  userOwner: string;
  statusId: string;
  remark: string | null;
  hAction: string;
  hType: string;
  createdAt: string;
  createdBy: string;
}