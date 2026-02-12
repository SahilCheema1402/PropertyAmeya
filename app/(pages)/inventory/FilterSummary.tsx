import React from 'react';
import { FaTimes, FaFilter, FaDownload } from 'react-icons/fa';
import { MdClear } from 'react-icons/md';

interface FilterSummaryProps {
  appliedFilters?: Record<string, any>;
  filtersCount?: number;
  totalRecords?: number;
  showingRecords?: number;
  onClearFilters: () => void;
  onClearSingleFilter: (filterKey: string) => void;
  onExportData?: () => void;
  isLoading?: boolean;
}

const FilterSummary: React.FC<FilterSummaryProps> = ({
  appliedFilters = {},
  filtersCount = 0,
  totalRecords = 0,
  showingRecords = 0,
  onClearFilters,
  onClearSingleFilter,
  onExportData,
  isLoading = false
}) => {
  // Format filter value for display
  const formatFilterValue = (key: string, value: any): string => {
    if (typeof value === 'object' && (value.min || value.max)) {
      const min = value.min ? `₹${value.min}` : 'Min';
      const max = value.max ? `₹${value.max}` : 'Max';
      return `${min} - ${max}`;
    }
    return String(value);
  };

  // Get display name for filter key
  const getFilterDisplayName = (key: string): string => {
    const displayNames: Record<string, string> = {
      project: 'Project',
      unit_no: 'Unit No',
      area: 'Area',
      type: 'Property Type',
      facing: 'Facing',
      inventoryType: 'Inventory Type',
      status: 'Status',
      bhk: 'BHK',
      tower_no: 'Tower No',
      location: 'Location',
      tenant: 'Tenant',
      dimension: 'Dimension',
      parking: 'Parking',
      parking_type: 'Parking Type',
      demand_range: 'Demand Range',
      expected_rent_range: 'Rent Range',
      available_date: 'Available From',
      deal_closing_date: 'Deal Closing Date',
      createAt: 'Created Date'
    };
    return displayNames[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (filtersCount === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-1">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <FaFilter className="text-blue-600" />
          <div>
            <h3 className="font-semibold text-gray-800">
              Active Filters ({filtersCount})
            </h3>
            <p className="text-sm text-gray-600">
              Showing {showingRecords} of {totalRecords} records
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onExportData && (
            <button
              onClick={onExportData}
              disabled={isLoading || showingRecords === 0}
              className="flex items-center gap-2 px-2 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <FaDownload size={12} />
              Export
            </button>
          )}
          
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            <MdClear size={14} />
            Clear All
          </button>
        </div>
      </div>

      {/* Filter Tags */}
      <div className="p-1">
        <div className="flex flex-wrap gap-2">
          {Object.entries(appliedFilters).map(([key, value]) => (
            <div
              key={key}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              <span className="font-medium">
                {getFilterDisplayName(key)}:
              </span>
              <span className="truncate max-w-32">
                {formatFilterValue(key, value)}
              </span>
              <button
                onClick={() => onClearSingleFilter(key)}
                className="ml-1 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <FaTimes size={10} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Results Summary */}
      {showingRecords > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 rounded-b-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {showingRecords === totalRecords 
                ? `All ${totalRecords} records match your filters`
                : `${showingRecords} of ${totalRecords} records match your filters`
              }
            </span>
            
            {showingRecords !== totalRecords && (
              <span className="text-blue-600 font-medium">
                {((showingRecords / totalRecords) * 100).toFixed(1)}% match rate
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterSummary;