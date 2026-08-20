// src/core/utils/gqlMapper.ts
import { FetchArgs } from "@reduxjs/toolkit/query";
import {
  // containsFile,
  extractQueryParams,
  normalizeObject
} from "@/core/utils/gqlUtils";
import type { GqlMapConfig } from "@/core/types/gql";
// Core
import { GQL_AUDIT } from "@/core/store/api/graphql/auditQueries";
import { GQL_AUTH } from "@/core/store/api/graphql/authQueries";
import { GQL_NOTIFICATION } from "@/core/store/api/graphql/notificationQueries";
import { GQL_ORGANIZATION } from "@/core/store/api/graphql/organizationQueries";
import { GQL_PERMISSION } from "@/core/store/api/graphql/permissionQueries";
import { GQL_ROLE } from "@/core/store/api/graphql/roleQueries";
import { GQL_USER } from "@/core/store/api/graphql/userQueries";
import { GQL_USER_GROUP } from "@/core/store/api/graphql/userGroupQueries";
// Dashboard layout API lives in core (the custom dashboard is cross-module).
import { GQL_DASHBOARD_LAYOUT } from "@/core/store/api/graphql/dashboardLayoutQueries";
// CMS Import
import { GQL_AREA } from "@/cms/store/api/graphql/areaQueries";
import { GQL_ATTACHMENT } from "@/cms/store/api/graphql/attachmentQueries";
import { GQL_CASE } from "@/cms/store/api/graphql/caseQueries";
import { GQL_CASE_HISTORY } from "@/cms/store/api/graphql/caseHistoryQueries";
import { GQL_CASE_RESULT } from "@/cms/store/api/graphql/caseResultQueries";
import { GQL_CASE_TYPE, GQL_CASE_SUB_TYPE } from "@/cms/store/api/graphql/caseTypeQueries";
import { GQL_DEVICE_IOT } from "@/cms/store/api/graphql/deviceIoTQueries";
import { GQL_DISPATCH } from "@/cms/store/api/graphql/dispatchQueries";
import { GQL_FORM } from "@/cms/store/api/graphql/formQueries";
import { GQL_MDM } from "@/cms/store/api/graphql/mdmQueries";
import { GQL_SKILL } from "@/cms/store/api/graphql/skillQueries";
import { GQL_WORKFLOW } from "@/cms/store/api/graphql/workflowQueries";
// CRM Import
import { GQL_APPOINTMENT } from "@/cms/store/api/graphql/appointmentQueries";
import { GQL_APPOINTMENT_STATUS } from "@/cms/store/api/graphql/appointmentStatusQueries";
import { GQL_APPOINTMENT_TYPE } from "@/cms/store/api/graphql/appointmentTypeQueries";
import { GQL_BRAND } from "@/cms/store/api/graphql/brandQueries";
import { GQL_CATEGORY } from "@/cms/store/api/graphql/categoryQueries";
import { GQL_CUSTOMER } from "@/cms/store/api/graphql/customerQueries";
import { GQL_CUSTOMER_CONTACT_DEFAULT } from "@/cms/store/api/graphql/customerContactDefaultQueries";
import { GQL_CUSTOMER_FORM } from "@/cms/store/api/graphql/customerFormQueries";
import { GQL_CUSTOMER_NOTE } from "@/cms/store/api/graphql/customerNoteQueries";
import { GQL_CUSTOMER_PRODUCT } from "@/cms/store/api/graphql/customerProductQueries";
import { GQL_CUSTOMER_SERVICE } from "@/cms/store/api/graphql/customerServiceQueries";
import { GQL_CUSTOMER_SOCIAL } from "@/cms/store/api/graphql/customerSocialQueries";
import { GQL_INVENTORY } from "@/cms/store/api/graphql/inventoryQueries";
import { GQL_INVENTORY_STOCK } from "@/cms/store/api/graphql/inventoryStockQueries";
import { GQL_ORDER_COMMENT } from "@/cms/store/api/graphql/orderCommentQueries";
import { GQL_ORDER_ITEM } from "@/cms/store/api/graphql/orderItemQueries";
import { GQL_ORDER_STATUS } from "@/cms/store/api/graphql/orderStatusQueries";
import { GQL_ORDER_WORKFLOW } from "@/cms/store/api/graphql/orderWorkflowQueries";
import { GQL_PRODUCT } from "@/cms/store/api/graphql/productQueries";
import { GQL_PRODUCT_STOCK } from "@/cms/store/api/graphql/productStockQueries";
import { GQL_SERVICE_TYPE } from "@/cms/store/api/graphql/serviceTypeQueries";
import { GQL_STORE } from "@/cms/store/api/graphql/storeQueries";

