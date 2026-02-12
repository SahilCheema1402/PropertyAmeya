'use client'
import React, { useEffect, useState } from 'react'
import DatePickerC from "react-datepicker";

const DatePicker = ({ name, setValue, clearErrors, value, maxDate, minDate }: any) => {
  const [date_, setDate] = useState<Date | null>(value ? new Date(value) : null);

  useEffect(() => {
    // Initialize with prop value
    if (value) setDate(new Date(value));
  }, [value]);

  const handleChange = (date: Date | null) => {
    const newDate = date ? new Date(date) : null;
    setDate(newDate);
    
    if (newDate) {
      // Set to end of day
      newDate.setHours(23, 59, 59, 999);
      setValue(name, newDate.toISOString());
    } else {
      setValue(name, null);
    }
    clearErrors(name);
  };

  return (
    <div className='flex flex-nowrap flex-1 border-[1px] bg-white px-3 py-[6px] focus-visible:outline-[#004aad] rounded-lg w-full relative text-xs border-[#e2e2e2] dark:bg-slate-600'>
      <DatePickerC 
        selected={date_}
        onChange={handleChange}
        wrapperClassName='w-full z-[1000]' 
        className='w-full focus-visible:outline-none z-[1000] dark:bg-slate-600' 
        popperClassName='z-[1001]' 
        showIcon 
        dateFormat="dd/MM/yyyy"
        placeholderText='dd/mm/yyyy'
        maxDate={maxDate}   // ✅ Disable future dates
        minDate={minDate}   // ✅ Optional: prevent invalid old dates (e.g. 1970)
      />
    </div>
  )
}

export default DatePicker
