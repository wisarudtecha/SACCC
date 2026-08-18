"use client";
import React, { useMemo, memo, useCallback } from 'react';
import DatePicker, { registerLocale, DatePickerProps } from 'react-datepicker';
import { th, enUS } from 'date-fns/locale';
import "react-datepicker/dist/react-datepicker.css";

registerLocale("th", th);
registerLocale("en", enUS);

interface DatePickerLocalProps extends Omit<DatePickerProps, 'onChange'> {
  selected?: Date | null;
  startDate?: Date | null;
  endDate?: Date | null;
  onChange: (date: any) => void;
  enableSelectStartAndEndDate?: boolean;
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

const DatePickerLocal: React.FC<DatePickerLocalProps> = memo((props) => {
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
    enableSelectStartAndEndDate,
    startDate,
    endDate
  } = props;

  const monthNames = useMemo(() => {
    return language === 'th'
      ? ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
      : ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
  }, [language]);


  const CustomBEInput = useCallback(({ value, onClick }: any) => {
    let displayValue = '';

    if (enableSelectStartAndEndDate && language === 'th' && startDate) {
      const startYear = getDisplayYear(startDate, 'th');
      const startDay = startDate.getDate();
      const startMonth = startDate.getMonth();
      const startDatePart = `${String(startDay).padStart(2, '0')}/${String(startMonth + 1).padStart(2, '0')}/${startYear}`;

      let endDatePart = '';
      if (endDate) {
        const endYear = getDisplayYear(endDate, 'th');
        const endDay = endDate.getDate();
        const endMonth = endDate.getMonth();
        endDatePart = ` - ${String(endDay).padStart(2, '0')}/${String(endMonth + 1).padStart(2, '0')}/${endYear}`;
      }

      displayValue = `${startDatePart}${endDatePart}`;

    } else if (selected && language === 'th') {
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
      <div className="relative w-full">
        <input
          value={displayValue}
          onClick={onClick}
          readOnly={true}
          disabled={disabled}
          className={`${className} pr-10`}
          placeholder={placeholderText}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          id={id}
          name={name}
          required={required}
          tabIndex={tabIndex}
          title={title}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    );
  }, [selected, language, showTimeSelect, disabled, className, placeholderText, autoComplete, autoFocus, id, name, required, tabIndex, title, enableSelectStartAndEndDate, startDate, endDate]);

  // Using useCallback for the custom header
  const renderCustomHeader = useCallback(({
    date,
    decreaseMonth,
    increaseMonth,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled,
  }: any) => {
    const displayYear = getDisplayYear(date, language);

    return (
      <div className="flex justify-between items-center px-2 py-2 dark:bg-gray-800 dark:text-gray-200">
        {!prevMonthButtonDisabled ? <button
          onClick={decreaseMonth}
          disabled={prevMonthButtonDisabled}
          type="button"
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button> : <div></div>}

        <div className="flex gap-2">
          <div className='text-md dark:bg-gray-800 dark:text-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500'>
            {monthNames[date.getMonth()] + " " + displayYear}
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
  }, [language, monthNames]);

  if (enableSelectStartAndEndDate) {
    return (
      <DatePicker
        selectsRange={true}
        startDate={startDate}
        endDate={endDate}
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
  }

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
});


DatePickerLocal.displayName = 'DatePickerLocal';

export default DatePickerLocal;