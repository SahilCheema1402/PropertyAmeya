"use client"
import React, { useEffect, useState } from "react";
import Header from "@app/_components/header";
import { useDispatch_ } from "@/store";
import { useG_ExpensesQuery } from "@app/_api_query/Expense/expense.api";
import ExpenseForm from '@app/_components//expenseForm'
import { loader } from "../../_api_query/store";
import { toast } from "react-toastify";
import ExpenseCategory from '@app/_components//ExpenseCategory'
import { FaSearch, FaPlus, FaCalendarAlt, FaTimes } from "react-icons/fa";
import Sidebar from "@app/_components/Sidebar";

const TotalExpensesScreen = () => {
    const [pop, setPop] = useState(false);
    const [form_, setForm_] = useState("");
    const dispatch = useDispatch_();
    const [type_, setType_] = useState<any>("");
    const [activeTab, setActiveTab] = useState("Today");
    const [officeExpense, setOfficeExpense] = useState("Office");
    const [category, setCategory] = useState(false);
    const [categoryData, setCategoryData] = useState([]);
    
    // Custom date selection states
    const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
    const [customDateRange, setCustomDateRange] = useState({
        fromDate: "",
        toDate: ""
    });
    const [selectedDateRange, setSelectedDateRange] = useState("");

    // Determine the search parameter based on active tab and custom date
    const getSearchParam = () => {
        if (activeTab === "Custom" && customDateRange.fromDate && customDateRange.toDate) {
            return `${customDateRange.fromDate}_${customDateRange.toDate}`;
        }
        return activeTab;
    };

    const { data, isError, isSuccess, isLoading, error, refetch, isFetching } = useG_ExpensesQuery(
        { activeTab: getSearchParam() }, 
        { refetchOnMountOrArgChange: true }
    );

    const colorMapping: any = {
        salary: "#4CAF50",
        marketing: "#FF9800",
        incentive: "#FF5722",
        stationery: "#7b61ff",
        miscellaneous: "#9E9E9E",
        mobile_recharge: "#FF4081",
        wifi_recharge: "#3F51B5",
        office_expense: "#00BCD4",
        convence: "#8BC34A",
        electricity: "#FFC107",
        maintenance: "#9C27B0",
        other: "#607D8B"
    };

    const personalCategoryColorMapping: any = {
        home_minister: "#6C757D",
        aaryan: "#495057",
        grossery: "#007BFF",
        vegetables_fruits: "#28A745",
        maintenance: "#17A2B8",
        recharge: "#FFC107",
        IGL: "#6F42C1",
        cloths: "#DC3545",
        medical: "#28A745",
        emi: "#343A40",
        maid: "#F08080",
        vehicle: "#17A2B8",
        gifts: "#007BFF",
        travels: "#FF6F61",
        investment: "#6610F2",
        LIC: "#6C757D",
        other: "#343A40"
    };

    const formatCategoryName = (category: string) => {
        return category
            .split('_')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const formatDateForDisplay = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const handleCustomDateSubmit = () => {
        if (!customDateRange.fromDate || !customDateRange.toDate) {
            toast.error("Please select both from and to dates");
            return;
        }
        
        if (new Date(customDateRange.fromDate) > new Date(customDateRange.toDate)) {
            toast.error("From date cannot be later than to date");
            return;
        }

        setActiveTab("Custom");
        setSelectedDateRange(`${formatDateForDisplay(customDateRange.fromDate)} - ${formatDateForDisplay(customDateRange.toDate)}`);
        setShowCustomDatePicker(false);
        refetch();
    };

    const clearCustomDateRange = () => {
        setCustomDateRange({ fromDate: "", toDate: "" });
        setSelectedDateRange("");
        setActiveTab("Today");
        setShowCustomDatePicker(false);
    };

    const BarChartData = isSuccess && data?.data?.lastSixMonths?.map((item: { month: string; totalAmount: number }) => ({
        name: item.month,
        amount: item.totalAmount,
        color: "#004aad",
        legendFontColor: "#004aad",
        legendFontSize: 12,
    }));

    const pieChartData = isSuccess && data?.data?.office.map((item: { category: string; totalAmount: any; }) => ({
        name: formatCategoryName(item?.category),
        amount: item.totalAmount,
        color: colorMapping[item?.category],
        legendFontColor: colorMapping[item?.category],
        legendFontSize: 12
    }));

    const pieChartPersonalData = isSuccess && data?.data?.personal.map((item: { category: string; totalAmount: any; }) => ({
        name: formatCategoryName(item?.category),
        amount: item.totalAmount,
        color: personalCategoryColorMapping[item?.category],
        legendFontColor: personalCategoryColorMapping[item?.category],
        legendFontSize: 12
    }));

    useEffect(() => {
        if (isLoading || isFetching) {
            dispatch(loader(true))
        } else {
            dispatch(loader(false))
        }
        if (isError) {
            toast.error((error as any)?.data?.message || "Expense fetch Failed");
        }
    }, [isLoading, isSuccess, isError, error, isFetching]);

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 p-8">
                <div className="space-y-6">
                    <div className="flex justify-between items-center mb-4">
                        <div className="bg-[#004aad] flex items-center gap-x-2 px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity cursor-pointer" 
                             onClick={() => { setPop(true), setType_("add") }}>
                            <FaPlus color="#fff" size={22} />
                            <p className="text-white font-semibold text-base">Add</p>
                        </div>
                        <Header header="Expenses" />
                    </div>

                    <div className="bg-gray-100 w-full flex-1 pb-10">
                        <div className="w-full">
                            {/* Filter Tabs */}
                            <div className="flex flex-row justify-around my-3 flex-wrap">
                                {["Today", "Monthly", "Half-yearly", "Yearly"].map((tab, index) => (
                                    <div
                                        key={index}
                                        onClick={() => {
                                            setActiveTab(tab);
                                            setSelectedDateRange("");
                                        }}
                                        className={`cursor-pointer ${
                                            activeTab === tab && activeTab !== "Custom"
                                                ? "bg-[#004aad] px-4 py-2 rounded-full"
                                                : "bg-gray-200 px-4 py-2 rounded-full"
                                        }`}
                                    >
                                        <p className={`${
                                            activeTab === tab && activeTab !== "Custom" 
                                                ? "text-white text-sm" 
                                                : "text-gray-600 text-sm"
                                        }`}>
                                            {tab}
                                        </p>
                                    </div>
                                ))}
                                
                                {/* Custom Date Range Button */}
                                <div
                                    onClick={() => setShowCustomDatePicker(true)}
                                    className={`cursor-pointer flex items-center gap-1 ${
                                        activeTab === "Custom"
                                            ? "bg-[#004aad] px-4 py-2 rounded-full"
                                            : "bg-gray-200 px-4 py-2 rounded-full"
                                    }`}
                                >
                                    <FaCalendarAlt size={12} className={activeTab === "Custom" ? "text-white" : "text-gray-600"} />
                                    <p className={`${
                                        activeTab === "Custom" 
                                            ? "text-white text-sm" 
                                            : "text-gray-600 text-sm"
                                    }`}>
                                        Custom
                                    </p>
                                </div>
                            </div>

                            {/* Selected Date Range Display */}
                            {activeTab === "Custom" && selectedDateRange && (
                                <div className="flex items-center justify-center my-4">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center gap-2">
                                        <FaCalendarAlt size={14} className="text-blue-600" />
                                        <span className="text-blue-800 font-medium">{selectedDateRange}</span>
                                        <button
                                            onClick={clearCustomDateRange}
                                            className="text-blue-600 hover:text-blue-800 ml-2"
                                        >
                                            <FaTimes size={12} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Current Period Display for other tabs */}
                            {activeTab !== "Custom" && data?.data?.dateRange && (
                                <div className="flex items-center justify-center my-4">
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
                                        <span className="text-gray-700 font-medium">
                                            Period: {data.data.dateRange.period}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Overview Section */}
                            <div className="flex flex-row justify-between mx-2 my-2">
                                <div className="w-1/3 rounded-lg p-4 items-center">
                                    <p className="text-xs font-semibold">Total Expense</p>
                                    <p className="text-lg font-bold">{data?.data?.totals?.overall || 0}</p>
                                </div>
                                <div className="bg-white w-1/3 rounded-lg p-4 items-center mx-2 my-auto">
                                    <p className="text-gray-500 text-xs">Total Office</p>
                                    <p className="text-xl font-bold">{data?.data?.totals?.office || 0}</p>
                                </div>
                                <div className="bg-white w-1/3 rounded-lg p-4 items-center my-auto">
                                    <p className="text-gray-500 text-xs">Total Personal</p>
                                    <p className="text-xl font-bold">{data?.data?.totals?.personal || 0}</p>
                                </div>
                            </div>

                            {/* Analytics Section */}
                            <p className="text-lg font-bold mx-4 my-4">Analytics</p>

                            <div className="flex flex-row justify-around my-3 w-10/12 mx-auto rounded-full bg-white p-1 shadow-md">
                                {["Office", "Personal"].map((tab, index) => (
                                    <div
                                        key={index}
                                        onClick={() => setOfficeExpense(tab)}
                                        className={`cursor-pointer ${
                                            officeExpense === tab ? 'bg-[#004aad] text-white' : 'bg-gray-300 text-gray-600'
                                        } px-6 py-3 rounded-full transition-all duration-300`}
                                    >
                                        <p className="text-sm">{tab}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Office Expenses */}
                            {officeExpense === 'Office' && isSuccess && (
                                <div className="flex w-full flex-col justify-center items-center">
                                    <div className="bg-white rounded-lg p-4 mb-4">
                                        <p className="text-lg font-bold mb-4 mx-4">Office Expense Analytics</p>
                                    </div>
                                    <div className="w-full">
                                        {data?.data?.office?.length === 0 ? (
                                            <p className="text-center text-gray-500">No office expenses found</p>
                                        ) : (
                                            data?.data?.office?.map((expense: any) => (
                                                <div
                                                    key={expense.category}
                                                    onClick={() => {
                                                        setCategoryData(
                                                            data?.data?.officeExpend.filter((e: { category: any }) => e.category === expense.category)
                                                        );
                                                        setCategory(true);
                                                    }}
                                                    className="w-full bg-white flex flex-row justify-between items-center rounded-lg p-4 mb-3 cursor-pointer hover:shadow-md transition-shadow"
                                                >
                                                    <p className="text-lg font-bold">{formatCategoryName(expense.category)}</p>
                                                    <p className="text-blue-500 text-sm mr-3">{expense.totalAmount}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Personal Expenses */}
                            {officeExpense === 'Personal' && isSuccess && (
                                <div className="flex w-full mx-2 gap-3 flex-col justify-center items-center">
                                    <div className="bg-white rounded-lg p-4 mb-4">
                                        <p className="text-lg font-bold mb-4 mx-4">Personal Expense Analytics</p>
                                    </div>
                                    <div className="w-full">
                                        {data?.data?.personal?.length === 0 ? (
                                            <p className="text-center text-gray-500">No personal expenses found</p>
                                        ) : (
                                            data?.data?.personal?.map((expense: any) => (
                                                <div
                                                    key={expense.category}
                                                    onClick={() => {
                                                        setCategoryData(
                                                            data?.data?.personalExpend.filter((e: { category: any }) => e.category === expense.category)
                                                        );
                                                        setCategory(true);
                                                    }}
                                                    className="w-full bg-white flex flex-row justify-between items-center rounded-lg p-4 mb-3 cursor-pointer hover:shadow-md transition-shadow"
                                                >
                                                    <p className="text-lg font-bold">{formatCategoryName(expense.category)}</p>
                                                    <p className="text-blue-500 text-sm mr-3">{expense.totalAmount}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Date Picker Modal */}
            {showCustomDatePicker && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-80 max-w-sm mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Select Date Range</h3>
                            <button
                                onClick={() => setShowCustomDatePicker(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FaTimes size={16} />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    From Date
                                </label>
                                <input
                                    type="date"
                                    value={customDateRange.fromDate}
                                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, fromDate: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    To Date
                                </label>
                                <input
                                    type="date"
                                    value={customDateRange.toDate}
                                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, toDate: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowCustomDatePicker(false)}
                                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCustomDateSubmit}
                                className="flex-1 px-4 py-2 text-white bg-[#004aad] rounded-md hover:bg-[#003a8f] transition-colors"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            {pop && <ExpenseForm setPop={setPop} type_={type_} form_={form_} />}
            {category && <ExpenseCategory setCategory={setCategory} setPop={setPop} categoryData={categoryData} setType_={setType_} setForm_={setForm_} />}
        </div>
    );
};

export default TotalExpensesScreen;