# query

## GetCountryLists
### Description: Get list of countries
### REST API Endpoint: GET /api/v1/area/countries
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "query ($input: ListDataInput!) { Area { GetCountryLists(input: $input) { status msg data desc } } }",
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
      "id": 5,
      "orgId": "434c0f16-b7ea-4a7b-a74b-e2e0f859f549",
      "countryId": "TH",
      "en": "Thailand xxxx",
      "th": "ประเทศไทย",
      "active": true,
      "nameSpace": "th",
      "coordinates": [
        [
          [
            100,
            13
          ],
          [
            101,
            13
          ],
          [
            101,
            14
          ],
          [
            100,
            13
          ]
        ]
      ],
      "yearOfData": 2026,
      "shapeArea": 513120,
      "shapeLength": 5326,
      "sourceTemplateId": 18,
      "createdAt": "2025-08-04T10:21:09.32552Z",
      "updatedAt": "2026-08-21T07:39:43.968708Z",
      "createdBy": "apiwat_r",
      "updatedBy": "apiwat.rod"
    }
  ],
  "desc": ""
}'

## GetCountryById
### Description: Get country by ID
### REST API Endpoint: GET /api/v1/area/countries/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "query ($input: GetIdInput!) { Area { GetCountryById(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "2"
    }
  }
}'
--response-body '{
  "status": "0",
  "msg": "Success",
  "data": {
    "id": 5,
    "orgId": "434c0f16-b7ea-4a7b-a74b-e2e0f859f549",
    "countryId": "TH",
    "en": "Thailand xxxx",
    "th": "ประเทศไทย",
    "active": true,
    "nameSpace": "th",
    "coordinates": [
      [
        [
          100,
          13
        ],
        [
          101,
          13
        ],
        [
          101,
          14
        ],
        [
          100,
          13
        ]
      ]
    ],
    "yearOfData": 2026,
    "shapeArea": 513120,
    "shapeLength": 5326,
    "sourceTemplateId": 18,
    "createdAt": "2025-08-04T10:21:09.32552Z",
    "updatedAt": "2026-08-21T07:39:43.968708Z",
    "createdBy": "apiwat_r",
    "updatedBy": "apiwat.rod"
  },
  "desc": ""
}'

## GetProvinceLists
### Description: Get list of provinces
### REST API Endpoint: GET /api/v1/area/provinces
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
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
--response-body '{
  "status": "0",
  "msg": "Success",
  "data": [
    {
      "id": 23,
      "orgId": "434c0f16-b7ea-4a7b-a74b-e2e0f859f549",
      "countryId": "TH",
      "provId": "10",
      "en": "BangkokZZZZ",
      "th": "IIIกรุงเทพมหานคร",
      "active": true,
      "nameSpace": "",
      "coordinates": [
        [
          [
            100.4,
            13.7
          ],
          [
            100.6,
            13.7
          ],
          [
            100.6,
            13.9
          ],
          [
            100.4,
            13.7
          ]
        ]
      ],
      "sourceTemplateId": 12,
      "createdAt": "2026-08-21T06:37:00.595765Z",
      "updatedAt": "2026-08-21T07:39:43.968708Z",
      "createdBy": "apiwat.rod",
      "updatedBy": "apiwat.rod"
    }
  ],
  "desc": ""
}'

## GetProvinceById
### Description: Get province by ID
### REST API Endpoint: GET /api/v1/area/provinces/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "query ($input: GetIdInput!) { Area { GetProvinceById(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "1"
    }
  }
}'
--response-body '{
  "status": "0",
  "msg": "Success",
  "data": {
    "id": 23,
    "orgId": "434c0f16-b7ea-4a7b-a74b-e2e0f859f549",
    "countryId": "TH",
    "provId": "10",
    "en": "BangkokZZZZ",
    "th": "IIIกรุงเทพมหานคร",
    "active": true,
    "nameSpace": "",
    "coordinates": [
      [
        [
          100.4,
          13.7
        ],
        [
          100.6,
          13.7
        ],
        [
          100.6,
          13.9
        ],
        [
          100.4,
          13.7
        ]
      ]
    ],
    "sourceTemplateId": 12,
    "createdAt": "2026-08-21T06:37:00.595765Z",
    "updatedAt": "2026-08-21T07:39:43.968708Z",
    "createdBy": "apiwat.rod",
    "updatedBy": "apiwat.rod"
  },
  "desc": ""
}'

