// src/cms/store/api/graphql/workflowQueries.ts
const GET_LIST_WORKFLOW_QUERY = {
  operationName: "GetListWorkflow",
  root: "Workflow",
  inputType: "ListDataInput!",
  // fields: `status msg data desc`,
  fields: `status msg currentPage pageSize totalFiltered totalRecords totalPage data desc`,
};

const GET_WORKFLOW_BY_ID_QUERY = {
  operationName: "GetWorkflowById",
  root: "Workflow",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
};

const CREATE_WORKFLOW_MUTATION = {
  operationName: "CreateWorkflow",
  root: "Workflow",
  inputType: "WorkFlowInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const UPDATE_WORKFLOW_MUTATION = {
  operationName: "UpdateWorkflow",
  root: "Workflow",
  inputType: "WorkFlowInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const DELETE_WORKFLOW_MUTATION = {
  operationName: "DeleteWorkflow",
  root: "Workflow",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true,
};

export const GQL_WORKFLOW = {
  // Create posts to the collection ("/workflows"), so POST has to live here. A bare config
  // satisfies every method in matchUrl's definesMethod guard, so leaving this as a plain
  // GET_LIST_WORKFLOW_QUERY made POST /workflows resolve to the list *query* instead of
  // CreateWorkflow - the same method-keyed shape as "/appointment", "/forms" and "/product".
  // "/workflows": GET_LIST_WORKFLOW_QUERY,
  "/workflows": {
    GET: GET_LIST_WORKFLOW_QUERY,
    POST: CREATE_WORKFLOW_MUTATION,
  },
  "/workflows/:id": {
    GET: GET_WORKFLOW_BY_ID_QUERY,
    // No caller ever posts to "/workflows/:id". Keeping POST here would instead capture the
    // two-segment POSTs that do exist (/workflows/from-template, /workflows/validate,
    // /workflows/analytics) and route them to CreateWorkflow with a junk id.
    // POST: CREATE_WORKFLOW_MUTATION,
    PATCH: UPDATE_WORKFLOW_MUTATION,
    DELETE: DELETE_WORKFLOW_MUTATION,
  },
};
