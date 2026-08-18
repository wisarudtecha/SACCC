# mutation

## SelectUserUnit
### REST API Endpoint: PATCH /api/v1/mob/select
curl --location 'https://cc-bff-qa.one-sky.ai/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "mutation ($input: SelectUserUnitInput!) { UserDevice { SelectUserUnit(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "unitId": "responder6",
      "username": "watee.tha"
    }
  }
}'

## UpdateUserTracking
### REST API Endpoint: PATCH /api/v1/mob/tracking
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "mutation ($input: UpdateUserTrackingInput!) { UserTracking { UpdateUserTracking(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "unitId": "UNIT-005",
      "latitude": 13.7563,
      "longitude": 100.5018,
      "accuracy": 15.2,
      "altitude": 1.5,
      "speed": 0.0,
      "heading": 180.5,
      "gpsTime": 1785759400000,
      "provider": "GPS",
      "satellites": 9,
      "breakDuration": 5
    }
  }
}'

## UpdateUserUnitStatus
### REST API Endpoint: PATCH /api/v1/mob/status
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "mutation ($input: UpdateUserUnitStatusInput!) { UserDevice { UpdateUserUnitStatus(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "sttId": "S001",
      "unitId": "UNIT-005"
    }
  }
}'

# websocket

## Select Unit
'{
  "EVENT": "MOB",
  "orgId": "434c0f16-b7ea-4a7b-a74b-e2e0f859f549",
  "senderType": "User",
  "sender": "apiwat.rod",
  "eventType": "UNIT_SELECT",
  "createdAt": "2026-08-04T13:36:00.659801232Z",
  "additionalJson": {
    "unitId": "UNIT-005",
    "username": "apiwat.rod"
  }
}'

## Update Location
'{
  "EVENT": "MOB",
  "orgId": "434c0f16-b7ea-4a7b-a74b-e2e0f859f549",
  "senderType": "User",
  "sender": "apiwat.rod",
  "eventType": "TRACKING",
  "createdAt": "2026-08-04T07:56:21.62385592Z",
  "additionalJson": {
    "accuracy": 15.2,
    "altitude": 1.5,
    "breakDuration": 5,
    "gpsTime": 1785759400000,
    "heading": 180.5,
    "latitude": 13.7563,
    "longitude": 100.5018,
    "provider": "GPS",
    "satellites": 9,
    "speed": 1.2,
    "unitId": "UNIT-005"
  }
}'

## Change Status
'{
  "EVENT": "MOB",
  "orgId": "434c0f16-b7ea-4a7b-a74b-e2e0f859f549",
  "senderType": "User",
  "sender": "apiwat.rod",
  "eventType": "STATUS",
  "createdAt": "2026-08-04T10:43:15.041453862Z",
  "additionalJson": {
    "sttId": "S001",
    "unitId": "UNIT-005"
  }
}'
