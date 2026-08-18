# query

## GetListMdmUnit
### REST API Endpoint: GET /api/v1/mdm/units
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: ListDataInput!) { MdmUnit { GetListMdmUnit(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
       "start": 0,
       "length" : 10
    }
  }
}'

## GetMdmUnitById
### REST API Endpoint: GET /api/v1/mdm/units/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: GetIdInput!) { MdmUnit { GetMdmUnitById(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "1"
    }
  }
}'

## GetMdmUnitPropById
### REST API Endpoint: GET /api/v1/mdm/units/properties/{unitId}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: ListDataInput!) { MdmUnit { GetMdmUnitPropById(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "UNIT-001",
      "start": 0,
      "length": 10
    }
  }
}'

## GetListMdmType
### REST API Endpoint: GET /api/v1/mdm/types
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: ListDataInput!) { MdmType { GetListMdmType(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "start": 0,
      "length" : 10
    }
  }
}'

## GetMdmTypeById
### REST API Endpoint: GET /api/v1/mdm/types/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: GetIdInput!) { MdmType { GetMdmTypeById(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "5"
    }
  }
}'

## GetListMdmStatus
### REST API Endpoint: GET /api/v1/mdm/status
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: ListDataInput!) { MdmStatus { GetListMdmStatus(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "start": 0,
      "length" : 10
    }
  }
}'

## GetMdmStatusById
### REST API Endpoint: GET /api/v1/mdm/status/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: GetIdInput!) { MdmStatus { GetMdmStatusById(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "6"
    }
  }
}'

## GetListMdmSource
### REST API Endpoint: GET /api/v1/mdm/sources
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: ListDataInput!) { MdmSource { GetListMdmSource(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "start": 0,
      "length" : 10
    }
  }
}'

## GetMdmSourceById
### REST API Endpoint: GET /api/v1/mdm/sources/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: GetIdInput!) { MdmSource { GetMdmSourceById(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "7"
    }
  }
}'

## GetListMdmProperty
### REST API Endpoint: GET /api/v1/mdm/properties
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: ListDataInput!) { MdmProperty { GetListMdmProperty(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "start": 0,
      "length" : 10
    }
  }
}'

## GetMdmPropertyById
### REST API Endpoint: GET /api/v1/mdm/properties/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: GetIdInput!) { MdmProperty { GetMdmPropertyById(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "3"
    }
  }
}'

## GetListMdmCompany
### REST API Endpoint: GET /api/v1/mdm/companies
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: ListDataInput!) { MdmCompany { GetListMdmCompany(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "start": 0,
      "length" : 10
    }
  }
}'

## GetMdmCompanyById
### REST API Endpoint: GET /api/v1/mdm/companies/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: GetIdInput!) { MdmCompany { GetMdmCompanyById(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "fdba0e5d-cf2f-4d97-9654-93078fa5d29b"
    }
  }
}'

# mutation

## CreateMdmUnit
### REST API Endpoint: POST /api/v1/mdm/units/add
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "mutation ($input: MmdUnitInput!) { MdmUnit { CreateMdmUnit(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "active": true,
      "breakDuration": 0,
      "commId": "258245ba-5554-49d9-ae80-563189ffab7d",
      "compId": "3e2579aa-0eaf-4f1d-94f9-1c1aa8ffabcd",
      "deptId": "40eab5cb-6d57-48e8-b3e1-5f733127c43f",
      "healthChk": "OK",
      "healthChkTime": "2026-05-18T10:30:00Z",
      "isFreeze": false,
      "isLogin": true,
      "isOutArea": false,
      "locAccuracy": 5,
      "locAlt": 10,
      "locBearing": 0,
      "locGpsTime": "2026-05-18T10:30:00Z",
      "locLastUpdateTime": "2026-05-18T10:35:00Z",
      "locLat": 13.7563,
      "locLon": 100.5018,
      "locProvider": "gps",
      "locSatellites": 8,
      "locSpeed": 0, 
      "plateNo": "ABC123",
      "priority": 1,
      "provinceCode": "10",
      "stnId": "19d6697b-7045-41a6-bb0f-07a37a7049cb",
      "sttId": "000",
      "unitId": "UNIT001",
      "unitName": "Test Unit",
      "unitSourceId": "3c48bb37-22a4-4aca-b659-955feadeb5c1",
      "unitTypeId": "f0372c38-2266-426b-8e9e-73df5e4045d4",
      "username": "admin"
    }
  }
}'

