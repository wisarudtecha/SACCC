# query

## GetListTemplateCountry
### Description: Get a list of template countries
### REST API Endpoint: GET /api/v1/template/countries
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
	"query": "query { AreaTemplate { GetListTemplateCountry { status msg data desc } } }"
}'
--response-body '{
  "status": "0",
  "msg": "Success",
  "data": [
    {
      "id": 13,
      "countryId": "TH",
      "en": "TH Version 3",
      "th": "ประเทศไทย",
      "active": true,
      "nameSpace": "",
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
      "version": 3,
      "status": "published",
      "parentTemplateId": 8,
      "rootTemplateId": 8,
      "publishedAt": "2026-08-21T04:12:37.706618Z",
      "publishedBy": "apiwat.rod",
      "createdAt": "2026-08-21T03:51:37.753776Z",
      "updatedAt": "2026-08-21T04:12:37.706618Z",
      "createdBy": "apiwat.rod",
      "updatedBy": "apiwat.rod"
    }
  ],
  "desc": ""
}'

## GetTemplateCountryById
### Description: Get a template country by ID
### REST API Endpoint: GET /api/v1/template/countries/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
	"query": "query ($input: GetIdInput!) { AreaTemplate { GetTemplateCountryById(input: $input) { status msg data desc } } }",
	"variables": {
		"input": {
			"id": "8"
		}
	}
}'
--response-body '{
  "status": "0",
  "msg": "Success",
  "data": {
    "id": 13,
    "countryId": "TH",
    "en": "TH Version 3",
    "th": "ประเทศไทย",
    "active": true,
    "nameSpace": "",
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
    "version": 3,
    "status": "published",
    "parentTemplateId": 8,
    "rootTemplateId": 8,
    "publishedAt": "2026-08-21T04:12:37.706618Z",
    "publishedBy": "apiwat.rod",
    "createdAt": "2026-08-21T03:51:37.753776Z",
    "updatedAt": "2026-08-21T04:12:37.706618Z",
    "createdBy": "apiwat.rod",
    "updatedBy": "apiwat.rod"
  },
  "desc": ""
}'

## GetTemplateCountryVersions
### Description: Get a list of versions for a template country - List all versions of a template lineage
### REST API Endpoint: GET /api/v1/template/countries/{id}/versions
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
	"query": "query ($input: GetIdInput!) { AreaTemplate { GetTemplateCountryVersions(input: $input) { status msg data desc } } }",
	"variables": {
		"input": {
			"id": "8"
		}
	}
}'
--response-body '{
  "status": "0",
  "msg": "Success",
  "data": [
    {
      "id": 8,
      "countryId": "TH",
      "en": "Thailand",
      "th": "ประเทศไทย",
      "active": true,
      "nameSpace": null,
      "coordinates": null,
      "yearOfData": null,
      "shapeArea": null,
      "shapeLength": null,
      "version": 1,
      "status": "published",
      "parentTemplateId": null,
      "rootTemplateId": null,
      "publishedAt": "2026-08-20T10:24:32.889304Z",
      "publishedBy": "apiwat.rod",
      "createdAt": "2026-08-20T10:23:47.369816Z",
      "updatedAt": null,
      "createdBy": "apiwat.rod",
      "updatedBy": null
    }
  ],
  "desc": ""
}'

