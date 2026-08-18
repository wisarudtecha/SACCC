# query

## Get Country List
### REST API Endpoint: GET /api/v1/area/countries
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: ListDataInput!) { Area { GetCountryLists(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "start": 0,
      "length": 10
    }
  }
}'

## Get Country By Id
### REST API Endpoint: GET /api/v1/area/countries/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: GetIdInput!) { Area { GetCountryById(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
       "id": "2"
    }
  }
}'

## Get Province List
### REST API Endpoint: GET /api/v1/area/provinces
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: ListDataInput!) { Area { GetProvinceLists(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "start": 0,
      "length": 10,
      "countryId": ""
    }
  }
}'

## Get Province By Id
### REST API Endpoint: GET /api/v1/area/provinces/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: GetIdInput!) { Area { GetProvinceById(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
       "id": "1"
    }
  }
}'

## Get District List
### REST API Endpoint: GET /api/v1/area/districts
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: ListDataInput!) { Area { GetDistrictLists_(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "start": 0,
      "length": 10,
      "countryId": "TH",
      "provId": "n"
    }
  }
}'

## Get District By Id
### REST API Endpoint: GET /api/v1/area/districts/{id}
curl --location 'https://cc-bff-stg.metthier.ai:65000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: GetIdInput!) { Area { GetDistrictById(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
       "id": "4"
    }
  }
}'

## Get Addr Area List
### REST API Endpoint: GET /api/v1/area
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: AddrAreaInput!) { Area { GetAddrAreaLists(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "start": 0,
      "length": 10,
      "search": ""
    }
  }
}'

## Get Addr Province List
### REST API Endpoint: GET /api/v1/provinces
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: AddrProvinceInput!) { Area { GetAddrProvincetLists(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "start": 0,
      "length": 10,
      "search": ""
    }
  }
}'

## Get Addr District List
### REST API Endpoint: GET /api/v1/districts
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
    "query": "query ($input: AddrDistricInput!) { Area { GetAddrDistrictLists(input: $input) { status msg data desc } } }",
    "variables": {
        "input": {
            "start": 0,
            "length": 10,
            "search": ""
        }
    }
}'

## Get Addr Sub District List
### REST API Endpoint: GET /api/v1/subdistricts
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
    "query": "query ($input: AddrSubDistricInput!) { Area { GetAddrSubDistrictLists(input: $input) { status msg data desc } } }",
    "variables": {
        "input": {
            "start": 0,
            "length": 10,
            "search": ""
        }
    }
}'

# mutation

## Create Country
### REST API Endpoint: POST /api/v1/countries/add
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
    "query": "mutation ($input: AreaCountryInput!) { Area { CreateCountry(input: $input) { status msg data desc } } }",
    "variables": {
        "input": {
            "active": true,
            "countryId": "string",
            "en": "string",
            "nameSpace": "string",
            "th": "string"
        }
    }
}'

## Update Country
### REST API Endpoint: PATCH /api/v1/countries/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
    "query": "mutation ($input: AreaCountryInput!) { Area { UpdateCountry(input: $input) { status msg data desc } } }",
    "variables": {
        "input": {
            "id": 2,
            "active": true,
            "countryId": "string----",
            "en": "string",
            "nameSpace": "string",
            "th": "string"
        }
    }
}'

## Delete Country
### REST API Endpoint: DELETE /api/v1/countries/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
    "query": "mutation ($input: GetIdInput!) { Area { DeleteCountry(input: $input) { status msg data desc } } }",
    "variables": {
        "input": {
            "id": "4"
        }
    }
}'

## Create Province
### REST API Endpoint: POST /api/v1/provinces/add
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
    "query": "mutation ($input: AreaProvinceInput!) { Area { CreateProvince(input: $input) { status msg data desc } } }",
    "variables": {
        "input": {
            "provId": "ssss",
            "active": true,
            "countryId": "string",
            "en": "string",
            "nameSpace": "string",
            "th": "string"
        }
    }
}'

## Update Province
### REST API Endpoint: PATCH /api/v1/provinces/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
    "query": "mutation ($input: AreaProvinceInput!) { Area { UpdateProvince(input: $input) { status msg data desc } } }",
    "variables": {
        "input": {
            "id": "1",
            "provId": "AAA",
            "active": true,
            "countryId": "string",
            "en": "string",
            "nameSpace": "string",
            "th": "string"
        }
    }
}'

## Delete Province
### REST API Endpoint: DELETE /api/v1/provinces/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
    "query": "mutation ($input: GetIdInput!) { Area { DeleteProvince(input: $input) { status msg data desc } } }",
    "variables": {
        "input": {
            "id": "3"
        }
    }
}'

## Create District
### REST API Endpoint: POST /api/v1/districts/add
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
    "query": "mutation ($input: AreaDistrictInput!) { Area { CreateDistrict(input: $input) { status msg data desc } } }",
    "variables": {
        "input": {
            "countryId": "111",
            "provId": "222",
            "distId": "444",
            "active": true,
            "en": "string",
            "nameSpace": "string",
            "th": "string"
        }
    }
}'

## Update District
### REST API Endpoint: PATCH /api/v1/districts/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
    "query": "mutation ($input: AreaDistrictInput!) { Area { UpdateDistrict(input: $input) { status msg data desc } } }",
    "variables": {
        "input": {
            "id": "52",
            "countryId": "111-",
            "provId": "222-",
            "distId": "444x",
            "active": true,
            "en": "stringp",
            "nameSpace": "string",
            "th": "string"
        }
    }
}'

## Delete District
### REST API Endpoint: DELETE /api/v1/districts/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
    "query": "mutation ($input: GetIdInput!) { Area { DeleteDistrict(input: $input) { status msg data desc } } }",
    "variables": {
        "input": {
            "id": "55"
        }
    }
}'