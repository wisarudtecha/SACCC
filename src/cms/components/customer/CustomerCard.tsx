import Button from "@/core/components/ui/button/Button";
import Badge from "@/core/components/ui/badge/Badge";
import { i18nUserType } from "./constant";
import { Mail, Package, Phone, Wrench } from "lucide-react";
import { CustomerProduct } from "@/cms/store/api/custommerApi";
import { useTranslation } from "@/core/hooks/useTranslation";
import { usePiiMasker } from "@/core/hooks/useMaskedValue";
import { ChatIcon } from "@/core/icons";
import { Avatar } from "@/core/components/ui/avatar/Avatarv2";



interface CustomerProps {
    customerData: CustomerProduct;
    onEdit?: () => void;
    onView?: () => void;
    onDelete?: () => void;
}


const CustomerCard: React.FC<CustomerProps> = ({ customerData, onEdit, onView, onDelete }) => {
    const { t } = useTranslation();
    const { canViewPii, maskValue } = usePiiMasker();
    return (
        <div
            key={customerData.id}
            className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow border-gray-200 dark:border-gray-700 flex flex-col"
        >
            <div className=' space-y-3'>
                <div className="flex items-start justify-between mb-5 space-x-3">
                    {/* <Avatar
                        src={
                            customerData?.photo
                                ? customerData.photo
                                : "/images/user/unknow user.png"
                        }
                        size="xxlarge"
                    /> */}
                    {/* Without `pii.view`, fall through to the initials branch below. */}
                    {canViewPii && customerData.photo ? (
                        <Avatar className="w-20 h-20 justify-center items-center" >
                            <img src={customerData.photo} alt={customerData.displayName} className="h-full w-full object-cover rounded-full"/>
                        </Avatar>
                    ) : (
                        <div className="w-20 h-20 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-2xl">
                            <span className="w-20 text-center uppercase">
                                {customerData.firstName || customerData.lastName
                                    ? `${customerData.firstName?.[0] || ""} ${customerData.lastName?.[0] || ""}`.trim()
                                    : customerData.email?.[0] || "?"}
                            </span>
                        </div>
                    )}
                    <div className="relative group w-50">
                        <h3 className="items-center text-lg font-semibold text-gray-900 dark:text-white leading-relaxed line-clamp-2">
                            {customerData.displayName}
                        </h3>

                    </div>
                    <div className=" flex space-x-3">
                        <Badge variant="outline">{customerData.userType ? i18nUserType(t, customerData.userType) : t("userform.na")}</Badge>
                        <div className={`w-3 h-3 rounded-full mx-1  self-center ${customerData.active ? "bg-green-500" : "bg-red-500"}`}></div>
                    </div>

                </div>
                <div className=" text-gray-600 dark:text-gray-300 space-x-2 grid-cols-[8%_92%] grid">
                    <Mail className="w-5 h-5" />
                    <p className=" mb-4 text-sm">{maskValue("email", customerData.email)}</p>
                    <Phone className="w-5 h-5" />
                    <p className=" mb-4 text-sm">{maskValue("mobileNo", customerData.mobileNo)}</p>

                </div>
                <div className="text-gray-600 dark:text-gray-300 grid grid-cols-2">
                    <div className="flex  space-x-2">
                        <Package className="w-5 h-5 text-blue-500" />
                        <p className=" mb-4 text-sm">{customerData.product + " " + t("common.product")}</p>
                    </div>
                    <div className="flex  space-x-2">
                        <Wrench className="w-5 h-5 text-orange-500" />
                        <p className=" mb-4 text-sm">{customerData.service + " " + t("common.service")}</p>
                    </div>
                    {/* <div className="flex  space-x-2">
                        <Ticket className="w-5 h-5 text-purple-500" />
                        <p className=" mb-4 text-sm">{customerData.case + " " + t("common.case")}</p>
                    </div> */}
                </div>



            </div>

            <div className="mt-auto pt-4">
                {/* <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center gap-1">
            <CalenderIcon className="w-4 h-4" />
            {formatDate(form.createdAt)}
          </div>
        </div> */}
                {/* <div className='mb-2 flex items-center text-sm text-gray-500 dark:text-gray-400'>{t("common.createBy")} : {getAvatarIconFromString(form.createdBy, "bg-blue-600 dark:bg-blue-700 mx-1")}{form.createdBy}</div> */}
                {/* <ButtonAction
          type="button"
          form={form}
          setForms={setForms}
          handleOnEdit={handleOnEdit}
          handleOnView={handleOnView}
          onSetStatusChange={onSetStatusInactive}
        /> */}
                {/* <Button>test</Button> */}
                <div className="text-gray-600 dark:text-gray-300  flex justify-between">
                    <div className="space-x-1 space-y-2">
                        <Button className=" bg-green-500 hover:bg-green-600" size="sm">
                            <Phone className="w-5 h-5 " />
                        </Button>
                        <Button className=" bg-blue-500 hover:bg-blue-600" size="sm">
                            <Mail className="w-5 h-5 " />
                        </Button>
                        <Button className=" bg-blue-500 hover:bg-blue-600" size="sm">
                            <ChatIcon className="w-5 h-5 " />
                        </Button>
                    </div>
                    <div className="space-x-1 space-y-2">
                        <Button onClick={onView} variant={`primary`} title="View" size='sm'>
                            {t("common.view")}
                        </Button>
                        <Button onClick={onEdit} variant={`warning`} title="Edit" size='sm'>
                            {t("common.edit")}
                        </Button>
                        <Button onClick={onDelete} variant={"outline"} size='sm'>
                            {t("common.delete")}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );

};

export default CustomerCard;