## UpdateMdmUnit 
### REST API Endpoint: PATCH /api/v1/mdm/units/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "mutation ($input: MmdUnitInput!) { MdmUnit { UpdateMdmUnit(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "112",
      "active": true,
      "breakDuration": 0,
      "commId": "258245ba-5554-49d9-ae80-563189ffab7d",
      "compId": "3e2579aa-0eaf-4f1d-94f9-1c1aa8ffabcd",
      "deptId": "40eab5cb-6d57-48e8-b3e1-5f733127c43f",
      "healthChk": "OK",
      "healthChkTime": "2026-05-18T10:30:00Z",
      "isFreeze": false,
      "isLogin": true,
      "isOutArea": false,
      "locAccuracy": 5,
      "locAlt": 10,
      "locBearing": 0,
      "locGpsTime": "2026-05-18T10:30:00Z",
      "locLastUpdateTime": "2026-05-18T10:35:00Z",
      "locLat": 13.7563,
      "locLon": 100.5018,
      "locProvider": "gps",
      "locSatellites": 8,
      "locSpeed": 0,
      "plateNo": "ABC123",
      "priority": 1,
      "provinceCode": "10",
      "stnId": "19d6697b-7045-41a6-bb0f-07a37a7049cb",
      "sttId": "000",
      "unitId": "UNIT001-cc",
      "unitName": "Test Unit-xx",
      "unitSourceId": "3c48bb37-22a4-4aca-b659-955feadeb5c1",
      "unitTypeId": "f0372c38-2266-426b-8e9e-73df5e4045d4",
      "username": "admin"
    }
  }
}'

## DeleteMdmUnit 
### REST API Endpoint: DELETE /api/v1/mdm/units/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "mutation ($input: GetIdInput!) { MdmUnit { DeleteMdmUnit(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "113"
    }
  }
}'

## CreateMdmType 
### REST API Endpoint: POST /api/v1/mdm/types/add
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "mutation ($input: MdmTypeInput!) { MdmType { CreateMdmType(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "active": true,
      "th": "xxxx",
      "en": "zzzzz"
    }
  }
}'

## UpdateMdmType
### REST API Endpoint: PATCH /api/v1/mdm/types/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "mutation ($input: MdmTypeInput!) { MdmType { UpdateMdmType(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id":"5", 
      "active": true,
      "th": "S--1",
      "en": "S--2"
    }
  }
}'

## DeleteMdmType
### REST API Endpoint: DELETE /api/v1/mdm/types/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "mutation ($input: GetIdInput!) { MdmType { DeleteMdmType(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "6"
    }
  }
}'

## CreateMdmStatus
### REST API Endpoint: POST /api/v1/mdm/status/add
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "mutation ($input: MdmStatusInput!) { MdmStatus { CreateMdmStatus(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "sttId": "aa",
      "sttName": "cc"
    }
  }
}'

## UpdateMdmStatus
### REST API Endpoint: PATCH /api/v1/mdm/status/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "mutation ($input: MdmStatusInput!) { MdmStatus { UpdateMdmStatus(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "9",
      "sttId": "AA1111",
      "sttName": "222"
    }
  }
}'

## DeleteMdmStatus
### REST API Endpoint: DELETE /api/v1/mdm/status/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "mutation ($input: GetIdInput!) { MdmStatus { DeleteMdmStatus(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "9"
    }
  }
}'

