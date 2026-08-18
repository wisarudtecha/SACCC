# query

## GetListUser
### REST API Endpoint: GET /api/v1/users
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: ListDataInput!) { User { GetListUser(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "start": 0,
      "length" : 10
    }
  }
}'

## GetUserById
### REST API Endpoint: GET /api/v1/users/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: GetIdInput!) { User { GetUserById(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "1"
    }
  }
}'

## GetUserForCaseInfo
### REST API Endpoint: GET /api/v1/users/username/ForCaseInfo/{username}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: GetIdInput!) { User { GetUserForCaseInfo(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "apiwat.rod"
    }
  }
}'

## GetUserByUsername
### REST API Endpoint: GET /api/v1/users/username/{username}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: GetIdInput!) { User { GetUserByUsername(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "apiwat.rod"
    }
  }
}'

## GetListUserGroup
### REST API Endpoint: GET /api/v1/user_groups/all
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: ListDataInput!) { UserGroup { GetListUserGroup(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "start": 0,
      "length" : 10
    }
  }
}'

## GetUserGroupById
### REST API Endpoint: GET /api/v1/user_groups/{grpId}
### Returns the group's own record with member usernames embedded in a `users` field, e.g.
### { status, msg, data: { active, createdAt, createdBy, en, grpId, id, orgId, th, updatedAt, updatedBy, users: ["admin", "apiwat.rod", ...] }, desc }
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: GetIdInput!) { UserGroup { GetUserGroupById(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "e843f8b9-3dcb-4c8c-8ea9-fd929bcde160"
    }
  }
}'

## GetUserGroupByUsername
### REST API Endpoint: GET /api/v1/user_with_groups/username/{username}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: GetIdInput!) { UserGroup { GetUserGroupByUsername(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "wisarud.tec"
    }
  }
}'

## GetListUserContact
### REST API Endpoint: GET /api/v1/users_with_contacts
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: ListDataInput!) { UserContact { GetListUserContact(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "start": 0,
      "length" : 10
    }
  }
}'

## GetUserContactById
### REST API Endpoint: GET /api/v1/users_with_contacts/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: GetIdInput!) { UserContact { GetUserContactById(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "1"
    }
  }
}'

## GetListUserSkill
### REST API Endpoint: GET /api/v1/users_with_skills
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: ListDataInput!) { UserSkill { GetListUserSkill(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "start": 0,
      "length" : 10
    }
  }
}'

## GetUserSkillBySkillId
### REST API Endpoint: GET /api/v1/users_with_skills//skillId/{skillId}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: GetIdInput!) { UserSkill { GetUserSkillBySkillId(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "7331326c-62e6-44fd-bf8e-e0ad4fca38c6"
    }
  }
}'

## GetUserSkillByUsername
### REST API Endpoint: GET /api/v1/users_with_skills/username/{username}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: GetIdInput!) { UserSkill { GetUserSkillByUsername(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "apiwat.rod"
    }
  }
}'

## GetUserSkillById
### REST API Endpoint: GET /api/v1/users_with_skills/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: GetIdInput!) { UserSkill { GetUserSkillById(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "1"
    }
  }
}'

## GetListUserSocial
### REST API Endpoint: GET /api/v1/users_with_socials
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: ListDataInput!) { UserSocial { GetListUserSocial(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "start": 0,
      "length" : 10
    }
  }
}'

## GetUserSocialById
### REST API Endpoint: GET /api/v1/users_with_socials/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "query ($input: GetIdInput!) { UserSocial { GetUserSocialById(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "7"
    }
  }
}'

# mutation

## CreateUser
### REST API Endpoint: POST /api/v1/users/add
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data-raw '{
  "query": "mutation ($input: CreateUserInput!) { User { CreateUser(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "active": true,
      "address": "",
      "blood": "A",
      "bod": "2010-07-07T00:00:00Z",
      "citizenId": "",
      "commId": "258245ba-5554-49d9-ae80-563189ffab7d",
      "deptId": "40eab5cb-6d57-48e8-b3e1-5f733127c43f",
      "displayName": "",
      "email": "admin@gmail.com",
      "empId": "XXXXXX",
      "firstName": "AAA",
      "gender": 1,
      "lastName": "edcba",
      "middleName": "",
      "mobileNo": "0123456789",
      "orgId": "434c0f16-b7ea-4a7b-a74b-e2e0f859f549",
      "photo": null,
      "roleId": "a62113af-3106-4725-b476-360379f62efa",
      "stnId": "19d6697b-7045-41a6-bb0f-07a37a7049cb",
      "title": "Mr.",
      "userType": 1,
      "username": "xxxxx",
      "lastActivationRequest": null,
      "lostPasswordRequest": null,
      "signupStamp": null,
      "islogin": false,
      "lastLogin": null,
      "createdAt": "2026-02-19T10:14:09.706792Z",
      "updatedAt": "2026-02-19T10:14:09.706792Z",
      "createdBy": "ananya",
      "updatedBy": "ananya"
    }
  }
}'

