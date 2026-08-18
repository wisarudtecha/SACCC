import { CaseTypeSubType } from "@/cms/components/interface/CaseType"


export const mergeCaseTypeAndSubType = (data: CaseTypeSubType,language:string) => {
    // return `${data.th ?? ""}` +
    //     `${data.sTypeCode ? `-${data.sTypeCode}` : ""}` +
    //     `${data.subTypeTh ? `_${data.subTypeTh}` : ""}`
    if (language === "th") {
        return `${data.sTypeCode ? `${data.sTypeCode}` : ""}` + `-${data.th ?? ""}` + `-${data.subTypeTh}`
    } else {
        return `${data.sTypeCode ? `${data.sTypeCode}` : ""}` + `-${data.en ?? ""}` + `-${data.subTypeEn}`
    }

}