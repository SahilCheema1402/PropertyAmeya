// import React, { useState, useEffect } from 'react';
// import { FaFilter, FaTimes, FaSearch, FaTrash } from 'react-icons/fa';
// import { MdClear } from 'react-icons/md';

// interface FilterUIProps {
//   setMultiFilter: (value: boolean) => void;
//   multiFilter: boolean;
//   setSearchMulti: (value: string) => void;
//   selectedFilters: string[];
//   setSelectedFilters: (value: string[]) => void;
//   appliedFilters: Record<string, any>;
//   setAppliedFilters: (value: Record<string, any>) => void;
//   pageType: string;
// }

// interface FilterField {
//   key: string;
//   label: string;
//   type: 'text' | 'select' | 'number' | 'date' | 'range';
//   options?: string[];
//   placeholder?: string;
// }

// const FilterUI: React.FC<FilterUIProps> = ({
//   setMultiFilter,
//   multiFilter,
//   setSearchMulti,
//   selectedFilters,
//   setSelectedFilters,
//   appliedFilters,
//   setAppliedFilters,
//   pageType
// }) => {
//   // const [filters, setFilters] = useState<Record<string, any>>({});
//    const [filters, setFilters] = useState<Record<string, any>>({});
//   const [activeFilters, setActiveFilters] = useState<string[]>([]);
//     useEffect(() => {
//     setFilters(appliedFilters);
//   }, [appliedFilters]);
//   // Define filter fields for inventory
//   const filterFields: FilterField[] = [
//     { key: 'project', label: 'Project', type: 'text', placeholder: 'Enter project name' },
//     { key: 'unit_no', label: 'Unit Number', type: 'text', placeholder: 'Enter unit number' },
//     { key: 'area', label: 'Size', type: 'text', placeholder: 'Enter area' },
//     // { key: 'type', label: 'Property Type', type: 'select', options: ['residential', 'Commercial', 'Plot', 'Villa', 'Apartment', 'Office', 'Shop', 'Warehouse'] },
//     { 
//         key: 'bhk', 
//         label: 'Property Type', 
//         type: 'select', 
//         options: [
//             '2 BHK', 
//             '2BHK + Study', 
//             '3 BHK', 
//             '3BHK + Study', 
//             '3BHK + Servant', 
//             '3BHK + Store', 
//             '4 BHK', 
//             '4 BHK + Study', 
//             '4BHK + Servant', 
//             '4 BHK + Store',
//             'Office Space',
//             'Studio App',
//             'Society Shop',
//             'Retail Shop',
//             'Industrial land',
//             'Commercial land'
//         ],
//         placeholder: 'Select property type'
//     },
//     { key: 'facing', label: 'Facing', type: 'text', placeholder: 'e.g., North' },
//     { key: 'inventoryType', label: 'Inventory Type', type: 'select', options: ['Rent Residential', 'Resale Residential', 'Rent Commercial', 'Resale Commercial'] },
//     { key: 'status', label: 'Status', type: 'select', options: ['Available', 'Done By Other', 'Plan Drop Out', 'Deal Done'] },
//     // { key: 'bhk', label: 'BHK', type: 'select', options: ['1 BHK', '2 BHK', '3 BHK', '4 BHK', '5 BHK+', 'Studio', 'Office Space'] },
//     { key: 'demand', label: 'Demand (₹)', type: 'range', placeholder: 'Min - Max price' }, //commercial
//     { key: 'expected_rent', label: 'Expected Rent (₹)', type: 'range', placeholder: 'Min - Max rent' }, //residental
//     { key: 'tower_no', label: 'Tower Number', type: 'text', placeholder: 'Enter tower number' },
//     { key: 'location', label: 'Location', type: 'text', placeholder: 'Enter location' },
//     { key: 'tenant', label: 'Tenant', type: 'select', options: ['Yes', 'No'] },
//     { key: 'available_date', label: 'Available From', type: 'date' },
//     { key: 'deal_closing_date', label: 'Deal Closing Date', type: 'date' },
//     { key: 'createAt', label: 'Created Date', type: 'date' },
//     { key: 'dimension', label: 'Dimension', type: 'text', placeholder: 'e.g., 1000 sq ft' },
//     { key: 'parking', label: 'Parking', type: 'select', options: ['Yes', 'No'] },
//     { key: 'parking_type', label: 'Parking Type', type: 'select', options: ['Covered', 'Open', 'Stilt'] }
//   ];

