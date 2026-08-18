// src/cms/store/api/graphql/productStockQueries.ts
const GET_LIST_PRODUCT_SERIAL_QUERY = {
  operationName: "GetListProductSerial",
  root: "ProductStock",
  inputType: "ListProductSerialInput!",
  // fields: `status msg data desc`,
  fields: `status msg currentPage pageSize totalFiltered totalRecords totalPage data desc`,
};

const GET_LIST_PRODUCT_STOCK_QUERY = {
  operationName: "GetListProductStock",
  root: "ProductStock",
  inputType: "ListDataInput!",
  fields: `status msg data desc`,
};

// const GET_PRODUCT_STOCK_BY_ID_QUERY = {
//   operationName: "GetProductStockById",
//   root: "ProductStock",
//   inputType: "GetIdInput!",
//   fields: `status msg data desc`,
// };

const CREATE_PRODUCT_STOCK_MUTATION = {
  operationName: "CreateProductStock",
  root: "ProductStock",
  inputType: "ProductStockInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const UPDATE_PRODUCT_STOCK_MUTATION = {
  operationName: "UpdateProductStock",
  root: "ProductStock",
  inputType: "ProductStockUpdateInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const DELETE_PRODUCT_STOCK_MUTATION = {
  operationName: "DeleteProductStock",
  root: "ProductStock",
  inputType: "GetIdInput_!",
  fields: `status msg data desc`,
  mutation: true,
};

export const GQL_PRODUCT_STOCK = {
  "/product_serial": GET_LIST_PRODUCT_SERIAL_QUERY,
  // DELETE api/v1/product_stock?productId=&serialNumber= (backend takes query params, not path segments)
  "/product_stock": {
    GET: GET_LIST_PRODUCT_STOCK_QUERY,
    DELETE: DELETE_PRODUCT_STOCK_MUTATION,
  },
  "/product_stock/add": {
    POST: CREATE_PRODUCT_STOCK_MUTATION,
  },
  "/product_stock/:productId/:serialNumber": {
    PUT: UPDATE_PRODUCT_STOCK_MUTATION,
  },
};
