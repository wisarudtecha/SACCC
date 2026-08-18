# query

## GetListCustomerNote
### REST API Endpoint: GET /api/v1/customer_notes
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "query ($input: ListDataInput!) { CustomerNote { GetListCustomerNote(input: $input) { status msg data desc pageSize} } }",
  "variables": {
    "input": {
      "custId": null,
      "start": 0,
      "length": 10,
      "orderBy": null,
      "direction": null
    }
  }
}'
--response '{
  "currentPage": 1,
  "data": [
    {
      "id": "8",
      "orgId": "434c0f16-b7ea-4a7b-a74b-e2e0f859f549",
      "custId": 1,
      "note": "UUUUU",
      "createdAt": "2026-07-31T08:24:59.042216Z",
      "updatedAt": "2026-07-31T08:24:59.042216Z",
      "createdBy": "apiwat.rod",
      "updatedBy": "apiwat.rod"
    }
  ],
  "desc": "",
  "msg": "Success",
  "pageSize": 10,
  "status": "0",
  "totalFiltered": 6,
  "totalPage": 1,
  "totalRecords": 6
}'

## GetCustomerNoteById
### REST API Endpoint: GET /api/v1/customer_notes/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "query ($input: GetIdInput!) { CustomerNote { GetCustomerNoteById(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "2"
    }
  }
}'
--response '{
  "status": "0",
  "msg": "Success",
  "data": {
    "id": "8",
    "orgId": "434c0f16-b7ea-4a7b-a74b-e2e0f859f549",
    "custId": 1,
    "note": "UUUUU",
    "createdAt": "2026-07-31T08:24:59.042216Z",
    "updatedAt": "2026-07-31T08:24:59.042216Z",
    "createdBy": "apiwat.rod",
    "updatedBy": "apiwat.rod"
  },
  "desc": ""
}'

# mutation

## CreateCustomerNote
### REST API Endpoint: POST /api/v1/customer_notes/add
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "mutation ($input: CustomerNoteInput!) { CustomerNote { CreateCustomerNote(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "custId": 1,
      "note": "UUUUU"
    }
  }
}'
--response '{
  "status": "0",
  "msg": "Success",
  "desc": "Create successfully"
}'

## UpdateCustomerNote
### REST API Endpoint: PATCH /api/v1/customer_notes/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "mutation ($input: CustomerNoteInput!) { CustomerNote { UpdateCustomerNote(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "6",
      "custId": 1,
      "note": "AAAAAA---XXX"
    }
  }
}'
--response '{
  "status": "0",
  "msg": "Success",
  "desc": "Update successfully"
}'

## DeleteCustomerNote
### REST API Endpoint: DELETE /api/v1/customer_notes/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "mutation ($input: GetIdInput!) { CustomerNote { DeleteCustomerNote(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "7"
    }
  }
}'
--response '{
  "status": "0",
  "msg": "Success",
  "desc": "Delete successfully"
}'
