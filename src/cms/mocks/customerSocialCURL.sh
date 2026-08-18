# query

## GetListCustomerSocial
### REST API Endpoint: GET /api/v1/customer_with_socials
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "query ($input: ListDataInput!) { CustomerSocial { GetListCustomerSocial(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "start": 0,
      "length": 10
    }
  }
}'
--response '{
  "status": "0",
  "msg": "Success",
  "data": [
    {
      "id": "9",
      "orgId": "434c0f16-b7ea-4a7b-a74b-e2e0f859f549",
      "custId": "1",
      "socialType": "FACEBOOK",
      "socialId": "fb_user_002",
      "socialName": "watee",
      "imgUrl": "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
      "createdAt": "2026-03-31T08:32:19.813555Z",
      "updatedAt": "2026-03-31T08:32:19.813555Z",
      "createdBy": "watee.tha",
      "updatedBy": "watee.tha"
    }
  ],
  "desc": ""
}'

## GetCustomerSocialById
### REST API Endpoint: GET /api/v1/customer_with_socials/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "query ($input: GetIdInput!) { CustomerSocial { GetCustomerSocialById(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "17"
    }
  }
}'
--response '{
  "status": "0",
  "msg": "Success",
  "data": {
    "id": "9",
    "orgId": "434c0f16-b7ea-4a7b-a74b-e2e0f859f549",
    "custId": "1",
    "socialType": "FACEBOOK",
    "socialId": "fb_user_002",
    "socialName": "watee",
    "imgUrl": "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
    "createdAt": "2026-03-31T08:32:19.813555Z",
    "updatedAt": "2026-03-31T08:32:19.813555Z",
    "createdBy": "watee.tha",
    "updatedBy": "watee.tha"
  },
  "desc": ""
}'

# mutation

## CreateCustomerSocial
### REST API Endpoint: POST /api/v1/customer_with_socials/add
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "mutation ($input: CustomerSocialInput!) { CustomerSocial { CreateCustomerSocial(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "custId": "1",
      "imgUrl": "string",
      "socialId": "string",
      "socialName": "string",
      "socialType": "string"
    }
  }
}'
--response '{
  "status": "0",
  "msg": "Success",
  "desc": "Create successfully"
}'

## UpdateCustomerSocial
### REST API Endpoint: PATCH /api/v1/customer_with_socials/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "mutation ($input: CustomerSocialInput!) { CustomerSocial { UpdateCustomerSocial(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "17",
      "custId": "1",
      "imgUrl": "string---",
      "socialId": "string--",
      "socialName": "string-----",
      "socialType": "05"
    }
  }
}'
--response '{
  "status": "0",
  "msg": "Success",
  "desc": "Update successfully"
}'

## DeleteCustomerSocial
### REST API Endpoint: DELETE /api/v1/customer_with_socials/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "mutation ($input: GetIdInput!) { CustomerSocial { DeleteCustomerSocial(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "18"
    }
  }
}'
--response '{
  "status": "0",
  "msg": "Success",
  "desc": "Delete successfully"
}'
