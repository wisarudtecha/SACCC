// @refresh reset
import store from "@/core/store/index";
import { caseApi, CaseListParams } from "@/cms/store/api/caseApi";
import { customerApi } from "@/cms/store/api/custommerApi";
import { formApi } from "@/cms/store/api/formApi";
import { CaseTypeSubType } from "../../interface/CaseType";
import { areaApi } from "@/cms/store/api/area";
import { unitApi } from "@/cms/store/api/unitApi";
import { caseStatusGroup } from "@/cms/components/ui/status/status";
import { notifyCaseListChanged } from "@/cms/components/case/caseListSignal";
import { idbStorage } from "@/cms/components/idb/idb";

export const fetchCustomers = async () => {
  const customerDataResult = await store.dispatch(
    customerApi.endpoints.getCustommers.initiate({ start: 0, length: 100 }, { forceRefetch: true })
  );
  if (customerDataResult.data?.data)
    localStorage.setItem("customer_data", JSON.stringify(customerDataResult.data?.data));
};

export const fetchUnitStatus = async () => {
  const unitStatusDataResult = await store.dispatch(
    unitApi.endpoints.getUnitStatuses.initiate({ start: 0, length: 100 }, { forceRefetch: true })
  );
  if (unitStatusDataResult.data?.data)
    localStorage.setItem("unit_status", JSON.stringify(unitStatusDataResult.data?.data));
  else {
    return "apiSetUp.fetchUnitStatusFail"
  }
};

export const fetchCase = async (params: CaseListParams) => {
  const requestNumber = parseInt(import.meta.env.VITE_GET_CASE_PER_REQUEST || "100", 10);
  const requestRetry = parseInt(import.meta.env.VITE_GET_CASE_RETRY || "3", 10);
  const delay = parseInt(import.meta.env.VITE_GET_CASE_DELAY || "200", 10);

  if (!requestNumber || typeof requestNumber != "number") {
    return;
  }

  // Dispatch loading start event
  window.dispatchEvent(new CustomEvent("caseLoadingStart"));
  localStorage.setItem("WorkOrderFilter", JSON.stringify(params));

  let allData: any[] = [];
  let start = 0;
  let currentPage = 0;
  let totalPages = 0;

  const statusId = caseStatusGroup
    .filter(item => item.show)
    .flatMap(item => item.group)
    .filter(Boolean)
    .join(',');

  const getListParams = {
    statusId: statusId,
    length: requestNumber,
    // distId: distIdCommaSeparate(),
    orderBy: "priority,createdAt",
    direction: "asc,desc"
  };

  // Retry helper function
  const fetchWithRetry = async (fetchParams: any, retries = requestRetry): Promise<any> => {
    for (let attempt = 0; attempt <= retries; attempt++) {

      try {
        const result = await store.dispatch(
          caseApi.endpoints.getListCase.initiate(fetchParams, { forceRefetch: true })
        );

        if (!!result.error) {
          throw new Error("API request failed");
        } else {
          // No data and no error - unexpected state
          if (attempt === retries) {
            throw new Error("Unexpected API response");
          }
        }
        if (result.data !== undefined) {
          return result;
        }
        // Exponential backoff: wait longer between retries
        const backoffDelay = delay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));

      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error)
        if (attempt === retries) {
          throw error;
        }

        // Exponential backoff
        const backoffDelay = delay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  };

  try {
    // Fetch first page with retry
    const firstResult = await fetchWithRetry({
      ...params,
      ...getListParams,
      start: 0,
    });

    // Check if data exists (could be null or empty array)
    if (firstResult.data?.data !== undefined && firstResult.data?.data !== null) {
      allData = [...firstResult.data.data];
      currentPage = firstResult.data.currentPage || 1;
      totalPages = firstResult.data.totalPage || 0;

      // Save first batch to IDB
      await idbStorage.setItem("caseList", JSON.stringify(allData));
      notifyCaseListChanged();

      // Dispatch progress for first page
      window.dispatchEvent(
        new CustomEvent("caseLoadingProgress", {
          detail: {
            current: currentPage,
            total: totalPages
          }
        })
      );
    } else if (firstResult.data?.data === null) {
      // Data is null - no data found, not an error
      console.info("No cases found");
      await idbStorage.setItem("caseList", "[]");
      notifyCaseListChanged();
      window.dispatchEvent(new CustomEvent("caseLoadingEnd"));
      return [];
    } else {
      throw new Error("Failed to fetch initial data");
    }

    // Fetch remaining pages with retry
    while (currentPage < totalPages) {
      start = currentPage * requestNumber;

      const result = await fetchWithRetry({
        ...params,
        ...getListParams,
        start,
      });

      if (result.data?.data !== undefined && result.data?.data !== null) {
        allData = [...allData, ...result.data.data];
        currentPage = result.data.currentPage || currentPage + 1;

        // Save updated data to IDB after each fetch
        await idbStorage.setItem("caseList", JSON.stringify(allData));

        window.dispatchEvent(
          new CustomEvent("caseLoadingProgress", {
            detail: {
              current: currentPage,
              total: totalPages
            }
          })
        );

        notifyCaseListChanged();
      } else if (result.data?.data === null) {
        // No more data on this page (unlikely but handle it)
        break;
      } else {
        throw new Error(`Failed to fetch page ${currentPage + 1}`);
      }

      // Delay between successful requests
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // All pages fetched successfully
    window.dispatchEvent(new CustomEvent("caseLoadingEnd"));
    return allData;

  } catch (error) {

    // Save whatever data we have
    await idbStorage.setItem("caseList", JSON.stringify(allData.length > 0 ? allData : []));

    // Dispatch failure event
    window.dispatchEvent(new CustomEvent("caseLoadingFail"));

    // Return partial data if available, or empty array
    return allData.length > 0 ? allData : [];
  }
};