const GQL_MAP: Record<string, GqlMapConfig | Record<string, GqlMapConfig>> = {
  // Core
  ...GQL_AUDIT,
  ...GQL_AUTH,
  ...GQL_NOTIFICATION,
  ...GQL_ORGANIZATION,
  ...GQL_PERMISSION,
  ...GQL_ROLE,
  ...GQL_USER,
  ...GQL_USER_GROUP,
  // CMS
  ...GQL_AREA,
  ...GQL_ATTACHMENT,
  ...GQL_FORM,
  ...GQL_CASE,
  ...GQL_CASE_HISTORY,
  ...GQL_CASE_RESULT,
  ...GQL_CASE_SUB_TYPE,
  ...GQL_CASE_TYPE,
  ...GQL_DASHBOARD_LAYOUT,
  ...GQL_DEVICE_IOT,
  ...GQL_DISPATCH,
  ...GQL_MDM,
  ...GQL_SKILL,
  ...GQL_WORKFLOW,
  // CRM
  ...GQL_APPOINTMENT,
  ...GQL_APPOINTMENT_STATUS,
  ...GQL_APPOINTMENT_TYPE,
  ...GQL_BRAND,
  ...GQL_CATEGORY,
  ...GQL_CUSTOMER,
  ...GQL_CUSTOMER_CONTACT_DEFAULT,
  ...GQL_CUSTOMER_FORM,
  ...GQL_CUSTOMER_NOTE,
  ...GQL_CUSTOMER_PRODUCT,
  ...GQL_CUSTOMER_SERVICE,
  ...GQL_CUSTOMER_SOCIAL,
  ...GQL_INVENTORY,
  ...GQL_INVENTORY_STOCK,
  ...GQL_ORDER_COMMENT,
  // GQL_ORDER_ITEM is currently fully shadowed by GQL_ORDER_WORKFLOW below (same "/orders" and
  // "/orders/:id" keys, later spread wins) - see orderItemQueries.ts for details.
  ...GQL_ORDER_ITEM,
  ...GQL_ORDER_STATUS,
  ...GQL_ORDER_WORKFLOW,
  ...GQL_PRODUCT,
  ...GQL_PRODUCT_STOCK,
  ...GQL_SERVICE_TYPE,
  ...GQL_STORE
};

// v8.0 - Auto-mapping based on URL AND method. Two different keys can compile to the
// exact same regex (e.g. "/orders/:id/comments" vs "/orders/:orderId/comments" - the
// placeholder name doesn't affect the shape), so matching on shape alone would always
// resolve to whichever key happens to be declared first, silently ignoring any method
// that key doesn't define. Keep trying candidates until one actually defines the method.
const matchUrl = (url: string, method: string) => {
  const clean = url.split("?")[0];
  for (const key of Object.keys(GQL_MAP)) {
    const regex = new RegExp("^" + key.replace(/:[^/]+/g, "([^/]+)") + "$");
    const match = clean.match(regex);
    if (!match) {
      continue;
    }

    const mapEntry = GQL_MAP[key];
    const definesMethod = mapEntry && "operationName" in mapEntry
      ? true
      : Boolean((mapEntry as Record<string, GqlMapConfig>)?.[method]);
    if (!definesMethod) {
      continue;
    }

    const paramNames = (key.match(/:([^/]+)/g) || []).map(p => p.replace(":", ""));
    const pathParams = Object.fromEntries(paramNames.map((name, i) => [name, match[i + 1]]));
    return {
      key,
      config: GQL_MAP[key],
      pathParams
    };
  }
  return null;
};

// v3.0 - Auto-mapping based on URL and config
// const matchUrl = (url: string) => {
//   const clean = url.split("?")[0];
//   for (const key of Object.keys(GQL_MAP)) {
//     const regex = new RegExp("^" + key.replace(/:[^/]+/g, "([^/]+)") + "$");
//     const match = clean.match(regex);
//     if (match) {
//       const paramNames = (key.match(/:([^/]+)/g) || []).map(p => p.replace(":", ""));
//       const pathParams = Object.fromEntries(paramNames.map((name, i) => [name, match[i + 1]]));
//       return {
//         key,
//         config: GQL_MAP[key],
//         pathParams
//       };
//     }
//   }
//   return null;
// };

