import { Custommer } from "@/cms/types";
import { CaseDetails } from "@/cms/types/case";

export const exampleCaseState: Partial<CaseDetails> = {
            location: "เลขที่ 78 ซอยสามเสน 3 (วัดสามพระยา) ถนนสามเสน แขวงวัดสามพระยา เขตพระนคร กรุงเทพมหานคร 10200",
            date: "",
            iotDevice: "CAM-001-XYZ123",
            customerData: {
                mobileNo: "0991396777",
                name: "",
            } as Custommer,
            caseType: {
                typeId: "fe4215f5-7127-4f6b-bd7a-d6ed8ccaa29d",
                orgId: "434c0f16-b7ea-4a7b-a74b-e2e0f859f549",
                en: "IOT Water Sensor",
                th: "เซ็นเซอร์น้ำอัจฉริยะ",
                active: true,
                sTypeId: "b2c3d4e5-f6a7-8901-bc23-45678901def0",
                sTypeCode: "200",
                subTypeEn: "Water Sensor Malfunction",
                subTypeTh: "เซ็นเซอร์น้ำทำงานผิดปกติ",
                wfId: "f090eeb5-b63c-46ed-aaa9-72462234a070",
                caseSla: "45",
                priority: 5,
                userSkillList: [
                    "fe6c8262-04a1-4f5c-8b48-c124cf0152b1"
                ],
                unitPropLists: [
                    "4a56e3c2-1188-40ef-bf0a-4ec07f6a5933"
                ],
                subTypeActive: true,
                caseType: "200-เซ็นเซอร์น้ำอัจฉริยะ-เซ็นเซอร์น้ำทำงานผิดปกติ",
                formField: {
                    nextNodeId: "node-1755508933488",
                    versions: "draft",
                    wfId: "f090eeb5-b63c-46ed-aaa9-72462234a070",
                    formId: "da7f4b82-dd1f-4743-bea3-eee5d415fccc",
                    formName: "เซ็นเซอร์น้ำอัจฉริยะ",
                    formColSpan: 2,
                    formFieldJson: [
                        {
                            colSpan: 1,
                            id: "18a00f16-6f0d-436e-9a1e-fec5c12513ab",
                            isChild: false,
                            label: "เลขเซ็นเซอร์น้ำ",
                            placeholder: "เลขเซ็นเซอร์น้ำ",
                            required: false,
                            showLabel: true,
                            type: "textInput",
                            value: "WS-001-ABC789"
                        },
                        {
                            colSpan: 1,
                            id: "48f15f2d-a3d6-4955-ab52-8138c780094e",
                            isChild: false,
                            label: "ระดับน้ำ",
                            placeholder: "ระดับน้ำ",
                            required: false,
                            showLabel: true,
                            type: "textInput",
                            value: "200 เมตร"
                        },
                        {
                            colSpan: 2,
                            id: "35c9cfe7-2779-414a-a1e4-b6954b384981",
                            isChild: false,
                            label: "ข้อมูลจากเซ็นเซอร์",
                            placeholder: "ข้อมูลจากเซ็นเซอร์",
                            required: false,
                            showLabel: true,
                            type: "textAreaInput",
                            value: "ลง   500 m"
                        }
                    ],
                    formType:"case"
                },



            },
            priority: 5,
            description: "เซ็นเซอร์น้ำขัดข้อง",
            // area: {
            //     id: "62",
            //     orgId: "434c0f16-b7ea-4a7b-a74b-e2e0f859f549",
            //     countryId: "TH",
            //     provId: "10",
            //     districtEn: "Phra Nakhon",
            //     districtTh: "พระนคร",
            //     districtActive: true,
            //     distId: "101",
            //     provinceEn: "Bangkok",
            //     provinceTh: "กรุงเทพมหานคร",
            //     provinceActive: true,
            //     countryEn: "Thailand",
            //     countryTh: "ประเทศไทย",
            //     countryActive: true
            // },
            status: "",
            scheduleDate: "2025-08-27T16:40",
            attachFile: [],
            source: { name: "IOT-Alert", id: "05" },
            attachFileResult: [],
            iotDate: "2025-08-27T16:40",
            workOrderDate: "2025-08-27T16:40"
};