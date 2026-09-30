// Guards the Place/Device GraphQL mapping against silent regression - in
// particular the "/devices/:id" (GET/DELETE, field "id") vs
// "/devices/:deviceId" (PATCH, field "deviceId") split documented in
// src/cms/store/api/graphql/deviceIoTQueries.ts. Expected shapes come from
// src/cms/mocks/deviceCURL.sh and src/cms/mocks/placeCURL.sh.
import { describe, expect, test } from "vitest";
import { buildGraphQLQuery } from "./gqlMapper";

describe("buildGraphQLQuery - Place", () => {
  test("GET /places (list) maps to GetPlaceLists with start/length", () => {
    const result = buildGraphQLQuery({ url: "/places?start=0&length=10", method: "GET" });

    expect(result).not.toBeNull();
    expect(result!.query).toContain("query");
    expect(result!.query).toContain("Place");
    expect(result!.query).toContain("GetPlaceLists");
    expect(result!.query).toContain("PlaceListInput");
    expect(result!.variables.input).toEqual({ start: 0, length: 10 });
  });

  test("GET /places/{id} maps to GetPlaceById with id", () => {
    const result = buildGraphQLQuery({ url: "/places/PLACE-001", method: "GET" });

    expect(result).not.toBeNull();
    expect(result!.query).toContain("GetPlaceById");
    expect(result!.query).toContain("GetIdInput");
    expect(result!.variables.input).toEqual({ id: "PLACE-001" });
  });

  test("POST /places maps to CreatePlace and forwards the body (no orgId injected)", () => {
    const body = {
      en: "North Fire Station",
      th: "สถานีดับเพลิงเหนือ",
      category: "fire_station",
      latitude: 13.8,
      longitude: 100.55,
      active: true,
    };
    const result = buildGraphQLQuery({ url: "/places", method: "POST", body });

    expect(result).not.toBeNull();
    expect(result!.query).toContain("CreatePlace");
    expect(result!.query).toContain("PlaceInput!");
    expect(result!.variables.input).toEqual(body);
    expect(result!.variables.input).not.toHaveProperty("orgId");
  });

  test("PATCH /places/{id} maps to UpdatePlace with id merged into the body", () => {
    const body = {
      en: "Central Police Station (renamed)",
      th: "สถานีตำรวจกลาง (เปลี่ยนชื่อ)",
      category: "police_station",
      latitude: 13.75,
      longitude: 100.5,
      active: true,
    };
    const result = buildGraphQLQuery({ url: "/places/PLACE-001", method: "PATCH", body });

    expect(result).not.toBeNull();
    expect(result!.query).toContain("UpdatePlace");
    expect(result!.variables.input).toEqual({ ...body, id: "PLACE-001" });
  });

  test("DELETE /places/{id} maps to DeletePlace with id", () => {
    const result = buildGraphQLQuery({ url: "/places/PLACE-001", method: "DELETE" });

    expect(result).not.toBeNull();
    expect(result!.query).toContain("DeletePlace");
    expect(result!.variables.input).toEqual({ id: "PLACE-001" });
  });
});