## UpdateUser 
### REST API Endpoint: PATCH /api/v1/users/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data-raw '{
  "query": "mutation ($input: UpdateUserInput!) { User { UpdateUser(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "200",
      "active": true,
      "address": "",
      "blood": "A",
      "bod": "2010-07-07T00:00:00Z",
      "citizenId": "",
      "commId": "258245ba-5554-49d9-ae80-563189ffab7d",
      "deptId": "40eab5cb-6d57-48e8-b3e1-5f733127c43f",
      "displayName": "",
      "email": "admin@gmail.com",
      "empId": "XXXXXX",
      "firstName": "AAA--",
      "gender": 1,
      "lastName": "edcba",
      "middleName": "",
      "mobileNo": "0123456789",
      "orgId": "434c0f16-b7ea-4a7b-a74b-e2e0f859f549",
      "photo": null,
      "roleId": "a62113af-3106-4725-b476-360379f62efa",
      "stnId": "19d6697b-7045-41a6-bb0f-07a37a7049cb",
      "title": "Mr.",
      "userType": 1,
      "username": "xxxxx",
      "lastActivationRequest": null,
      "lostPasswordRequest": null,
      "signupStamp": null,
      "islogin": false,
      "lastLogin": null,
      "createdAt": "2026-02-19T10:14:09.706792Z",
      "updatedAt": "2026-02-19T10:14:09.706792Z",
      "createdBy": "ananya",
      "updatedBy": "ananya"
    }
  }
}'

## DeleteUser 
### REST API Endpoint: DELETE /api/v1/users/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "mutation ($input: GetIdInput!) { User { DeleteUser(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
        "id": "195"
    }
  }
}'

## ChangePassword 
### REST API Endpoint: PATCH /api/v1/users/change_password/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "mutation ($input: ChangePasswordInput!) { User { ChangePassword(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id" : "userId",
      "currentPassword": "string",
      "newPassword": "string"
    }
  }
}'

## ResetPassword
### REST API Endpoint: POST /api/v1/users/reset_password
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "mutation ($input: ResetPasswordInput!) { User { ResetPassword(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "email": "string",
      "newPassword": "string",
      "username": "string"
    }
  }
}'

## UpdateUserByUsername
### REST API Endpoint: PATCH /api/v1/username/{username}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data-raw '{
  "query": "mutation ($input: UpdateUserInput!) { User { UpdateUserByUsername(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "username",
      "active": true,
      "address": "",
      "blood": "A",
      "bod": "2010-07-07T00:00:00Z",
      "citizenId": "",
      "commId": "258245ba-5554-49d9-ae80-563189ffab7d",
      "deptId": "40eab5cb-6d57-48e8-b3e1-5f733127c43f",
      "displayName": "",
      "email": "admin@gmail.com",
      "empId": "XXXXXX",
      "firstName": "AAA--",
      "gender": 1,
      "lastName": "edcba",
      "middleName": "",
      "mobileNo": "0123456789",
      "orgId": "434c0f16-b7ea-4a7b-a74b-e2e0f859f549",
      "photo": null,
      "roleId": "a62113af-3106-4725-b476-360379f62efa",
      "stnId": "19d6697b-7045-41a6-bb0f-07a37a7049cb",
      "title": "Mr.",
      "userType": 1,
      "username": "xxxxx",
      "lastActivationRequest": null,
      "lostPasswordRequest": null,
      "signupStamp": null,
      "islogin": false,
      "lastLogin": null,
      "createdAt": "2026-02-19T10:14:09.706792Z",
      "updatedAt": "2026-02-19T10:14:09.706792Z",
      "createdBy": "ananya",
      "updatedBy": "ananya"
    }
  }
}'

## CreateUserGroup
### REST API Endpoint: POST /api/v1/user_groups/add
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "mutation ($input: UserGroupInsertInput!) { UserGroup { CreateUserGroup(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "active": true,
      "en": "string",
      "th": "string"
    }
  }
}'

## DeleteUserGroup
### REST API Endpoint: DELETE /api/v1/user_groups/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "mutation ($input: GetIdInput!) { UserGroup { DeleteUserGroup(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "23e56230-37aa-4b35-bc88-39d930584154"
    }
  }
}'