//   useEffect(() => {
//     if (multiFilter) {
//       console.log('Modal opened, restoring filters:', appliedFilters);
//       console.log('Selected filters:', selectedFilters);
      
//       // Convert applied filters format to internal format
//       const convertedFilters: Record<string, any> = {};
//       const derivedActiveFilters: string[] = [];
      
//       Object.entries(appliedFilters || {}).forEach(([key, value]) => {
//         if (key.includes('_range')) {
//           // Handle range filters like "demand_range" -> "demand"
//           const baseKey = key.replace('_range', '');
//           if (value && typeof value === 'object' && (value.min || value.max)) {
//             convertedFilters[baseKey] = {
//               min: value.min || '',
//               max: value.max || ''
//             };
//             derivedActiveFilters.push(baseKey);
//           }
//         } else if (key.includes('_min') || key.includes('_max')) {
//           // Handle separate min/max parameters
//           const baseKey = key.replace(/_min|_max/, '');
//           if (!convertedFilters[baseKey]) {
//             convertedFilters[baseKey] = {};
//           }
          
//           if (key.includes('_min')) {
//             convertedFilters[baseKey].min = value || '';
//           } else {
//             convertedFilters[baseKey].max = value || '';
//           }
          
//           if (!derivedActiveFilters.includes(baseKey)) {
//             derivedActiveFilters.push(baseKey);
//           }
//         } else {
//           // Handle regular filters
//           if (value && value !== '') {
//             convertedFilters[key] = value;
//             derivedActiveFilters.push(key);
//           }
//         }
//       });
      
//       console.log('Converted filters:', convertedFilters);
//       console.log('Derived active filters:', derivedActiveFilters);
      
//       // Restore filters
//       setFilters(convertedFilters);
      
//       // Restore active filters - use selectedFilters if available, otherwise use derived
//       if (selectedFilters && selectedFilters.length > 0) {
//         setActiveFilters(selectedFilters);
//       } else {
//         setActiveFilters(derivedActiveFilters);
//       }
//     }
//   }, [multiFilter, appliedFilters, selectedFilters]);

//   // Initialize filters from selected filters
//   useEffect(() => {
//     if (selectedFilters.length > 0) {
//       setActiveFilters(selectedFilters);
//     }
//   }, [selectedFilters]);

//   // Handle filter input changes
//   const handleFilterChange = (key: string, value: any) => {
//     console.log(`Filter changed: ${key} = ${value}`);
//     setFilters(prev => ({
//       ...prev,
//       [key]: value
//     }));
//   };

//   const handleRangeChange = (key: string, type: 'min' | 'max', value: string) => {
//     // Only allow numeric input
//     const numericValue = value.replace(/[^0-9.]/g, '');
    
//     console.log(`Range changed: ${key}.${type} = ${numericValue}`);
    
//     setFilters(prev => ({
//       ...prev,
//       [key]: {
//         ...prev[key],
//         [type]: numericValue
//       }
//     }));
//   };

//   // Add filter to active filters
//   const addFilter = (filterKey: string) => {
//     if (!activeFilters.includes(filterKey)) {
//       setActiveFilters(prev => [...prev, filterKey]);
//     }
//   };

//   // Remove filter from active filters
//   const removeFilter = (filterKey: string) => {
//     setActiveFilters(prev => prev.filter(f => f !== filterKey));
//     setFilters(prev => {
//       const newFilters = { ...prev };
//       delete newFilters[filterKey];
//       return newFilters;
//     });
//   };

//   // Clear all filters
//   const clearAllFilters = () => {
//     setActiveFilters([]);
//     setFilters({});
//   };

//   const applyFilters = () => {
//     let queryString = 'inventoryMultiFilter?company=672876351633b41e68d7c51e';
//     setAppliedFilters(filters);
    
//     Object.entries(filters).forEach(([key, value]) => {
//       if (value !== undefined && value !== null && value !== '') {
//         if (typeof value === 'object' && (value.min !== undefined || value.max !== undefined)) {
//           // Handle range filters - ensure numeric values
//           if (value.min && value.min !== '') {
//             const minValue = parseFloat(value.min);
//             if (!isNaN(minValue)) {
//               queryString += `&${key}_min=${encodeURIComponent(minValue)}`;
//             }
//           }
//           if (value.max && value.max !== '') {
//             const maxValue = parseFloat(value.max);
//             if (!isNaN(maxValue)) {
//               queryString += `&${key}_max=${encodeURIComponent(maxValue)}`;
//             }
//           }
//         } else {
//           queryString += `&${key}=${encodeURIComponent(value)}`;
//         }
//       }
//     });

