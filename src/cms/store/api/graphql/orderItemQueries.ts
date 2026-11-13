// src/cms/store/api/graphql/orderItemQueries.ts
//
// Order items are a SUB-RESOURCE of an order (/orders/:orderId/items...), so the "/orders" and
// "/orders/:id" keys this file used to declare never matched a real call site - and were
// additionally shadowed by the later ...GQL_ORDER_WORKFLOW spread, which declares both of those
// paths. They are replaced with the key the call sites actually produce rather than kept as a
// safety net that cannot catch anything.
//
// DELIBERATELY STILL UNMAPPED (they hard-fail in GraphQL mode today, same as before this change):
//   POST /orders/:orderId/items       -> OrderItem.CreateOrderItem(input: OrderItemInput!)
//   PUT  /orders/:orderId/items/:id   -> OrderItem.UpdateOrderItem(input: OrderItemInput!)
// Both call sites (order.ts addOrderItem, orderItem.ts updateOrderItemByRequestMutation) accept
// EITHER a productId OR a partId, while the BFF's OrderItemInput requires `productId: String!`.
// Mapping them would turn the part-only flow - which REST supports - into a validation error, so
// the honest state is "blocked on a BFF input change" (productId nullable, or a dedicated
// part-item input), not a mapping that looks complete. Verified against the staging schema with
// `node scripts/validate-gql-map.mjs`.

const DELETE_ORDER_ITEM_MUTATION = {
  operationName: "DeleteOrderItem",
  root: "OrderItem",
  inputType: "GetOrderItemInput!",
  fields: `status msg data desc`,
  mutation: true,
  // GetOrderItemInput is { orderId, requestId }. order.ts calls the second path segment "itemId"
  // and orderItem.ts calls it "requestId"; both reach this same URL, so the rename lives here
  // instead of forcing one of the two call sites (and its REST body) to change.
  inputFieldAliases: { itemId: "requestId" },
};

export const GQL_ORDER_ITEM = {
  "/orders/:orderId/items/:itemId": {
    DELETE: DELETE_ORDER_ITEM_MUTATION,
  },
};
