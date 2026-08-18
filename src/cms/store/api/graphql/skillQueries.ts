// src/cms/store/api/graphql/skillQueries.ts
const GET_LIST_SKILL_QUERY = {
  operationName: "GetListSkill",
  root: "Skill",
  inputType: "ListDataInput!",
  fields: `status msg data desc`,
  // fields: `status msg currentPage pageSize totalFiltered totalRecords totalPage data desc`,
};

const GET_SKILL_BY_ID_QUERY = {
  operationName: "GetSkillById",
  root: "Skill",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
};

const CREATE_SKILL_MUTATION = {
  operationName: "CreateSkill",
  root: "Skill",
  inputType: "SkillInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const UPDATE_SKILL_MUTATION = {
  operationName: "UpdateSkill",
  root: "Skill",
  inputType: "SkillInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const DELETE_SKILL_MUTATION = {
  operationName: "DeleteSkill",
  root: "Skill",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true,
};

export const GQL_SKILL = {
  "/skill": GET_LIST_SKILL_QUERY,
  "/skill/:id": {
    GET: GET_SKILL_BY_ID_QUERY,
    POST: CREATE_SKILL_MUTATION,
    PATCH: UPDATE_SKILL_MUTATION,
    DELETE: DELETE_SKILL_MUTATION,
  },
};