describe("buildGraphQLQuery - Device", () => {
  test("GET /devices (list) maps to GetDeviceLists with start/length", () => {
    const result = buildGraphQLQuery({ url: "/devices", method: "GET", params: { start: 0, length: 10 } });

    expect(result).not.toBeNull();
    expect(result!.query).toContain("Device");
    expect(result!.query).toContain("GetDeviceLists");
    expect(result!.query).toContain("DeviceListInput!");
    expect(result!.variables.input).toEqual({ start: 0, length: 10 });
  });

  test("GET /devices (list) with deviceType/bbox filters", () => {
    const result = buildGraphQLQuery({
      url: "/devices",
      method: "GET",
      params: { deviceType: "Camera", bbox: "100.4,13.7,100.6,13.8" },
    });

    expect(result).not.toBeNull();
    expect(result!.variables.input).toEqual({ deviceType: "Camera", bbox: "100.4,13.7,100.6,13.8" });
  });

  test("GET /devices/{id} maps to GetDeviceById with id (not deviceId)", () => {
    const result = buildGraphQLQuery({ url: "/devices/CAM-001-XYZ123", method: "GET" });

    expect(result).not.toBeNull();
    expect(result!.query).toContain("GetDeviceById");
    expect(result!.query).toContain("GetIdInput!");
    expect(result!.variables.input).toEqual({ id: "CAM-001-XYZ123" });
  });

  test("POST /devices maps to InsertDeviceIoT and forwards deviceId", () => {
    const body = {
      deviceId: "CAM-002-XYZ456",
      deviceType: "Camera",
      en: "Back Gate Camera",
      th: "กล้องประตูหลัง",
      latitude: "13.76",
      longitude: "100.51",
      active: true,
    };
    const result = buildGraphQLQuery({ url: "/devices", method: "POST", body });

    expect(result).not.toBeNull();
    expect(result!.query).toContain("InsertDeviceIoT");
    expect(result!.query).toContain("DeviceIoTInput!");
    expect(result!.variables.input).toEqual(body);
  });

  test("PATCH /devices/{id} maps to UpdateDeviceIoT with deviceId (not id) in the input", () => {
    const body = {
      deviceType: "Camera",
      en: "Back Gate Camera (renamed)",
      th: "กล้องประตูหลัง (เปลี่ยนชื่อ)",
      latitude: "13.76",
      longitude: "100.51",
      active: true,
    };
    const result = buildGraphQLQuery({ url: "/devices/CAM-002-XYZ456", method: "PATCH", body });

    expect(result).not.toBeNull();
    expect(result!.query).toContain("UpdateDeviceIoT");
    expect(result!.variables.input).toEqual({ ...body, deviceId: "CAM-002-XYZ456" });
    expect(result!.variables.input).not.toHaveProperty("id");
  });

  test("DELETE /devices/{id} maps to DeleteDeviceIoT with id (not deviceId)", () => {
    const result = buildGraphQLQuery({ url: "/devices/CAM-002-XYZ456", method: "DELETE" });

    expect(result).not.toBeNull();
    expect(result!.query).toContain("DeleteDeviceIoT");
    expect(result!.query).toContain("GetIdInput!");
    expect(result!.variables.input).toEqual({ id: "CAM-002-XYZ456" });
    expect(result!.variables.input).not.toHaveProperty("deviceId");
  });
});

// Guards the CaseUpdateInput sanitizing contract: callers PATCH /case/:id with a
// body spread from the SOP read model, which carries fields the GraphQL input
// type does not define (top-level AND nested inside attachments). Regression here
// resurfaces as BAD_USER_INPUT "Field X is not defined by type ..." for the whole
// save flow - see UPDATE_CASE_MUTATION.omitInputFields in caseQueries.ts.
describe("buildGraphQLQuery - Case update input sanitizing", () => {
  const body = {
    caseId: "D260929-00003",
    caseDetail: "....",
    statusId: "S007",
    referCaseId: "D260929-00002",
    caseSla: "97",
    customerId: 2,
    docId: "0004/2569",
    attachments: [
      {
        id: 0,
        orgId: "",
        caseId: "",
        type: "close",
        attId: "062ed148-ecf3-4a32-b264-0150144e0226",
        attName: "062ed148-ecf3-4a32-b264-0150144e0226.jpg",
        attUrl: "https://storage.example/cms-stg/close/062ed148.jpg",
        createdAt: "2026-09-29T10:36:29.759136Z",
        updatedAt: "2026-09-29T10:36:29.759136Z",
        createdBy: "",
        updatedBy: "",
      },
    ],
  };

  test("PATCH /case/{id} strips top-level fields CaseUpdateInput does not define", () => {
    const result = buildGraphQLQuery({ url: "/case/D260929-00003", method: "PATCH", body });

    expect(result).not.toBeNull();
    expect(result!.query).toContain("UpdateCase");
    expect(result!.variables.input).not.toHaveProperty("customerId");
    expect(result!.variables.input).not.toHaveProperty("docId");
  });

  test("PATCH /case/{id} strips AttachmentInput audit fields but keeps attachment content", () => {
    const result = buildGraphQLQuery({ url: "/case/D260929-00003", method: "PATCH", body });

    expect(result).not.toBeNull();
    const attachments = (result!.variables.input as { attachments: Record<string, unknown>[] }).attachments;
    expect(attachments).toHaveLength(1);
    expect(attachments[0]).toEqual({
      id: 0,
      type: "close",
      attId: "062ed148-ecf3-4a32-b264-0150144e0226",
      attName: "062ed148-ecf3-4a32-b264-0150144e0226.jpg",
      attUrl: "https://storage.example/cms-stg/close/062ed148.jpg",
    });
  });

  test("PATCH /case/{id} keeps writable fields and preserves referCaseId (including empty-string unlink)", () => {
    const result = buildGraphQLQuery({
      url: "/case/D260929-00003",
      method: "PATCH",
      body: { ...body, referCaseId: "" },
    });

    expect(result).not.toBeNull();
    const input = result!.variables.input as Record<string, unknown>;
    expect(input.caseDetail).toBe("....");
    expect(input.statusId).toBe("S007");
    expect(input.caseSla).toBe("97");
    // Unlink is expressed as referCaseId: "" and must survive the empty-string strip.
    expect(input).toHaveProperty("referCaseId", "");
  });
});
