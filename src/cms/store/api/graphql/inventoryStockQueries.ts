// src/cms/store/api/graphql/inventoryStockQueries.ts
const GET_LIST_INVENTORY_SERIAL_QUERY = {
  operationName: "GetListSparepartSerial",
  root: "SparepartStock",
  inputType: "ListDataInput!",
  // fields: `status msg data desc`,
  fields: `status msg currentPage pageSize totalFiltered totalRecords totalPage data desc`,
};

const GET_LIST_INVENTORY_STOCK_QUERY = {
  operationName: "GetListSparepartStock",
  root: "SparepartStock",
  inputType: "ListDataInput!",
  fields: `status msg data desc`,
};

const GET_INVENTORY_STOCK_BY_ID_QUERY = {
  operationName: "GetSparepartStockById",
  root: "SparepartStock",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
};

const CREATE_INVENTORY_STOCK_MUTATION = {
  operationName: "CreateSparepartStock",
  root: "SparepartStock",
  inputType: "SparepartStockInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const UPDATE_INVENTORY_STOCK_MUTATION = {
  operationName: "UpdateSparepartStock",
  root: "SparepartStock",
  inputType: "UpdateSparepartStockInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const DELETE_INVENTORY_STOCK_MUTATION = {
  operationName: "DeleteSparepartStock",
  root: "SparepartStock",
  // Composite key (partId + serialNumber), same shape as ProductStock's delete -
  // reuses that convention's dedicated input type rather than the single-id "GetIdInput!".
  inputType: "GetIdInput_2!",
  fields: `status msg data desc`,
  mutation: true,
};

export const GQL_INVENTORY_STOCK = {
  "/spare_part_serial": GET_LIST_INVENTORY_SERIAL_QUERY,
  // DELETE api/v1/spare_part_stock?partId=&serialNumber= (backend takes query params, not path segments)
  "/spare_part_stock": {
    GET: GET_LIST_INVENTORY_STOCK_QUERY,
    DELETE: DELETE_INVENTORY_STOCK_MUTATION,
  },
  "/spare_part_stock/add": {
    POST: CREATE_INVENTORY_STOCK_MUTATION,
  },
  "/spare_part_stock/:id": {
    GET: GET_INVENTORY_STOCK_BY_ID_QUERY,
  },
  "/spare_part_stock/:partId/:serialNumber": {
    PUT: UPDATE_INVENTORY_STOCK_MUTATION,
  },
};