// v2.0 - Normalize URL by removing query parameters for matching
// const normalizeUrl = (url: string) => {
//   return url.split("?")[0];
// };

// v1.0 - Initial version with hardcoded query
// const findConfig = (url: string) => {
//   const clean = url.split("?")[0];
//   if (GQL_MAP[clean]) {
//     return GQL_MAP[clean];
//   }
//   const match = Object.keys(GQL_MAP).find(key => clean.startsWith(key));
//   return match ? GQL_MAP[match] : null;
// };

/**
 * Helper to build a GraphQL query from REST-style FetchArgs
 * This is a placeholder implementation that should be expanded based on your schema
 */
// v2.0 - Auto-mapping based on URL and config
export const buildGraphQLQuery = (args: FetchArgs) => {
  const {
    url,
    // params
  } = args;

  // v4.0 - Extract query params for potential use in variables
  const {
    // path,
    queryParams
  } = extractQueryParams(url!);

  // v8.0 - method must be known before matching, since matchUrl now filters candidates by it
  const method = (args.method || "GET").toUpperCase();

  // v3.0 - Auto-mapping based on URL and config
  const result = matchUrl(url!, method);

  // v2.0 - Normalize URL for matching
  // const normalizedUrl = normalizeUrl(url!);

  if (!result) {
    // console.warn(`No GraphQL mapping for ${url}, fallback REST`);
    return null;
  }

  // v4.0
  const { key, pathParams } = result;
  const mapEntry = GQL_MAP[key];
  const config = ((mapEntry && "operationName" in mapEntry) ? mapEntry : (mapEntry as Record<string, GqlMapConfig>)?.[method]) as GqlMapConfig | undefined;

  // v3.0 - Destructure config and pathParams from match result
  // const { config, pathParams } = result;

  // v2.0
  // const config = GQL_MAP[normalizedUrl];

  // v1.0 - Initial version with hardcoded query
  // const config = findConfig(url!);
  // const config = GQL_MAP[url!];

  // console.log("🚀 ~ buildGraphQLQuery ~ args:", args);
  // console.log("🚀 ~ buildGraphQLQuery ~ url:", url);
  // console.log("🚀 ~ buildGraphQLQuery ~ params:", params);
  // console.log("🚀 ~ buildGraphQLQuery ~ GQL_MAP:", GQL_MAP);
  // console.log("🚀 ~ buildGraphQLQuery ~ GQL_MAP[normalizedUrl]:", GQL_MAP[normalizedUrl]);
  // console.log("🚀 ~ buildGraphQLQuery ~ pathParams:", pathParams);
  // console.log("🚀 ~ buildGraphQLQuery ~ result:", result);
  // console.log("🚀 ~ buildGraphQLQuery ~ method:", method);
  // console.log("🚀 ~ buildGraphQLQuery ~ mapEntry:", mapEntry);
  // console.log("🚀 ~ buildGraphQLQuery ~ config:", config);

  if (!config) {
    // console.warn(`No GraphQL mapping for ${url}, fallback REST`);
    // throw new Error(`No GraphQL mapping for ${normalizedUrl}, fallback REST`);

    // v2.0 - Return null to indicate fallback to REST
    return null;

    // v1.0 - Initial version with hardcoded query
    // return {
    //   query: "",
    //   variables: {},
    // };
  }

  // v7.0 - FormData bodies (file uploads) don't spread like plain objects
  const bodySource = args.body instanceof FormData
    ? Object.fromEntries(args.body.entries())
    : (args.body as Record<string, unknown>) || {};

  // v6.0 - Determine input source based on method and config
  const isMutation = config.mutation === true || ["PATCH", "POST", "PUT"].includes(method);
  // v8.0 - DELETE mutations often identify the record via query params rather than
  // a body (e.g. composite keys like ?productId=x&serialNumber=y), so merge those in too.
  const inputSource = isMutation
    ? {
        ...queryParams,
        ...(args.params || {}),
        ...bodySource,
        ...pathParams
      }
    : {
        ...queryParams,
        ...(args.params || {}),
        ...pathParams
      };

  // v5.0
  // const inputSource = (args: FetchArgs, config: GqlMapConfig, pathParams: Record<string, string>) => {
  //   if (config.mutation) {
  //     return {
  //       ...(args.body || {}),
  //       ...pathParams
  //     };
  //   }
  //   return {
  //     ...(args.params || {}),
  //     ...pathParams
  //   };
  // };

  // v4.0
  // const isMutation = config.mutation === true;
  // const inputSource = isMutation ? {
  //   ...(args.body as Record<string, unknown> || {}),
  //   ...pathParams
  // } : {
  //   ...(params || {}),
  //   ...pathParams
  // };

  // Remove empty values
  // v5.0 - Clean input by removing undefined, null, and empty string values
  const cleanedInput = normalizeObject(
    Object.fromEntries(
      Object.entries(inputSource).filter(
        ([, v]) => v !== undefined && v !== null && v !== ""
      )
    )
  , isMutation);

  // const hasFiles = containsFile(cleanedInput);

  // v4.0
  // const cleanedInput = Object.fromEntries(Object.entries(inputSource(args, config as GqlMapConfig, pathParams)).filter(
  //   ([, v]) => v !== undefined && v !== null && v !== ""
  // ));

  // v3.0 - Combine params and pathParams, with pathParams taking precedence
  // Object.entries({
  //   ...(params || {}),
  //   ...pathParams
  // }).filter(([, v]) => v !== undefined && v !== null && v !== "");

  // v2.0 - Original params only
  // Object.entries(params || {}).filter(
  //   ([, v]) => v !== undefined && v !== null && v !== ""
  // );

  // console.log("🚀 ~ buildGraphQLQuery ~ cleanedInput:", cleanedInput);
  // console.log("🚀 ~ buildGraphQLQuery ~ args:", args);

  // v5.0
  // v8.0 - Composite-key deletes (e.g. productId+serialNumber) have no "id" field,
  // so the real signal that identifying data is missing is an empty input, not a
  // missing "id" specifically.
  if (config.mutation && method === "DELETE" && Object.keys(cleanedInput).length === 0) {
    // console.warn("Missing identifier for delete mutation, fallback REST");
    return null;
  }
  else if ((config.mutation && method === "PATCH" || config.mutation && method === "PUT") && !cleanedInput.id && !args.body) {
    // console.warn("Missing id and body for mutation, fallback REST");
    return null;
  }
  else if (config.mutation && method === "POST" && !args.body) {
    // console.warn("Missing body for mutation, fallback REST");
    return null;
  }

  // v4.0
  // if (config.mutation && (!cleanedInput.id || !args.body)) {
  //   console.warn("Missing id for mutation, fallback REST");
  //   return null;
  // }

  // v7.0 - Resolve operationName variants keyed by a path param (e.g. upload path -> CMS vs CRM)
  let operationName = config.operationName;
  if (config.operationNameByPathParam) {
    const { param, map } = config.operationNameByPathParam;
    const paramValue = pathParams[param];
    if (paramValue in map) {
      operationName = map[paramValue];
    }
    else if (import.meta.env.DEV) {
      // Falling through silently is exactly how a new path value (e.g. a new upload
      // category) can end up routed to the wrong backend operation unnoticed - warn instead.
      console.warn(
        `[gqlMapper] No operationNameByPathParam mapping for ${key} (${param}="${paramValue}"), ` +
        `defaulting to "${config.operationName}". Add it to the map if this is wrong.`
      );
    }
  }

  // v3.0 - Auto-mapping based on URL and config
  return {
    query: `${config.mutation ? "mutation" : "query"} ${config.inputType ? `($input: ${config.inputType})` : ""} { ${config.root} { ${operationName} ${config.inputType ? "(input: $input)" : ""} { ${config.fields} } } }`,
    variables: config.inputType ? { input: cleanedInput } : {},
  };

  // v2.0
  // return {
  //   query: `${config.mutation ? "mutation" : "query"} ${config.inputType ? `($input: ${config.inputType})` : ""} { ${config.root} { ${config.operationName} ${config.inputType ? "(input:$input)" : ""} { ${config.fields} } } }`,
  //   variables: {
  //     input: cleanedInput,
  //   },
  // };
};

// v1.0 - Initial version with hardcoded query
// const buildGraphQLQuery = (args: FetchArgs) => {
//   // If the args already contain a GQL structure (from gql() util)
//   if (typeof args === "object" && (args as unknown as Record<string, unknown>).type === "GQL") {
//     return {
//       query: (args as unknown as Record<string, unknown>).document as string,
//       variables: (args as unknown as Record<string, unknown>).variables as Record<string, unknown>,
//     };
//   }
//   // Fallback or Auto-mapping logic would go here
//   return {
//     query: "",
//     variables: args.params || {},
//   };
// };
