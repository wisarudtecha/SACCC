// src/cms/store/api/graphql/orderStatusQueries.ts
// SCAFFOLD (unverified): no Postman collection or schema doc exists in this repo for this
// domain, so operationName/root/inputType/fields below are a best-effort guess following the
// ListDataInput convention used elsewhere. Safe to land because hybrid mode still falls back
// to REST if wrong. Only /order_status is mapped here - it's the one live, reachable endpoint
// in inventoryRequestApi.ts (used by the Workflow Editor page). The rest of that file's
// endpoints (/request_spare_part, /request_status) are unreachable or unused in the app today
// and are intentionally NOT mapped.
const GET_LIST_ORDER_STATUS_QUERY = {
  operationName: "GetListOrderStatus",
  root: "OrderStatus",
  inputType: "ListDataInput!",
  fields: `status msg data desc`,
};

export const GQL_ORDER_STATUS = {
  "/order_status": GET_LIST_ORDER_STATUS_QUERY,
};
