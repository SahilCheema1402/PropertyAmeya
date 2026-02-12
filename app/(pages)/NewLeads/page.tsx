"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import Header from "../../_components/header";
import Sidebar from "../../_components/Sidebar";
import { debounce } from "lodash";
import { useNG_LeadQuery } from "../../_api_query/NewLeads/newlead.api";
import { FaSearch, FaUser, FaCalendarAlt } from "react-icons/fa";
import { useAuth } from "../../_components/useAuth";
import { useDispatch_ } from "@/store";
import { useG_STAFFQuery } from "../../_api_query/staff/staffs.api";
import { toast } from "react-toastify";
import { HierarchyService } from "@app/services/hierarchyService";
import DatePicker from 'react-datepicker';

const NewLeads = React.memo(() => {
    const dispatch = useDispatch_();
    const [search, setSearch] = useState("");
    const [userId, setUserId] = useState<any>("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [role_, setRole] = useState<any>(1);
    const [filteredStaffOptions, setFilteredStaffOptions] = useState<any[]>([]);
    const [token, setToken] = useState("");
    const [user, setUser] = useState("");
    const [searchError, setSearchError] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
    const [viewStaffId, setViewStaffId] = useState<string>("");
    const [currentUserId, setCurrentUserId] = useState<string>("");
    const [userData, setUserData] = useState<any>({});

    const parseDate = (d: string) => (d ? new Date(d) : null);

    // Memoized debounce function
    const debouncedSetSearch = useMemo(
        () => debounce((value: string) => {
            if (value.length <= 50) {
                setSearch(value);
                setPage(1);
                setSearchError("");
            } else {
                setSearchError("Search text is too long. Please shorten your search.");
            }
        }, 300), // Reduced debounce time to 300ms
        []
    );

    useEffect(() => {
        debouncedSetSearch(debouncedSearch);
        return () => {
            debouncedSetSearch.cancel();
        };
    }, [debouncedSearch, debouncedSetSearch]);

    // Initialize user data only once
    useEffect(() => {
        const initializeUserData = () => {
            if (typeof window !== "undefined") {
                const role = localStorage.getItem("role");
                const token = localStorage.getItem("accessToken") || "";
                const user = localStorage.getItem("comUserId") || "";
                const userId = localStorage.getItem("UserId");
                const userData = JSON.parse(localStorage.getItem('user') || '{}');
                
                setToken(token);
                setUser(user);
                setUserId(userId);
                setRole(role ? parseInt(role) : null);
                setUserData(userData);
                setCurrentUserId(userData.userId || "");
            }
        };
        initializeUserData();
    }, []);

    // Optimized query parameters with proper memoization
    const queryParams = useMemo(() => {
        let searchParam = search;
        
        if (viewStaffId) {
            searchParam = `createdBy:${viewStaffId}`;
        }

        return {
            page,
            limit: Math.min(limit, 250), // Cap limit
            search: searchParam,
            startDate: dateRange.startDate ? new Date(dateRange.startDate).toISOString() : '',
            endDate: dateRange.endDate ? new Date(dateRange.endDate).toISOString() : ''
        };
    }, [page, limit, search, viewStaffId, dateRange]);

    // Main data query with optimized options
    const { data, isError, isSuccess, isLoading, error, refetch } = useNG_LeadQuery(
        queryParams,
        { 
            refetchOnMountOrArgChange: 30, // Reduced refetch frequency
            skip: false,
            pollingInterval: 0, // Disable polling for better performance
        }
    );

    // Staff data query with skip optimization
    const { data: Sdata, isError: SisError, isSuccess: SisSuccess, isLoading: SisLoading } = useG_STAFFQuery(
        currentUserId, 
        { 
            refetchOnMountOrArgChange: true,
            skip: !currentUserId || !role_ || (role_ !== 1 && role_ !== 2 && role_ !== 3 && role_ !== 4 && role_ !== 5 && role_ !== 31 && role_ !== 7 && role_ !== 6)
        }
    );

    const { getAuthHeaders } = useAuth();

    // Memoized event handlers
    const handleLimitChange = useCallback((newLimit: number) => {
        if (newLimit > 0 && newLimit <= 250) {
            setLimit(newLimit);
            setPage(1);
        }
    }, []);

    const handlePageChange = useCallback((newPage: number) => {
        if (newPage > 0) {
            setPage(newPage);
        }
    }, []);

    const handleViewStaffChange = useCallback((staffId: string) => {
        setViewStaffId(staffId);
        setPage(1);
        setSearch("");
        setDebouncedSearch("");
    }, []);

    const handleDateRangeChange = useCallback((field: 'startDate' | 'endDate', value: string) => {
        setDateRange(prev => ({ ...prev, [field]: value }));
        setPage(1);
    }, []);

    // Loading skeleton component
    const LoadingSkeleton = () => (
        <div className="space-y-2">
            {Array.from({ length: limit }, (_, index) => (
                <div key={index} className="p-4 rounded-lg mb-3 shadow-sm border-l-4 border-l-gray-300 bg-white animate-pulse">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                            <div>
                                <div className="h-5 bg-gray-300 rounded w-32 mb-2"></div>
                                <div className="h-3 bg-gray-300 rounded w-20"></div>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <div className="h-3 bg-gray-300 rounded w-20 mb-2"></div>
                            <div className="h-5 bg-gray-300 rounded w-28"></div>
                        </div>
                        <div className="flex flex-col">
                            <div className="h-3 bg-gray-300 rounded w-16 mb-2"></div>
                            <div className="h-5 bg-gray-300 rounded w-24"></div>
                        </div>
                        <div className="flex flex-col">
                            <div className="h-3 bg-gray-300 rounded w-16 mb-2"></div>
                            <div className="h-4 bg-gray-300 rounded w-20 mb-1"></div>
                            <div className="h-3 bg-gray-300 rounded w-16"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    // Optimized lead row component with React.memo
    const LeadRow = React.memo(({ lead_, index }: { lead_: any, index: number }) => (
        <div 
            className={`p-4 rounded-lg mb-3 shadow-sm border-l-4 border-l-blue-500 transition-all duration-200 hover:shadow-md ${
                index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
            }`}
        >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FaUser className="text-blue-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 text-lg">{lead_.name}</p>
                        <p className="text-sm text-gray-500">Lead #{index + 1 + (page - 1) * limit}</p>
                    </div>
                </div>

                <div className="flex flex-col">
                    <p className="text-sm text-gray-500 font-medium">Phone Number</p>
                    <p className="text-gray-900 font-mono text-lg">{lead_.phone}</p>
                </div>

                <div className="flex flex-col">
                    <p className="text-sm text-gray-500 font-medium">Created By</p>
                    <p className="text-gray-900 font-semibold">{lead_.createdByName}</p>
                </div>

                <div className="flex flex-col">
                    <p className="text-sm text-gray-500 font-medium">Created On</p>
                    <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-gray-400 text-sm" />
                        <p className="text-gray-900">
                            {new Date(lead_.createAt || lead_.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                    <p className="text-xs text-gray-400">
                        {new Date(lead_.createAt || lead_.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                </div>
            </div>
        </div>
    ));

    // Update staff options only when necessary
    useEffect(() => {
        if (Sdata?.data && Array.isArray(Sdata.data)) {
            setFilteredStaffOptions(Sdata.data);
        }
    }, [Sdata]);

    // Simplified hierarchy loading
    const [hierarchyLoading, setHierarchyLoading] = useState(true);

    useEffect(() => {
        const loadHierarchy = async () => {
            try {
                if (userData.userId && role_ && [1,2,3,4,5,31,7,6].includes(role_)) {
                    // Only load if user has permission to view staff
                    const storedHierarchy = localStorage.getItem('userHierarchy');
                    if (!storedHierarchy && userData.userId) {
                        const comUser = JSON.parse(localStorage.getItem('comUserId') || '{}');
                        if (comUser.compId) {
                            await HierarchyService.fetchUserHierarchy(userData.userId, comUser.compId);
                        }
                    }
                }
            } catch (error) {
                console.error("Error loading hierarchy:", error);
            } finally {
                setHierarchyLoading(false);
            }
        };

        if (userData.userId) {
            loadHierarchy();
        } else {
            setHierarchyLoading(false);
        }
    }, [userData.userId, role_]);

    // Memoized processed data with efficient sorting
    const processedData = useMemo(() => {
        if (!data?.data?.fields_ || !Array.isArray(data.data.fields_)) return [];
        
        // Data is already sorted by the backend, no need to sort again
        return data.data.fields_;
    }, [data]);

    const totalPages = Math.ceil((data?.data?.total || 0) / limit);
    const showStaffSelection = role_ && [1,2,3,4,5,31,7,6].includes(role_);

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar className="flex-shrink-0" />

            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 px-4 py-4 bg-white shadow-sm">
                    <div className="flex items-center gap-4">
                        <Header header="New Leads" />
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">(View Only)</span>
                        {viewStaffId && (
                            <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                Showing leads by: {filteredStaffOptions.find(s => s._id === viewStaffId)?.userName || "Unknown"}
                            </span>
                        )}
                    </div>
                    <div className="text-sm text-gray-600 bg-green-50 px-3 py-1 rounded">
                        Total: <span className="font-semibold">{data?.data?.total || 0}</span> leads
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 pt-4 rounded-2xl mx-4 shadow-lg">
                        <div className="w-full flex flex-col gap-4 p-4">
                            <div className="flex flex-col md:flex-row items-center gap-4 justify-center">
                                {/* FROM */}
      <div className="flex items-center gap-2">
        <label className="text-white font-medium">From:</label>
        <DatePicker
          selected={parseDate(dateRange.startDate)}
          onChange={(date) =>
            handleDateRangeChange('startDate', date ? date.toISOString().split('T')[0] : '')
          }
          dateFormat="dd/MM/yyyy"
          placeholderText="dd/mm/yyyy"
          className="p-2 rounded-lg text-gray-700 border-0 focus:ring-2 focus:ring-white"
        />
      </div>

      {/* TO */}
      <div className="flex items-center gap-2">
        <label className="text-white font-medium">To:</label>
        <DatePicker
          selected={parseDate(dateRange.endDate)}
          onChange={(date) =>
            handleDateRangeChange('endDate', date ? date.toISOString().split('T')[0] : '')
          }
          dateFormat="dd/MM/yyyy"
          placeholderText="dd/mm/yyyy"
          className="p-2 rounded-lg text-gray-700 border-0 focus:ring-2 focus:ring-white"
        />
      </div>

      {/* Clear button stays identical */}
      {(dateRange.startDate || dateRange.endDate) && (
        <button
          onClick={() => {
            setDateRange({ startDate: '', endDate: '' });
            setPage(1);
          }}
          className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors shadow-sm"
        >
          Clear Dates
        </button>
      )}
                            </div>

                            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                                {showStaffSelection && (
                                    <div className="flex items-center gap-2 flex-1">
                                        <label className="text-lg font-medium text-white whitespace-nowrap">
                                            View leads by:
                                        </label>
                                        {hierarchyLoading ? (
                                            <div className="flex-1 p-3 bg-white/20 rounded-lg animate-pulse text-white">
                                                Loading staff...
                                            </div>
                                        ) : (
                                            <select
                                                value={viewStaffId}
                                                onChange={(e) => handleViewStaffChange(e.target.value)}
                                                className="flex-1 p-3 text-white bg-white/20 rounded-lg backdrop-blur border-0 focus:ring-2 focus:ring-white focus:bg-white/30"
                                            >
                                                <option value="" className="bg-white text-black">
                                                    All staff members
                                                </option>
                                                {filteredStaffOptions.map((staff: any) => (
                                                    <option key={staff._id} value={staff._id} className="bg-white text-black">
                                                        {staff.userName.toUpperCase()}
                                                        {staff._id === currentUserId ? " (You)" : ""}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                )}

                                <div className="flex flex-col w-full md:w-1/2">
                                    <div className="flex flex-row items-center bg-white/20 backdrop-blur rounded-full px-4 py-3 gap-x-3 overflow-y-hidden">
                                        <FaSearch color="#ffffff" size={20} />
                                        <input
                                            type="search"
                                            value={debouncedSearch}
                                            onChange={(e) => setDebouncedSearch(e.target.value)}
                                            placeholder="Search by name or phone..."
                                            className="w-full bg-transparent text-lg font-medium text-white placeholder:text-white/80 pr-2 focus:outline-none"
                                            disabled={!!viewStaffId}
                                            minLength={2}
                                        />
                                    </div>
                                    {searchError && (
                                        <div className="text-red-200 text-sm mt-2 text-center bg-red-500/20 rounded px-2 py-1">
                                            {searchError}
                                        </div>
                                    )}
                                    {viewStaffId && (
                                        <div className="text-white/80 text-xs mt-1 text-center">
                                            Search disabled when viewing specific staff
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center px-4 py-6 gap-4">
                        <select
                            value={limit}
                            onChange={(e) => handleLimitChange(Number(e.target.value))}
                            className="border border-gray-300 rounded-lg bg-white p-3 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value={10}>10 per page</option>
                            <option value={20}>20 per page</option>
                            <option value={50}>50 per page</option>
                            <option value={100}>100 per page</option>
                            <option value={250}>250 per page</option>
                        </select>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page <= 1 || isLoading}
                                className="px-4 py-2 rounded-lg bg-gray-600 text-white disabled:bg-gray-300 hover:bg-gray-700 transition-colors shadow-sm"
                            >
                                Previous
                            </button>
                            <span className="font-semibold text-lg px-4 py-2 bg-blue-50 rounded-lg">
                                Page {page} of {totalPages || 1}
                            </span>
                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page >= totalPages || isLoading}
                                className="px-4 py-2 rounded-lg bg-gray-600 text-white disabled:bg-gray-300 hover:bg-gray-700 transition-colors shadow-sm"
                            >
                                Next
                            </button>
                        </div>
                    </div>

                    <div className="px-4 pb-6">
                        {isLoading ? (
                            <LoadingSkeleton />
                        ) : isSuccess && processedData.length > 0 ? (
                            <div className="space-y-2">
                                {processedData.map((lead_: any, index: number) => (
                                    <LeadRow key={lead_._id} lead_={lead_} index={index} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                                <div className="max-w-md mx-auto">
                                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FaUser className="text-gray-400 text-3xl" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                        {viewStaffId ? "No leads found" : "No New Leads Found!"}
                                    </h3>
                                    <p className="text-gray-500">
                                        {viewStaffId
                                            ? `${filteredStaffOptions.find(s => s._id === viewStaffId)?.userName || "This user"} hasn't created any leads yet.`
                                            : "New leads will appear here when they are created."
                                        }
                                    </p>
                                    {(dateRange.startDate || dateRange.endDate) && (
                                        <p className="text-sm text-gray-400 mt-2">
                                            Try adjusting the date range or search criteria
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

NewLeads.displayName = 'NewLeads';

export default NewLeads;