import React, { SetStateAction, useState } from 'react';
import Button from '@/core/components/ui/button/Button';
import { FormField, FormLinkWf, FormManager } from '../interface/FormField';
import { ConfirmationModal } from '../case/modal/ConfirmationModal';
import { useDeleteFormMutationMutation, usePublishFormMutationMutation } from '@/cms/store/api/formApi';
// import { useToast } from '@/core/hooks';
import Badge from '@/core/components/ui/badge/Badge';
import { useTranslation } from '@/core/hooks/useTranslation';
import Switch from '@/core/components/form/switch/Switch';
import { useToastContext } from '@/core/components/crud/ToastGlobal';
import { LoadingModal } from '@/core/components/common/Loading';
// import { TranslationKey } from '@/core/types/i18n';


const ListOfWf: React.FC<{ formLinkWf: FormLinkWf[] }> = ({ formLinkWf }) => {
  const { t } = useTranslation();
  return <div> {t("form_builder.remove_workflow")}
    <div>{formLinkWf.length > 0 && (
      <div className=" rounded-lg ">
        <div className="flex flex-wrap gap-2 mt-2 max-h-20 overflow-y-auto custom-scrollbar">
          {formLinkWf.map((item) => (
            <Badge key={item.wfId}>
              {item.title}
            </Badge>
          ))}
        </div>
      </div>
    )}</div>
  </div>
}

// const LoadingSpinner: React.FC = () => {
//   const { t } = useTranslation();
//   return (
//     <div className="flex items-center justify-center py-4">
//       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
//       <span className="ml-2">{t("common.loading")}...</span>
//     </div>
//   );
// }

interface TableRowActionsProps {
  form: FormManager;
  handleOnEdit?: (form: FormField) => void;
  handleOnView?: () => void;
  type?: "button" | "list";
  onSetStatusChange: (formId: string, formName: string, newStatus: boolean) => void;
  setForms: React.Dispatch<SetStateAction<FormManager[]>>
}

