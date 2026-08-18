# query

## GetListLayout
### REST API Endpoint: GET /api/v1/layout_configurations
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "query ($input: LayoutListInput!) { Layout { GetListLayout(input: $input) { status msg data desc pageSize totalRecords} } }",
  "variables": {
    "input": {
      "type": "dashboard",
      "isShared": false,
      "isDefault": true,
      "start": 0,
      "length": 100
    }
  }
}'

## GetLayoutById
### REST API Endpoint: GET /api/v1/layout_configurations/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "query ($input: GetIdInput!) { Layout { GetLayoutById(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "4b4deaef-25b9-4890-a60c-45d8f86b31a9"
    }
  }
}'

# mutation

## CreateLayout
### REST API Endpoint: POST /api/v1/layout_configurations/add
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "mutation ($input: LayoutInput!) { Layout { CreateLayout(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "type": "dashboard",
      "name": "aaaa zzzzzz",
      "isShared": false,
      "isDefault": true,
      "widgets": [
        {
          "id": "widget-mock-summary",
          "widgetKey": "case-summary-metrics",
          "position": {
            "order": 0,
            "colSpan": 3,
            "rowSpan": 1
          },
          "config": {
            "showHeader": true
          }
        },
        {
          "id": "widget-mock-sla",
          "widgetKey": "sla-performance",
          "position": {
            "order": 1,
            "colSpan": 1,
            "rowSpan": 1
          },
          "config": {
            "showHeader": true
          }
        },
        {
          "id": "widget-mock-daily",
          "widgetKey": "case-daily-chart",
          "position": {
            "order": 2,
            "colSpan": 3,
            "rowSpan": 2
          },
          "config": {
            "showHeader": true
          }
        },
        {
          "id": "widget-mock-donut",
          "widgetKey": "case-status-donut",
          "position": {
            "order": 3,
            "colSpan": 1,
            "rowSpan": 2
          },
          "config": {
            "showHeader": true
          }
        },
        {
          "id": "widget-mock-monthly",
          "widgetKey": "case-monthly-chart",
          "position": {
            "order": 4,
            "colSpan": 4,
            "rowSpan": 2
          },
          "config": {
            "showHeader": true,
            "monthRange": 6
          }
        }
      ]
    }
  }
}'

## UpdateLayout
### REST API Endpoint: PATCH /api/v1/layout_configurations/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "mutation ($input: LayoutInput!) { Layout { UpdateLayout(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id" : "4b4deaef-25b9-4890-a60c-45d8f86b31a9",
      "type": "dashboard",
      "name": "=====xxxxx==== Overview",
      "isShared": false,
      "isDefault": true,
      "widgets": [
        {
          "id": "xxxxx-mock-summary",
          "widgetKey": "case-summary-metrics",
          "position": {
            "order": 0,
            "colSpan": 3,
            "rowSpan": 1
          },
          "config": {
            "showHeader": true
          }
        },
        {
          "id": "widget-mock-sla",
          "widgetKey": "sla-performance",
          "position": {
            "order": 1,
            "colSpan": 1,
            "rowSpan": 1
          },
          "config": {
            "showHeader": true
          }
        },
        {
          "id": "widget-mock-daily",
          "widgetKey": "case-daily-chart",
          "position": {
            "order": 2,
            "colSpan": 3,
            "rowSpan": 2
          },
          "config": {
            "showHeader": true
          }
        },
        {
          "id": "widget-mock-donut",
          "widgetKey": "case-status-donut",
          "position": {
            "order": 3,
            "colSpan": 1,
            "rowSpan": 2
          },
          "config": {
            "showHeader": true
          }
        },
        {
          "id": "widget-mock-monthly",
          "widgetKey": "case-monthly-chart",
          "position": {
            "order": 4,
            "colSpan": 4,
            "rowSpan": 2
          },
          "config": {
            "showHeader": true,
            "monthRange": 6
          }
        }
      ]
    }
  }
}'

## DeleteLayout
### REST API Endpoint: DELETE /api/v1/layout_configurations/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "mutation ($input: GetIdInput!) { Layout { DeleteLayout(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "4b4deaef-25b9-4890-a60c-45d8f86b31a9"
    }
  }
}'
