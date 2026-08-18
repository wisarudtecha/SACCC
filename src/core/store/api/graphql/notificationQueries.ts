// src/core/store/api/graphql/notificationQueries.ts
const GET_NOTIFICATION_BY_ID_QUERY = {
  operationName: "GetNotificationById",
  root: "Notification",
  inputType: "GetIdInput!",
  fields: `Listdata`
};

export const GQL_NOTIFICATION = {
  "/notifications/:id": {
    GET: GET_NOTIFICATION_BY_ID_QUERY
  }
};
