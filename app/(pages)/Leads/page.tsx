"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Header from "../../_components/header";
import Sidebar from "../../_components/Sidebar";
import { debounce } from "lodash";
import { useG_LeadQuery,useG_Lead_CountsQuery, useGetMultiFilterDataQuery, useDownloadLeadsMutation } from "../../_api_query/Leads/leads.api";
import { loader } from "../../_api_query/store";
import { setNotification, setUserHierarchy } from "@app/_api_query/store";
import { FaSearch, FaPlus, FaChevronLeft, FaChevronRight, FaSpinner, FaDownload, FaChevronDown, FaCalendarAlt } from "react-icons/fa";
import LeadForm from "../../_components/LeadForm";
import QueryForm from "../../_components/Form/index";
import QueryTable from "../../_components/Query";
import PopUpToAddLead from "../../_components/PopUpToAddLead";
import TableRow from "../../_components/TableRow";
import { useAuth } from "../../_components/useAuth";
import FilterUI from "../../_components/FilterUI";
import { useDispatch_ } from "@/store";
import { useG_STAFFQuery, useP_STAFFMutation } from "../../_api_query/staff/staffs.api";
import { useSelector } from "react-redux";
import { clearUserSelection, toggleUserSelection } from "../../_api_query/store";
import { toast } from "react-toastify";
import { skipToken } from "@reduxjs/toolkit/query";
import { HierarchyService } from "@app/services/hierarchyService";
import { format } from 'date-fns';
import WhatsAppTemplateSettings from '@app/_components/WhatsAppTemplateSettings';

const leadStatusOptions = [
    { value: "fresh", label: "Fresh", color: "bg-orange-600" },
    { value: "followup", label: "Follow Up", color: "bg-green-700" },
    { value: "notInterest", label: "Not Interested", color: "bg-red-700" },
    { value: "deal-done", label: "Deal Done", color: "bg-blue-700" },
    { value: "hotprospects", label: "Hot Prospects", color: "bg-pink-600" },
    { value: "suspects", label: "Suspects", color: "bg-yellow-600" },
];

const callStatusOptions = [
    { value: "visitdone", label: "Visit Done", color: "bg-purple-600" },
    { value: "meetingdone", label: "Meeting Done", color: "bg-teal-600" },
    { value: "ringing", label: "Ringing", color: "bg-indigo-600" },
    { value: "switchoff", label: "Switch Off", color: "bg-gray-600" },
    { value: "wrongno", label: "Wrong Number", color: "bg-rose-600" },
    { value: "callback", label: "Call Back", color: "bg-cyan-600" },
];

