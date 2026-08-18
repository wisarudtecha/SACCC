"use client";
import React, { useMemo } from 'react';
import DatePicker, { registerLocale, DatePickerProps } from 'react-datepicker';
import { th, enUS } from 'date-fns/locale';
import "react-datepicker/dist/react-datepicker.css";

registerLocale("th", th);
registerLocale("en", enUS);

interface DatePickerLocalProps extends Omit<DatePickerProps, 'onChange'> {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  language: string;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
  showTimeSelect?: boolean;
  dateFormat?: string;
  placeholderText?: string;
  calendarClassName?: string;
  wrapperClassName?: string;
  popperClassName?: string;
}

export const getDisplayYear = (date: Date, language: string): number => {
  return language === 'th' ? date.getFullYear() + 543 : date.getFullYear();
};

const DatePickerLocal: React.FC<DatePickerLocalProps> = (props) => {
  const {
    selected,
    onChange,
    language,
    className = "",
    showTimeSelect = false,
    dateFormat = "P",
    placeholderText = "Select date",
    calendarClassName = "dark-theme-datepicker",
    disabled,
    autoComplete,
    autoFocus,
    id,
    name,
    required,
    tabIndex,
    title,
  } = props;

  const monthNames = useMemo(() => {
    return language === 'th'
      ? ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
      : ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
  }, [language]);

  const CustomBEInput = (({ value, onClick }: any) => {
    
    let displayValue = '';

    if (selected && language === 'th') {
      const year = getDisplayYear(selected, 'th');
      const month = selected.getMonth();
      const day = selected.getDate();
      const hours = String(selected.getHours()).padStart(2, '0');
      const minutes = String(selected.getMinutes()).padStart(2, '0');
      const datePart = `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;

      displayValue = showTimeSelect ? `${datePart} ${hours}:${minutes}` : datePart;
    } else if (value) {
      displayValue = value;
    }

    return (
      <input
        value={displayValue}
        onClick={onClick}
        readOnly={true}
        disabled={disabled}
        className={className}
        placeholder={placeholderText}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        id={id}
        name={name}
        required={required}
        tabIndex={tabIndex}
        title={title}
      />
    );
  });

  const renderCustomHeader = ({
    date,
    decreaseMonth,
    increaseMonth,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled,
  }: any) => {
    const displayYear = getDisplayYear(date, language);

    return (
      <div className="flex justify-between items-center px-2 py-2 dark:bg-gray-800 dark:text-gray-200">
        {!prevMonthButtonDisabled ?<button
          onClick={decreaseMonth}
          disabled={prevMonthButtonDisabled}
          type="button"
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>:<div></div>}

        <div className="flex gap-2">
          <div className='text-md dark:bg-gray-800 dark:text-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500'>
            { monthNames[date.getMonth()]+" "+displayYear}
          </div>
        </div>

        <button
          onClick={increaseMonth}
          disabled={nextMonthButtonDisabled}
          type="button"
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  };


  return (
    <DatePicker
      selected={selected}
      onChange={onChange} 
      locale={language === 'th' ? 'th' : 'en'}
      dateFormat={dateFormat} 
      showTimeSelect={showTimeSelect}
      customInput={<CustomBEInput />}
      renderCustomHeader={language === 'th' ? renderCustomHeader : undefined}
      placeholderText={placeholderText}
      minDate={props.minDate}
      maxDate={props.maxDate}
      calendarClassName={calendarClassName}
      wrapperClassName={props.wrapperClassName}
      popperClassName={props.popperClassName}
    />
  );
};

export default DatePickerLocal;