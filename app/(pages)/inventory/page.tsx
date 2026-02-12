"use client";
export const dynamic = 'force-dynamic';
import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from 'next/navigation';
import { useG_InventoryQuery, useGetMultiFilterInventoryDataQuery, useD_LeadMutation } from "./../../_api_query/Inventory/inventory.api";
import { useDispatch_ } from "@/store";
import { loader } from "./../../_api_query/store";
import Header from "./../../_components/header";
import InventoryForm from './../../_components/InventoryForm';
import { FaFilter, FaPlus, FaSearch } from 'react-icons/fa';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Sidebar from "./../../_components/Sidebar";
import FilterUI from "./../../_components/FilterUI";
import { MdDelete } from '@node_modules/react-icons/md';
import { toast } from "react-toastify";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoImg from '../../../assets/images/property 360.png';
import FilterSummary from "./FilterSummary";

interface InventoryData {
    front: string;
    height: string;
    parking: string;
    parking_type: string;
    _id?: string;
    project: string;
    unit_no: string;
    area: string;
    type: string;
    facing: string;
    demand: string;
    name?: string;
    phone?: string;
    email?: string;
    bhk?: string;
    dimension?: string;
    tower_no?: string;
    budget?: string;
    expected_rent?: string;
    remarks?: string;
    inventoryType?: string;
    status?: string;
    tenant?: string;
    amount: string;
    landing?: string;
    registry?: string;
    expVisitTime?: string;
    mobile?: string;
    address?: string;
    available_date?: string | null;
    deal_closing_date?: string | null;
    createAt?: string;
    company?: string;
    createdBy?: any;
    closing_amount?: string | null;
    purpose?: string | null;
    location?: string | null;
    tenant_mobile_no?: string | null;
    landing_amount?: string | null;

}