export const fetchCaseResults = async () => {
  const result = await store.dispatch(
    caseApi.endpoints.getCaseResults.initiate({}, { forceRefetch: true })
  );
  if (result.data?.data) {
    localStorage.setItem("caseResultsList", JSON.stringify(result.data?.data));
  } else {
    localStorage.setItem("caseResultsList", "[]");
    return "apiSetUp.fetchCaseResultFail"
  }
};

export const fetchTypeSubType = async () => {
  const caseTypeSubType = await store.dispatch(
    caseApi.endpoints.postTypeSubType.initiate(null, { forceRefetch: true })
  );
  if (caseTypeSubType.data?.data)
    localStorage.setItem("caseTypeSubType", JSON.stringify(caseTypeSubType.data?.data));
  else {
    return "apiSetUp.fetchcaseTypeFail"
  }
};

export const fetchSubTypeForm = async (subType: string) => {
  const SubTypeForm = await store.dispatch(
    formApi.endpoints.postSubTypeForm.initiate(subType)
  );
  return SubTypeForm
};

export const fetchSubTypeAllForm = async () => {
  const typeSubTypeForm = localStorage.getItem("caseTypeSubType");
  if (typeSubTypeForm) {
    const typeSubTypeFormList = JSON.parse(typeSubTypeForm) as CaseTypeSubType[];


    await Promise.all(
      typeSubTypeFormList.map(async (item) => {
        const SubTypeForm = await store.dispatch(
          formApi.endpoints.postSubTypeForm.initiate(item.sTypeId)
        );
        return SubTypeForm
      })
    );
  }
};

export const fetchDeptCommandStations = async () => {
  const result = await store.dispatch(
    caseApi.endpoints.getDeptCommandStations.initiate(null, { forceRefetch: true })
  );
  if (result.data?.data)
    localStorage.setItem("DeptCommandStations", JSON.stringify(result.data?.data));
  else {
    return "apiSetUp.fetchDeptCommandStationFail"
  }
};

export const fetchCaseStatus = async () => {
  const result = await store.dispatch(
    caseApi.endpoints.getStatus.initiate({ start: 0, length: 100 }, { forceRefetch: true })
  );
  if (result.data?.data)
    localStorage.setItem("caseStatus", JSON.stringify(result.data?.data));
  else {
    return "apiSetUp.fetchCaseStatusFail"
  }
};

export const fetchArea = async () => {
  const result = await store.dispatch(
    areaApi.endpoints.getArea.initiate(null)
  );
  if (result.data?.data)
    localStorage.setItem("area", JSON.stringify(result.data?.data));
  else {
    return "apiSetUp.fetchAreaFail"
  }
};

export const caseApiSetup = async () => {
  // await fetchCustomers()
  let err: string[] = []
  err.push(await fetchTypeSubType() || "")
  err.push(await fetchDeptCommandStations() || "");
  err.push(await fetchCaseStatus() || "");
  err.push(await fetchCaseResults() || "");
  err.push(await fetchUnitStatus() || "");
  err.push(await fetchArea() || "");
  fetchCase({});
  return err
};