## CreateMdmSource
### REST API Endpoint: POST /api/v1/mdm/sources/add
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "mutation ($input: MdmSourceInput!) { MdmSource { CreateMdmSource(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "active": true,
      "en": "stringxxxx",
      "th": "stringaaa"
    }
  }
}'

## UpdateMdmSource
### REST API Endpoint: PATCH /api/v1/mdm/sources/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "mutation ($input: MdmSourceInput!) { MdmSource { UpdateMdmSource(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "7",
      "active": true,
      "en": "AAA",
      "th": "BBB"
    }
  }
}'

## DeleteMdmSource
### REST API Endpoint: DELETE /api/v1/mdm/sources/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "mutation ($input: GetIdInput!) { MdmSource { DeleteMdmSource(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "7"
    }
  }
}'

## CreateMdmProperty
### REST API Endpoint: POST /api/v1/mdm/properties/add
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "mutation ($input: MdmPropertyInput!) { MdmProperty { CreateMdmProperty(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "active": true,
      "en": "stringxxxx",
      "th": "stringaaa"
    }
  }
}'

## UpdateMdmProperty
### REST API Endpoint: PATCH /api/v1/mdm/properties/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "mutation ($input: MdmPropertyInput!) { MdmProperty { UpdateMdmProperty(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "3",
      "active": true,
      "en": "AAA",
      "th": "BBB"
    }
  }
}'

## DeleteMdmProperty
### REST API Endpoint: DELETE /api/v1/mdm/properties/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "mutation ($input: GetIdInput!) { MdmProperty { DeleteMdmProperty(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "3"
    }
  }
}'

## CreateMdmCompany
### REST API Endpoint: POST /api/v1/mdm/companies/add
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data-raw '{
  "query": "mutation ($input: MmdCompaniesInput!) { MdmCompany { CreateMdmCompany(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "name": "SKY-AI",
      "legalName": "SKY AI COMPANY LIMITED",
      "domain": "skyai.co.th",
      "email": "contact@skyai.co.th",
      "phoneNumber": "02-123-4567",
      "address": {
        "building": "Central Pinklao Tower A",
        "floor": "19th",
        "street": "7/129",
        "road": "Baromrajchonnee Rd",
        "subDistrict": "Aroon-Amarin",
        "district": "Bangkok Noi",
        "province": "Bangkok",
        "postalCode": "10700",
        "country": "Thailand"
      },
      "logoUrl": "https://skyai.co.th/logo.png",
      "websiteUrl": "https://skyai.co.th",
      "description": "AI Solution provider for smart city and industry."
    }
  }
}'

## UpdateMdmCompany
### REST API Endpoint: PATCH /api/v1/mdm/companies/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data-raw '{
  "query": "mutation ($input: MmdCompaniesInput!) { MdmCompany { UpdateMdmCompany(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "fdba0e5d-cf2f-4d97-9654-93078fa5d29b",
      "name": "SKY-AIccccccc",
      "legalName": "SKY AI COMPANY LIMITED",
      "domain": "skyai.co.th",
      "email": "contact@skyai.co.th",
      "phoneNumber": "02-123-4567",
      "address": {
        "building": "Central Pinklao Tower A",
        "floor": "19th",
        "street": "7/129",
        "road": "Baromrajchonnee Rd",
        "subDistrict": "Aroon-Amarin",
        "district": "Bangkok Noi",
        "province": "Bangkok",
        "postalCode": "10700",
        "country": "Thailand"
      },
      "logoUrl": "https://skyai.co.th/logo.png",
      "websiteUrl": "https://skyai.co.th",
      "description": "AI Solution provider for smart city and industry."
    }
  }
}'

## DeleteMdmCompany
### REST API Endpoint: DELETE /api/v1/mdm/companies/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "mutation ($input: GetIdInput!) { MdmCompany { DeleteMdmCompany(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "fdba0e5d-cf2f-4d97-9654-93078fa5d29b"
    }
  }
}'
