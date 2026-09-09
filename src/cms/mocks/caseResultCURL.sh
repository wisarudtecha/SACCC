# query

## GetListCaseResult
### REST API Endpoint: GET /api/v1/case/result
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "query ($input: ListDataInput!) { CaseResult { GetListCaseResult(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "start": 0,
      "length": 10
    }
  }
}'
--response-body '{
  "status": "0",
  "msg": "Success",
  "data": [
    {
      "id": "1",
      "orgId": "434c0f16-b7ea-4a7b-a74b-e2e0f859f549",
      "resId": "cf443fd2-ddad-4438-99ea-fcdeec875680",
      "en": "Work Closed",
      "th": "ปิดงานเรียบร้อย",
      "active": true,
      "createdAt": "2025-07-02T11:51:00.263359Z",
      "updatedAt": "2025-07-02T11:51:00.263359Z",
      "createdBy": "apiwat_r",
      "updatedBy": "apiwat_r"
    }
  ],
  "desc": ""
}'

## GetCaseResultById
### REST API Endpoint: GET /api/v1/case/result/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "query ($input: GetIdInput!) { CaseResult { GetCaseResultById(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "cf443fd2-ddad-4438-99ea-fcdeec875680"
    }
  }
}'
--response-body '{
  "status": "0",
  "msg": "Success",
  "data": {
    "id": "1",
    "orgId": "434c0f16-b7ea-4a7b-a74b-e2e0f859f549",
    "resId": "cf443fd2-ddad-4438-99ea-fcdeec875680",
    "en": "Work Closed",
    "th": "ปิดงานเรียบร้อย",
    "active": true,
    "createdAt": "2025-07-02T11:51:00.263359Z",
    "updatedAt": "2025-07-02T11:51:00.263359Z",
    "createdBy": "apiwat_r",
    "updatedBy": "apiwat_r"
  },
  "desc": ""
}'

# mutation

## CreateCaseResult
### REST API Endpoint: POST /api/v1/case/result/add
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "mutation ($input: CaseResultInput!) { CaseResult { CreateCaseResult(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "active": true,
      "en": "string",
      "th": "string"
    }
  }
}'

## UpdateCaseResult
### REST API Endpoint: PATCH /api/v1/case/result/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "mutation ($input: CaseResultInput!) { CaseResult { UpdateCaseResult(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "cf443fd2-ddad-4438-99ea-fcdeec875680",
      "active": true,
      "en": "string",
      "th": "string"
    }
  }
}'

## DeleteCaseResult
### REST API Endpoint: DELETE /api/v1/case/result/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "mutation ($input: GetIdInput!) { CaseResult { DeleteCaseResult(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": ""
    }
  }
}'
