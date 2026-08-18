// src/cms/store/api/graphql/inventoryQueries.ts
const GET_LIST_INVENTORY_QUERY = {
  operationName: "GetListSparepart",
  root: "Sparepart",
  inputType: "ListDataInput!",
  // fields: `status msg data desc`,
  fields: `status msg currentPage pageSize totalFiltered totalRecords totalPage data desc`,
};

const GET_INVENTORY_BY_ID_QUERY = {
  operationName: "GetSparepartById",
  root: "Sparepart",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
};

const CREATE_INVENTORY_MUTATION = {
  operationName: "CreateSparepart",
  root: "Sparepart",
  inputType: "SparePartInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const UPDATE_INVENTORY_MUTATION = {
  operationName: "UpdateSparepart",
  root: "Sparepart",
  inputType: "SparePartInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const DELETE_INVENTORY_MUTATION = {
  operationName: "DeleteSparepart",
  root: "Sparepart",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true,
};

export const GQL_INVENTORY = {
  // "/spare_part": GET_LIST_INVENTORY_QUERY,
  "/spare_part": {
    GET: GET_LIST_INVENTORY_QUERY,
    POST: CREATE_INVENTORY_MUTATION,
  },
  "/spare_part/:id": {
    GET: GET_INVENTORY_BY_ID_QUERY,
    // POST: CREATE_INVENTORY_MUTATION,
    PUT: UPDATE_INVENTORY_MUTATION,
    DELETE: DELETE_INVENTORY_MUTATION,
  },
};
