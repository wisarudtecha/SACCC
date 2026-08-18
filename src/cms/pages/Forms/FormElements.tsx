import PageBreadcrumb from "@/core/components/common/PageBreadCrumb";
import DefaultInputs from "@/core/components/form/form-elements/DefaultInputs";
import InputGroup from "@/core/components/form/form-elements/InputGroup";
import DropzoneComponent from "@/core/components/form/form-elements/DropZone";
import CheckboxComponents from "@/core/components/form/form-elements/CheckboxComponents";
import RadioButtons from "@/core/components/form/form-elements/RadioButtons";
import ToggleSwitch from "@/core/components/form/form-elements/ToggleSwitch";
import FileInputExample from "@/core/components/form/form-elements/FileInputExample";
import SelectInputs from "@/core/components/form/form-elements/SelectInputs";
import TextAreaInput from "@/core/components/form/form-elements/TextAreaInput";
import InputStates from "@/core/components/form/form-elements/InputStates";
import PageMeta from "@/core/components/common/PageMeta";

export default function FormElements() {
  return (
    <div>
      <PageMeta
        title="React.js Form Elements Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Form Elements  Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="From Elements" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <DefaultInputs />
          <SelectInputs />
          <TextAreaInput />
          <InputStates />
        </div>
        <div className="space-y-6">
          <InputGroup />
          <FileInputExample />
          <CheckboxComponents />
          <RadioButtons />
          <ToggleSwitch />
          <DropzoneComponent />
        </div>
      </div>
    </div>
  );
}