//     console.log('Applying filters:', queryString);
//     console.log('Filters object:', filters);
//     console.log('Active filters:', activeFilters);
    
//     setSearchMulti(queryString);
//     setSelectedFilters(activeFilters);
//     setMultiFilter(false);
//   };

//   // Get filter field by key
//   const getFilterField = (key: string) => {
//     return filterFields.find(field => field.key === key);
//   };

//   // Check if filter has value
//   const hasFilterValue = (field: FilterField) => {
//     const value = filters[field.key];
//     if (field.type === 'range') {
//       return value?.min || value?.max;
//     }
//     return value && value !== '';
//   };

//   // Get active filters count with values
//   const activeFiltersWithValues = activeFilters.filter(key => {
//     const field = getFilterField(key);
//     return field && hasFilterValue(field);
//   });

//   // Render filter input based on type
//   const renderFilterInput = (field: FilterField) => {
//     const value = filters[field.key] || '';

//     switch (field.type) {
//       case 'select':
//         return (
//           <select
//             value={value}
//             onChange={(e) => handleFilterChange(field.key, e.target.value)}
//             className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
//           >
//             <option value="">Select {field.label}</option>
//             {field.options?.map(option => (
//               <option key={option} value={option}>{option}</option>
//             ))}
//           </select>
//         );

//       case 'range':
//         return (
//           <div className="flex gap-2">
//             <input
//               type="number"
//               placeholder="Min"
//               value={value?.min || ''}
//               onChange={(e) => handleRangeChange(field.key, 'min', e.target.value)}
//               className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             />
//             <span className="flex items-center text-gray-500">-</span>
//             <input
//               type="number"
//               placeholder="Max"
//               value={value?.max || ''}
//               onChange={(e) => handleRangeChange(field.key, 'max', e.target.value)}
//               className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             />
//           </div>
//         );

//       case 'date':
//         return (
//           <input
//             type="date"
//             value={value}
//             onChange={(e) => handleFilterChange(field.key, e.target.value)}
//             className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           />
//         );

//       default: // text and number
//         return (
//           <input
//             type={field.type}
//             placeholder={field.placeholder}
//             value={value}
//             onChange={(e) => handleFilterChange(field.key, e.target.value)}
//             className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           />
//         );
//     }
//   };

//   if (!multiFilter) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
//         {/* Header */}
//         <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
//           <div className="flex justify-between items-center">
//             <div className="flex items-center gap-3">
//               <FaFilter className="text-xl" />
//               <h2 className="text-2xl font-bold">Advanced Filters</h2>
//             </div>
//             <button
//               onClick={() => setMultiFilter(false)}
//               className="text-white hover:text-gray-200 transition-colors"
//             >
//               <FaTimes size={24} />
//             </button>
//           </div>
          
//           {/* Active filters count */}
//           {activeFilters.length > 0 && (
//             <div className="mt-3 flex items-center gap-4">
//               <div className="text-sm opacity-90">
//                 {activeFilters.length} filter{activeFilters.length > 1 ? 's' : ''} selected
//               </div>
//               {activeFiltersWithValues.length > 0 && (
//                 <div className="text-sm bg-white/20 px-3 py-1 rounded-full">
//                   {activeFiltersWithValues.length} with values
//                 </div>
//               )}
//             </div>
//           )}
//         </div>

//         {/* Content */}
//         <div className="flex h-[calc(90vh-180px)]">
//           {/* Available Filters Sidebar */}
//           <div className="w-1/3 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
//             <h3 className="text-lg font-semibold mb-4 text-gray-700">Available Filters</h3>
//             <div className="space-y-2">
//               {filterFields.map(field => (
//                 <button
//                   key={field.key}
//                   onClick={() => addFilter(field.key)}
//                   disabled={activeFilters.includes(field.key)}
//                   className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
//                     activeFilters.includes(field.key)
//                       ? 'bg-blue-100 border-blue-300 text-blue-700 cursor-not-allowed'
//                       : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm'
//                   }`}
//                 >
//                   <div className="font-medium">{field.label}</div>
//                   <div className="text-sm text-gray-500 capitalize">{field.type}</div>
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Active Filters Content */}
//           <div className="flex-1 p-6 overflow-y-auto">
//             {activeFilters.length === 0 ? (
//               <div className="flex flex-col items-center justify-center h-full text-gray-500">
//                 <FaSearch size={48} className="mb-4 opacity-30" />
//                 <h3 className="text-xl font-medium mb-2">No Filters Selected</h3>
//                 <p className="text-center max-w-md">Click on filters from the left sidebar to start filtering your inventory. You can combine multiple filters for more precise results.</p>
//               </div>
//             ) : (
//               <div className="space-y-6">
//                 <div className="flex justify-between items-center">
//                   <h3 className="text-lg font-semibold text-gray-700">
//                     Active Filters ({activeFilters.length})
//                   </h3>
//                   <button
//                     onClick={clearAllFilters}
//                     className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//                   >
//                     <MdClear />
//                     Clear All
//                   </button>
//                 </div>

