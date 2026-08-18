// src/cms/store/api/graphql/orderCommentQueries.ts
const GET_LIST_ORDER_COMMENT_QUERY = {
  operationName: "GetListOrderComment",
  root: "OrderComment",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
};

const CREATE_ORDER_COMMENT_MUTATION = {
  operationName: "CreateOrderComment",
  root: "OrderComment",
  inputType: "OrderCommentInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const UPDATE_ORDER_COMMENT_MUTATION = {
  operationName: "UpdateOrderComment",
  root: "OrderComment",
  inputType: "OrderCommentInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const DELETE_ORDER_COMMENT_MUTATION = {
  operationName: "DeleteOrderComment",
  root: "OrderComment",
  inputType: "OrderCommentInput!",
  fields: `status msg data desc`,
  mutation: true,
};

// GET uses GetIdInput! (field "id"), the mutations use OrderCommentInput! (field "orderId") -
// they can't share one placeholder name, so the list endpoint stays on its own key even
// though it's the same URL shape as the create endpoint below.
export const GQL_ORDER_COMMENT = {
  "/orders/:id/comments": {
    GET: GET_LIST_ORDER_COMMENT_QUERY,
  },
  "/orders/:orderId/comments": {
    POST: CREATE_ORDER_COMMENT_MUTATION,
  },
  "/orders/:orderId/comments/:id": {
    PUT: UPDATE_ORDER_COMMENT_MUTATION,
    DELETE: DELETE_ORDER_COMMENT_MUTATION,
  },
};
