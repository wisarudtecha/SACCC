# organizationSettings.sh

## query

### ListConfigProperty

### REST API Endpoint: GET /api/v1/config_properties

---

### GetConfigPropertyByKey

### REST API Endpoint: GET /api/v1/config_properties/key/{propKey}

curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "query GetConfigPropertyByKey($input: ConfigPropertyKeyInput) { ConfigProperty { GetConfigPropertyByKey(input: $input) { status msg desc data } } }",
  "variables": {
    "input": {
      "propKey": "org.config.properties"
    }
  }
}'

---

### GetConfigPropertyById

### REST API Endpoint: GET /api/v1/config_properties/{id}

---

## mutation

### CreateConfigProperty

### REST API Endpoint: POST /api/v1/config_properties/add

curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "mutation CreateConfigProperty($input: ConfigPropertyInput!) { ConfigProperty { CreateConfigProperty(input: $input) { status msg desc data } } }",
  "variables": {
    "input": {
      "propKey": "org.config.properties",
      "propVal": {
        "mapSettings": {
          "general": {
            "mapProvider": "arcgis",
            "defaultBasemapId": "street",
            "allowMapStyleChange": true
          },
          "layers": {
            "showPlace": true,
            "showBoundaries": true,
            "showSearch": true,
            "showAddressCoordinates": true,
            "allowPlaceIncidentPin": true
          },
          "incident": {
            "radiusMeters": 900,
            "showRadius": true,
            "autoLockServiceCenterOnMatch": true
          },
          "staff": {
            "showStaff": true,
            "showTrail": true,
            "routing": {
              "mode": "auto",
              "autoIntervalSeconds": 60
            },
            "etaTtl": {
              "mode": "auto",
              "autoIntervalSeconds": 30,
              "applyToAssignmentPicker": true
            },
            "tracking": {
              "mode": "auto",
              "autoIntervalSeconds": 15
            }
          },
          "assignment": {
            "showWorkload": true,
            "showAssignedCases": true,
            "enableRecommendRanking": true
          }
        },
        "assignmentMode": [
          {
            "caseSubTypes": [
              "b582b7be-e6ce-4613-a2e3-6b4b6f4f6dd2",
              "722f1074-154b-4eb0-adf9-f944c01895ca"
            ],
            "mode": "auto",
            "type": "pic"
          },
          {
            "caseSubTypes": [
              "168aaa1f-6c27-4b44-bb9d-87ed38bd3b35"
            ],
            "mode": "manual",
            "type": "pic"
          },
          {
            "caseSubTypes": [
              "97b4c229-639b-4b76-afa1-241f45b99bef"
            ],
            "mode": "auto",
            "type": "assignment"
          },
          {
            "caseSubTypes": [
              "c41d9a47-ee9d-44ba-a515-da69c794b549"
            ],
            "mode": "manual",
            "type": "assignment"
          }
        ],
        "assignmentRules": {
          "routingModes": {
            "skillBased": true,
            "availability": true,
            "areaBased": true,
            "unitProperty": true,
            "combineWithAnd": false
          },
          "allocationMethod": "load_balance",
          "advancedOptions": {
            "serviceSubType": "general",
            "autoRequireAllSkills": false,
            "autoRespectShiftSchedule": true,
            "manualSuggestByWorkload": true,
            "manualAllowOverride": true
          }
        }
      }
    }
  }
}'

---

### SetConfigPropertyByKey

### REST API Endpoint: POST /api/v1/config_properties/key/{propKey}

---

### DeleteConfigProperty

### REST API Endpoint: POST /api/v1/config_properties/{id}

---

### UpdateConfigProperty

### REST API Endpoint: POST /api/v1/config_properties/{id}
