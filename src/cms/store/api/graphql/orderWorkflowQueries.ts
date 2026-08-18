// src/cms/store/api/graphql/orderWorkflowQueries.ts
const GET_LIST_ORDER_WORKFLOW_QUERY = {
  operationName: "GetListOrder",
  root: "OrderWorkflow",
  inputType: "ListDataInput!",
  // fields: `status msg data desc`,
  fields: `status msg currentPage pageSize totalFiltered totalRecords totalPage data desc`,
};

const GET_ORDER_WORKFLOW_BY_ID_QUERY = {
  operationName: "GetOrderById",
  root: "OrderWorkflow",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
};

const CREATE_ORDER_WORKFLOW_MUTATION = {
  operationName: "CreateOrder",
  root: "OrderWorkflow",
  inputType: "OrderInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const UPDATE_ORDER_WORKFLOW_MUTATION = {
  operationName: "UpdateOrder",
  root: "OrderWorkflow",
  inputType: "OrderInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const DELETE_ORDER_WORKFLOW_MUTATION = {
  operationName: "DeleteOrder",
  root: "OrderWorkflow",
  inputType: "OrderInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const CANCEL_ORDER_WORKFLOW_MUTATION = {
  operationName: "CancelOrder",
  root: "OrderWorkflow",
  inputType: "OrderCancelInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const CONTROL_ORDER_WORKFLOW_MUTATION = {
  operationName: "OrderControl",
  root: "OrderWorkflow",
  inputType: "OrderControlInput!",
  fields: `status msg data desc`,
  mutation: true,
};

export const GQL_ORDER_WORKFLOW = {
  // "/orders": GET_LIST_ORDER_WORKFLOW_QUERY,
  "/orders": {
    GET: GET_LIST_ORDER_WORKFLOW_QUERY,
    POST: CREATE_ORDER_WORKFLOW_MUTATION,
  },
  "/orders/:id/cancel": {
    POST: CANCEL_ORDER_WORKFLOW_MUTATION,
  },
  "/orders/:id/control": {
    POST: CONTROL_ORDER_WORKFLOW_MUTATION,
  },
  "/orders/:id": {
    GET: GET_ORDER_WORKFLOW_BY_ID_QUERY,
    // POST: CREATE_ORDER_WORKFLOW_MUTATION,
    PATCH: UPDATE_ORDER_WORKFLOW_MUTATION,
    DELETE: DELETE_ORDER_WORKFLOW_MUTATION,
  },
};