const ButtonAction: React.FC<TableRowActionsProps> = ({
  form,
  type = "list",
  handleOnEdit,
  handleOnView,
  setForms
}) => {
  const [showPubModal, setShowPubModal] = useState<boolean>(false);
  const [showDelModal, setShowDelModal] = useState<boolean>(false);
  // const [isLoadingWfData, setIsLoadingWfData] = useState<boolean>(false);
  const style = type === "list" ? "outline" : "outline";
  const [pusblishForm] = usePublishFormMutationMutation({})
  const { addToast } = useToastContext();
  const [loading, setLoading] = useState<boolean>(false);
  const [deleteForm] = useDeleteFormMutationMutation()
  // const [SelectFormLinkWf, setSelectFormLinkWf] = useState<FormLinkWf[] | undefined>(undefined)
  const { t } = useTranslation();
  const handleOnPubUnPub = async (form: FormManager) => {
    try {
      const response = await pusblishForm({ formId: form.formId, publish: !form.publish })

      if (response?.data?.msg === "Success") {
        addToast(
          'success',
          `${!form.publish ? "Publish" : "Unpublish"} Complete.`
        );
        setForms((prev) =>
          prev.map((f) =>
            f.formId === form.formId ? { ...f, publish: !form.publish } : f
          )
        );
        setShowPubModal(false);
        return
      }
    } catch (error: any) {
      addToast(
        'error',
        `${!form.publish ? "Publish" : "Unpublish"} Failed.`
      );
    }
  }

  // useEffect(() => {
  //   const fetchData = async () => {
  //     setIsLoadingWfData(true);
  //     try {
  //       const response = await getFormLinkWf({ formId: form.formId }).unwrap();
  //       if (response?.data) {
  //         setSelectFormLinkWf(response.data || []);
  //       } else {
  //         setSelectFormLinkWf([]);
  //       }
  //     } catch (error: any) {
  //       if (error.data?.msg === "No data found") {
  //         setSelectFormLinkWf([]);
  //         return;
  //       }
  //       addToast('error', `${error.data?.msg || 'Failed to fetch workflow data'}`);
  //     } finally {
  //       setIsLoadingWfData(false);
  //     }
  //   };

  //   if (showPubModal && form.publish) {
  //     fetchData();
  //   }
  // }, [showPubModal, form.publish, form.formId]);
  const handleOnDelete = async (form: FormManager) => {

    try {
      setLoading(true)
      const resultForm = await deleteForm({ formId: form.formId }).unwrap()
      if (resultForm.msg?.toLowerCase() === "success")
        addToast("success", t("toast.delete_form_success"))
    } catch (error) {
      addToast("error", t("common.error"))
      return
    } finally {
      setLoading(false)
      setShowDelModal(false)
    }
  }


  const getModalDescription = () => {
    if (!form?.publish) {
      return t("form_manager.confirm_publish");
    }

    // if (isLoadingWfData) {
    //   return <LoadingSpinner />;
    // }

    // if (!form.workflows) {
    //   return t("common.error")
    // }

    if (form.workflows) {
      return <ListOfWf formLinkWf={form.workflows} />;
    }

    return t("form_manager.confirm_unpublish");
  };

  const canConfirm = () => {
    // For publish action, always allow
    if (!form.publish) return true;

    // For unpublish, only allow if not loading and no workflows linked
    // if (isLoadingWfData) return false;
    if (form.workflows?.length != 0 || !form.workflows) return false;

    return true;
  };

  const handleSwitchChange = () => {
    setShowPubModal(true);
  };

  return (
    <div className={`flex  flex-wrap ${type !== "list" ? "justify-between space-y-2" : "  justify-end"} w-full`}>
      <div className="flex items-center gap-2">
        <Button
          onClick={() => handleOnView?.()}
          variant={`primary`}
          title="View"
          size='sm'
        >
          {t("common.view")}
        </Button>
        <Button
          onClick={() => handleOnEdit?.(form)}
          variant={`warning`}
          title="Edit"
          size='sm'
        // disabled={
        //   (form?.versionsInfoList?.length ?? 0) > 0 &&
        //   Number(form.versions) <
        //   Math.max(...(form.versionsInfoList?.map((item)=>Number(item.version)) ?? [Number(form.versions)]))
        // }
        >
          {t("common.edit")}
        </Button>
        {form.workflows?.length == 0 && <Button
          onClick={() => setShowDelModal(true)}
          variant={style}
          size='sm'
        // title="Edit"
        // disabled={
        //   (form?.versionsInfoList?.length ?? 0) > 0 &&
        //   Number(form.versions) <
        //   Math.max(...(form.versionsInfoList?.map((item)=>Number(item.version)) ?? [Number(form.versions)]))
        // }
        >
          {t("common.delete")}
        </Button>}


        {type === "list" && <Switch
          label={t("common.status")}
          defaultChecked={form.publish}
          onChick={handleSwitchChange}
          color={form.publish ? "blue" : "gray"}
        />
        }
      </div>
      {type != "list" && <Switch
        label={t("common.status")}
        defaultChecked={form.publish}
        onChick={handleSwitchChange}
        color={form.publish ? "blue" : "gray"}
      />
      }


      <ConfirmationModal
        isOpen={showPubModal}
        onClose={() => {
          setShowPubModal(false);
          // setSelectFormLinkWf(undefined);
          // setIsLoadingWfData(false);
        }}
        onConfirm={canConfirm() ? () => handleOnPubUnPub(form) : undefined}
        title={!form?.publish ? t("common.active") : t("common.inactive")}
        description={getModalDescription()}
        confirmButtonVariant={!form?.publish ? "success" : "error"}
        cancelButtonText={t("common.cancel")}
        confirmButtonText={t("common.confirm")}
      />
      <ConfirmationModal
        isOpen={showDelModal}
        onClose={() => {
          setShowDelModal(false);
          // setSelectFormLinkWf(undefined);
          // setIsLoadingWfData(false);
        }}
        onConfirm={() => handleOnDelete(form)}
        title={t("common.delete")}
        description={t("form_manager.delete_form_desc")}
        confirmButtonVariant={"error"}
        cancelButtonText={t("common.cancel")}
        confirmButtonText={t("common.confirm")}
      />
      {loading &&
        <LoadingModal />
      }
    </div>
  );
};

export default ButtonAction;