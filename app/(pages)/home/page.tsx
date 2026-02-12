"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from "react";
import Sidebar from "../../_components/Sidebar";
import { setNotification, setUserHierarchy } from "@app/_api_query/store";
import Link from "next/link";
import Notification from "../../_components/Notifications";
import { useSelector_, useDispatch_ } from '../../../store';
import YesterdayTargetBanner from "../../_components/YesterdayTargetBanner";
import {
  useHome_ReportQuery,
  useLazyHome_WidgetLeadsQuery,
} from "../../_api_query/Leads/leads.api";
import StaffTermsAndCondition from '../../_components/StaffTermsAndCondition';
import { useShow_Term_ConditionsMutation } from "../../_api_query/termsConditions/termsconditions.api";
import {
  Bell, X, Eye, Users, Boxes, TrendingUp,
  FileBarChart2, FileText, ReceiptText, AlarmClock,
  CalendarDays, PhoneCall, CalendarCheck, PhoneIncoming,
  CalendarClock, CheckCircle, PowerOff, PhoneOff
} from "lucide-react";
import { useRouter } from "next/navigation";
import { HierarchyService } from '../../services/hierarchyService';
import { useGetNotificationQuery } from "@app/_api_query/Notification/notification.api";
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { useG_STAFFQuery } from "@app/_api_query/staff/staffs.api";
import { useGetSalesNotificationsQuery } from "@app/_api_query/SaleNotification/saleNotification.api";
import 'react-calendar/dist/Calendar.css';
import { DateTime } from 'luxon';
// Custom hook for user data
const useUserData = () => {
  const [userData, setUserData] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [role_, setRole] = useState<any>(1);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Only run once on mount
    if (!isLoaded) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const role = Number(localStorage.getItem('role') || '1');

      setUserData(user);
      setCurrentUserId(user.userId || '');
      setRole(role);
      setIsLoaded(true);
    }
  }, [isLoaded]);

  return { userData, currentUserId, role_, isLoaded };
};

interface DailyCallResult {
  date: number;
  fullDate: string;
  callTargetAchieved: boolean;
  calls: number;
  callTarget: number;
}

// Optimized Modal Components
const OptimizedWidgetModal = lazy(() => import('./OptimizedWidgetModal'));

const DateRangePicker = lazy(() => import('./DateRangePicker'));

const TodaysFollowUpModal = lazy(() => import('./TodaysFollowupModal'));

const KRACalendar = lazy(() => import('./KRACalendar'));

const DailyCallModal = lazy(() => import('./DailyCallModal'));


