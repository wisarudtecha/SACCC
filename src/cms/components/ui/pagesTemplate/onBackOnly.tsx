
import { ArrowLeft } from "lucide-react";
import Button from "@/core/components/ui/button/Button";
import PageMeta from "@/core/components/common/PageMeta";


interface onBackPagesProps {
    onBack: () => void;
    children?: React.ReactNode;
}


export default function OnBackOnly({ children,onBack }: onBackPagesProps) {
    return (
        <div>
            <PageMeta
                title="React.js Blank Dashboard | TailAdmin - Next.js Admin Dashboard Template"
                description="This is React.js Blank Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
            />
            
            <div className="">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="sm" onClick={onBack}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                    
                    </div>
                </div>
            </div>
          

                {children}

        </div>
    );
}
