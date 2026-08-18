import { Eye, EyeClosed } from "lucide-react";
import React from "react";
import { FormLinkWf } from "../interface/FormField";
import Badge from "@/core/components/ui/badge/Badge";
import { useTranslation } from "@/core/hooks/useTranslation";

interface ViewWorkFlowProps {
    workflows: FormLinkWf[];
}

const ViewWorkFlow: React.FC<ViewWorkFlowProps> = ({ workflows }) => {
    const [show, setShow] = React.useState(false);
    const { t } = useTranslation();
    if (!workflows || workflows.length === 0) return null;

    return (
        <div>
            <div className="flex items-center gap-2">
                <Badge size='xxs'>{t("common.used")}{show ? (
                    <EyeClosed 
                        className="w-4 h-4 cursor-pointer" 
                        onClick={() => setShow(false)}
                    />
                ) : (
                    <Eye 
                        className="w-4 h-4 cursor-pointer" 
                        onClick={() => setShow(true)}
                    />
                )}</Badge>
            
            </div>
            
            {show && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {workflows.map((item, index) => (
                        <Badge key={index} size='xxs'>
                            {item.title}
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ViewWorkFlow;