const Home: React.FC = () => {
  const router = useRouter();
  const dispatch = useDispatch_();
  const notification = useSelector_((state) => state?.store?.notification);

  // Use custom hook for user data
  const { userData, currentUserId, role_, isLoaded } = useUserData();
  const [widgetLoading, setWidgetLoading] = useState<string | null>(null);

  // State management - consolidated and optimized
const [dateRange, setDateRange] = useState({
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0]
});
  const [staffId, setStaffId] = useState<string>("");
  const [leadType] = useState<'all' | 'rent' | 'residential' | 'commercial'>('all');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<any>(null);
  const [widgetModalVisible, setWidgetModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(true); // For today's follow-up
  const [selectedDailyData, setSelectedDailyData] = useState<DailyCallResult | null>(null);
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [todaysFollowUpData, setTodaysFollowUpData] = useState<any>(null);
  const [isTodaysFollowUpLoading, setIsTodaysFollowUpLoading] = useState(false);
  // API calls - optimized with proper dependencies
  const [fetchWidgetLeads, { data: widgetLeadsData, isLoading: isWidgetLoading }] = useLazyHome_WidgetLeadsQuery();
  const [showFetchData, { isSuccess: SisSuccess, data: SData }] = useShow_Term_ConditionsMutation();

  const { data: reportData, isLoading: reportLoading } = useHome_ReportQuery(
    { dateRange, staffId, leadType },
    {
      pollingInterval: 300000,
      skip: !dateRange?.startDate || !dateRange?.endDate || !isLoaded || !staffId,
      refetchOnFocus: false,
      refetchOnMountOrArgChange: true,
    }
  );

  const { data: staffData, isLoading: staffLoading } = useG_STAFFQuery(
    currentUserId,
    { skip: !currentUserId || !isLoaded }
  );

  useEffect(() => {
    if (isLoaded && staffData?.data && currentUserId && !staffId) {
      // For admin roles, set the first staff member as default
      if (role_ === 1 || role_ === 2 || role_ === 3 || role_ === 4 || role_ === 5 || role_ === 31 || role_ === 7 || role_ === 6) {
        if (staffData.data.length > 0) {
          setStaffId(staffData.data[0]._id);
        }
      } else {
        // For non-admin users, set their own ID as default
        setStaffId(currentUserId);
      }
    }
  }, [staffData?.data, currentUserId, isLoaded, staffId, role_]);

  const { data: salesResponse, isLoading: salesLoading } = useGetSalesNotificationsQuery('', {
    pollingInterval: 600000,
    refetchOnFocus: false,
  });

  const { data: AData, isLoading: notificationLoading } = useGetNotificationQuery({}, {
    refetchOnFocus: false,
  });

  // Memoized computations
  const notifications = useMemo(() => salesResponse?.data?.notifications || [], [salesResponse]);

  const filteredStaffOptions = useMemo(() => {
    if (!staffData?.data) return [];
    return staffData.data;
  }, [staffData]);

  const leadStatusWidgets = useMemo(() => {
    if (!reportData?.data) return [];

    return [
      // First row
      {
        name: "Fresh Leads",
        count: reportData?.data?.TotalFresh || 0,
        status: "fresh",
        color: "bg-gray-50 border border-gray-100",
        textColor: "text-gray-800",
        icon: <Users className="text-gray-600" size={20} />,
        gradient: "from-gray-50 to-gray-100"
      },
      {
        name: "Today's Follow-Up",
        count: reportData?.data?.TotalTodaysfollowup || 0,
        status: "todaysfollowup",
        color: "bg-orange-50 border border-orange-100",
        textColor: "text-orange-800",
        icon: <AlarmClock className="text-orange-600" size={20} />,
        gradient: "from-orange-50 to-orange-100"
      },
      {
        name: "Visit",
        count: reportData?.data?.TotalVisitdone || 0,
        status: "visitdone",
        color: "bg-blue-50 border border-blue-100",
        textColor: "text-blue-800",
        icon: <CalendarCheck className="text-blue-600" size={20} />,
        gradient: "from-blue-50 to-blue-100"
      },
      {
        name: "Switch Off",
        count: reportData?.data?.TotalSwitchoff || 0,
        status: "switchoff",
        color: "bg-slate-50 border border-slate-100",
        textColor: "text-slate-800",
        icon: <PowerOff className="text-slate-600" size={20} />,
        gradient: "from-slate-50 to-slate-100"
      },

      // Second row
      {
        name: "Call Back",
        count: reportData?.data?.TotalCallback || 0,
        status: "callback",
        color: "bg-cyan-50 border border-cyan-100",
        textColor: "text-cyan-800",
        icon: <PhoneIncoming className="text-cyan-600" size={20} />,
        gradient: "from-cyan-50 to-cyan-100"
      },
      {
        name: "Follow-Up",
        count: reportData?.data?.TotalFollowup || 0,
        status: "followup",
        color: "bg-teal-50 border border-teal-100",
        textColor: "text-teal-800",
        icon: <PhoneCall className="text-teal-600" size={20} />,
        gradient: "from-teal-50 to-teal-100"
      },
      {
        name: "Meeting",
        count: reportData?.data?.TotalMeetingdone || 0,
        status: "meetingdone",
        color: "bg-green-50 border border-green-100",
        textColor: "text-green-800",
        icon: <CalendarClock className="text-green-600" size={20} />,
        gradient: "from-green-50 to-green-100"
      },
      {
        name: "Wrong Number",
        count: reportData?.data?.TotalWrongno || 0,
        status: "wrongno",
        color: "bg-rose-50 border border-rose-100",
        textColor: "text-rose-800",
        icon: <PhoneOff className="text-rose-600" size={20} />,
        gradient: "from-rose-50 to-rose-100"
      },

      // Third row
      {
        name: "Ringing",
        count: reportData?.data?.TotalRinging || 0,
        status: "ringing",
        color: "bg-red-50 border border-red-100",
        textColor: "text-red-800",
        icon: <PhoneCall className="text-red-600" size={20} />,
        gradient: "from-red-50 to-red-100"
      },
      {
        name: "Expected Visit Date",
        count: reportData?.data?.TotalExpectedvisit || 0,
        status: "expectedvisit",
        color: "bg-yellow-50 border border-yellow-100",
        textColor: "text-yellow-800",
        icon: <CalendarDays className="text-yellow-600" size={20} />,
        gradient: "from-yellow-50 to-yellow-100"
      },
      {
        name: "Deal",
        count: reportData?.data?.TotalDealdone || 0,
        status: "deal-done",
        color: "bg-emerald-50 border border-emerald-100",
        textColor: "text-emerald-800",
        icon: <CheckCircle className="text-emerald-600" size={20} />,
        gradient: "from-emerald-50 to-emerald-100"
      },
      {
        name: "Not Interested",
        count: reportData?.data?.TotalNotInterest || 0,
        status: "notInterest",
        color: "bg-gray-50 border border-gray-100",
        textColor: "text-gray-800",
        icon: <X className="text-gray-600" size={20} />,
        gradient: "from-gray-50 to-gray-100"
      },

      // Fourth row (new additions)
      {
        name: "Hot Prospect",
        count: reportData?.data?.TotalHotProspect || 0,
        status: "hotprospect",
        color: "bg-purple-50 border border-purple-100",
        textColor: "text-purple-800",
        icon: <TrendingUp className="text-purple-600" size={20} />,
        gradient: "from-purple-50 to-purple-100"
      },
      {
        name: "Suspect",
        count: reportData?.data?.TotalSuspect || 0,
        status: "suspect",
        color: "bg-amber-50 border border-amber-100",
        textColor: "text-amber-800",
        icon: <Eye className="text-amber-600" size={20} />,
        gradient: "from-amber-50 to-amber-100"
      }
    ];
  }, [reportData?.data]);

  const quickAccessMenus = useMemo(() => [
    {
      name: "Customers",
      url: "/customer",
      icon: <Users className="text-amber-600" size={24} />,
      bgColor: "bg-amber-50",
      hoverColor: "hover:bg-amber-100",
      borderColor: "border-amber-200"
    },
    {
      name: "Inventory",
      url: "/inventory",
      icon: <Boxes className="text-blue-600" size={24} />,
      bgColor: "bg-blue-50",
      hoverColor: "hover:bg-blue-100",
      borderColor: "border-blue-200"
    },
    {
      name: "Target vs Achievement",
      url: "/targetVsAchievement",
      icon: <TrendingUp className="text-emerald-600" size={24} />,
      bgColor: "bg-emerald-50",
      hoverColor: "hover:bg-emerald-100",
      borderColor: "border-emerald-200"
    },
    {
      name: "Reports",
      url: "/reports",
      icon: <FileBarChart2 className="text-purple-600" size={24} />,
      bgColor: "bg-purple-50",
      hoverColor: "hover:bg-purple-100",
      borderColor: "border-purple-200"
    },
    {
      name: "Project Details",
      url: "/ProjectDetails",
      icon: <FileText className="text-cyan-600" size={24} />,
      bgColor: "bg-cyan-50",
      hoverColor: "hover:bg-cyan-100",
      borderColor: "border-cyan-200"
    },
    {
      name: "Expenses",
      url: "/Expense",
      icon: <ReceiptText className="text-indigo-600" size={24} />,
      bgColor: "bg-indigo-50",
      hoverColor: "hover:bg-indigo-100",
      borderColor: "border-indigo-200"
    }
  ], []);

  const processedNotifications = useMemo(() => {
    if (!salesResponse?.data?.notifications) return [];

    return salesResponse.data.notifications.map((n: any, index: number) => {
      // Determine styling based on notification type
      let bgColor, textColor, icon;

      if (n.isCongratulatory) {
        // Positive sales notifications - green without warning
        bgColor = 'bg-green-100 border-green-300';
        textColor = 'text-green-800';
        icon = n.isOwnSale ? '🎉' : '✨';
      } else if (n.isNoSaleMessage) {
        // No-sale notifications - red with warning
        bgColor = 'bg-red-100 border-red-300';
        textColor = 'text-red-800';
        icon = '⚠️';
      } else {
        // Fallback (shouldn't normally happen)
        bgColor = 'bg-gray-100 border-gray-300';
        textColor = 'text-gray-800';
        icon = 'ℹ️';
      }

      return {
        ...n,
        id: n._id || `notification-${index}`,
        displayMessage: n.message, // Use message as-is (API handles icons)
        bgColor,
        textColor,
        icon
      };
    });
  }, [salesResponse?.data?.notifications]);

  // Callback functions
  const handleWidgetClick = useCallback(async (status: string) => {
    try {
      const widget = leadStatusWidgets.find(w => w.status === status);
      if (!widget || widget.count === 0) { return };

      if (status === 'fresh') {
        router.push('/Leads');
        return;
      }

      // Set loading state for this specific widget
      setWidgetLoading(status);

      await fetchWidgetLeads({
        status,
        dateRange,
        staffId,
        leadType
      });

      setSelectedWidget(widget);
      setWidgetModalVisible(true);
    } catch (error) {
      console.error("Error handling widget click:", error);
    } finally {
      // Clear loading state
      setWidgetLoading(null);
    }
  }, [leadStatusWidgets, router, fetchWidgetLeads, dateRange, staffId, leadType]);

  const handleViewLead = useCallback((phone: string) => {
    localStorage.setItem('leadSearchPhone', phone);
    router.push('/Leads');
  }, [router]);

  const handleDateApply = useCallback(() => {
    setShowDatePicker(false);
  }, []);

  const handleDateChange = useCallback(async (date: Date) => {
    // No need for additional logic here since the KRACalendar handles its own data fetching
  }, []);

  function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  const fetchTodaysFollowUpData = useCallback(async () => {
    if (!staffId) return;

    setIsTodaysFollowUpLoading(true);
    try {
      const result = await fetchWidgetLeads({
        status: 'todaysfollowup',
        dateRange,
        staffId,
        leadType
      });

      if (result.data) {
        setTodaysFollowUpData(result.data);
      }
    } catch (error) {
      console.error("Error fetching today's follow-up data:", error);
    } finally {
      setIsTodaysFollowUpLoading(false);
    }
  }, [fetchWidgetLeads, dateRange, staffId, leadType]);

  // 3. Create a stable debounced version without useEffect
  const debouncedFetchTodaysFollowUp = useMemo(() =>
    debounce(fetchTodaysFollowUpData, 300),
    [fetchTodaysFollowUpData]
  );

  // Effects - optimized
  useEffect(() => {
    if (isLoaded && staffId) {
      debouncedFetchTodaysFollowUp();
    }
  }, [staffId, dateRange, debouncedFetchTodaysFollowUp]);

  useEffect(() => {
    if (isLoaded && staffData?.data && currentUserId) {
      // For non-admin users, if no staffId is set, default to current user
      if (!staffId && !(role_ === 1 || role_ === 2 || role_ === 3 || role_ === 4 || role_ === 5 || role_ === 31 || role_ === 7 || role_ === 6)) {
        setStaffId(currentUserId);
      }
      // For admin users, if no staffId is set, default to first staff member
      else if (!staffId && (role_ === 1 || role_ === 2 || role_ === 3 || role_ === 4 || role_ === 5 || role_ === 31 || role_ === 7 || role_ === 6)) {
        if (staffData.data.length > 0) {
          setStaffId(staffData.data[0]._id);
        }
      }
    }
  }, [staffData?.data, currentUserId, isLoaded, staffId, role_]);

  const handleStaffChange = useCallback((newStaffId: string) => {
    setStaffId(newStaffId);
    // Force refresh of today's follow-up data for the new staff member
    if (newStaffId) {
      debouncedFetchTodaysFollowUp();
    }
  }, [debouncedFetchTodaysFollowUp]);

  useEffect(() => {
    if (staffId) {
      debouncedFetchTodaysFollowUp();
    }
  }, [staffId, dateRange, debouncedFetchTodaysFollowUp]);

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
      }
    };

    loadHierarchy();
  }, [dispatch]);

  const SkeletonLoader = () => (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    </div>
  );


  if (!isLoaded) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-7 py-7 space-y-6">
          {/* Check-in Button */}
          <div className="w-full text-center">
            <Link href="/Attendance">
              <button className="relative bg-gradient-to-r from-pink-600 to-indigo-600 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 group overflow-hidden">
                <span className="flex items-center justify-center gap-2 relative z-10">
                  <span className="inline-block w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                  🕒 Please Check-in for Today
                </span>
              </button>
            </Link>
          </div>

          {/* Header Section */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-100 rounded-full opacity-20 transform translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-100 rounded-full opacity-20 transform -translate-x-20 translate-y-20"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  Ameya Innovex Dashboard
                </h1>
                <p className="text-gray-500 mt-1 text-sm">Welcome back! Here's what's happening today.</p>
              </div>
              <div className="flex items-center space-x-4">
                <YesterdayTargetBanner staffId={currentUserId} />
                <button
                  onClick={() => dispatch(setNotification(true))}
                  title="Notifications"
                  className="relative p-2 rounded-full hover:bg-pink-50 transition duration-150 group"
                >
                  <Bell className="text-pink-600 group-hover:text-indigo-600 transition-colors" size={20} />
                  {AData?.data?.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {AData.data.length}
                    </span>
                  )}
                </button>
              </div>

            </div>
          </section>

          {/* Notification Banner */}
          {(salesLoading || processedNotifications.length > 0) && (
            <div className="relative overflow-hidden h-12 bg-gradient-to-r from-pink-50 to-indigo-100 rounded-full border border-pink-200 shadow-sm">
              <div className="absolute top-0 left-0 w-2 h-full bg-indigo-400" />
              <div className="h-full flex items-center">
                {salesLoading ? (
                  // Loading state
                  <div className="w-full flex items-center justify-center">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-pink-600"></div>
                      <span className="text-sm text-gray-600">Loading sales updates...</span>
                    </div>
                  </div>
                ) : processedNotifications.length > 0 ? (
                  // Continuous marquee with duplicated content
                  <div className="animate-marquee-continuous whitespace-nowrap flex">
                    {/* First copy */}
                    <div className="flex shrink-0">
                      {processedNotifications.map((notification: any) => (
                        <span
                          key={`first-${notification.id}`}
                          className={`inline-block text-sm font-medium px-4 py-1 ${notification.bgColor} ${notification.textColor} rounded-full mx-2 border shadow-sm`}
                        >
                          <span className="mr-2">{notification.icon}</span>
                          {notification.displayMessage}
                        </span>
                      ))}
                    </div>

                    {/* Second copy for seamless loop */}
                    <div className="flex shrink-0 ml-8">
                      {processedNotifications.map((notification: any) => (
                        <span
                          key={`second-${notification.id}`}
                          className={`inline-block text-sm font-medium px-4 py-1 ${notification.bgColor} ${notification.textColor} rounded-full mx-2 border shadow-sm`}
                        >
                          <span className="mr-2">{notification.icon}</span>
                          {notification.displayMessage}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  // No notifications state
                  <div className="w-full flex items-center justify-center">
                    <span className="text-sm text-gray-600">🎯 No recent sales updates - Time to make your next sale!</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lead Bank Section */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  <span className="bg-gradient-to-r from-pink-600 to-indigo-800 bg-clip-text text-transparent">
                    Lead Management
                  </span>
                </h2>
                <p className="text-gray-500">Track and manage your property leads</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <Suspense fallback={<SkeletonLoader />}>
                  <DateRangePicker
                    dateRange={dateRange}
                    onChange={setDateRange}
                    showPicker={showDatePicker}
                    onToggle={setShowDatePicker}
                    onApply={handleDateApply}
                  />
                </Suspense>

                {(role_ === 1 || role_ === 2 || role_ === 3 || role_ === 4 || role_ === 5 || role_ === 31 || role_ === 7 || role_ === 6) && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">User:</label>
                    {staffLoading ? (
                      <div className="p-2 bg-gray-200 rounded animate-pulse">Loading...</div>
                    ) : (
                      <select
                        value={staffId}
                        onChange={(e) => handleStaffChange(e.target.value)}
                        className="p-2 text-white bg-gradient-to-r from-pink-600 to-indigo-600 rounded-lg"
                      >
                        {filteredStaffOptions.map((staff: any) => (
                          <option
                            key={staff._id}
                            value={staff._id}
                            className="bg-white text-black"
                          >
                            {staff.userName.toUpperCase()}
                            {staff._id === currentUserId ? " (You)" : ""}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {leadStatusWidgets.map((widget, index) => (
                <div
                  key={index}
                  onClick={() => handleWidgetClick(widget.status)}
                  className={`p-4 rounded-lg border ${widget.color} cursor-pointer transition-all hover:shadow-md hover:-translate-y-1 group relative overflow-hidden min-h-[100px] ${widgetLoading === widget.status ? 'opacity-70 pointer-events-none' : ''
                    }`}
                >
                  {widgetLoading === widget.status && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-pink-600"></div>
                    </div>
                  )}

                  <div className="relative flex flex-col justify-between gap-2 h-full">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="p-2 rounded-full bg-white shadow-sm shrink-0">
                          {widget.icon}
                        </div>
                        <h3 className={`font-semibold text-sm ${widget.textColor} truncate`}>
                          {widget.name}
                        </h3>
                      </div>
                      <span className={`text-lg font-bold ${widget.textColor} whitespace-nowrap`}>
                        {widget.count}
                      </span>
                    </div>
                    <p className={`text-xs ${widget.textColor} opacity-70`}>
                      Click to view details
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Access + KRA Section */}
          <section>
            <div className="flex flex-col xl:flex-row gap-6">
              {/* Left side - Quick Access */}
              <div className="w-full xl:w-2/3">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  <span className="bg-gradient-to-r from-pink-600 to-indigo-800 bg-clip-text text-transparent">
                    Quick Access
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {quickAccessMenus.map((menu, index) => (
                    <Link key={index} href={menu.url} className="block w-full group">
                      <div className={`${menu.bgColor} ${menu.hoverColor} rounded-xl shadow-sm border ${menu.borderColor} transition-all transform hover:scale-[1.02] p-6 flex flex-col items-center justify-center cursor-pointer h-full relative overflow-hidden`}>
                        <div className="w-16 h-16 flex items-center justify-center mb-4 rounded-full bg-white shadow-inner border border-gray-100">
                          {menu.icon}
                        </div>
                        <p className="text-center font-bold text-gray-800">{menu.name}</p>
                        <p className="text-center text-sm text-gray-500 mt-1">View and manage {menu.name.toLowerCase()}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Right side - KRA Calendar */}
              <div className="w-full xl:w-1/3">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  <span className="bg-gradient-to-r from-pink-600 to-indigo-800 bg-clip-text text-transparent">
                    KRA Activity
                  </span>
                </h2>
                <div className="max-w-full">
                  <Suspense fallback={
                    <div className="h-64 bg-gray-100 animate-pulse rounded-xl flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-600 mx-auto mb-2"></div>
                        <p className="text-gray-500 text-sm">Loading calendar...</p>
                      </div>
                    </div>
                  }>
                    <KRACalendar
                      staffId={staffId}
                      onDateChange={handleDateChange}
                      setSelectedDailyData={setSelectedDailyData}
                      setShowDailyModal={setShowDailyModal}
                    />
                  </Suspense>
                </div>
              </div>
            </div>
          </section>

          {/* Modals */}
          {notification && <Notification data={AData} isSuccess={true} notificationLoading={notificationLoading} />}
          {SisSuccess && SData?.data?.length === 0 && (role_ !== 1 && role_ !== 2) && (
            <StaffTermsAndCondition showFetchData={() => showFetchData({})} />
          )}

          <Suspense fallback={null}>
            <OptimizedWidgetModal
              widget={selectedWidget}
              data={widgetLeadsData}
              isLoading={isWidgetLoading}
              visible={widgetModalVisible}
              onClose={() => {
                setWidgetModalVisible(false);
                setSelectedWidget(null);
              }}
              onViewLead={handleViewLead}
            />
          </Suspense>

          <TodaysFollowUpModal
            visible={modalVisible && todaysFollowUpData !== null}
            data={todaysFollowUpData?.data || []}
            isLoading={isTodaysFollowUpLoading}
            staffData={staffData} // Pass staff data here
            onClose={() => {
              setModalVisible(false);
              setTodaysFollowUpData(null);
            }}
            onViewLead={handleViewLead}
          />
          <DailyCallModal
            visible={showDailyModal}
            data={selectedDailyData}
            onClose={() => setShowDailyModal(false)}
          />
        </div>
      </main>

      {/* Animation styles */}
      <style jsx>{`
  @keyframes marquee-continuous {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  
  .animate-marquee-continuous {
    animation: marquee-continuous 40s linear infinite;
  }
  
  .custom-calendar .rdr-Day {
    cursor: default;
  }
  
  /* Pause animation on hover */
  .animate-marquee-continuous:hover {
    animation-play-state: paused;
  }
`}</style>
    </div>
  );
};

export default Home;