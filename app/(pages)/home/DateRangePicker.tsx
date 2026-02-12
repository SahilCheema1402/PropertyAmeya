import { useRef, useEffect } from "react";
import { DateRange } from "react-date-range";
import { Calendar, ChevronDown } from "lucide-react";

const DateRangePicker = ({ dateRange, onChange, showPicker, onToggle, onApply }: any) => {
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        onToggle(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onToggle]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get display text for the button
  const getDisplayText = () => {
    if (!dateRange?.startDate || !dateRange?.endDate) {
      return "Select Date";
    }

    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    
    // Check if it's the same date (single day selection)
    const isSameDate = startDate.toDateString() === endDate.toDateString();
    
    if (isSameDate) {
      return formatDate(dateRange.startDate);
    } else {
      return `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`;
    }
  };

  // Check if today is selected
  const isToday = () => {
    if (!dateRange?.startDate || !dateRange?.endDate) return false;
    
    const today = new Date();
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    
    const isTodayStart = today.toDateString() === startDate.toDateString();
    const isTodayEnd = today.toDateString() === endDate.toDateString();
    
    return isTodayStart && isTodayEnd;
  };

  // Check if a date/range is selected
  const hasSelection = dateRange?.startDate && dateRange?.endDate;

  // Quick preset buttons
  const quickPresets = [
    {
      label: 'Today',
      getValue: () => {
        const today = new Date();
        return {
          startDate: today.toISOString(),
          endDate: today.toISOString()
        };
      }
    },
    {
      label: 'Yesterday',
      getValue: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          startDate: yesterday.toISOString(),
          endDate: yesterday.toISOString()
        };
      }
    },
    {
      label: 'Last 7 Days',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 6);
        return {
          startDate: start.toISOString(),
          endDate: end.toISOString()
        };
      }
    },
    {
      label: 'This Month',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          startDate: start.toISOString(),
          endDate: end.toISOString()
        };
      }
    }
  ];

  const handlePresetClick = (preset: any) => {
    const newDateRange = preset.getValue();
    onChange(newDateRange);
  };

  return (
    <div className="relative">
      <button
        onClick={() => onToggle(!showPicker)}
        className={`flex items-center justify-between space-x-2 px-4 py-2 rounded-lg transition-all duration-200 border min-w-[200px] group ${
          hasSelection
            ? isToday()
              ? 'bg-green-50 hover:bg-green-100 border-green-200 text-green-800'
              : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800'
            : 'bg-indigo-50 hover:bg-pink-100 border-pink-200 text-pink-800 group-hover:text-indigo-900'
        }`}
      >
        <div className="flex items-center space-x-2">
          <Calendar size={16} className={hasSelection ? (isToday() ? 'text-green-600' : 'text-blue-600') : 'text-pink-600 group-hover:text-indigo-600'} />
          <span className="font-medium text-sm">
            {getDisplayText()}
          </span>
        </div>
        <ChevronDown 
          size={16} 
          className={`transition-transform duration-200 ${showPicker ? 'rotate-180' : ''} ${
            hasSelection ? (isToday() ? 'text-green-500' : 'text-blue-500') : 'text-pink-500 group-hover:text-indigo-500'
          }`} 
        />
      </button>

      {/* Clear Selection Button (only show when date is selected) */}
      {hasSelection && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onChange({
              startDate: new Date().toISOString(),
              endDate: new Date().toISOString()
            });
          }}
          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs transition-colors z-10"
          title="Clear selection"
        >
          ×
        </button>
      )}

      {showPicker && (
        <div
          ref={calendarRef}
          className="absolute top-full right-0 mt-2 z-[9999] bg-white rounded-xl shadow-2xl border border-gray-200 max-h-[80vh] overflow-y-auto w-auto min-w-[350px] max-w-[90vw]"
        >
          {/* Quick Presets */}
          <div className="p-3 border-b border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Select</h4>
            <div className="grid grid-cols-2 gap-1.5">
              {quickPresets.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => handlePresetClick(preset)}
                  className="px-2 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 rounded-md transition-colors text-gray-700 hover:text-gray-900 whitespace-nowrap"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Picker */}
          <div className="p-2 overflow-x-auto">
            <div className="min-w-[320px]">
              <DateRange
                editableDateInputs={true}
                onChange={(item: any) => onChange({
                  startDate: item.selection.startDate.toISOString(),
                  endDate: item.selection.endDate.toISOString(),
                })}
                moveRangeOnFirstSelection={false}
                ranges={[{
                  startDate: new Date(dateRange.startDate),
                  endDate: new Date(dateRange.endDate),
                  key: "selection",
                }]}
                rangeColors={['#ec4899']}
                className="!font-sans"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 bg-gray-50 border-t border-gray-100">
            <div className="text-xs text-gray-500 flex-1">
              {hasSelection && (
                <span className="block sm:inline">
                  Selected: <strong className="text-gray-700">{getDisplayText()}</strong>
                </span>
              )}
            </div>
            <div className="flex space-x-2 w-full sm:w-auto">
              <button
                onClick={() => onToggle(false)}
                className="flex-1 sm:flex-none px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={onApply}
                className="flex-1 sm:flex-none px-3 py-1.5 text-sm bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-700 hover:to-indigo-700 text-white rounded-lg transition-all"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;