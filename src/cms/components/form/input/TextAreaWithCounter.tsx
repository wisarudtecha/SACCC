import { useTranslation } from '@/core/hooks/useTranslation';
import { ChangeEvent } from 'react';

interface TextAreaWithCounterProps {
    value: string;
    onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
    maxLength?: number;
    placeholder?: string;
    className?: string;
    rows?: number;
    required?: boolean;
    containnerClass?: string;
    disable?: boolean;
    name?: string
}

const TextAreaWithCounter: React.FC<TextAreaWithCounterProps> = ({
    value,
    onChange,
    maxLength = 500,
    placeholder = "Enter your text here...",
    className = "",
    rows = 6,
    required = false,
    containnerClass = "",
    disable = false,
    name = "",
}) => {
    const { t } = useTranslation();
    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value;
        if (maxLength && newText.length <= maxLength) {
            onChange(e);
        } else if (!maxLength) {
            onChange(e);
        }
    };

    return (
        <div className={`w-full ${containnerClass}`}>
            <div className="relative">
                <textarea
                    name={name}
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className={className}
                    rows={rows}
                    required={required}
                    disabled={disable}
                />
                <div className="flex justify-between items-center mt-2 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                        {t("common.charater")}: <span className="font-semibold text-gray-700 dark:text-gray-300">{value.length}</span>
                        {maxLength && <span className="text-gray-400"> / {maxLength}</span>}
                    </span>
                    {maxLength && (
                        <span className={`font-medium ${value.length >= maxLength ? 'text-red-500' : 'text-gray-400'
                            }`}>
                            {/* {maxLength - value.length} remaining */}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TextAreaWithCounter;