const Lead = () => {
    const [pop, setPop] = useState(false);
    const [leadForm, setLeadForm] = useState(false);
    const [leadFormData, setLeadFormData] = useState(null);
    const [queryForm, setQueryForm] = useState(false);
    const [multiFilter, setMultiFilter] = useState(false);
    const dispatch = useDispatch_();
    const [queryFormType_, setQueryFormType_] = useState(null);
    const [selectedLeadStatus, setSelectedLeadStatus] = useState<string>("fresh");
    const [selectedCallStatus, setSelectedCallStatus] = useState<string | null>(null);
    const [leadType, setLeadType] = useState<string>("all");
    const [staffId, setStaffId] = useState<string>("");
    const [search, setSearch] = useState("");
    const [userId, setUserId] = useState<any>("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [LeadAssgin] = useP_STAFFMutation();
    const [role_, setRole] = useState<any>(1);
    const selectedUserIds = useSelector((state: any) => state.store.selectedUserIds);
    const [id, setId] = useState(null);
    const [leadIndex, setLeadIndex] = useState(NaN);
    const [token, setToken] = useState("");
    const [user, setUser] = useState("");
    const [searchError, setSearchError] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [statusPage, setStatusPage] = useState(0);
    const statusPerPage = 4;
    const [filteredStaffOptions, setFilteredStaffOptions] = useState<any[]>([]);
    const [viewStaffId, setViewStaffId] = useState<string>("");
    const [filteredViewStaffOptions, setFilteredViewStaffOptions] = useState<any[]>([]);
    const [isTabSwitching, setIsTabSwitching] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isStatusChanging, setIsStatusChanging] = useState(false);

    // Filter states
    const [searchMulti, setSearchMulti] = useState<string | null>(null);
    const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
    const [isFiltering, setIsFiltering] = useState(false);

    const capitalizeName = (name: string): string => {
        if (!name) return '';

        // Handle special cases first
        if (name === 'deal-done') return 'Deal Done';
        if (name === 'notInterest') return 'Not Interested';

        // Replace hyphens with spaces and capitalize each word
        return name
            .replace(/-/g, ' ')
            .replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
    };

    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });
    const [showDateFilter, setShowDateFilter] = useState(false);

    // Memoized debounced search function
    const debouncedSetSearch = useCallback(
        debounce((value: string) => {
            setSearch(value);
            setIsSearching(false);
        }, 200),
        []
    );

    // Helper function to check if search is a 10-digit phone number
    const isPhoneNumberSearch = useCallback((searchValue: string) => {
        const digitsOnly = searchValue.replace(/\D/g, '');
        return digitsOnly.length === 10;
    }, []);

    // Enhanced search effect with loading states
    useEffect(() => {
        if (debouncedSearch.length <= 50) {
            setSearchError("");
            if (debouncedSearch !== search) {
                setIsSearching(true);
            }
            debouncedSetSearch(debouncedSearch);
        } else {
            setSearchError("Search text is too long. Please shorten your search.");
            setIsSearching(false);
        }

        return () => {
            debouncedSetSearch.cancel();
        };
    }, [debouncedSearch, search, debouncedSetSearch]);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setRole(user.role);
        setUserId(user.userId);
        setToken(localStorage.getItem('accessToken') || '');
        setUser(localStorage.getItem('comUserId') || '');
    }, []);

    // Optimized query with better caching
    const { data, isError, isSuccess, isLoading, error, refetch, isFetching } = useG_LeadQuery(
        {
            page,
            limit,
            search,
            leadType,
            selectedStatus: selectedCallStatus || selectedLeadStatus,
            staffId: viewStaffId,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
        },
        {
            refetchOnMountOrArgChange: true,
            refetchOnFocus: false,
            refetchOnReconnect: false,
        }
    );

    // Secondary query for all status counts (background)
    const { 
        data: countsData, 
        isLoading: countsLoading,
        isFetching: countsFetching 
    } = useG_Lead_CountsQuery(
        {
            staffId: viewStaffId,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            search: search
        },
        {
            // This will fetch in background after main data loads
            skip: false,
            refetchOnMountOrArgChange: true,
        }
    );

    // Merge counts from both sources
    const [statusCounts, setStatusCounts] = useState<any>({});

    useEffect(() => {
        // Start with current status count from main query
        const currentStatus = selectedCallStatus || selectedLeadStatus;
        const capitalizedStatus = currentStatus?.charAt(0).toUpperCase() + currentStatus?.slice(1).replace('-', '');
        
        const newCounts: any = {};
        
        // Add current status count from main query (fast, immediate)
        if (data?.data?.total !== undefined) {
            newCounts[`Total${capitalizedStatus}`] = data.data.total;
        }
        
        // Merge with background counts when available
        if (countsData?.data) {
            Object.assign(newCounts, countsData.data);
        }
        
        setStatusCounts(newCounts);
    }, [data, countsData, selectedCallStatus, selectedLeadStatus]);

    // Updated getStatusCount to use merged counts
    const getStatusCount = (statusValue: string) => {
        const statusMap: Record<string, string> = {
            "fresh": "TotalFresh",
            "followup": "TotalFollowup",
            "notInterest": "TotalNotInterest",
            "deal-done": "TotalDealdone",
            "visitdone": "TotalVisitdone",
            "meetingdone": "TotalMeetingdone",
            "hotprospects": "TotalHotprospects",
            "suspects": "TotalSuspects",
            "ringing": "TotalRinging",
            "switchoff": "TotalSwitchoff",
            "wrongno": "TotalWrongno",
            "callback": "TotalCallback",
        };

        const count = statusCounts[statusMap[statusValue]];
        
        // Show loading indicator for counts that haven't loaded yet
        if (count === undefined && countsFetching) {
            return '...';
        }
        
        return count || 0;
    };

    const getCallStatusCount = (callStatusValue: string) => {
        const statusMap: Record<string, string> = {
            "visitdone": "TotalVisitdone",
            "meetingdone": "TotalMeetingdone",
            "hotprospects": "TotalHotprospects",
            "suspects": "TotalSuspects",
            "ringing": "TotalRinging",
            "switchoff": "TotalSwitchoff",
            "wrongno": "TotalWrongno",
            "callback": "TotalCallback",
        };

        const count = statusCounts[statusMap[callStatusValue]];
        
        if (count === undefined && countsFetching) {
            return '...';
        }
        
        return count || 0;
    };

    // Update getCurrentStatusTotal to use merged counts
    const getCurrentStatusTotal = useMemo(() => {
        const currentStatus = selectedCallStatus || selectedLeadStatus;
        const statusMap: Record<string, string> = {
            "fresh": "TotalFresh",
            "followup": "TotalFollowup",
            "notInterest": "TotalNotInterest",
            "deal-done": "TotalDealdone",
            "visitdone": "TotalVisitdone",
            "meetingdone": "TotalMeetingdone",
            "hotprospects": "TotalHotprospects",
            "suspects": "TotalSuspects",
            "ringing": "TotalRinging",
            "switchoff": "TotalSwitchoff",
            "wrongno": "TotalWrongno",
            "callback": "TotalCallback",
        };

        return statusCounts[statusMap[currentStatus]] || data?.data?.total || 0;
    }, [statusCounts, selectedCallStatus, selectedLeadStatus, data]);

    // Optional: Add a small loading indicator for background counts
    const CountBadge = ({ count }: { count: number | string }) => (
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
            count === '...' ? 'animate-pulse bg-gray-200' : 'bg-white/20'
        }`}>
            {count}
        </span>
    );

    // Update your StatusPill to use the new CountBadge
    const StatusPill: React.FC<StatusPillProps> = ({ status, count, isActive, onClick }) => (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all
                border text-sm font-medium whitespace-nowrap
                ${isActive
                    ? `${status.color} text-white shadow-sm border-transparent`
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }
                ${count === 0 ? 'opacity-60 cursor-default' : 'cursor-pointer'}
            `}
            disabled={count === 0}
        >
            <div className={`w-2 h-2 rounded-full ${status.color} ${!isActive ? 'opacity-80' : ''}`} />
            {status.label}
            <CountBadge count={count} />
        </button>
    );

    // Add date range filter handler
    const handleDateRangeChange = (start: string, end: string) => {
        setDateRange({ startDate: start, endDate: end });
        setPage(1); // Reset to first page when changing date range
    };

    // Add clear date filter function
    const clearDateFilter = () => {
        setDateRange({ startDate: '', endDate: '' });
        setPage(1);
    };

    const DateRangeFilter = () => (
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700">Date Range Filter</h3>
                <button
                    onClick={clearDateFilter}
                    className="text-sm text-red-600 hover:text-red-800"
                >
                    Clear
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                    </label>
                    <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                    </label>
                    <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
            <div className="mt-3 flex gap-2">
                <button
                    onClick={() => setShowDateFilter(false)}
                    className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                >
                    Close
                </button>
                <button
                    onClick={() => refetch()}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                    Apply
                </button>
            </div>
        </div>
    );

    const [userData, setUserData] = useState<any>({});
    const [currentUserId, setCurrentUserId] = useState<string>("");

    const ROLE_31_ASSIGNABLE_STATUSES = ['fresh'];

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        console.log("User Data from localStorage:", user);
        setUserData(user);
        setCurrentUserId(user.userId);
    }, []);

    const currentStatus = selectedCallStatus || selectedLeadStatus;
    const shouldBypassHierarchy = role_ === 31 && ROLE_31_ASSIGNABLE_STATUSES.includes(currentStatus);
    const isRole31SpecialAssignment = shouldBypassHierarchy;

    const { data: filteredData, isLoading: isFilterLoading } = useGetMultiFilterDataQuery(
        searchMulti ? searchMulti : skipToken,
    );

    const { data: Sdata, isError: SisError, isSuccess: SisSuccess, isLoading: staffLoading } = useG_STAFFQuery(
        {
            userId: currentUserId,
            bypassHierarchy: shouldBypassHierarchy
        },
        {
            refetchOnMountOrArgChange: true,
            refetchOnFocus: false
            // Refetch when the bypass condition changes
            // refetchOnArgsChange: true // Removed invalid property
        }
    );

    useEffect(() => {
        if (!Sdata?.data) return;

        console.log('View staff options:', {
            staffCount: Sdata.data.length,
            staffList: Sdata.data.map((s: { userName: any; }) => s.userName)
        });

        setFilteredViewStaffOptions(Sdata.data);

        // Set current user as default if available
        if (Sdata.data.some((staff: any) => staff._id === currentUserId)) {
            setViewStaffId(currentUserId);
        }
    }, [Sdata, currentUserId]);

    const { getAuthHeaders } = useAuth();

    // Optimized auto-switch tab logic - Updated for new response structure
    useEffect(() => {
        if (search && isSuccess && data?.message === "phone_search_results") {
            const { phoneSearchResults, availableStatuses } = data.data;

            const statusPriority = ['fresh', 'followup', 'notInterest', 'deal-done'];
            const bestStatus = statusPriority.find(status =>
                availableStatuses.includes(status) && status !== selectedLeadStatus
            );

            if (bestStatus) {
                setIsTabSwitching(true);
                setSelectedLeadStatus(bestStatus);
                setSelectedCallStatus(null);
                toast.info(`Phone number found in ${bestStatus} tab (${phoneSearchResults[bestStatus]} results)`);

                setTimeout(() => {
                    setIsTabSwitching(false);
                }, 500);
            }
            return;
        }

        // Original logic for non-phone searches - Updated for new structure
        if (search && isSuccess && data?.data?.fields_?.length === 0 && isPhoneNumberSearch(search) && !isTabSwitching) {
            const statusCounts = {
                fresh: data?.data?.TotalFresh || 0,
                followup: data?.data?.TotalFollowup || 0,
                notInterest: data?.data?.TotalNotInterest || 0,
                'deal-done': data?.data?.TotalDealdone || 0
            };

            const statusWithResults = Object.entries(statusCounts)
                .find(([status, count]) => status !== selectedLeadStatus && count > 0);

            if (statusWithResults) {
                setIsTabSwitching(true);
                setSelectedLeadStatus(statusWithResults[0]);
                toast.info(`Phone number found in ${statusWithResults[0]} tab`);
            }
        }
    }, [search, isSuccess, data, selectedLeadStatus, isPhoneNumberSearch, isTabSwitching]);

    // Handle tab switching completion - Updated for new structure
    useEffect(() => {
        if (isTabSwitching && isSuccess && data?.data?.fields_?.length > 0) {
            setIsTabSwitching(false);
        }
    }, [isTabSwitching, isSuccess, data]);

    const handleLimitChange = (newLimit: number) => {
        if (newLimit > 0 && newLimit <= 250) {
            setLimit(newLimit);

            // Calculate if current page is still valid with new limit
            const newMaxPage = Math.ceil(getCurrentStatusTotal / newLimit);
            if (page > newMaxPage) {
                setPage(Math.max(1, newMaxPage)); // Go to last valid page
            }
        }
    };

    const hasNextPage = useMemo(() => {
        if (!isSuccess || !data?.data) return false;

        // Get current results count
        const currentResultsCount = data?.data?.fields_?.length || 0;

        // If current page has results equal to limit, there might be more pages
        // If current page has less than limit, this is the last page
        return currentResultsCount === limit;
    }, [data?.data?.fields_, limit, isSuccess]);

    // Helper function to get total results for current status
    // const getCurrentStatusTotal = useMemo(() => {
    //     if (!isSuccess || !data?.data) return 0;

    //     const currentStatus = selectedCallStatus || selectedLeadStatus;
    //     const statusMap: Record<string, string> = {
    //         "fresh": "TotalFresh",
    //         "followup": "TotalFollowup",
    //         "notInterest": "TotalNotInterest",
    //         "deal-done": "TotalDealdone",
    //         "visitdone": "TotalVisitdone",
    //         "meetingdone": "TotalMeetingdone",
    //         "hotprospects": "TotalHotprospects",
    //         "suspects": "TotalSuspects",
    //         "ringing": "TotalRinging",
    //         "switchoff": "TotalSwitchoff",
    //         "wrongno": "TotalWrongno",
    //         "callback": "TotalCallback",
    //     };

    //     return data?.data[statusMap[currentStatus]] || 0;
    // }, [data?.data, selectedCallStatus, selectedLeadStatus, isSuccess]);

    // Calculate max possible page
    const maxPage = useMemo(() => {
        return Math.ceil(getCurrentStatusTotal / limit);
    }, [getCurrentStatusTotal, limit]);

    // Updated handlePageChange function
    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= maxPage) {
            setPage(newPage);
        }
    };

    const DownloadDropdown = ({
        handleDownloadAllLeads,
        handleDownloadCurrentStatus,
        isDownloading,
        selectedStatus
    }: {
        handleDownloadAllLeads: () => void;
        handleDownloadCurrentStatus: () => void;
        isDownloading: boolean;
        selectedStatus: string;
    }) => {
        const [isOpen, setIsOpen] = useState(false);
        const dropdownRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);

        const handleOptionClick = (downloadType: 'all' | 'current') => {
            setIsOpen(false);
            if (downloadType === 'all') {
                handleDownloadAllLeads();
            } else {
                handleDownloadCurrentStatus();
            }
        };

        return (
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={isDownloading}
                    className="mt-7 ml-2 bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white px-4 py-2 rounded-lg flex items-center gap-1 transition-all shadow-md"
                >
                    {isDownloading ? (
                        <>
                            <FaSpinner className="animate-spin" size={16} />
                            Downloading...
                        </>
                    ) : (
                        <>
                            <FaDownload size={16} />
                           
                            <FaChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </>
                    )}
                </button>

                {isOpen && !isDownloading && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                        <div className="py-2">
                            <button
                                onClick={() => handleOptionClick('all')}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3"
                            >
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <FaDownload className="text-blue-600" size={14} />
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900">Download All Leads</div>
                                    <div className="text-sm text-gray-500">Export all leads from all statuses</div>
                                </div>
                            </button>

                            <button
                                onClick={() => handleOptionClick('current')}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3"
                            >
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <FaDownload className="text-green-600" size={14} />
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900">Download Current Status</div>
                                    <div className="text-sm text-gray-500">
                                        Export only "{capitalizeName(selectedStatus)}" leads
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Memoized bulk selection handler - Updated for new structure
    const handleBulkSelection = useCallback(() => {
        const allIds = data?.data?.fields_?.map((item: { _id: any }) => item._id);
        if (data?.data?.fields_?.every((item: { _id: any }) => selectedUserIds.includes(item._id))) {
            dispatch(clearUserSelection());
        } else {
            dispatch(toggleUserSelection(allIds));
        }
    }, [data?.data?.fields_, selectedUserIds, dispatch]);

    // Update isFiltering state when search or filters change
    useEffect(() => {
        setIsFiltering(search !== "" || selectedFilters.length > 0 || multiFilter);
    }, [search, selectedFilters, multiFilter]);

    const submit = async () => {
        try {
            if (!staffId) {
                return toast.error("Staff is not selected");
            }
            if (selectedUserIds.length === 0) {
                return toast.error("Lead is not selected");
            }

            const currentStatus = selectedCallStatus || selectedLeadStatus;
            const isRole31SpecialAssignment = role_ === 31 && ROLE_31_ASSIGNABLE_STATUSES.includes(currentStatus);

            console.log('Assignment debug:', {
                role_,
                currentStatus,
                isRole31SpecialAssignment,
                staffId,
                selectedStaffName: filteredStaffOptions.find(s => s._id === staffId)?.userName
            });

            dispatch(loader(true));
            let obj: any = {
                staffId,
                selectedUserIds,
                isRole31SpecialAssignment
            };

            const res = await LeadAssgin(obj).unwrap();
            setStaffId("");
            refetch();
            dispatch(clearUserSelection());

            if (isRole31SpecialAssignment) {
                toast.success("Lead Assigned Successfully (Special Assignment)");
            } else {
                toast.success("Lead Assigned Successfully");
            }
        } catch (error: any) {
            console.error("Full error object:", error);
            if (error.response?.status === 401) {
                toast.error("Session expired. Please try again.");
            } else {
                toast.error(error.response?.data?.message || "Failed to assign lead");
            }
        } finally {
            dispatch(loader(false));
        }
    };

    // Memoized filter function for better performance
    const filterLeads = useCallback((leads: any[]) => {
        if (!leads) return [];

        return leads.filter((lead) => {
            if (isFiltering) return true;
            if (role_ !== "1" && role_ !== "2") return true;
            const isAssigned = lead.staffId !== null && lead.staffId !== undefined;
            return !isAssigned;
        });
    }, [isFiltering, role_]);

    // Memoized filtered and sorted leads - Updated for new structure
    const processedLeads = useMemo(() => {
        const leadsToProcess = filteredData?.data?.fields_ || (isSuccess && data?.data?.fields_) || [];
        const filtered = filterLeads([...leadsToProcess]);

        return filtered.sort((a: any, b: any) => {
            if (a.name && b.name) {
                return a.name.localeCompare(b.name);
            }
            return 0;
        });
    }, [filteredData?.data?.fields_, data?.data?.fields_, isSuccess, filterLeads]);

    useEffect(() => {
        if (staffId && selectedUserIds.length > 0) {
            const timer = setTimeout(() => {
                submit();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [staffId]);

    // Add these helper functions
    const isDateRangeActive = dateRange.startDate || dateRange.endDate;

    const getDateRangeDisplayText = () => {
        if (!dateRange.startDate && !dateRange.endDate) return 'All dates';

        const format = (dateStr: string) =>
            new Date(dateStr).toLocaleDateString('en-IN');

        if (dateRange.startDate && dateRange.endDate) {
            return `${format(dateRange.startDate)} - ${format(dateRange.endDate)}`;
        } else if (dateRange.startDate) {
            return `From ${format(dateRange.startDate)}`;
        } else {
            return `Until ${format(dateRange.endDate)}`;
        }
    };

    // Enhanced loading state management
    useEffect(() => {
        const shouldShowLoader = isLoading || staffLoading || isStatusChanging;
        dispatch(loader(shouldShowLoader));

        if (isError || SisError) {
            if (error && "data" in error) {
                if (error.data && typeof error.data === "object" && "message" in error.data && typeof error.data.message === "string" && error.data.message.includes("Exceeded memory limit")) {
                    toast.error("Search too broad. Please be more specific.");
                    setSearch("");
                    setDebouncedSearch("");
                } else {
                    if (error.data && typeof error.data === "object" && "message" in error.data) {
                        toast.error((error.data as { message: string }).message || "An error occurred");
                    } else {
                        toast.error("An error occurred");
                    }
                }
            } else {
                toast.error("An error occurred");
            }
        }
    }, [isLoading, isSuccess, isError, error, SisError, staffLoading, SisSuccess, isStatusChanging, dispatch]);

    // Status change handlers
    const handleLeadStatusChange = useCallback(async (status: string) => {
        if (isTabSwitching || isStatusChanging) return;

        setIsStatusChanging(true);
        setSelectedLeadStatus(status);
        setSelectedCallStatus(null);
        setPage(1); // Reset to page 1 when switching tabs

        try {
            await refetch();
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to fetch data");
        } finally {
            setIsStatusChanging(false);
        }
    }, [isTabSwitching, isStatusChanging, refetch]);

    const handleCallStatusChange = useCallback(async (status: string) => {
        if (isTabSwitching || isStatusChanging) return;

        setIsStatusChanging(true);
        setSelectedCallStatus(status);
        setSelectedLeadStatus("");
        setPage(1); // Reset to page 1 when switching tabs

        try {
            await refetch();
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to fetch data");
        } finally {
            setIsStatusChanging(false);
        }
    }, [isTabSwitching, isStatusChanging, refetch]);


    // Check if any loading state is active
    const isAnyLoading = isLoading || isFetching || isSearching || isTabSwitching || isStatusChanging;

    const [downloadLeads, { isLoading: isDownloading }] = useDownloadLeadsMutation();

    const handleDownloadAllLeads = async () => {
        try {
            const downloadParams = {
                selectedStatus: selectedCallStatus || selectedLeadStatus,
                leadType,
                search,
                downloadAll: true, // This will download all statuses
                startDate: dateRange.startDate, // NEW
                endDate: dateRange.endDate      // NEW
            };

            const blob = await downloadLeads(downloadParams).unwrap();

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `All_Leads_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('All leads downloaded successfully');
        } catch (error) {
            console.error('Download failed:', error);
            toast.error('Failed to download leads');
        }
    };

    // 3. Add a function to download current status leads only
    const handleDownloadCurrentStatus = async () => {
        try {
            const downloadParams = {
                selectedStatus: selectedCallStatus || selectedLeadStatus,
                leadType,
                search,
                downloadAll: false,
                startDate: dateRange.startDate, // NEW
                endDate: dateRange.endDate
            };

            const response = await downloadLeads(downloadParams).unwrap();

            // Create download link
            const url = window.URL.createObjectURL(response);
            const link = document.createElement('a');
            link.href = url;

            const statusName = selectedCallStatus || selectedLeadStatus;
            const formattedStatus = capitalizeName(statusName);
            link.setAttribute('download', `${formattedStatus.replace(/\s+/g, '_')}_Leads_${new Date().toISOString().split('T')[0]}.xlsx`);

            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success(`${formattedStatus} leads downloaded successfully`);
        } catch (error) {
            console.error('Download failed:', error);
            toast.error('Failed to download leads');
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedPhone = localStorage.getItem('leadSearchPhone');
            if (storedPhone) {
                setDebouncedSearch(storedPhone);
                localStorage.removeItem('leadSearchPhone');
            }
        }
    }, []);

    // Updated getStatusCount function to match new response structure
    // const getStatusCount = (statusValue: string) => {
    //     if (!isSuccess || !data?.data) return 0;

    //     const statusMap: Record<string, string> = {
    //         "fresh": "TotalFresh",
    //         "followup": "TotalFollowup",
    //         "notInterest": "TotalNotInterest",
    //         "deal-done": "TotalDealdone", // Updated to match your response
    //         "visitdone": "TotalVisitdone", // Updated to match your response
    //         "meetingdone": "TotalMeetingdone", // Updated to match your response
    //         "hotprospects": "TotalHotprospects",
    //         "suspects": "TotalSuspects",
    //         "ringing": "TotalRinging",
    //         "switchoff": "TotalSwitchoff", // Updated to match your response
    //         "wrongno": "TotalWrongno", // Updated to match your response
    //         "callback": "TotalCallback", // Updated to match your response
    //     };

    //     return data?.data[statusMap[statusValue]] || 0;
    // };

    // // Updated getCallStatusCount function
    // const getCallStatusCount = (callStatusValue: string) => {
    //     if (!isSuccess || !data?.data) return 0;

    //     const statusMap: Record<string, string> = {
    //         "visitdone": "TotalVisitdone",
    //         "meetingdone": "TotalMeetingdone",
    //         "hotprospects": "TotalHotprospects",
    //         "suspects": "TotalSuspects",
    //         "ringing": "TotalRinging",
    //         "switchoff": "TotalSwitchoff",
    //         "wrongno": "TotalWrongno",
    //         "callback": "TotalCallback",
    //     };

    //     return data?.data[statusMap[callStatusValue]] || 0;
    // };

    const [hierarchyLoading, setHierarchyLoading] = useState(true);

    useEffect(() => {
        const loadHierarchy = async () => {
            try {
                const storedHierarchy = localStorage.getItem('userHierarchy');
                if (storedHierarchy) {
                    const parsed = JSON.parse(storedHierarchy);
                    dispatch(setUserHierarchy(parsed));
                }

                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const comUser = JSON.parse(localStorage.getItem('comUserId') || '{}');

                if (user.userId && comUser.compId) {
                    const freshData = await HierarchyService.fetchUserHierarchy(user.userId, comUser.compId);
                    dispatch(setUserHierarchy(freshData));
                }
            } catch (error) {
                console.error("Error loading hierarchy:", error);
            } finally {
                setHierarchyLoading(false);
            }
        };

        loadHierarchy();
    }, [dispatch]);

    useEffect(() => {
        if (!Sdata?.data) return;

        const currentStatus = selectedCallStatus || selectedLeadStatus;
        const isRole31Special = role_ === 31 && ROLE_31_ASSIGNABLE_STATUSES.includes(currentStatus);

        console.log('Staff filtering debug:', {
            role_,
            currentStatus,
            isRole31Special,
            staffCount: Sdata.data.length,
            staffList: Sdata.data.map((s: { userName: any; }) => s.userName)
        });

        setFilteredStaffOptions(Sdata.data);
    }, [Sdata, role_, selectedCallStatus, selectedLeadStatus]);

    type StatusOption = {
        value: string;
        label: string;
        color: string;
    };

    type StatusPillProps = {
        status: StatusOption;
        count: number;
        isActive: boolean;
        onClick: () => void;
    };

    // const StatusPill: React.FC<StatusPillProps> = ({ status, count, isActive, onClick }) => (
    //     <button
    //         onClick={onClick}
    //         className={`
    //             flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all
    //             border text-sm font-medium whitespace-nowrap
    //             ${isActive
    //                 ? `${status.color} text-white shadow-sm border-transparent`
    //                 : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
    //             }
    //             ${count === 0 ? 'opacity-60 cursor-default' : 'cursor-pointer'}
    //         `}
    //     >
    //         <div className={`w-2 h-2 rounded-full ${status.color} ${!isActive ? 'opacity-80' : ''}`} />
    //         {status.label}
    //         <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-gray-100'}`}>
    //             {count}
    //         </span>
    //     </button>
    // );



    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <Sidebar className="flex-shrink-0" />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Fixed Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 px-4 py-4 bg-white shadow-sm">
  <div className="flex gap-3">
    <button
      className="bg-[#004aad] flex items-center gap-x-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg text-white"
      onClick={() => setPop(true)}
    >
      <FaPlus color="#fff" size={22} />
      <span className="text-white font-semibold text-base">Lead</span>
    </button>
    
    {/* Add WhatsApp Template Settings */}
    <WhatsAppTemplateSettings />
  </div>
  <Header header="Leads" />
</div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Lead Assignment Section */}
                    <div className="bg-gradient-to-r from-pink-600 to-indigo-600 pt-4 rounded-2xl mx-4">
                        <div className="w-full p-4 rounded-xl shadow-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">

                                {/* Assign To Section */}
                                {(role_ === 1 || role_ === 2 || role_ === 3 || role_ === 4 || role_ === 5 || role_ === 31 || role_ === 7 || role_ === 6) && (
                                    <div className="flex flex-col space-y-1">
                                        <label className="text-sm font-medium text-white flex items-center">
                                            Assign To:
                                            {isRole31SpecialAssignment && (
                                                <span className="ml-1 text-xs text-yellow-300">(Any Staff)</span>
                                            )}
                                        </label>
                                        {staffLoading || hierarchyLoading ? (
                                            <div className="h-10 bg-blue-500 rounded-lg animate-pulse"></div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={staffId}
                                                    onChange={(e) => setStaffId(e.target.value)}
                                                    className="w-full p-2 text-white bg-indigo-700 rounded-lg border border-indigo-500 focus:ring-2 focus:ring-blue-300 focus:outline-none"
                                                >
                                                    <option value="" className="bg-white text-black">Select</option>
                                                    {filteredStaffOptions.map((staff: any) => (
                                                        <option key={staff._id} value={staff._id} className="bg-white text-black">
                                                            {staff.userName.toUpperCase()}
                                                            {staff._id === currentUserId ? " (You)" : ""}
                                                            {isRole31SpecialAssignment && <span className="text-green-600"> ✓</span>}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* View Staff Section */}
                                {(role_ === 1 || role_ === 2 || role_ === 3 || role_ === 4 || role_ === 5 || role_ === 31 || role_ === 7 || role_ === 6) && (
                                    <div className="flex flex-col space-y-1">
                                        <label className="text-sm font-medium text-white">View Staff:</label>
                                        {staffLoading ? (
                                            <div className="h-10 bg-blue-500 rounded-lg animate-pulse"></div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={viewStaffId}
                                                    onChange={(e) => setViewStaffId(e.target.value)}
                                                    className="w-full p-2 text-white bg-indigo-700 rounded-lg border border-indigo-500 focus:ring-2 focus:ring-blue-300 focus:outline-none"
                                                >
                                                    <option value="">All Staff</option>
                                                    {filteredViewStaffOptions.map((staff: any) => (
                                                        <option key={staff._id} value={staff._id} className="bg-white text-black">
                                                            {staff.userName.toUpperCase()}
                                                            {staff._id === currentUserId ? " (You)" : ""}
                                                        </option>
                                                    ))}
                                                </select>
                                                {viewStaffId && (
                                                    <button
                                                        onClick={() => setViewStaffId("")}
                                                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg flex-shrink-0 transition-colors"
                                                        title="Clear view filter"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Lead Type & Filter Section */}
                                <div className="flex flex-col space-y-1">
                                    <label className="text-sm font-medium text-white">Lead Type & Filters</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={leadType}
                                            onChange={(e) => setLeadType(e.target.value)}
                                            className="flex-1 p-2 text-white bg-indigo-700 rounded-lg border border-indigo-500 focus:ring-2 focus:ring-blue-300 focus:outline-none"
                                        >
                                            <option value="all">All Lead</option>
                                            <option value="rent">Rent Lead</option>
                                            <option value="residential">Residential Lead</option>
                                            <option value="commercial">Commercial Lead</option>
                                        </select>
                                        <button
                                            onClick={() => setMultiFilter(true)}
                                            className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white px-4 py-2 rounded-lg flex items-center gap-1 transition-all shadow-md"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                                            </svg>
                                            <span className="hidden xs:inline">Filter</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Download & Date Range Section */}
                                <div className="flex flex-col space-y-2">
                                    <div className="flex gap-2">
                                        {(role_ == 1 || role_ == 2) && (
                                            <div className="flex-1">
                                                <DownloadDropdown
                                                    handleDownloadAllLeads={handleDownloadAllLeads}
                                                    handleDownloadCurrentStatus={handleDownloadCurrentStatus}
                                                    isDownloading={isDownloading}
                                                    selectedStatus={selectedCallStatus || selectedLeadStatus}
                                                />
                                            </div>
                                        )}

                                        {/* Date Range Filter Button */}
                                        <div className="relative mt-6">
                                            <button
                                                onClick={() => setShowDateFilter(!showDateFilter)}
                                                className={`
                                                    h-10 px-3 py-2 rounded-lg flex items-center transition-all duration-200 ease-in-out
                                                    focus:outline-none focus:ring-2 gap-2 focus:ring-offset-2 focus:ring-green-500
                                                    ${dateRange.startDate || dateRange.endDate
                                                                                                ? 'bg-green-500 text-white shadow-md hover:bg-green-600'
                                                                                                : 'bg-indigo-700 text-white border border-indigo-500 hover:bg-indigo-600'
                                                                                            }
                                                    `}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 极 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                                </svg>
                                                <span className="hidden sm:inline text-sm">Date Range</span>
                                                {(dateRange.startDate || dateRange.endDate) && (
                                                    <span className="bg-white text-green-600 text-xs font-semibold px-1 rounded-full">
                                                        ●
                                                    </span>
                                                )}
                                            </button>

                                            {/* Dropdown */}
                                            {showDateFilter && (
                                                <div className="absolute top-full right-0 mt-2 w-72 sm:w-80 z-50 bg-white rounded-xl shadow-xl border border-gray-200 animate-fadeIn">
                                                    <DateRangeFilter />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Search Bar with Loading Indicator */}
                        <div className="flex flex-col w-5/6 mx-auto">
                            <div className="flex flex-row items-center bg-slate-100/20 rounded-full px-4 py-2 gap-x-2 overflow-y-hidden my-3">
                                {isSearching ? (
                                    <FaSpinner className="animate-spin text-white/80" size={20} />
                                ) : (
                                    <FaSearch color="#ffffffc8" size={24} />
                                )}
                                <input
                                    type="search"
                                    value={debouncedSearch}
                                    onChange={(e) => setDebouncedSearch(e.target.value)}
                                    placeholder="Search (phone number auto-switches tabs)"
                                    className="w-full bg-transparent text-sm md:text-xl font-semibold text-white placeholder:text-white/80 pr-2 focus:outline-none"
                                />
                                {isSearching && (
                                    <span className="text-white/60 text-sm">Searching...</span>
                                )}
                            </div>
                            {searchError && (
                                <div className="text-red-400 text-sm mt-1 text-center">
                                    {searchError}
                                </div>
                            )}
                        </div>

                        {/* Status Counts with Enhanced Loading States */}
                        <div className="w-10/12 flex flex-col py-1 bg-gray-100 rounded-lg dark:bg-gray-800 mx-auto">
                            {(isTabSwitching || isStatusChanging) && (
                                <div className="flex items-center justify-center py-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                    <span className="text-xs text-gray-600">
                                        {isTabSwitching ? "Switching to phone number results..." : "Loading status data..."}
                                    </span>
                                </div>
                            )}
                            {/* Lead Status Tabs */}
                            {/* Lead Status Tabs */}
                            <div className="overflow-x-auto whitespace-nowrap py-2 px-4">
                                <div className="inline-flex gap-2">
                                    {leadStatusOptions.map((status) => (
                                        <StatusPill
                                            key={status.value}
                                            status={status}
                                            count={getStatusCount(status.value)}
                                            isActive={selectedLeadStatus === status.value}
                                            onClick={() => handleLeadStatusChange(status.value)}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Call Status Tabs */}
                            <div className="overflow-x-auto whitespace-nowrap py-2 px-4">
                                <div className="inline-flex gap-2">
                                    {callStatusOptions.map((status) => (
                                        <StatusPill
                                            key={status.value}
                                            status={status}
                                            count={getCallStatusCount(status.value)}
                                            isActive={selectedCallStatus === status.value}
                                            onClick={() => handleCallStatusChange(status.value)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex flex-col md:flex-row justify-between items-center px-4 py-4 gap-4">
                        <div className="flex items-center gap-4">
                            <select
                                value={limit}
                                onChange={(e) => handleLimitChange(Number(e.target.value))}
                                className="border border-gray-300 rounded-lg bg-white p-2"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                                <option value={250}>250</option>
                            </select>

                            {/* Show current status info */}
                            <div className="text-sm text-gray-600">
                                <span className="font-medium">
                                    {getCurrentStatusTotal} total results
                                </span>
                                {getCurrentStatusTotal > 0 && (
                                    <span className="ml-2">
                                        (Page {page} of {maxPage})
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page <= 1}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                                title="Previous page"
                            >
                                {"<"}
                            </button>

                            {/* Page input for direct navigation */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Page</span>
                                <input
                                    type="number"
                                    min="1"
                                    max={maxPage}
                                    value={page}
                                    onChange={(e) => {
                                        const newPage = parseInt(e.target.value);
                                        if (newPage >= 1 && newPage <= maxPage) {
                                            handlePageChange(newPage);
                                        }
                                    }}
                                    className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                />
                                <span className="text-sm text-gray-600">of {maxPage}</span>
                            </div>

                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page >= maxPage || !hasNextPage || getCurrentStatusTotal === 0}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                                title="Next page"
                            >
                                {">"}
                            </button>
                        </div>
                    </div>

                    {/* Leads Table with Loading Overlay */}
                    <div className="bg-white rounded-lg shadow-md p-4 mx-4 mb-4 overflow-x-auto relative">
                        {/* Loading Overlay */}
                        {isAnyLoading && (
                            <div className="absolute inset-0 bg-white/75 backdrop-blur-sm flex items-center justify-center z-10">
                                <div className="flex flex-col items-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                                    <span className="text-sm text-gray-600">
                                        {isSearching ? "Searching..." :
                                            isTabSwitching ? "Switching tabs..." :
                                                isStatusChanging ? "Changing status..." : "Loading..."}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Table Header */}
                        <div className="border-b-2 border-b-gray-300 p-3 flex flex-row items-center">
                            <div className="flex items-center justify-center">
                                <input
                                    type="checkbox"
                                    checked={data?.data?.fields_?.every((item: { _id: any }) =>
                                        selectedUserIds.includes(item._id)
                                    )}
                                    onChange={handleBulkSelection}
                                    className="w-4 h-4"
                                />
                            </div>
                            <div className="basis-3/12 px-2">
                                <p className="font-semibold text-lg text-gray-600/70">Name</p>
                            </div>

                            {/* NEW: Assigned User Column - Only show when viewing specific staff */}
                            {viewStaffId && (
                                <div className="basis-3/12 px-2">
                                    <p className="font-semibold text-lg text-gray-600/70">Assigned User</p>
                                </div>
                            )}

                            <div className="basis-2/12 px-2">
                                <p className="font-semibold text-lg text-gray-600/70">Call Status</p>
                            </div>
                            <div className="basis-3/12 px-2">
                                <p className="font-semibold text-lg text-gray-600/70">Created At</p>
                            </div>
                            <div className="basis-3/12 px-2">
                                <p className="font-semibold text-lg text-gray-600/70">Last Called At</p>
                            </div>
                            <div className="basis-2/12 px-2">
                                <p className="font-semibold text-lg text-gray-600/70">Total Calls</p>
                            </div>
                            <div className="basis-3/12 px-8">
                                <p className="font-semibold text-lg text-gray-600/70">Actions</p>
                            </div>
                        </div>

                        {/* Table Body */}
                        <div className="overflow-y-auto">
                            {processedLeads.length > 0 ? (
                                processedLeads.map((lead_: any) => (
                                    <TableRow
                                        key={lead_._id}
                                        setId={setId}
                                        lead_={lead_}
                                        setLeadForm={setLeadForm}
                                        setLeadFormData={setLeadFormData}
                                        selectedStatus={selectedLeadStatus}
                                        search={search}
                                        leadType={leadType}
                                        isLeadsPage={true}
                                        showAssignedUser={!!viewStaffId}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-10">
                                    <p className="font-semibold text-gray-400">
                                        {isAnyLoading ? "Loading data..." : "No Data Found!"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals and Popups */}
            {/* {multiFilter && (
                <FilterUI
                    setMultiFilter={(value: boolean | ((prevState: boolean) => boolean)) => {
                        setMultiFilter(value);
                        if (!value) {
                            setSearchMulti(null);
                        }
                    } }
                    multiFilter={multiFilter}
                    setSearchMulti={setSearchMulti}
                    selectedFilters={selectedFilters}
                    setSelectedFilters={setSelectedFilters}
                    pageType="leads" setAppliedFilters={undefined} setAppliedFilters={function (value: Record<string, any>): void {
                        throw new Error("Function not implemented.");
                    } }                />
            )} */}
            {pop && <PopUpToAddLead setPop={setPop} setLeadForm={setLeadForm} />}
            {queryForm && (
                <QueryForm
                    leadIndex={leadIndex}
                    setLeadIndex={setLeadIndex}
                    setQueryForm={setQueryForm}
                    setQueryFormType_={setQueryFormType_}
                    id={id}
                    type_={queryFormType_}
                    refetch={refetch}
                />
            )}
            {leadForm && (
                <LeadForm
                    setLeadForm={setLeadForm}
                    leadFormData={leadFormData}
                    setLeadFormData={setLeadFormData}
                />
            )}
            {id && (
                <QueryTable
                    setLeadForm={setId}
                    setLeadIndex={setLeadIndex}
                    id={id}
                    setQueryForm={setQueryForm}
                    setQueryFormType_={setQueryFormType_}
                    selectedStatus={selectedCallStatus || selectedLeadStatus}
                />
            )}
        </div>
    );
};

export default Lead;