//                 {activeFilters.map(filterKey => {
//                   const field = getFilterField(filterKey);
//                   if (!field) return null;

//                   return (
//                     <div key={filterKey} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
//                       <div className="flex justify-between items-center mb-3">
//                         <label className="text-sm font-medium text-gray-700">
//                           {field.label}
//                         </label>
//                         <button
//                           onClick={() => removeFilter(filterKey)}
//                           className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
//                         >
//                           <FaTrash size={14} />
//                         </button>
//                       </div>
//                       {renderFilterInput(field)}
//                     </div>
//                   );
//                 })}
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="border-t border-gray-200 p-6 bg-gray-50">
//           <div className="flex justify-between items-center">
//             <div className="text-sm text-gray-600">
//               {activeFiltersWithValues.length > 0 && (
//                 <span>{activeFiltersWithValues.length} filter{activeFiltersWithValues.length > 1 ? 's' : ''} ready to apply</span>
//               )}
//             </div>
//             <div className="flex gap-4">
//               <button
//                 onClick={() => setMultiFilter(false)}
//                 className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={applyFilters}
//                 disabled={activeFiltersWithValues.length === 0}
//                 className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
//               >
//                 <FaFilter size={14} />
//                 Apply Filters {activeFiltersWithValues.length > 0 && `(${activeFiltersWithValues.length})`}
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default FilterUI;

import React, { useState, useEffect } from 'react';
import { FaFilter, FaTimes, FaSearch, FaTrash } from 'react-icons/fa';
import { MdClear } from 'react-icons/md';

interface FilterUIProps {
  setMultiFilter: (value: boolean) => void;
  multiFilter: boolean;
  setSearchMulti: (value: string) => void;
  selectedFilters: string[];
  setSelectedFilters: (value: string[]) => void;
  appliedFilters: Record<string, any>;
  setAppliedFilters: (value: Record<string, any>) => void;
  pageType: string;
}

interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'number' | 'date' | 'range';
  options?: string[];
  placeholder?: string;
}

