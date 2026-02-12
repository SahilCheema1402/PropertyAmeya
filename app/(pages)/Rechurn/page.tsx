"use client";
import React, { useState, useEffect } from "react";
import Header from "../../_components/header";
import Sidebar from "../../_components/Sidebar";
import { debounce } from "lodash";
import {
    useAssignRechurnLeadsMutation,
    useAssignSingleRechurnLeadMutation,
    useG_Rechurn_LeadsQuery,
    useLazyCheck_Rechurn_LeadsQuery,
    useMove_To_RechurnMutation,
} from "../../_api_query/Leads/leads.api";
import { loader } from "../../_api_query/store";
import { FaSearch, FaRecycle, FaSync, FaFilter } from "react-icons/fa";
import { useAuth } from "../../_components/useAuth";
import { useDispatch_ } from "@/store";
import { useSelector } from "react-redux";
import { clearUserSelection, toggleUserSelection } from "../../_api_query/store";
import { toast } from "react-toastify";
import { useG_STAFFQuery } from "@app/_api_query/staff/staffs.api";
import { DateTime } from 'luxon';

const RechurnLeads = () => {
    const dispatch = useDispatch_();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const selectedUserIds = useSelector((state: any) => state.store.selectedUserIds);
    const [role_, setRole] = useState<any>(1);
    const [token, setToken] = useState("");
    const [user, setUser] = useState("");
    const [searchError, setSearchError] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [lastChecked, setLastChecked] = useState<string>("");
    // const [rechurnThresholdMinutes, setRechurnThresholdMinutes] = useState(2);
    const [rechurnThresholdDays, setRechurnThresholdDays] = useState(30);
    const [totalRechurnCount, setTotalRechurnCount] = useState(0);
    const [staffId, setStaffId] = useState<string>("");
    const [lastAssignedToFilter, setLastAssignedToFilter] = useState<string>(""); // New filter state
    const [assignRechurnLeads] = useAssignRechurnLeadsMutation();
    const [assignSingleRechurnLead] = useAssignSingleRechurnLeadMutation();
    const [quickAssignStaffId, setQuickAssignStaffId] = useState("");
    const [currentUserId, setCurrentUserId] = useState<string>("");
    const [leadStaffAssignments, setLeadStaffAssignments] = useState<Record<string, string>>({});

    // Helper function to capitalize first letter of each word
    const capitalizeWords = (str: string) => {
        if (!str) return '';
        return str.split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    };

    const { data, isError, isSuccess, isLoading, error, refetch } = useG_Rechurn_LeadsQuery(
        {
            page,
            limit,
            search,
            thresholdDays: rechurnThresholdDays,
            leadStatus: 'fresh',
            lastAssignedTo: lastAssignedToFilter // Add filter to query
        },
        {
            refetchOnMountOrArgChange: true
        }
    );

    const { data: Sdata } = useG_STAFFQuery(
        currentUserId,
        {
            refetchOnMountOrArgChange: true,
            refetchOnFocus: false
        }
    );

    useEffect(() => {
        function roleFetch() {
            if (typeof window !== "undefined") {
                const role = localStorage.getItem("role");
                const token = localStorage.getItem("accessToken") || "";
                const user = localStorage.getItem("comUserId") || "";
                const userId = localStorage.getItem("UserId");
                setToken(token);
                setUser(user || "");
                setCurrentUserId(userId || "");
                setRole(role);
            }
        }
        roleFetch();
    }, [token, user, role_]);

    useEffect(() => {
        if (data) {
            setTotalRechurnCount(data?.data?.totalRechurn || 0);
        }
    }, [data]);

    const [moveToRechurn] = useMove_To_RechurnMutation();
    const [triggerCheckRechurn] = useLazyCheck_Rechurn_LeadsQuery();

    useEffect(() => {
        const checkRechurnLeads = async () => {
            try {
                const result = await triggerCheckRechurn(rechurnThresholdDays).unwrap();
                setLastChecked(new Date().toLocaleTimeString());
                if (result.success && result.count > 0) {
                    toast.info(`${result.count} leads moved to rechurn`);
                    refetch();
                }
            } catch (err) {
                console.error("Failed to check rechurn leads:", err);
            }
        };

        checkRechurnLeads();
        const interval = setInterval(checkRechurnLeads, 2 * 60 * 1000); // 200 minutes

        return () => clearInterval(interval);
    }, [triggerCheckRechurn, refetch, rechurnThresholdDays]);

    useEffect(() => {
        const debouncedSetSearch = debounce((value) => {
            setSearch(value);
        }, 500);

        if (debouncedSearch.length <= 50) {
            setSearchError("");
            debouncedSetSearch(debouncedSearch);
        } else {
            setSearchError("Search text is too long. Please shorten your search.");
        }

        return () => {
            debouncedSetSearch.cancel();
        };
    }, [debouncedSearch]);

    // Reset page when filter changes
    useEffect(() => {
        setPage(1);
    }, [lastAssignedToFilter, search]);

    const handleLimitChange = (newLimit: number) => {
        if (newLimit > 0 && newLimit <= 250) {
            setLimit(newLimit);
            setPage(1);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage > 0) {
            setPage(newPage);
        }
    };

    const handleMoveToRechurn = async () => {
        try {
            if (selectedUserIds.length === 0) {
                return toast.error("Please select leads to rechurn");
            }

            dispatch(loader(true));
            const res = await moveToRechurn({
                leadIds: selectedUserIds,
                thresholdDays: rechurnThresholdDays
            }).unwrap();
            dispatch(clearUserSelection());
            refetch();
            toast.success(res.message || "Leads moved to rechurn successfully");
        } catch (error: any) {
            console.error("Error:", error);
            toast.error(error?.data?.message || "Failed to move leads to rechurn");
        } finally {
            dispatch(loader(false));
        }
    };

    const handleManualRefresh = async () => {
        try {
            dispatch(loader(true));
            await refetch();
            toast.success("Leads refreshed successfully");
        } catch (error) {
            toast.error("Failed to refresh leads");
        } finally {
            dispatch(loader(false));
        }
    };

    const handleBulkSelection = () => {
        const allIds = data?.data?.fields_?.map((item: { _id: any }) => item._id);
        if (data?.data?.fields_?.every((item: { _id: any }) => selectedUserIds.includes(item._id))) {
            dispatch(clearUserSelection());
        } else {
            dispatch(toggleUserSelection(allIds));
        }
    };

    // Clear filters function
    const clearFilters = () => {
        setLastAssignedToFilter("");
        setDebouncedSearch("");
        setSearch("");
        setPage(1);
    };

    useEffect(() => {
        if (isLoading) {
            dispatch(loader(true));
        } else {
            dispatch(loader(false));
        }

        if (isError) {
            if (error && "data" in error) {
                toast.error((error.data as { message: string }).message || "An error occurred");
            } else {
                toast.error("An error occurred");
            }
        }
    }, [isLoading, isSuccess, isError, error]);

    const submitBulkAssignment = async () => {
        try {
            if (!staffId) {
                return toast.error("Please select a staff member first");
            }
            if (selectedUserIds.length === 0) {
                return toast.error("Please select leads to assign");
            }

            dispatch(loader(true));
            await assignRechurnLeads({
                leadIds: selectedUserIds,
                staffId,
                assignAt: DateTime.now().setZone('Asia/Kolkata').toJSDate(),
                updateAt: DateTime.now().setZone('Asia/Kolkata').toJSDate()
            }).unwrap();

            setStaffId("");
            dispatch(clearUserSelection());
            refetch();
            toast.success("Leads assigned successfully");
        } catch (error: any) {
            console.error("Error:", error);
            toast.error(error?.data?.message || "Failed to assign leads");
        } finally {
            dispatch(loader(false));
        }
    };

    const assignSingleLead = async (leadId: string, staffId: string) => {
        try {
            if (!staffId) {
                return toast.error("Please select a staff member first");
            }

            dispatch(loader(true));
            await assignSingleRechurnLead({
                leadId,
                staffId,
                assignAt: DateTime.now().setZone('Asia/Kolkata').toJSDate(),
                updateAt: DateTime.now().setZone('Asia/Kolkata').toJSDate()
            }).unwrap();

            refetch();
            toast.success("Lead assigned successfully");
        } catch (error: any) {
            console.error("Error:", error);
            toast.error(error?.data?.message || "Failed to assign lead");
        } finally {
            dispatch(loader(false));
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar className="flex-shrink-0" />

            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 px-4 py-4 bg-white shadow-sm">
                    <div className="flex gap-4">
                        <button
                            className="bg-gradient-to-r from-pink-600 to-indigo-600 flex items-center gap-x-1 px-4 py-2 rounded-lg text-white"
                            onClick={handleManualRefresh}
                        >
                            <FaSync color="#fff" size={22} />
                            <span className="text-white font-semibold text-base">Refresh</span>
                        </button>
                    </div>
                    <div className="flex flex-col items-center">
                        <Header header="Rechurn Leads (Fresh Only)" />
                        <div className="flex gap-4 mt-2">
                            <span className="text-sm font-semibold bg-blue-100 px-2 py-1 rounded">
                                Total Rechurn Leads: <span className="text-blue-600 font-bold">{totalRechurnCount}</span>
                            </span>
                            <span className="text-sm font-semibold bg-green-100 px-2 py-1 rounded">
                                Showing: <span className="text-green-600 font-bold">{data?.data?.fields_?.length || 0}</span> of {data?.data?.total || 0}
                            </span>
                        </div>
                    </div>
                    {lastChecked && (
                        <span className="text-xs text-gray-500">
                            Last checked: {lastChecked}
                        </span>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="flex justify-between items-center p-4 bg-white">
                        <div className="flex items-center gap-4">
                            <select
                                value={staffId}
                                onChange={(e) => setStaffId(e.target.value)}
                                className="flex-1 p-2 text-white bg-indigo-600 rounded-lg"
                            >
                                <option value="">Select Staff for Bulk Assign</option>
                                {Sdata?.data?.map((staff: any) => (
                                    <option key={staff._id} value={staff._id} className="bg-white text-black">
                                        {capitalizeWords(staff.userName)}
                                        {staff._id === currentUserId ? " (You)" : ""}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={submitBulkAssignment}
                                disabled={!staffId}
                                className={`px-4 py-2 rounded-lg ${staffId ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
                            >
                                Assign Selected
                            </button>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-pink-600 to-indigo-600 pt-4 rounded-2xl mx-4">
                        <div className="flex flex-col w-5/6 mx-auto">
                            <div className="flex flex-row items-center bg-slate-100/20 rounded-full px-4 py-2 gap-x-2 overflow-y-hidden my-3">
                                <FaSearch color="#ffffffc8" size={24} />
                                <input
                                    type="search"
                                    value={debouncedSearch}
                                    onChange={(e) => setDebouncedSearch(e.target.value)}
                                    placeholder="Search rechurn leads..."
                                    className="w-full bg-transparent text-sm md:text-xl font-semibold text-white placeholder:text-white/80 pr-2 focus:outline-none"
                                />
                            </div>
                            {searchError && (
                                <div className="text-red-400 text-sm mt-1 text-center">
                                    {searchError}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Filter Section */}
                    <div className="bg-white mx-4 mt-4 p-4 rounded-lg shadow-sm border">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <FaFilter className="text-gray-500" />
                                <span className="font-semibold text-gray-700">Filters:</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <label htmlFor="lastAssignedFilter" className="text-sm font-medium text-gray-700">
                                    Last Assigned To:
                                </label>
                                <select
                                    id="lastAssignedFilter"
                                    value={lastAssignedToFilter}
                                    onChange={(e) => setLastAssignedToFilter(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-1 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">All Staff</option>
                                    {Sdata?.data?.map((staff: any) => (
                                        <option key={staff._id} value={staff._id}>
                                            {capitalizeWords(staff.userName)}
                                            {staff._id === currentUserId ? " (You)" : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Clear filters button */}
                            {(lastAssignedToFilter || search) && (
                                <button
                                    onClick={clearFilters}
                                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
                                >
                                    Clear Filters
                                </button>
                            )}

                            {/* Active filter indicators */}
                            <div className="flex gap-2">
                                {lastAssignedToFilter && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Last Assigned: {capitalizeWords(Sdata?.data?.find((staff: any) => staff._id === lastAssignedToFilter)?.userName || '')}
                                        <button
                                            onClick={() => setLastAssignedToFilter('')}
                                            className="ml-1 text-blue-600 hover:text-blue-800"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                                {search && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Search: "{search}"
                                        <button
                                            onClick={() => {
                                                setSearch('');
                                                setDebouncedSearch('');
                                            }}
                                            className="ml-1 text-green-600 hover:text-green-800"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center px-4 py-4 gap-4">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center group relative">
                                <span className="text-sm">Rechurn Threshold (days):</span>
                                <div className="ml-1 relative">
                                    <span className="text-gray-500 cursor-help" title="Leads will return to rechurn if inactive for this many days after assignment">
                                        ⓘ
                                    </span>
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-64 z-10">
                                        <div className="text-center">
                                            <strong>Rechurn Logic:</strong><br />
                                            • New leads: No activity for X days after assignment<br />
                                            • Old leads: No activity beyond 30 days from assignment<br />
                                            • Active leads: Recent activity keeps them assigned
                                        </div>
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                                    </div>
                                </div>
                            </div>
                            <input
                                type="number"
                                value={rechurnThresholdDays}
                                onChange={(e) => setRechurnThresholdDays(Number(e.target.value))}
                                className="border border-gray-300 rounded-lg bg-white p-2 w-20"
                                min="1"
                                max="365"
                            />
                            <span className="text-xs text-gray-500">
                                (Adjust if you want to change the threshold for rechurn leads)
                            </span>
                        </div>

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

                            <button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page <= 1}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-600 text-white disabled:bg-gray-300"
                            >
                                {"<"}
                            </button>
                            <span className="font-semibold text-xl">{page}</span>
                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={!data?.data?.fields_?.length}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-600 text-white disabled:bg-gray-300"
                            >
                                {">"}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-4 mx-4 mb-4 overflow-x-auto">
                        <div className="border-b-2 border-b-gray-300 p-3 flex flex-row items-center">
                            <div className="px-4">
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
                            <div className="basis-3/12 px-2">
                                <p className="font-semibold text-lg text-gray-600/70">Phone</p>
                            </div>
                            <div className="basis-3/12 px-2">
                                <p className="font-semibold text-lg text-gray-600/70">Email</p>
                            </div>
                            <div className="basis-3/12 px-2">
                                <p className="font-semibold text-lg text-gray-600/70">Created At</p>
                            </div>
                            <div className="basis-3/12 px-2">
                                <p className="font-semibold text-lg text-gray-600/70">Source</p>
                            </div>
                            <div className="basis-3/12 px-2">
                                <p className="font-semibold text-lg text-gray-600/70">Last Assigned To</p>
                            </div>
                            <div className="basis-4/12 px-2">
                                <p className="font-semibold text-lg text-gray-600/70">Actions</p>
                            </div>
                        </div>

                        <div className="overflow-y-auto">
                            {data?.data?.fields_?.length > 0 ? (
                                [...data.data.fields_]
                                    .sort((a: any, b: any) => {
                                        if (a.name && b.name) {
                                            return a.name.localeCompare(b.name);
                                        }
                                        return 0;
                                    })
                                    .map((lead_: any) => (
                                        <div key={lead_._id} className="border-b-[1px] border-b-gray-300 w-full p-3 flex flex-row items-center overflow-auto">
                                            <div className="px-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUserIds.includes(lead_._id)}
                                                    onChange={() => dispatch(toggleUserSelection(lead_?._id))}
                                                    className="w-4 h-4"
                                                />
                                            </div>
                                            <div className="basis-3/12 px-2">
                                                <p className="font-semibold text-[10px] text-gray-600/70">
                                                    {lead_?.name?.toUpperCase() || '-'}
                                                </p>
                                            </div>
                                            <div className="basis-3/12 px-2">
                                                <p className="font-semibold text-[10px] text-gray-600/70">
                                                    {lead_?.phone || '-'}
                                                </p>
                                            </div>
                                            <div className="basis-3/12 px-2">
                                                <p className="font-semibold text-[10px] text-gray-600/70">
                                                    {lead_?.email || '-'}
                                                </p>
                                            </div>
                                            <div className="basis-3/12 px-2">
                                                <p className="font-semibold text-[10px] text-gray-600/70">
                                                    {lead_?.createAt ? new Date(lead_?.createAt).toLocaleString("en-IN", {
                                                        timeZone: "Asia/Kolkata",
                                                        day: "2-digit",
                                                        month: "2-digit",
                                                        year: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                        hour12: true
                                                    }) : '-'}
                                                </p>
                                            </div>
                                            <div className="basis-3/12 px-2">
                                                <p className="font-semibold text-[10px] text-gray-600/70">
                                                    {lead_?.source || '-'}
                                                </p>
                                            </div>
                                            <div className="basis-3/12 px-2">
                                                <div className="flex flex-col">
                                                    <p className="font-semibold text-[10px] text-gray-600/70">
                                                        {lead_?.lastAssignedTo ? capitalizeWords(lead_.lastAssignedTo) : 'NO Data'}
                                                    </p>
                                                   
                                                </div>
                                            </div>
                                            <div className="basis-4/12 px-2">
                                                <select
                                                    value={leadStaffAssignments[lead_._id] || ""}
                                                    onChange={(e) => setLeadStaffAssignments(prev => ({
                                                        ...prev,
                                                        [lead_._id]: e.target.value
                                                    }))}
                                                    className="p-1 border rounded text-sm"
                                                >
                                                    <option value="">Select Staff</option>
                                                    {Sdata?.data?.map((staff: any) => (
                                                        <option key={staff._id} value={staff._id}>
                                                            {capitalizeWords(staff.userName)}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => assignSingleLead(lead_._id, leadStaffAssignments[lead_._id])}
                                                    disabled={!leadStaffAssignments[lead_._id]}
                                                    className={`ml-2 px-2 py-1 rounded text-sm ${leadStaffAssignments[lead_._id]
                                                        ? "bg-green-500 text-white hover:bg-green-600"
                                                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                        }`}
                                                >
                                                    Assign
                                                </button>
                                            </div>
                                        </div>
                                    ))
                            ) : (
                                <div className="text-center py-10">
                                    <p className="font-semibold text-gray-400">No Rechurn Leads Found!</p>
                                    {(lastAssignedToFilter || search) && (
                                        <p className="text-sm text-gray-500 mt-2">
                                            Try clearing your filters to see all rechurn leads.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RechurnLeads;