## GetDistrictLists_
### Description: Get list of districts
### REST API Endpoint: GET /api/v1/area/districts
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
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
--response-body '{
  "status": "0",
  "msg": "Success",
  "data": [
    {
      "id": 102,
      "orgId": "434c0f16-b7ea-4a7b-a74b-e2e0f859f549",
      "countryId": "TH",
      "provId": "10",
      "distId": "1001",
      "en": "ZZZPhra Nakhon",
      "th": "XXXพระนคร",
      "postcode": "10200",
      "active": true,
      "nameSpace": "",
      "coordinates": [
        [
          [
            100.49,
            13.75
          ],
          [
            100.5,
            13.75
          ],
          [
            100.5,
            13.76
          ],
          [
            100.49,
            13.75
          ]
        ]
      ],
      "sourceTemplateId": 11,
      "createdAt": "2026-08-21T06:37:00.595765Z",
      "updatedAt": "2026-08-21T07:39:43.968708Z",
      "createdBy": "apiwat.rod",
      "updatedBy": "apiwat.rod"
    }
  ],
  "desc": ""
}'

## GetDistrictById
### Description: Get district by ID
### REST API Endpoint: GET /api/v1/area/districts/{id}
curl --location 'https://cc-bff-stg.metthier.ai:65000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "query ($input: GetIdInput!) { Area { GetDistrictById(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "4"
    }
  }
}'
--response-body '{
  "status": "0",
  "msg": "Success",
  "data": {
    "id": 102,
    "orgId": "434c0f16-b7ea-4a7b-a74b-e2e0f859f549",
    "countryId": "TH",
    "provId": "10",
    "distId": "1001",
    "en": "ZZZPhra Nakhon",
    "th": "XXXพระนคร",
    "postcode": "10200",
    "active": true,
    "nameSpace": "",
    "coordinates": [
      [
        [
          100.49,
          13.75
        ],
        [
          100.5,
          13.75
        ],
        [
          100.5,
          13.76
        ],
        [
          100.49,
          13.75
        ]
      ]
    ],
    "sourceTemplateId": 11,
    "createdAt": "2026-08-21T06:37:00.595765Z",
    "updatedAt": "2026-08-21T07:39:43.968708Z",
    "createdBy": "apiwat.rod",
    "updatedBy": "apiwat.rod"
  },
  "desc": ""
}'

## GetAddrAreaLists
### Description: Get list of address areas
### REST API Endpoint: GET /api/v1/area
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
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

## GetAddrProvincetLists
### Description: Get list of address provinces
### REST API Endpoint: GET /api/v1/provinces
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
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

## GetAddrDistrictLists
### Description: Get list of address districts
### REST API Endpoint: GET /api/v1/districts
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
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

## GetAddrSubDistrictLists
### Description: Get list of address subdistricts
### REST API Endpoint: GET /api/v1/subdistricts
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
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

## GetOrgCountryTree
### Description: Get organization country tree - Read the cached nested tree for an org's area country (no DB joins)
### REST API Endpoint: GET /api/v1/area/countries/{id}/tree
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "query ($input: GetIdInput!) { AreaTemplate { GetOrgCountryTree(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "5"
    }
  }
}'
--response-body '{
  "status": "0",
  "msg": "Success",
  "data": {
    "en": "Thailand xxxx",
    "id": 5,
    "th": "ประเทศไทย",
    "active": true,
    "countryId": "TH",
    "provinces": [
      {
        "en": "BangkokZZZZ",
        "id": 23,
        "th": "IIIกรุงเทพมหานคร",
        "active": true,
        "provId": "10",
        "districts": [
          {
            "en": "ZZZPhra Nakhon",
            "id": 102,
            "th": "XXXพระนคร",
            "active": true,
            "distId": "1001",
            "postcode": "10200",
            "coordinates": [
              [
                [
                  100.49,
                  13.75
                ],
                [
                  100.5,
                  13.75
                ],
                [
                  100.5,
                  13.76
                ],
                [
                  100.49,
                  13.75
                ]
              ]
            ]
          }
        ],
        "coordinates": [
          [
            [
              100.4,
              13.7
            ],
            [
              100.6,
              13.7
            ],
            [
              100.6,
              13.9
            ],
            [
              100.4,
              13.7
            ]
          ]
        ]
      }
    ],
    "shapeArea": 513120,
    "yearOfData": 2026,
    "coordinates": [
      [
        [
          100,
          13
        ],
        [
          101,
          13
        ],
        [
          101,
          14
        ],
        [
          100,
          13
        ]
      ]
    ],
    "shapeLength": 5326
  },
  "desc": ""
}'

# mutation

