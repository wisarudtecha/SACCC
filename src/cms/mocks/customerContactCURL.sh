# query

## GetListCustomerContact
### REST API Endpoint: GET /api/v1/customer_contacts
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: ListDataInput!) { CustomerContact { GetListCustomerContact(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "start": 0,
      "length" : 10
    }
  }
}'
--response '{
  "status": "0",
  "msg": "Success",
  "data": [
    {
      "id": "1",
      "orgId": "434c0f16-b7ea-4a7b-a74b-e2e0f859f549",
      "custId": 1,
      "contactName": "Contact_1",
      "contactPhone": "080995yyyyy",
      "contactAddr": {
        "building": "Central Pinklao Tower A",
        "country": "Thailand",
        "district": "Bangkok Noi",
        "floor": "19th",
        "lat": "13.7563",
        "lon": "100.5018",
        "postalCode": "10700",
        "province": "Bangkok",
        "road": "Baromrajchonnee Rd",
        "room": "1901",
        "street": "7/129",
        "subDistrict": "Aroon-Amarin"
      },
      "createdAt": "2025-08-01T03:30:40.054512Z",
      "updatedAt": "2025-08-01T03:30:40.054512Z",
      "createdBy": "apiwat_r",
      "updatedBy": "apiwat_r"
    }
  ],
  "desc": ""
}'

## GetCustomerContactById
### REST API Endpoint: GET /api/v1/customer_contacts/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: GetIdInput!) { CustomerContact { GetCustomerContactById(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "3"
    }
  }
}'
--response '{
  "status": "0",
  "msg": "Success",
  "data": {
    "id": "1",
    "orgId": "434c0f16-b7ea-4a7b-a74b-e2e0f859f549",
    "custId": 1,
    "contactName": "Contact_1",
    "contactPhone": "080995yyyyy",
    "contactAddr": {
      "building": "Central Pinklao Tower A",
      "country": "Thailand",
      "district": "Bangkok Noi",
      "floor": "19th",
      "lat": "13.7563",
      "lon": "100.5018",
      "postalCode": "10700",
      "province": "Bangkok",
      "road": "Baromrajchonnee Rd",
      "room": "1901",
      "street": "7/129",
      "subDistrict": "Aroon-Amarin"
    },
    "createdAt": "2025-08-01T03:30:40.054512Z",
    "updatedAt": "2025-08-01T03:30:40.054512Z",
    "createdBy": "apiwat_r",
    "updatedBy": "apiwat_r"
  },
  "desc": ""
}'

## GetCustomerContactDefault
### REST API Endpoint: GET /api/v1/customer_contact/default/{custId}
curl --location 'https://cc-bff-stg.one-sky.ai/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "query ($input: GetIdInput!) { CustomerContactDefault { GetCustomerContactDefault(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "111111"
    }
  }
}'
--response '{
  "status": "0",
  "msg": "Success",
  "data": {
    "id": "1",
    "orgId": "434c0f16-b7ea-4a7b-a74b-e2e0f859f549",
    "custId": 111111,
    "type": "zzzz",
    "referId": "ccccccccccc",
    "createdAt": "2026-08-20T02:30:40.068526Z",
    "updatedAt": "2026-08-20T02:31:37.696433Z",
    "createdBy": "apiwat.rod",
    "updatedBy": "apiwat.rod"
  },
  "desc": ""
}'

# mutation

## CreateCustomerContact
### REST API Endpoint: POST /api/v1/customer_contacts/add
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "mutation ($input: CustomerContactInput!) { CustomerContact { CreateCustomerContact(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "contactAddr": {
        "additionalProp1": {}
      },
      "contactName": "string",
      "contactPhone": "string",
      "custId": 1
    }
  }
}'
--response '{
  "status": "0",
  "msg": "Success",
  "desc": "Create successfully"
}'

## UpdateCustomerContact
### REST API Endpoint: PATCH /api/v1/customer_contacts/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "mutation ($input: CustomerContactInput!) { CustomerContact { UpdateCustomerContact(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "3",
      "contactAddr": {
        "additionalProp1": {}
      },
      "contactName": "string00",
      "contactPhone": "string--",
      "custId": 1
    }
  }
}'
--response '{
  "status": "0",
  "msg": "Success",
  "desc": "Update successfully"
}'

## UpdateCustomerContactDefault
### REST API Endpoint: PATCH /api/v1/customer_contacts/{id}
curl --location 'https://cc-bff-stg.one-sky.ai/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "mutation ($input: CustomerContactDefaultInput!) { CustomerContactDefault { UpdateCustomerContactDefault(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "custId": 11111111,
      "referId": "stringxxx",
      "type": "stringzzz"
    }
  }
}'
--response '{
  "status": "0",
  "msg": "Success",
  "desc": "Update successfully"
}'

## DeleteCustomerContact
### REST API Endpoint: DELETE /api/v1/customer_contacts/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "mutation ($input: GetIdInput!) { CustomerContact { DeleteCustomerContact(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "3"
    }
  }
}'
--response '{
  "status": "0",
  "msg": "Success",
  "desc": "Delete successfully"
}'
