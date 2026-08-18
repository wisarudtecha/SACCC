// src/components/workflow/list/formCard.tsx
import React, { SetStateAction } from 'react';

import {
  CalenderIcon,
} from "@/core/icons";
import { FormManager } from '../interface/FormField';
import ButtonAction from './ButtonAction';
import { getAvatarIconFromString } from '../avatar/createAvatarFromString';
import Button from '@/core/components/ui/button/Button';
import { formatDate } from '@/core/utils/crud';
import { useTranslation } from '@/core/hooks/useTranslation';
import ViewWorkFlow from './viewWorkFlow';

interface FormCardProps {
  form: FormManager;
  setForms: React.Dispatch<SetStateAction<FormManager[]>>
  handleOnEdit?: () => void;
  handleOnView?: () => void;
  handleOnVersion?: (form: FormManager) => void;
  setShowPubModal?: React.Dispatch<React.SetStateAction<boolean>>;
  onSetStatusInactive: (formId: string, formName: string, newStatus: FormManager['active']) => void; // Add this line
}



const FormCard: React.FC<FormCardProps> = ({
  form,
  setForms,
  handleOnEdit,
  handleOnView,
  onSetStatusInactive, // Destructure the new prop
  handleOnVersion
}) => {

  // const config = statusConfig[form.active===true?"active":"inactive"];
  const { t } = useTranslation();
  return (
    <div
      key={form.formId}
      className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow border-gray-200 dark:border-gray-700 flex flex-col"
    >
      <div className=' space-y-3'>
        <div className="flex items-start justify-between mb-4">
          <div className="relative group w-50">
            <h3 className="items-center text-lg font-semibold text-gray-900 dark:text-white leading-relaxed line-clamp-2">
              {form.formName}
            </h3>
            {/* <span className="
                absolute left-0 top-0 mt-1 hidden text-lg group-hover:block
                bg-gray-800 text-white px-2 py-1 rounded shadow-lg
                whitespace-nowrap z-50
                "
            >
              {form.formName}
            </span> */}
          </div>
          {/* {form?.versionsInfoList &&
            form.versionsInfoList.length > 0 &&
            Number(form.versions) < Math.max(...form.versionsInfoList.map(Number)) && (
              <Badge color="warning" className="px-2 py-1 rounded-full text-xs font-medium">
                {t("common.new_version")}
              </Badge>
            )} */}
          <div className="flex items-center gap-1">
            {/* <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
              {config.label}
            </span> */}
            {/* {form.publish && <Badge color='success' variant='solid' className={`px-2 py-1 rounded-full text-xs font-medium`}>
              Pubilsh
            </Badge>} */}
            {/* <SearchableSelect className=' w-18 rounded-full text-xs font-medium' value={form.versions} prefixedStringValue="v." options={(form?.versionsList || [])} onChange={()=>{}} disabledChevronsIcon={true} disabledRemoveButton={true} placeholder=' '/> */}
            <Button className=' w-fit rounded-full text-xs font-medium' variant='outline' onClick={() => { handleOnVersion && handleOnVersion(form) }}>v.{form.versions}</Button>
            {/* <Badge color='warning' className={`px-2 py-1 rounded-full text-xs font-medium `}>
              v.{form.versions}
            </Badge> */}
          </div>
        </div>

        {/* <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">{form.description}</p> */}
        
        {form.workflows&& <ViewWorkFlow workflows={form.workflows} />}
      
        
      </div>

      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center gap-1">
            <CalenderIcon className="w-4 h-4" />
            {formatDate(form.createdAt)}
          </div>
        </div>
        <div className='mb-2 flex items-center text-sm text-gray-500 dark:text-gray-400'>{t("common.createBy")} : {getAvatarIconFromString(form.createdBy, "bg-blue-600 dark:bg-blue-700 mx-1")}{form.createdBy}</div>
        <ButtonAction
          type="button"
          form={form}
          setForms={setForms}
          handleOnEdit={handleOnEdit}
          handleOnView={handleOnView}
          onSetStatusChange={onSetStatusInactive}
        />
      </div>
    </div>
  );

};

export default FormCard;