## CreateCountry
### Description: Create a new country
### REST API Endpoint: POST /api/v1/countries/add
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "mutation ($input: AreaCountryInput!) { Area { CreateCountry(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "countryId": "AA",
      "en": "AA",
      "th": "ZZ",
      "active": true,
      "nameSpace": "",
      "coordinates": [
        [
          [
            100.0,
            13.0
          ],
          [
            101.0,
            13.0
          ],
          [
            101.0,
            14.0
          ],
          [
            100.0,
            13.0
          ]
        ]
      ],
      "yearOfData": 2026,
      "shapeArea": 513120.0,
      "shapeLength": 5326.0
    }
  }
}'

## UpdateCountry
### Description: Update an existing country
### REST API Endpoint: PATCH /api/v1/countries/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "mutation ($input: AreaCountryInput!) { Area { UpdateCountry(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "21",
      "countryId": "xxxx",
      "en": "ppp",
      "th": "ssss",
      "active": true,
      "nameSpace": "",
      "coordinates": [
        [
          [
            100.0,
            13.0
          ],
          [
            101.0,
            13.0
          ],
          [
            101.0,
            14.0
          ],
          [
            100.0,
            13.0
          ]
        ]
      ],
      "yearOfData": 2026,
      "shapeArea": 513120.0,
      "shapeLength": 5326.0
    }
  }
}'

## DeleteCountry
### Description: Delete a country by ID
### REST API Endpoint: DELETE /api/v1/countries/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "mutation ($input: GetIdInput!) { Area { DeleteCountry(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "4"
    }
  }
}'

## CreateProvince
### Description: Create a new province
### REST API Endpoint: POST /api/v1/provinces/add
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "mutation ($input: AreaProvinceInput!) { Area { CreateProvince(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "countryId": "xxxx",
      "provId": "10",
      "en": "Sub-area",
      "th": "Sub-area",
      "active": true,
      "nameSpace": "",
      "coordinates": [
        [
          [
            100.4,
            13.7
          ],
          [
            100.6,
            13.7
          ],
          [
            100.6,
            13.9
          ],
          [
            100.4,
            13.7
          ]
        ]
      ]
    }
  }
}'

## UpdateProvince
### Description: Update an existing province
### REST API Endpoint: PATCH /api/v1/provinces/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "mutation ($input: AreaProvinceInput!) { Area { UpdateProvince(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "26",
      "countryId": "xxxx",
      "provId": "10",
      "en": "AA",
      "th": "BB",
      "active": true,
      "nameSpace": "",
      "coordinates": [
        [
          [
            100.4,
            13.7
          ],
          [
            100.6,
            13.7
          ],
          [
            100.6,
            13.9
          ],
          [
            100.4,
            13.7
          ]
        ]
      ]
    }
  }
}'

## DeleteProvince
### Description: Delete a province by ID
### REST API Endpoint: DELETE /api/v1/provinces/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "mutation ($input: GetIdInput!) { Area { DeleteProvince(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "3"
    }
  }
}'

## CreateDistrict
### Description: Create a new district
### REST API Endpoint: POST /api/v1/districts/add
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "mutation ($input: AreaDistrictInput!) { Area { CreateDistrict(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "countryId": "xxxx",
      "provId": "10",
      "distId": "101",
      "active": true,
      "en": "D-1",
      "nameSpace": "string",
      "th": "D-1",
      "coordinates": [
        [
          [
            100.49,
            13.75
          ],
          [
            100.50,
            13.75
          ],
          [
            100.50,
            13.76
          ],
          [
            100.49,
            13.75
          ]
        ]
      ]
    }
  }
}'

## UpdateDistrict
### Description: Update an existing district
### REST API Endpoint: PATCH /api/v1/districts/{id}
curl --location 'https://cc-bff-stg.one-sky.ai/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "mutation ($input: AreaDistrictInput!) { Area { UpdateDistrict(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "106",
      "countryId": "111-",
      "provId": "222-",
      "distId": "444x",
      "active": true,
      "en": "stringp",
      "nameSpace": "string",
      "th": "string",
      "coordinates": [
        [
          [
            100.49,
            13.75
          ],
          [
            100.50,
            13.75
          ],
          [
            100.50,
            13.76
          ],
          [
            100.49,
            13.75
          ]
        ]
      ]
    }
  }
}'

## DeleteDistrict
### Description: Delete a district by ID
### REST API Endpoint: DELETE /api/v1/districts/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "mutation ($input: GetIdInput!) { Area { DeleteDistrict(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "55"
    }
  }
}'

## GenerateOrgCountryTree
### Description: Generate the organization country tree - Generate (and cache) the full nested tree for an org's area country
### REST API Endpoint: POST /api/v1/area/countries/{id}/generate_tree
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "mutation ($input: GetIdInput!) { AreaTemplate { GenerateOrgCountryTree(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "5"
    }
  }
}'
