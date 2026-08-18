# query

## GetUserAreaByUsername
### REST API Endpoint: GET /api/v1/users_with_area/username/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer ' \
--data '{
  "query": "query ($input: GetIdInput!) { UserArea { GetUserAreaByUsername(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "apiwat.rod"
    }
  }
}'

# mutation

## UpdateUserArea
### REST API Endpoint: PATCH /api/v1/users_with_area/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer ' \
--data '{
  "query": "mutation ($input: UserAreaInput!) { UserArea { UpdateUserArea(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "AAAAAAA",
      "distIds": [
        "aaaa",
        "bbbb"
      ]
    }
  }
}'