## UpdateUserGroup
### REST API Endpoint: PATCH /api/v1/user_groups/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "mutation ($input: UserGroupInsertInput!) { UserGroup { UpdateUserGroup(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id" : "1514c256-0558-41f7-9fc0-60ff58828c1e",
      "active": true,
      "en": "string--1",
      "th": "string--2"
    }
  }
}'

## AssignUserGroup
### REST API Endpoint: POST /api/v1/user_groups/{id}/users/add
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "mutation ($input: AssignUserGroupInput!) { UserGroup { AssignUserGroup(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id" : "1514c256-0558-41f7-9fc0-60ff58828c1e",
      "username": "Jane"
    }
  }
}'

## AssignUserGroupBatch
### REST API Endpoint: POST /api/v1/user_groups/{id}/users/batch
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "mutation ($input: AssignUserGroupBatchInput!) { UserGroup { AssignUserGroupBatch(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "1514c256-0558-41f7-9fc0-60ff58828c1e",
      "usernames": [
        "Jane11",
        "Jane22"
      ]
    }
  }
}'

## DeleteAssignUserGroup
### REST API Endpoint: DELETE /api/v1/user_groups/{id}/users/{username}
curl --location 'https://cc-bff-qa.one-sky.ai/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{bearer_token_graphql}}' \
--data '{
  "query": "mutation ($input: DeleteAssignUserGroupInput!) { UserGroup { DeleteAssignUserGroup(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "1514c256-0558-41f7-9fc0-60ff58828c1e",
      "username": "Jane11"
    }
  }
}'

## CreateUserContact
### REST API Endpoint: POST /api/v1/users_with_contacts/add
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "mutation ($input: UserContactInput!) { UserContact { CreateUserContact(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "contactAddr": "string",
      "contactName": "string",
      "contactPhone": "string",
      "username": "string"
    }
  }
}'

## UpdateUserContact
### REST API Endpoint: PATCH /api/v1/users_with_contacts/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "mutation ($input: UserContactInput!) { UserContact { UpdateUserContact(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "1",
      "contactAddr": "string--",
      "contactName": "string--",
      "contactPhone": "string--",
      "username": "string"
    }
  }
}'

## DeleteUserContact
### REST API Endpoint: DELETE /api/v1/users_with_contacts/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "mutation ($input: GetIdInput!) { UserContact { DeleteUserContact(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "2"
    }
  }
}'

## CreateUserSkill
### REST API Endpoint: POST /api/v1/users_with_skills/add
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "mutation ($input: UserSkillInput!) { UserSkill { CreateUserSkill(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "active": true, 
      "skillId": "7331326c-62e6-44fd-bf8e-e0ad4fca38c6",
      "userName": "apiwat.rod"
    }
  }
}'

## UpdateUserSkill
### REST API Endpoint: PATCH /api/v1/users_with_skills/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "mutation ($input: UserSkillInput!) { UserSkill { UpdateUserSkill(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "123",
      "active": true,
      "skillId": "3b84783c-abe1-45ba-95ac-2d048498bea1",
      "userName": "apiwat.rod"
    }
  }
}'

## UpdateUserSkillBatch
### REST API Endpoint: PATCH /api/v1/users_with_skills_batch/update
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "mutation ($input: UserSkillBatchInput!) { UserSkill { UpdateUserSkillBatch(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "active": true,
      "skillIds": [
        "string"
      ],
      "userName": "string"
    }
  }
}'

## DeleteUserSkill
### REST API Endpoint: DELETE /api/v1/users_with_skills/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "mutation ($input: GetIdInput!) { UserSkill { DeleteUserSkill(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "123"
    }
  }
}'

## CreateUserSocial
### REST API Endpoint: POST /api/v1/users_with_socials/add
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "mutation ($input: UserSocialInput!) { UserSocial { CreateUserSocial(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "socialId": "string",
      "socialName": "string",
      "socialType": "string",
      "username": "string"
    }
  }
}'

## UpdateUserSocial
### REST API Endpoint: PATCH /api/v1/users_with_socials/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "mutation ($input: UserSocialInput!) { UserSocial { UpdateUserSocial(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "7",
      "socialId": "string--",
      "socialName": "string--",
      "socialType": "string",
      "username": "string"
    }
  }
}'

## DeleteUserSocial
### REST API Endpoint: DELETE /api/v1/users_with_socials/{id}
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization;' \
--data '{
  "query": "mutation ($input: GetIdInput!) { UserSocial { DeleteUserSocial(input: $input) { status msg data desc } } }",
  "variables": {
    "input": {
      "id": "7"
    }
  }
}'