const FilterUI: React.FC<FilterUIProps> = ({
  setMultiFilter,
  multiFilter,
  setSearchMulti,
  selectedFilters,
  setSelectedFilters,
  appliedFilters,
  setAppliedFilters,
  pageType
}) => {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Define filter fields for inventory
  const filterFields: FilterField[] = [
    { key: 'project', label: 'Project', type: 'text', placeholder: 'Enter project name' },
    { key: 'unit_no', label: 'Unit Number', type: 'text', placeholder: 'Enter unit number' },
    { key: 'area', label: 'Size', type: 'text', placeholder: 'Enter area' },
    { 
        key: 'bhk', 
        label: 'Property Type', 
        type: 'select', 
        options: [
            '2 BHK', 
            '2BHK + Study', 
            '3 BHK', 
            '3BHK + Study', 
            '3BHK + Servant', 
            '3BHK + Store', 
            '4 BHK', 
            '4 BHK + Study', 
            '4BHK + Servant', 
            '4 BHK + Store',
            'Office Space',
            'Studio App',
            'Society Shop',
            'Retail Shop',
            'Industrial land',
            'Commercial land'
        ],
        placeholder: 'Select property type'
    },
    { key: 'facing', label: 'Facing', type: 'text', placeholder: 'e.g., North' },
    { key: 'inventoryType', label: 'Inventory Type', type: 'select', options: ['Rent Residential', 'Resale Residential', 'Rent Commercial', 'Resale Commercial'] },
    { key: 'status', label: 'Status', type: 'select', options: ['Available', 'Done By Other', 'Plan Drop Out', 'Deal Done'] },
    { key: 'demand', label: 'Demand (₹)', type: 'range', placeholder: 'Min - Max price' },
    { key: 'expected_rent', label: 'Expected Rent (₹)', type: 'range', placeholder: 'Min - Max rent' },
    { key: 'tower_no', label: 'Tower Number', type: 'text', placeholder: 'Enter tower number' },
    { key: 'location', label: 'Location', type: 'text', placeholder: 'Enter location' },
    { key: 'tenant', label: 'Tenant', type: 'select', options: ['Yes', 'No'] },
    { key: 'available_date', label: 'Available From', type: 'date' },
    { key: 'deal_closing_date', label: 'Deal Closing Date', type: 'date' },
    { key: 'createAt', label: 'Created Date', type: 'date' },
    { key: 'dimension', label: 'Dimension', type: 'text', placeholder: 'e.g., 1000 sq ft' },
    { key: 'parking', label: 'Parking', type: 'select', options: ['Yes', 'No'] },
    { key: 'parking_type', label: 'Parking Type', type: 'select', options: ['Covered', 'Open', 'Stilt'] }
  ];

  // Initialize filters and active filters from props when modal opens
  useEffect(() => {
    if (multiFilter) {
      console.log('Modal opened, restoring filters:', appliedFilters);
      console.log('Selected filters:', selectedFilters);
      
      // Convert applied filters format to internal format
      const convertedFilters: Record<string, any> = {};
      const derivedActiveFilters: string[] = [];
      
      Object.entries(appliedFilters || {}).forEach(([key, value]) => {
        if (key.includes('_range')) {
          // Handle range filters like "demand_range" -> "demand"
          const baseKey = key.replace('_range', '');
          if (value && typeof value === 'object' && (value.min || value.max)) {
            convertedFilters[baseKey] = {
              min: value.min || '',
              max: value.max || ''
            };
            derivedActiveFilters.push(baseKey);
          }
        } else if (key.includes('_min') || key.includes('_max')) {
          // Handle separate min/max parameters
          const baseKey = key.replace(/_min|_max/, '');
          if (!convertedFilters[baseKey]) {
            convertedFilters[baseKey] = {};
          }
          
          if (key.includes('_min')) {
            convertedFilters[baseKey].min = value || '';
          } else {
            convertedFilters[baseKey].max = value || '';
          }
          
          if (!derivedActiveFilters.includes(baseKey)) {
            derivedActiveFilters.push(baseKey);
          }
        } else {
          // Handle regular filters
          if (value && value !== '') {
            convertedFilters[key] = value;
            derivedActiveFilters.push(key);
          }
        }
      });
      
      console.log('Converted filters:', convertedFilters);
      console.log('Derived active filters:', derivedActiveFilters);
      
      // Restore filters
      setFilters(convertedFilters);
      
      // Restore active filters - use selectedFilters if available, otherwise use derived
      if (selectedFilters && selectedFilters.length > 0) {
        setActiveFilters(selectedFilters);
      } else {
        setActiveFilters(derivedActiveFilters);
      }
    }
  }, [multiFilter, appliedFilters, selectedFilters]);

  // Handle filter input changes
  const handleFilterChange = (key: string, value: any) => {
    console.log(`Filter changed: ${key} = ${value}`);
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleRangeChange = (key: string, type: 'min' | 'max', value: string) => {
    // Only allow numeric input
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    console.log(`Range changed: ${key}.${type} = ${numericValue}`);
    
    setFilters(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [type]: numericValue
      }
    }));
  };

  // Add filter to active filters
  const addFilter = (filterKey: string) => {
    if (!activeFilters.includes(filterKey)) {
      console.log(`Adding filter: ${filterKey}`);
      setActiveFilters(prev => [...prev, filterKey]);
    }
  };

  // Remove filter from active filters
  const removeFilter = (filterKey: string) => {
    console.log(`Removing filter: ${filterKey}`);
    setActiveFilters(prev => prev.filter(f => f !== filterKey));
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[filterKey];
      return newFilters;
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    console.log('Clearing all filters');
    setActiveFilters([]);
    setFilters({});
  };

  // Apply filters
  const applyFilters = () => {
    let queryString = 'inventoryMultiFilter?company=672876351633b41e68d7c51e';
    setAppliedFilters(filters);
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'object' && (value.min !== undefined || value.max !== undefined)) {
          // Handle range filters - ensure numeric values
          if (value.min && value.min !== '') {
            const minValue = parseFloat(value.min);
            if (!isNaN(minValue)) {
              queryString += `&${key}_min=${encodeURIComponent(minValue)}`;
            }
          }
          if (value.max && value.max !== '') {
            const maxValue = parseFloat(value.max);
            if (!isNaN(maxValue)) {
              queryString += `&${key}_max=${encodeURIComponent(maxValue)}`;
            }
          }
        } else {
          queryString += `&${key}=${encodeURIComponent(value)}`;
        }
      }
    });

    console.log('Applying filters:', queryString);
    console.log('Filters object:', filters);
    console.log('Active filters:', activeFilters);
    
    setSearchMulti(queryString);
    setSelectedFilters(activeFilters);
    setMultiFilter(false);
  };

  // Get filter field by key
  const getFilterField = (key: string) => {
    return filterFields.find(field => field.key === key);
  };

  // Check if filter has value
  const hasFilterValue = (field: FilterField) => {
    const value = filters[field.key];
    if (field.type === 'range') {
      return value?.min || value?.max;
    }
    return value && value !== '';
  };

  // Get active filters count with values
  const activeFiltersWithValues = activeFilters.filter(key => {
    const field = getFilterField(key);
    return field && hasFilterValue(field);
  });

  // Render filter input based on type
  const renderFilterInput = (field: FilterField) => {
    const value = filters[field.key] || (field.type === 'range' ? {} : '');

    switch (field.type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFilterChange(field.key, e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">Select {field.label}</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'range':
        return (
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={value?.min || ''}
              onChange={(e) => handleRangeChange(field.key, 'min', e.target.value)}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="flex items-center text-gray-500">-</span>
            <input
              type="number"
              placeholder="Max"
              value={value?.max || ''}
              onChange={(e) => handleRangeChange(field.key, 'max', e.target.value)}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFilterChange(field.key, e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );

      default: // text and number
        return (
          <input
            type={field.type}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleFilterChange(field.key, e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );
    }
  };

  if (!multiFilter) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FaFilter className="text-xl" />
              <h2 className="text-2xl font-bold">Advanced Filters</h2>
            </div>
            <button
              onClick={() => setMultiFilter(false)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <FaTimes size={24} />
            </button>
          </div>
          
          {/* Active filters count */}
          {activeFilters.length > 0 && (
            <div className="mt-3 flex items-center gap-4">
              <div className="text-sm opacity-90">
                {activeFilters.length} filter{activeFilters.length > 1 ? 's' : ''} selected
              </div>
              {activeFiltersWithValues.length > 0 && (
                <div className="text-sm bg-white/20 px-3 py-1 rounded-full">
                  {activeFiltersWithValues.length} with values
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-180px)]">
          {/* Available Filters Sidebar */}
          <div className="w-1/3 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Available Filters</h3>
            <div className="space-y-2">
              {filterFields.map(field => (
                <button
                  key={field.key}
                  onClick={() => addFilter(field.key)}
                  disabled={activeFilters.includes(field.key)}
                  className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                    activeFilters.includes(field.key)
                      ? 'bg-blue-100 border-blue-300 text-blue-700 cursor-not-allowed'
                      : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm'
                  }`}
                >
                  <div className="font-medium">{field.label}</div>
                  <div className="text-sm text-gray-500 capitalize">{field.type}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Filters Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeFilters.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <FaSearch size={48} className="mb-4 opacity-30" />
                <h3 className="text-xl font-medium mb-2">No Filters Selected</h3>
                <p className="text-center max-w-md">Click on filters from the left sidebar to start filtering your inventory. You can combine multiple filters for more precise results.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Active Filters ({activeFilters.length})
                  </h3>
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <MdClear />
                    Clear All
                  </button>
                </div>

                {activeFilters.map(filterKey => {
                  const field = getFilterField(filterKey);
                  if (!field) return null;

                  return (
                    <div key={filterKey} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-sm font-medium text-gray-700">
                          {field.label}
                        </label>
                        <button
                          onClick={() => removeFilter(filterKey)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                      {renderFilterInput(field)}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {activeFiltersWithValues.length > 0 && (
                <span>{activeFiltersWithValues.length} filter{activeFiltersWithValues.length > 1 ? 's' : ''} ready to apply</span>
              )}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setMultiFilter(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={applyFilters}
                disabled={activeFiltersWithValues.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <FaFilter size={14} />
                Apply Filters {activeFiltersWithValues.length > 0 && `(${activeFiltersWithValues.length})`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterUI;