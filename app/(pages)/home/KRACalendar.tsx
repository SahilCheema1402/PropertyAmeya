import React, { useState, useEffect } from "react";
import { format, isSameDay, isBefore, startOfMonth, endOfMonth, addMonths, subMonths, getDaysInMonth, getDay, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useG_DailyCallsQuery } from "@app/_api_query/report/report.api";

interface KRACalendarProps {
  staffId: string;
  onDateChange: (date: Date) => void;
  setSelectedDailyData: (data: DailyCallResult | null) => void;
  setShowDailyModal: (show: boolean) => void;
}

interface DailyCallResult {
  date: number;
  fullDate: string;
  callTargetAchieved: boolean;
  calls: number;
  callTarget: number;
}

interface DailyCallsResponse {
  message: string;
  data: {
    month: string;
    userData: {
      userName: string;
      email: string;
    };
    dailyCallTarget: number;
    dailyResults: DailyCallResult[];
  };
}

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CustomKRACalendar = ({
  staffId,
  onDateChange,
  setSelectedDailyData,
  setShowDailyModal,
}: KRACalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));

  // Update currentMonth when currentDate changes
  useEffect(() => {
    const newMonth = format(currentDate, 'yyyy-MM');
    if (newMonth !== currentMonth) {
      setCurrentMonth(newMonth);
    }
  }, [currentDate, currentMonth]);

  // Reset when staffId changes
  useEffect(() => {
    if (staffId) {
      const today = new Date();
      setSelectedDate(today);
      setCurrentDate(today);
      setCurrentMonth(format(today, 'yyyy-MM'));
    }
  }, [staffId]);

  // Fetch data for the current month and staff
  const { data: dailyCallsData, isLoading, isFetching } = useG_DailyCallsQuery({
    month: currentMonth,
    staffId
  }, {
    skip: !staffId,
    refetchOnMountOrArgChange: true,
  }) as { data: DailyCallsResponse | undefined, isLoading: boolean, isFetching: boolean };

  // Generate calendar days
  const generateCalendarDays = () => {
    const firstDayOfMonth = startOfMonth(currentDate);
    const lastDayOfMonth = endOfMonth(currentDate);
    const firstDayWeekday = getDay(firstDayOfMonth); // 0 = Sunday, 1 = Monday, etc.
    const daysInMonth = getDaysInMonth(currentDate);
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      days.push(date);
    }
    
    return days;
  };

  // Handle date click
  const handleDateClick = (date: Date | null) => {
    if (!date) return;
    
    setSelectedDate(date);
    onDateChange(date);

    // Find day data and show modal if exists
    const dayOfMonth = date.getDate();
    const dayData = dailyCallsData?.data?.dailyResults?.find(
      (item: any) => item.date === dayOfMonth
    );

    if (dayData) {
      setSelectedDailyData(dayData);
      setShowDailyModal(true);
    }
  };

  // Handle month navigation
  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  // Get day styling
  const getDayStyle = (date: Date | null) => {
    if (!date) return 'invisible';

    const dayOfMonth = date.getDate();
    const dayData = dailyCallsData?.data?.dailyResults?.find(
      (item: any) => item.date === dayOfMonth
    );
    
    const isToday = isSameDay(date, new Date());
    const isPast = isBefore(date, new Date());
    const targetAchieved = dayData?.callTargetAchieved ?? false;
    const hasData = dayData !== undefined;
    const isSelected = isSameDay(date, selectedDate);

    let baseClasses = 'relative w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-200 text-sm font-medium ';

    if (isLoading || isFetching) {
      baseClasses += 'bg-gray-100 animate-pulse ';
    } else if (hasData) {
      if (targetAchieved) {
        if (isToday) {
          baseClasses += 'bg-green-600 text-white font-bold shadow-md ';
        } else if (isPast) {
          baseClasses += 'bg-green-500 text-white ';
        } else {
          baseClasses += 'bg-green-100 text-green-800 ';
        }
      } else {
        if (isToday) {
          baseClasses += 'bg-red-600 text-white font-bold shadow-md ';
        } else if (isPast) {
          baseClasses += 'bg-red-500 text-white ';
        } else {
          baseClasses += 'bg-red-100 text-red-800 ';
        }
      }
    } else if (isPast) {
      baseClasses += 'bg-gray-300 text-gray-600 opacity-70 ';
    } else {
      baseClasses += 'bg-white text-gray-700 hover:bg-gray-50 ';
    }

    if (isSelected && !isToday) {
      baseClasses += 'ring-2 ring-blue-500 ring-offset-1 ';
    }

    return baseClasses;
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="rounded-xl shadow-sm border border-gray-200 p-4 bg-white">
      <h3 className="text-md font-bold text-gray-700 mb-3 flex items-center gap-2">
        Daily Activity
        {(isLoading || isFetching) && (
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-pink-600"></div>
        )}
        {dailyCallsData?.data?.userData?.userName && (
          <span className="text-sm font-normal text-gray-500">
            - {dailyCallsData.data.userData.userName}
          </span>
        )}
      </h3>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-600"></div>
          <p className="text-gray-500">Loading daily activity...</p>
        </div>
      ) : (
        <>
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <h2 className="text-lg font-semibold text-gray-800">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Weekdays Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="h-8 flex items-center justify-center text-xs font-semibold text-gray-500 uppercase"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {calendarDays.map((date, index) => (
              <div
                key={index}
                className="h-10 flex items-center justify-center"
              >
                {date && (
                  <button
                    onClick={() => handleDateClick(date)}
                    className={getDayStyle(date)}
                  >
                    {date.getDate()}
                    {/* Activity indicator dot */}
                    {dailyCallsData?.data?.dailyResults?.find(
                      (item: any) => item.date === date.getDate()
                    ) && (
                      <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-white opacity-80"></div>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-600"></div>
              <span>Target Achieved</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-600"></div>
              <span>Target Not Met</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
              <span>No Data</span>
            </div>
          </div>
          
          {/* Debug info */}
          <div className="mt-2 text-xs text-gray-400 text-center">
            Month: {currentMonth} | Staff: {staffId?.slice(-4)} | 
            Data: {dailyCallsData?.data?.dailyResults?.length || 0} days
            {isFetching && " | Updating..."}
          </div>
        </>
      )}
    </div>
  );
};

export default CustomKRACalendar;