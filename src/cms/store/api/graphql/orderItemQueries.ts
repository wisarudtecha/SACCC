// src/cms/store/api/graphql/orderItemQueries.ts
// Orphaned: "/orders" and "/orders/:id" keys below are shadowed in GQL_MAP (gqlMapper.ts) by the
// later ...GQL_ORDER_WORKFLOW spread, which declares the same keys. Also, the real REST caller
// (orderItem.ts) hits /orders/:id/items and /orders/:id/items/:id, which don't match these keys
// anyway - this file is dead regardless of the collision.
const GET_LIST_ORDER_ITEM_QUERY = {
  operationName: "GetListOrderItem",
  root: "OrderItem",
  inputType: "GetOrderItemInput!",
  fields: `status msg data desc`,
};

const GET_ORDER_ITEM_BY_ID_QUERY = {
  operationName: "GetOrderItemById",
  root: "OrderItem",
  inputType: "GetOrderItemInput!",
  fields: `status msg data desc`,
};

const CREATE_ORDER_ITEM_MUTATION = {
  operationName: "CreateOrderItem",
  root: "OrderItem",
  inputType: "OrderItemInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const UPDATE_ORDER_ITEM_MUTATION = {
  operationName: "UpdateOrderItem",
  root: "OrderItem",
  inputType: "OrderItemInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const DELETE_ORDER_ITEM_MUTATION = {
  operationName: "DeleteOrderItem",
  root: "OrderItem",
  inputType: "GetOrderItemInput!",
  fields: `status msg data desc`,
  mutation: true,
};

export const GQL_ORDER_ITEM = {
  "/orders": GET_LIST_ORDER_ITEM_QUERY,
  "/orders/:id": {
    GET: GET_ORDER_ITEM_BY_ID_QUERY,
    POST: CREATE_ORDER_ITEM_MUTATION,
    PATCH: UPDATE_ORDER_ITEM_MUTATION,
    DELETE: DELETE_ORDER_ITEM_MUTATION,
  },
};