## GetTemplateCountryTree
### Description: Get the full nested tree for a template country - Read the cached nested tree for a specific template version (no DB joins)
### REST API Endpoint: GET /api/v1/template/countries/{id}/tree
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
	"query": "query ($input: GetIdInput!) { AreaTemplate { GetTemplateCountryTree(input: $input) { status msg data desc } } }",
	"variables": {
		"input": {
			"id": "8"
		}
	}
}'
--response-body '{
  "status": "0",
  "msg": "Success",
  "data": {
    "en": "Thailand",
    "id": 8,
    "th": "ประเทศไทย",
    "active": true,
    "status": "published",
    "version": 1,
    "countryId": "TH",
    "provinces": [
      {
        "en": "Bangkok",
        "id": 7,
        "th": "กรุงเทพมหานคร",
        "active": true,
        "provId": "10",
        "districts": [
          {
            "en": "Phra Nakhon",
            "id": 7,
            "th": "พระนคร",
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

## GetListTemplateProvince
### Description: Get a list of template provinces for a given template country
### REST API Endpoint: GET /api/v1/template/provinces
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
	"query": "query ($input: TemplateProvinceListInput) { AreaTemplate { GetListTemplateProvince(input: $input) { status msg data desc } } }",
	"variables": {
		"input": {
			"templateCountryId": 1
		}
	}
}'
--response-body '{
  "status": "0",
  "msg": "Success",
  "data": [
    {
      "id": 7,
      "templateCountryId": 8,
      "countryId": "TH",
      "provId": "10",
      "en": "Bangkok",
      "th": "กรุงเทพมหานคร",
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
      "createdAt": "2026-08-20T10:34:54.000741Z",
      "updatedAt": "2026-08-20T10:53:50.454982Z",
      "createdBy": "apiwat.rod",
      "updatedBy": "apiwat.rod"
    }
  ],
  "desc": ""
}'

## GetTemplateProvinceById
### Description: Get a template province by ID
### REST API Endpoint: GET /api/v1/template/provinces/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
	"query": "query ($input: GetIdInput!) { AreaTemplate { GetTemplateProvinceById(input: $input) { status msg data desc } } }",
	"variables": {
		"input": {
			"id": "10"
		}
	}
}'
--response-body '{
  "status": "0",
  "msg": "Success",
  "data": {
    "id": 7,
    "templateCountryId": 8,
    "countryId": "TH",
    "provId": "10",
    "en": "Bangkok",
    "th": "กรุงเทพมหานคร",
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
    "createdAt": "2026-08-20T10:34:54.000741Z",
    "updatedAt": "2026-08-20T10:53:50.454982Z",
    "createdBy": "apiwat.rod",
    "updatedBy": "apiwat.rod"
  },
  "desc": ""
}'

## GetListTemplateDistrict
### Description: Get a list of template districts for a given template province
### REST API Endpoint: GET /api/v1/template/districts
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
	"query": "query ($input: TemplateDistrictListInput) { AreaTemplate { GetListTemplateDistrict(input: $input) { status msg data desc } } }",
	"variables": {
		"input": {
			"templateProvinceId": 10
		}
	}
}'
--response-body '{
  "status": "0",
  "msg": "Success",
  "data": [
    {
      "id": 7,
      "templateProvinceId": 7,
      "countryId": "TH",
      "provId": "10",
      "distId": "1001",
      "en": "Phra Nakhon",
      "th": "พระนคร",
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
      "createdAt": "2026-08-20T10:36:16.48812Z",
      "updatedAt": "2026-08-20T10:36:16.48812Z",
      "createdBy": "apiwat.rod",
      "updatedBy": "apiwat.rod"
    }
  ],
  "desc": ""
}'

## GetTemplateDistrictById
### Description: Get a template district by ID
### REST API Endpoint: GET /api/v1/template/districts/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
	"query": "query ($input: GetIdInput!) { AreaTemplate { GetTemplateDistrictById(input: $input) { status msg data desc } } }",
	"variables": {
		"input": {
			"id": "100"
		}
	}
}'
--response-body '{
  "status": "0",
  "msg": "Success",
  "data": {
    "id": 7,
    "templateProvinceId": 7,
    "countryId": "TH",
    "provId": "10",
    "distId": "1001",
    "en": "Phra Nakhon",
    "th": "พระนคร",
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
    "createdAt": "2026-08-20T10:36:16.48812Z",
    "updatedAt": "2026-08-20T10:36:16.48812Z",
    "createdBy": "apiwat.rod",
    "updatedBy": "apiwat.rod"
  },
  "desc": ""
}'

# mutation