function Inventories() {
    const [pop, setPop] = useState(false);
    const searchParams = useSearchParams();
    const dispatch = useDispatch_();
    const [search, setSearch] = useState("");
    const [leadType, setLeadType] = useState<string>("all");
    const [role_, setRole] = useState<number>(1);
    const [userId, setUserId] = useState<any>(null);
    const [type_, setType_] = useState<string>("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [inventoryFormData, setInventoryFormData] = useState<InventoryData | null>(null);
    const [deleteTerms] = useD_LeadMutation();

    // Filter states
    const [multiFilter, setMultiFilter] = useState(false);
    const [searchMulti, setSearchMulti] = useState('inventoryMultiFilter?company=672876351633b41e68d7c51e');
    const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
    const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});
    const [propertyCat, setPropertyCat] = useState<string>(''); // "residential" | "commercial"
    const [dealType, setDealType] = useState<string>('');       // "rent" | "resale"

    // Table container ref for scrolling
    const tableContainerRef = React.useRef<HTMLDivElement>(null);

    // Whenever either dropdown changes, rebuild the single string the API expects
    useEffect(() => {
        if (!propertyCat || !dealType) {
            setLeadType('all');          // nothing chosen
        } else {
            // e.g. "Rent Residential"
            const formatted = `${dealType} ${propertyCat.charAt(0).toUpperCase()}${propertyCat.slice(1)}`;
            setLeadType(formatted);
        }
    }, [propertyCat, dealType]);

    // Check if we're using filters
    const isUsingFilters = searchMulti !== 'inventoryMultiFilter?company=672876351633b41e68d7c51e';

    // Queries
    const {
        data: mainData,
        isError,
        isSuccess,
        isLoading,
        error,
        refetch
    } = useG_InventoryQuery(
        { search, leadType, limit, page },
        {
            refetchOnMountOrArgChange: true,
            skip: isUsingFilters // Skip main query when using filters
        }
    );

    const {
        data: filteredData,
        isLoading: isFilterLoading,
        error: filterError,
        refetch: refetchFiltered
    } = useGetMultiFilterInventoryDataQuery(
        searchMulti,
        {
            skip: !isUsingFilters, // Only run when we have filters
            refetchOnMountOrArgChange: true
        }
    );

    // Clear all filters handler
    const handleClearAllFilters = () => {
        setSearchMulti('inventoryMultiFilter?company=672876351633b41e68d7c51e');
        setSelectedFilters([]);
        setAppliedFilters({});
        setPage(1); // Reset to first page
    };

    // Clear single filter handler
    const handleClearSingleFilter = (filterKey: string) => {
        try {
            // Parse current URL
            const urlParts = searchMulti.split('?');
            if (urlParts.length < 2) return;

            const params = new URLSearchParams(urlParts[1]);

            // Remove the filter parameter(s)
            if (filterKey.includes('_range')) {
                const baseKey = filterKey.replace('_range', '');
                params.delete(`${baseKey}_min`);
                params.delete(`${baseKey}_max`);
            } else {
                params.delete(filterKey);
            }

            // Rebuild the query string
            const newQuery = `inventoryMultiFilter?${params.toString()}`;
            setSearchMulti(newQuery);

            // Update selected filters
            setSelectedFilters(prev => prev.filter(f => f !== filterKey));

            // Update applied filters
            setAppliedFilters(prev => {
                const newFilters = { ...prev };
                delete newFilters[filterKey];
                return newFilters;
            });

            setPage(1); // Reset to first page
        } catch (error) {
            console.error('Error clearing single filter:', error);
        }
    };

    // Export data handler
    const handleExportData = () => {
        try {
            const dataToExport = isUsingFilters ? filteredData?.data?.fields_ : mainData?.data?.fields_;

            if (!dataToExport || dataToExport.length === 0) {
                toast.error('No data to export');
                return;
            }

            const exportData = dataToExport.map((inventory: InventoryData) => ({
                Project: inventory.project || '',
                'Unit No': inventory.unit_no || '',
                Area: inventory.area || '',
                Type: inventory.type || '',
                Facing: inventory.facing || '',
                Demand: inventory.demand || '',
                Status: inventory.status || '',
                Owner: inventory?.createdBy?.name || '',
                Tenant: inventory.tenant || '',
                'Expected Rent': inventory.expected_rent || '',
                'Tower No': inventory.tower_no || '',
                Location: inventory.location || '',
                'Available Date': inventory.available_date || '',
                'Created Date': inventory.createAt ? new Date(inventory.createAt).toLocaleDateString() : ''
            }));

            // Convert to CSV and download
            const csvContent = "data:text/csv;charset=utf-8,"
                + Object.keys(exportData[0] || {}).join(",") + "\n"
                + exportData.map((row: Record<string, any>) =>
                    Object.values(row).map(value =>
                        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
                    ).join(",")
                ).join("\n");

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `inventory_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success('Data exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export data');
        }
    };

    // Delete handler
    const handleDeleteTerm = async (id: any) => {
        try {
            dispatch(loader(true));
            const res = await deleteTerms(id).unwrap();

            // Refetch appropriate data
            if (isUsingFilters) {
                refetchFiltered();
            } else {
                refetch();
            }

            toast.success("Inventory Deleted Successfully");
            dispatch(loader(false));
        } catch (error: any) {
            dispatch(loader(false));
            toast.error("Inventory Deleted Failed");
            console.error('Delete error:', error);
        }
    };

    // Loading state management
    useEffect(() => {
        if (isLoading || isFilterLoading) {
            dispatch(loader(true));
        } else {
            dispatch(loader(false));
        }

        if (isError && error) {
            console.error('Error fetching inventory:', error);
        }

        if (filterError) {
            console.error('Error fetching filtered inventory:', filterError);
        }
    }, [isLoading, isSuccess, isError, error, isFilterLoading, filterError, dispatch]);

    // Get role and user info
    useEffect(() => {
        const role = localStorage.getItem('role');
        if (role) setRole(Number(role));

        const comUserId = localStorage.getItem('comUserId');
        if (comUserId) {
            try {
                const parsedUser = JSON.parse(comUserId);
                setUserId(parsedUser.userId);
            } catch (error) {
                console.error("Error parsing comUserId from localStorage:", error);
            }
        }
    }, []);

    // Handle inventory click
    const handleInventoryClick = (inventory: InventoryData) => {
        setInventoryFormData(inventory);
        setType_("update");
        setPop(true);
    };

    // Pagination handlers
    const handlePreviousPage = () => {
        if (page > 1) setPage(page - 1);
    };

    const handleNextPage = () => {
        setPage(page + 1);
    };

    // Get display data - prioritize filtered data when available
    const displayData = React.useMemo(() => {
        if (isUsingFilters && filteredData?.data?.fields_) {
            // Update applied filters from response - THIS IS IMPORTANT
            if (filteredData.data.appliedFilters) {
                console.log('API returned appliedFilters:', filteredData.data.appliedFilters);
                // Convert API response format to our internal format
                const convertedFilters: Record<string, any> = {};

                Object.entries(filteredData.data.appliedFilters).forEach(([key, value]) => {
                    if (key.includes('_range') && value && typeof value === 'object') {
                        // Handle range filters
                        const baseKey = key.replace('_range', '');
                        convertedFilters[baseKey] = value;
                    } else if (!key.includes('_min') && !key.includes('_max')) {
                        // Handle regular filters (but not min/max separately)
                        convertedFilters[key] = value;
                    }
                });

                // Check for separate min/max values and combine them
                Object.keys(filteredData.data.appliedFilters).forEach(key => {
                    if (key.includes('_min') || key.includes('_max')) {
                        const baseKey = key.replace(/_min|_max/, '');
                        if (!convertedFilters[baseKey]) {
                            convertedFilters[baseKey] = {};
                        }

                        if (key.includes('_min')) {
                            convertedFilters[baseKey].min = filteredData.data.appliedFilters[key];
                        } else {
                            convertedFilters[baseKey].max = filteredData.data.appliedFilters[key];
                        }
                    }
                });

                console.log('Converted appliedFilters for UI:', convertedFilters);

                // Update the applied filters state if it's different
                if (JSON.stringify(convertedFilters) !== JSON.stringify(appliedFilters)) {
                    setAppliedFilters(convertedFilters);
                }
            }
            return filteredData.data.fields_;
        }
        return mainData?.data?.fields_ || [];
    }, [filteredData, mainData, isUsingFilters]);

    useEffect(() => {
        console.log('Current appliedFilters:', appliedFilters);
        console.log('Current selectedFilters:', selectedFilters);
        console.log('Current searchMulti:', searchMulti);
    }, [appliedFilters, selectedFilters, searchMulti]);

    const handleOpenFilterModal = () => {
        console.log('Opening filter modal with:', { appliedFilters, selectedFilters });
        setMultiFilter(true);
    };

    // Get current data stats
    const currentStats = React.useMemo(() => {
        if (isUsingFilters && filteredData?.data) {
            return {
                total: filteredData.data.count || 0,
                showing: filteredData.data.fields_?.length || 0,
                filtersCount: filteredData.data.filtersCount || 0,
                appliedFilters: filteredData.data.appliedFilters || {}
            };
        }
        return {
            total: mainData?.data?.count || 0,
            showing: mainData?.data?.fields_?.length || 0,
            filtersCount: 0,
            appliedFilters: {}
        };
    }, [filteredData, mainData, isUsingFilters]);

    // Add this to your state declarations
    const [sortConfig, setSortConfig] = useState<{
        key: string;
        direction: 'asc' | 'desc';
    } | null>(null);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortedData = (data: InventoryData[]) => {
        if (!sortConfig) return data;

        return [...data].sort((a, b) => {
            // Handle numeric fields differently
            const numericFields = ['demand', 'expected_rent', 'area'];
            const isNumeric = numericFields.includes(sortConfig.key);

            // Get values to compare
            let aValue = a[sortConfig.key as keyof InventoryData];
            let bValue = b[sortConfig.key as keyof InventoryData];

            // Handle nested fields (like createdBy.name)
            if (sortConfig.key === 'owner') {
                aValue = a?.createdBy?.name || '';
                bValue = b?.createdBy?.name || '';
            }

            // Handle numeric comparison
            if (isNumeric) {
                // Convert currency strings to numbers
                const parseCurrency = (value: string | undefined) => {
                    if (!value) return 0;
                    const num = parseFloat(value.replace(/[^0-9.-]+/g, ''));
                    return isNaN(num) ? 0 : num;
                };

                const aNum = parseCurrency(aValue as string);
                const bNum = parseCurrency(bValue as string);

                return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
            }

            // Handle string comparison
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortConfig.direction === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            // Fallback for other types
            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    const generateInventoryPDF = (inventory: InventoryData) => {
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        const primaryColor: [number, number, number] = [91, 24, 78]; // #5B184E (purple)
        const textGray: [number, number, number] = [60, 60, 60];

        /* --- LOGO --- */
        const img = new Image();
        img.src = logoImg.src; // Your logo path
        img.onload = () => {
            const logoWidth = 40;
            const logoHeight = 20;
            const logoX = (doc.internal.pageSize.getWidth() - logoWidth) / 2;
            doc.addImage(img, "PNG", logoX, 15, logoWidth, logoHeight);

            /* --- HEADING --- */
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...primaryColor);
            doc.text(
                `Property Details – ${inventory.project || "-"}`,
                doc.internal.pageSize.getWidth() / 2,
                42,
                { align: "center" }
            );

            /* --- TABLE DATA --- */
            const tableData = [
                ["Project Name", inventory.project || "-"],
                ["Property Type", inventory.type || "-"],
                ["Tower/Floor", inventory.tower_no || "-"],
                ["Size", inventory.area ? `${inventory.area} sq. ft.` : "-"],
                ["Facing", inventory.facing || "-"],
                ["Status", inventory.status || "-"],
                ["Demand Price", inventory.demand || "-"],
                ["Registry", inventory.registry || "-"],
                ["Dimensions", inventory.dimension || "Not Available"]
            ];

            autoTable(doc, {
                startY: 48,
                body: [
                    [
                        { content: "Project Name", styles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' } },
                        { content: inventory.project || "-", styles: { fillColor: primaryColor, textColor: [255, 255, 255] } }
                    ],
                    ["Property Type", inventory.type || "-"],
                    ["Tower/Floor", inventory.tower_no || "-"],
                    ["Size", inventory.area ? `${inventory.area} sq. ft.` : "-"],
                    ["Facing", inventory.facing || "-"],
                    ["Status", inventory.status || "-"],
                    ["Demand Price", inventory.demand || "-"],
                    ["Registry", inventory.registry || "-"],
                    ["Dimensions", inventory.dimension || "Not Available"]
                ],
                theme: "grid",
                styles: {
                    font: "helvetica",
                    fontSize: 11,
                    cellPadding: 3,
                    textColor: textGray
                },
                columnStyles: {
                    0: { cellWidth: 50, fontStyle: "bold" },
                    1: { cellWidth: 120 }
                },
                tableWidth: "auto"
            });


            /* --- QUOTE --- */
            const quoteY = (doc as any).lastAutoTable.finalY + 15;
            doc.setFontSize(12);
            doc.setFont("helvetica", "italic");
            doc.setTextColor(60, 60, 60);
            doc.text(
                `"In the right property, every brick tells a story."`,
                doc.internal.pageSize.getWidth() / 2,
                quoteY,
                { align: "center" }
            );

            /* --- FOOTER --- */
            const footerY = quoteY + 20;
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 0);
            doc.text("For More Information, Contact:", 15, footerY);

            // Phone
            doc.setTextColor(...primaryColor);
            doc.setFont("helvetica", "normal");
            doc.text(`+91 9205500984`, 15, footerY + 6);

            // Email
            doc.setTextColor(...primaryColor);
            doc.text(`info@property360degree.in`, 15, footerY + 12);

            // Company address
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...primaryColor);
            doc.text(
                "Property 360 Degree Pvt Ltd",
                15,
                footerY + 20
            );

            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 0, 0);
            doc.text(
                "543, T3 Tower, Golden I, Techzone 4, Greater Noida West",
                15,
                footerY + 26
            );

            /* --- SAVE PDF --- */
            const safeProject = (inventory.project || "Inventory")
                .replace(/[^a-zA-Z0-9]/g, "_")
                .replace(/^_+|_+$/g, "");
            const safeUnit = (inventory.unit_no || "")
                .replace(/[^a-zA-Z0-9]/g, "_")
                .replace(/^_+|_+$/g, "");
            doc.save(`${safeProject}_${safeUnit}.pdf`);
        };
    };


    // Handle query params for new inventory
    useEffect(() => {
        const name = searchParams.get('name');
        const phone = searchParams.get('phone');
        const email = searchParams.get('email');
        const address = searchParams.get('address');

        if (name || phone || email) {
            const initialData: InventoryData = {
                name: name || '',
                mobile: phone || '',
                email: email || '',
                address: address || '',
                project: '',
                unit_no: '',
                area: '',
                type: '',
                facing: '',
                demand: '',
                status: 'Available',
                amount: "",
                parking: "",
                parking_type: "",
                front: "",
                height: ""
            };

            setInventoryFormData(initialData);
            setType_("add");
            setPop(true);
        }
    }, [searchParams]);

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 p-8">
                <div className="space-y-6">
                    {/* Header section */}
                    <div className="flex justify-between items-center mb-4">
                        <button
                            className="bg-[#004aad] flex items-center gap-x-2 px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity"
                            onClick={() => { setType_("add"); setPop(true); }}
                        >
                            <FaPlus size={16} />
                            <span className="font-semibold">Inventory</span>
                        </button>
                        <Header header="Inventory" />
                    </div>

                    {/* Main content card */}
                    <div className="bg-gradient-to-r from-[#9e4e8e] to-[#504f99] rounded-2xl shadow-lg p-6">
                        {/* Stats and filters section */}
                        <div className="flex flex-col space-y-4 mb-4">
                            <div className="flex justify-between items-center">
                                <div className="text-white">
                                    Total Inventory: {currentStats.total}
                                    {isUsingFilters && (
                                        <span className="ml-2 text-sm opacity-75">
                                            (Filtered: {currentStats.showing})
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-white">Inventory Type</span>

                                    {/* Step 1: Residential / Commercial */}
                                    <select
                                        value={propertyCat}
                                        onChange={(e) => {
                                            setPropertyCat(e.target.value);
                                            setDealType('');           // reset second select when top-level changes
                                        }}
                                        className="bg-[#004aad] text-white border border-white rounded-lg px-3 py-1 w-32"
                                        disabled={isUsingFilters}
                                    >
                                        <option value="">Select</option>
                                        <option value="residential">Residential</option>
                                        <option value="commercial">Commercial</option>
                                    </select>

                                    {/* Step 2: Rent / Resale (only visible after step 1) */}
                                    {propertyCat && (
                                        <select
                                            value={dealType}
                                            onChange={(e) => setDealType(e.target.value)}
                                            className="bg-[#004aad] text-white border border-white rounded-lg px-3 py-1 w-24"
                                            disabled={isUsingFilters}
                                        >
                                            <option value="">Select</option>
                                            <option value="rent">Rent</option>
                                            <option value="resale">Resale</option>
                                        </select>
                                    )}
                                    <button
                                        onClick={handleOpenFilterModal}
                                        className="bg-[#004aad] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                                    >
                                        <FaFilter size={14} />
                                        Advanced Filter
                                        {selectedFilters.length > 0 && (
                                            <span className="bg-white text-[#004aad] text-xs px-2 py-1 rounded-full font-semibold">
                                                {selectedFilters.length}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>
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
                                disabled={isUsingFilters} // Disable when filters are active
                            />
                        </div>

                        {/* Filter Summary */}
                        {isUsingFilters && currentStats.filtersCount > 0 && (
                            <FilterSummary
                                appliedFilters={currentStats.appliedFilters}
                                filtersCount={currentStats.filtersCount}
                                totalRecords={currentStats.total}
                                showingRecords={currentStats.showing}
                                onClearFilters={handleClearAllFilters}
                                onClearSingleFilter={handleClearSingleFilter}
                                onExportData={handleExportData}
                                isLoading={isFilterLoading}
                            />
                        )}

                        {/* Pagination and limit controls */}
                        <div className="flex justify-between items-center mb-7 px-4">
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
                                    onClick={handlePreviousPage}
                                    disabled={page === 1}
                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-600 text-white disabled:opacity-50"
                                >
                                    <FiChevronLeft />
                                </button>
                                <span className="text-white font-semibold text-xl">{page}</span>
                                <button
                                    onClick={handleNextPage}
                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-600 text-white"
                                >
                                    <FiChevronRight />
                                </button>
                            </div>
                        </div>

                        {/* Table section */}
                        {!pop && (
                            <div className="bg-white rounded-lg shadow-md -mt-7 overflow-hidden">
                                {/* Table container with fixed height and scroll */}
                                <div 
                                    ref={tableContainerRef}
                                    className="overflow-y-auto max-h-[calc(100vh-350px)]"
                                >
                                    <table className="w-full min-w-[700px]">
                                        <thead>
                                            <tr className="bg-gray-50 sticky top-0 z-10">
                                                <th
                                                    className="text-left p-4 font-semibold text-gray-800 cursor-pointer hover:bg-gray-100 bg-gray-50"
                                                    onClick={() => requestSort('project')}
                                                >
                                                    <div className="flex items-center">
                                                        Project
                                                        {sortConfig?.key === 'project' && (
                                                            <span className="ml-1">
                                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </th>
                                                <th
                                                    className="text-left p-4 font-semibold text-gray-800 cursor-pointer hover:bg-gray-100 bg-gray-50"
                                                    onClick={() => requestSort('unit_no')}
                                                >
                                                    <div className="flex items-center">
                                                        Unit no
                                                        {sortConfig?.key === 'unit_no' && (
                                                            <span className="ml-1">
                                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </th>
                                                <th
                                                    className="text-left p-4 font-semibold text-gray-800 cursor-pointer hover:bg-gray-100 bg-gray-50"
                                                    onClick={() => requestSort('area')}
                                                >
                                                    <div className="flex items-center">
                                                        Size
                                                        {sortConfig?.key === 'area' && (
                                                            <span className="ml-1">
                                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </th>
                                                <th
                                                    className="text-left p-4 font-semibold text-gray-800 cursor-pointer hover:bg-gray-100 bg-gray-50"
                                                    onClick={() => requestSort('type')}
                                                >
                                                    <div className="flex items-center">
                                                        Type
                                                        {sortConfig?.key === 'type' && (
                                                            <span className="ml-1">
                                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </th>
                                                {(role_ === 1 || role_ === 2) && (
                                                    <th
                                                        className="text-left p-4 font-semibold text-gray-800 cursor-pointer hover:bg-gray-100 bg-gray-50"
                                                        onClick={() => requestSort('owner')}
                                                    >
                                                        <div className="flex items-center">
                                                            Owner
                                                            {sortConfig?.key === 'owner' && (
                                                                <span className="ml-1">
                                                                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </th>
                                                )}
                                                <th
                                                    className="text-left p-4 font-semibold text-gray-800 cursor-pointer hover:bg-gray-100 bg-gray-50"
                                                    onClick={() => requestSort('facing')}
                                                >
                                                    <div className="flex items-center">
                                                        Facing
                                                        {sortConfig?.key === 'facing' && (
                                                            <span className="ml-1">
                                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </th>
                                                <th
                                                    className="text-left p-4 font-semibold text-gray-800 cursor-pointer hover:bg-gray-100 bg-gray-50"
                                                    onClick={() => requestSort('demand')}
                                                >
                                                    <div className="flex items-center">
                                                        Demand
                                                        {sortConfig?.key === 'demand' && (
                                                            <span className="ml-1">
                                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </th>
                                                {(role_ === 1 || role_ === 2 || role_ === 31) && (
                                                    <th className="text-left p-4 font-semibold text-gray-800 bg-gray-50">Delete</th>
                                                )}
                                                <th className="text-left p-4 font-semibold text-gray-800 bg-gray-50">PDF</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {getSortedData(displayData).length > 0 ? (
                                                getSortedData(displayData).map((inventory, index) => (
                                                    <tr
                                                        key={inventory._id || index}
                                                        className={`border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                                                            }`}
                                                        onClick={() => {
                                                            if (inventory?.createdBy?._id === userId || role_ === 1 || role_ === 2) {
                                                                handleInventoryClick(inventory);
                                                            }
                                                        }}
                                                    >
                                                        <td className="p-4">{inventory.project || '-'}</td>
                                                        <td className="p-4">{inventory.unit_no || '-'}</td>
                                                        <td className="p-4">{inventory.area || '-'}</td>
                                                        <td className="p-4">{inventory.type || '-'}</td>
                                                        {(role_ === 1 || role_ === 2) && (
                                                            <td className="p-4">
                                                                {(inventory?.createdBy?.name || '').toUpperCase()}
                                                            </td>
                                                        )}
                                                        <td className="p-4">{inventory.facing || '-'}</td>
                                                        <td className="p-4">{inventory.demand || '-'}</td>
                                                        {(role_ === 1 || role_ === 2 || role_ === 31) && (
                                                            <td
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteTerm(inventory?._id);
                                                                }}
                                                                className="text-left p-4 font-semibold text-red-600 hover:text-red-800 cursor-pointer"
                                                            >
                                                                <MdDelete size={18} />
                                                            </td>
                                                        )}
                                                        <td className="p-4">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    generateInventoryPDF(inventory);
                                                                }}
                                                                className="text-blue-600 underline text-sm hover:text-blue-800"
                                                            >
                                                                Download
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={8} className="text-center py-10 text-gray-400 text-lg font-semibold">
                                                        {isLoading || isFilterLoading ? 'Loading...' : 'No Data Found!'}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {multiFilter && (
                <FilterUI
                    setMultiFilter={setMultiFilter}
                    multiFilter={multiFilter}
                    setSearchMulti={setSearchMulti}
                    selectedFilters={selectedFilters}
                    setSelectedFilters={setSelectedFilters}
                    appliedFilters={appliedFilters}
                    setAppliedFilters={setAppliedFilters}
                    pageType="inventory"
                />
            )}

            {pop && (
                <InventoryForm
                    inventoryFormData={inventoryFormData}
                    setInventoryFormData={setInventoryFormData}
                    type_={type_}
                    setPop={setPop}
                />
            )}
        </div>
    );
}

export default function Inventory() {
    return (
        <Suspense fallback={<div>Loading inventory...</div>}>
            <Inventories />
        </Suspense>
    );
}