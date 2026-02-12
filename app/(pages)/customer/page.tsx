"use client";
import React, { useEffect, useState } from "react";
import { useG_CustomerQuery } from "./../../_api_query/Leads/leads.api";
import { useDispatch_ } from "@/store";
import { loader, setUserHierarchy } from "./../../_api_query/store";
import Header from "./../../_components/header";
import { FaSearch, FaPhone } from 'react-icons/fa';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Sidebar from "./../../_components/Sidebar";
import QueryForm from './../../_components/Form';
import QueryTable from "./../../_components/Query";
import { useAuth } from "../../_components/useAuth";
import { HierarchyService } from "@app/services/hierarchyService";

interface CustomerData {
    _id: string;
    name: string;
    phone: string;
    source: string;
    createAt: any;
}

export default function Customer() {
    const dispatch = useDispatch_();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [role_, setRole] = useState<number>(1);
    const [queryForm, setQueryForm] = useState(false);
    const [queryFormType_, setQueryFormType_] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
    const [leadIndex, setLeadIndex] = useState(NaN);
    const [hierarchyLoading, setHierarchyLoading] = useState(true);
    const [accessibleUserIds, setAccessibleUserIds] = useState<string[]>([]);
    const { getAuthHeaders } = useAuth();

    useEffect(() => {
        const loadHierarchy = async () => {
            try {
                const storedHierarchy = localStorage.getItem('userHierarchy');
                if (storedHierarchy) {
                    const parsed = JSON.parse(storedHierarchy);
                    dispatch(setUserHierarchy(parsed));
                }

                // Optionally refresh hierarchy data
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

    const { 
        data, 
        isError, 
        isSuccess, 
        isLoading, 
        error,
        isFetching,
        refetch 
    } = useG_CustomerQuery(
        { 
            search, 
            page, 
            limit,
            userIds: role_ !== 1 && role_ !== 2 ? accessibleUserIds : undefined 
        },
        { 
            refetchOnMountOrArgChange: true,
            skip: hierarchyLoading && (role_ !== 1 && role_ !== 2)
        }
    );

    // Loading and error handling
    useEffect(() => {
        if (isLoading || isFetching || hierarchyLoading) {
            dispatch(loader(true));
        } else {
            dispatch(loader(false));
        }

        if (isError && error) {
            console.error('Error fetching customers:', error);
        }
    }, [isLoading, isSuccess, isError, error, isFetching, hierarchyLoading, dispatch]);

    const handleCall = (phone: string) => {
        if (phone === "No Phone Present") {
            alert('Unable to dial this number.');
            return;
        }
        window.location.href = `tel:${phone}`;
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 p-8">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                        <Header header="Customer" />
                    </div>

                    {/* Main content card */}
                    <div className="bg-gradient-to-r from-[#9e4e8e] to-[#504f99] rounded-2xl shadow-lg p-6">
                        {/* Customer count */}
                        <div className="text-white font-semibold text-xl px-4 mb-4">
                            Total Customer: {data?.data?.count || 0}
                        </div>

                        {/* Search bar */}
                        <div className="flex items-center bg-white/20 rounded-full px-4 py-2 gap-x-2 max-w-2xl mx-auto mb-4">
                            <FaSearch className="text-white/80" size={20} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search"
                                className="w-full bg-transparent text-lg font-semibold text-white placeholder:text-white/80 focus:outline-none"
                            />
                        </div>

                        {/* Pagination controls */}
                        <div className="flex justify-between items-center mb-4 px-4">
                            <div className="flex items-center space-x-2">
                                <select
                                    value={limit}
                                    onChange={(e) => setLimit(Number(e.target.value))}
                                    className="bg-white rounded-lg px-3 py-1 border border-gray-300"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                    <option value={250}>250</option>
                                </select>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        if (page > 1) {
                                            setPage(page - 1);
                                            refetch();
                                        }
                                    }}
                                    disabled={page === 1}
                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-600 text-white disabled:opacity-50"
                                >
                                    <FiChevronLeft />
                                </button>
                                <span className="text-white font-semibold text-xl">{page}</span>
                                <button
                                    onClick={() => {
                                        setPage(page + 1);
                                        refetch();
                                    }}
                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-600 text-white"
                                >
                                    <FiChevronRight />
                                </button>
                            </div>
                        </div>

                        {/* Customer table */}
                        {!queryForm && (
                            <div className="bg-white rounded-lg shadow-md -mt-7 overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b-2 border-gray-300">
                                            <th className="text-left p-4 font-semibold text-gray-600/70 w-5/12">Name</th>
                                            <th className="text-left p-4 font-semibold text-gray-600/70 w-3/12">Phone</th>
                                            <th className="text-left p-4 font-semibold text-gray-600/70 w-4/12">Source</th>
                                            <th className="text-left p-4 font-semibold text-gray-600/70 w-4/12">Created At</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isSuccess && data?.data?.fields_?.length > 0 ? (
                                            [...data.data.fields_]
                                                .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''))
                                                .map((customer: CustomerData) => (
                                                    <tr 
                                                        key={customer._id}
                                                        className="border-b border-gray-300 hover:bg-gray-50"
                                                    >
                                                        <td className="p-4">
                                                            <div 
                                                                className="flex items-center gap-2 cursor-pointer"
                                                                onClick={() => setSelectedCustomer(customer)}
                                                            >
                                                                <div className="bg-[#004aad] w-8 h-8 rounded-full flex items-center justify-center">
                                                                    <span className="text-white font-semibold">
                                                                        {customer.name?.[0]?.toUpperCase()}
                                                                    </span>
                                                                </div>
                                                                <span className="font-semibold text-sm text-gray-600/70">
                                                                    {customer.name?.toUpperCase()}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div 
                                                                className="flex items-center gap-2 cursor-pointer"
                                                                onClick={() => handleCall(customer.phone || "No Phone Present")}
                                                            >
                                                                <span className="font-semibold text-sm text-gray-600/70">
                                                                    {customer.phone?.toUpperCase() || "No Phone Present"}
                                                                </span>
                                                                <FaPhone className="text-gray-600/70" />
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className="font-semibold text-sm text-gray-600/70">
                                                                {customer.source?.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className="font-semibold text-sm text-gray-600/70">
                                                                {customer?.createAt ? new Date(customer?.createAt).toLocaleString("en-IN", {
                                                                    timeZone: "Asia/Kolkata",
                                                                    day: "2-digit",
                                                                    month: "2-digit",
                                                                    year: "numeric",
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                    hour12: true
                                                                }) : '-'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="text-center py-10 text-gray-400 text-lg font-semibold">
                                                    {isLoading || isFetching || hierarchyLoading ? 'Loading...' : 'No Data Found!'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {queryForm && (
                <QueryForm 
                    leadIndex={leadIndex}
                    setLeadIndex={setLeadIndex}
                    setQueryForm={setQueryForm}
                    setQueryFormType_={setQueryFormType_}
                    id={selectedCustomer?._id}
                    type_={queryFormType_}
                />
            )}
            
            {selectedCustomer && (
                <QueryTable 
                    setLeadForm={setSelectedCustomer}
                    setLeadIndex={setLeadIndex}
                    id={selectedCustomer}
                    setQueryForm={setQueryForm}
                    setQueryFormType_={setQueryFormType_}
                />
            )}
        </div>
    );
}