## CreateTemplateCountry
### Description: Create a new template country
### REST API Endpoint: POST /api/v1/template/countries/add
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
	"query": "mutation ($input: TemplateCountryInput!) { AreaTemplate { CreateTemplateCountry(input: $input) { status msg data desc } } }",
	"variables": {
		"input": {
			"countryId": "TH",
			"en": "Thailand",
			"th": "ประเทศไทย",
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

## UpdateTemplateCountry
### Description: Update an existing template country
### REST API Endpoint: PATCH /api/v1/template/countries/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
	"query": "mutation ($input: TemplateCountryInput!) { AreaTemplate { UpdateTemplateCountry(input: $input) { status msg data desc } } }",
	"variables": {
		"input": {
			"id": "7",
			"countryId": "TH",
			"en": "Thailand",
			"th": "ประเทศไทย",
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

## DeleteTemplateCountry
### Description: Delete a template country by ID
### REST API Endpoint: DELETE /api/v1/template/countries/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
	"query": "mutation ($input: GetIdInput!) { AreaTemplate { DeleteTemplateCountry(input: $input) { status msg data desc } } }",
	"variables": {
		"input": {
			"id": "7"
		}
	}
}'

## PublishTemplateCountry
### Description: Publish a template country by ID - Publish Area Template Country (locks it againts further edits)
### REST API Endpoint: POST /api/v1/template/countries/{id}/publish
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
	"query": "mutation ($input: GetIdInput!) { AreaTemplate { PublishTemplateCountry(input: $input) { status msg data desc } } }",
	"variables": {
		"input": {
			"id": "18"
		}
	}
}'

## CreateTemplateProvince
### Description: Create a new template province
### REST API Endpoint: POST /api/v1/template/provinces/add
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
	"query": "mutation ($input: TemplateProvinceInput!) { AreaTemplate { CreateTemplateProvince(input: $input) { status msg data desc } } }",
	"variables": {
		"input": {
			"templateCountryId": 9,
			"countryId": "TH",
			"provId": "10",
			"en": "Bangkok",
			"th": "กรุงเทพมหานคร",
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

## UpdateTemplateProvince
### Description: Update an existing template province
### REST API Endpoint: PATCH /api/v1/template/provinces/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
	"query": "mutation ($input: TemplateProvinceInput!) { AreaTemplate { UpdateTemplateProvince(input: $input) { status msg data desc } } }",
	"variables": {
		"input": {
			"id": "7",
			"countryId": "TH",
			"provId": "10",
			"en": "Bangkok",
			"th": "กรุงเทพมหานคร",
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

## DeleteTemplateProvince
### Description: Delete a template province by ID
### REST API Endpoint: DELETE /api/v1/template/provinces/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
	"query": "mutation ($input: GetIdInput!) { AreaTemplate { DeleteTemplateProvince(input: $input) { status msg data desc } } }",
	"variables": {
		"input": {
			"id": "10"
		}
	}
}'

## CreateTemplateDistrict
### Description: Create a new template district
### REST API Endpoint: POST /api/v1/template/districts/add
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
	"query": "mutation ($input: TemplateDistrictInput!) { AreaTemplate { CreateTemplateDistrict(input: $input) { status msg data desc } } }",
	"variables": {
		"input": {
			"templateProvinceId": 7,
			"countryId": "TH",
			"provId": "10",
			"distId": "1001",
			"en": "Phra Nakhon",
			"th": "พระนคร",
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

## UpdateTemplateDistrict
### Description: Update an existing template district
### REST API Endpoint: PATCH /api/v1/template/districts/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
	"query": "mutation ($input: TemplateDistrictInput!) { AreaTemplate { UpdateTemplateDistrict(input: $input) { status msg data desc } } }",
	"variables": {
		"input": {
			"id": "100",
			"countryId": "TH",
			"provId": "10",
			"distId": "1001",
			"en": "Phra Nakhon",
			"th": "พระนคร",
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

## DeleteTemplateDistrict
### Description: Delete a template district by ID
### REST API Endpoint: DELETE /api/v1/template/districts/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
	"query": "mutation ($input: GetIdInput!) { AreaTemplate { DeleteTemplateDistrict(input: $input) { status msg data desc } } }",
	"variables": {
		"input": {
			"id": "100"
		}
	}
}'

## CreateOrgAreaFromTemplateCountry
### Description: Create an organization area from a template country - Dupplicate Area Country From Template
### REST API Endpoint: POST /api/v1/template/countries/from_template
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
	"query": "mutation ($input: FromTemplateCountryInput!) { AreaTemplate { CreateOrgAreaFromTemplateCountry(input: $input) { status msg data desc } } }",
	"variables": {
		"input": {
			"templateCountryId": 8
		}
	}
}'

## SyncTemplateCountry
### Description: Sync a template country with an organization area - Sync Area Country From Template (merge, replace_all, replace_label, replace_coodinates)
### REST API Endpoint: POST /api/v1/template/countries/{id}/sync_template
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
	"query": "mutation ($input: SyncTemplateInput!) { AreaTemplate { SyncTemplateCountry(input: $input) { status msg data desc } } }",
	"variables": {
		"input": {
			"id": "5",
			"templateCountryId": 18,
			"mode": "merge"
		}
	}
}'

## ForkTemplateCountry
### Description: Fork a template country to create a new version - Fork Area Country into a new draft version
### REST API Endpoint: POST /api/v1/template/countries/{id}/fork
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
	"query": "mutation ($input: ForkTemplateInput!) { AreaTemplate { ForkTemplateCountry(input: $input) { status msg data desc } } }",
	"variables": {
		"input": {
			"id": "8",
			"en": "Thailand xxxx"
		}
	}
}'

## GenerateTemplateCountryTree
### Description: Generate the template country tree - Generate (and cache) the full nested tree for a specific template version
### REST API Endpoint: POST /api/v1/template/countries/{id}/generate_tree
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
	"query": "mutation ($input: GetIdInput!) { AreaTemplate { GenerateTemplateCountryTree(input: $input) { status msg data desc } } }",
	"variables": {
		"input": {
			"id": "9"
		}
	}
}'
