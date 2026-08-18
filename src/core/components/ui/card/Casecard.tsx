import { useState, ReactNode, ReactEventHandler } from "react"; // Import ReactNode for children types
import { MoreHorizontal } from "lucide-react";
import Button from "../button/Button";
import { Dropdown } from "../dropdown/Dropdown";

// Define an interface for your case item data structure


interface CaseCardProps {
    priority_color?: string;
    dropdownChild?: ReactNode; 
    cardChild: ReactNode;
    title ?: string;
    onChick?:ReactEventHandler;
}

export default function Card({ priority_color, dropdownChild, cardChild, title ,onChick}: CaseCardProps) {
    const [isOpen, setIsOpen] = useState(false);

    function toggleDropdown() {
        setIsOpen(!isOpen);
    }

    function closeDropdown() {
        setIsOpen(false);
    }

    return (
        <div className="rounded-lg p-4 mb-3 border border-gray-200 hover:border-gray-300 shadow-sm
                       dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600 transition-colors" onClick={onChick}>
            <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-2">
                    {/* Access caseItem.title with certainty due to typing */}
                    {title}
                </h4>
                <div className="flex items-center space-x-1">
                    <div
                        className={`w-2 h-2 rounded-full ${priority_color}`}
                    ></div>
                    <div className="relative inline-block">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-6 h-6 p-0 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 dropdown-toggle"
                            onClick={toggleDropdown}
                        >
                            <MoreHorizontal className="w-3 h-3" />
                        </Button>
                        <Dropdown
                            isOpen={isOpen}
                            onClose={closeDropdown}
                            className="w-40 p-2"
                        >
                            {dropdownChild}
                        </Dropdown>
                    </div>
                </div>
            </div>

            {cardChild}
        </div>
    );
}