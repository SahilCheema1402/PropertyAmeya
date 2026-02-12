"use client"

import React, { useState, useEffect } from 'react';
import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar, BarChart, Line } from 'recharts';
import { useDispatch_ } from '@/store';
import Header from './../../_components/header';
import Sidebar from './../../_components/Sidebar';
import {loader, setNotification, setUserHierarchy } from "@app/_api_query/store";
import { useG_STAFFQuery } from './../../_api_query/staff/staffs.api';
import { useG_TargetVsAchievementQuery } from './../../_api_query/report/report.api';
import { toast } from 'react-toastify';
import { HierarchyService } from '@app/services/hierarchyService';

const TeamPerformance = () => {
  const [selectedView, setSelectedView] = useState("Today");
  const [staffId, setStaffId] = useState('672876361633b41e68d7c521');
  const [role_, setRole] = useState<number>(1);
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString()
  });
  const [leadType] = useState<string>('all');
  const [userId, setUserId] = useState("");
  const [token, setToken] = useState("");

  const [totals, setTotals] = useState({
    missedCalls: 0,
    followUpCalls: 0,
    visitsDone: 0,
    dealsDone: 0,
    meetingsDone: 0,
  });

  const [Past6Months, setPast6Months] = useState({
    labels: ["", "", "", "", "", ""],
    visits: [0, 0, 0, 0, 0, 0],
    dealDone: [0, 0, 0, 0, 0, 0],
    meetings: [0, 0, 0, 0, 0, 0],
  });

  const [incentiveData, setIncentiveData] = useState({
    totalIncentiveAll: 0,
    totalIncentiveLast3Months: 0,
    totalSellRevenueAll: 0,
    totalSellRevenueLast3Months: 0
  });
    const [filteredStaffOptions, setFilteredStaffOptions] = useState<any[]>([]);
  const dispatch = useDispatch_();
  const [userData, setUserData] = useState<any>({});
  const [currentUserId, setCurrentUserId] = useState<string>("");
  useEffect(() => {
    // Client-side only
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log("User Data from localStorage:", user);
    setUserData(user);
    setCurrentUserId(user.userId);
  }, []);

  // const { data: Sdata, isError: SisError, isSuccess: SisSuccess, isLoading: SisLoading } =
  //   useG_STAFFQuery({}, { refetchOnMountOrArgChange: true });

  const { data: Sdata, isError: SisError, isSuccess: SisSuccess, isLoading: staffLoading } = useG_STAFFQuery(currentUserId, { refetchOnMountOrArgChange: true });

  const { data: rData, isError, isSuccess, isLoading, error, isFetching } =
    useG_TargetVsAchievementQuery({
      dateRange: {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      },
      staffId,
      leadType
    }, { refetchOnMountOrArgChange: true });

  useEffect(() => {
    function fetchUserData() {
      if (typeof window !== "undefined") {
        const role = localStorage.getItem('role');
        const token = localStorage.getItem('accessToken') || "";
        const userId = localStorage.getItem('UserId');
        setToken(token);
        setUserId(userId || "");
        setRole(Number(role));
      }
    }
    fetchUserData();
  }, []);
      useEffect(() => {
          if (!Sdata?.data) return;
  
          // The API already handles the filtering, so we can use the data directly
          setFilteredStaffOptions(Sdata.data);
  
          // Default to current user if available
          if (Sdata.data.some((staff: any) => staff._id === currentUserId)) {
              setStaffId(currentUserId);
          }
      }, [Sdata, currentUserId]);

  useEffect(() => {
    const fetchData = async () => {
      // Past 6 Months Data
      if (rData?.data?.past6Months) {
        const updatedPast6Months = {
          labels: rData.data.past6Months.map((item: { month: any; }) => item?.month || ""),
          visits: rData.data.past6Months.map((item: { visits: any; }) => item?.visits || 0),
          dealDone: rData.data.past6Months.map((item: { dealDone: any; }) => item?.dealDone || 0),
          meetings: rData.data.past6Months.map((item: { meetings: any; }) => item?.meetings || 0),
        };
        setPast6Months(updatedPast6Months);
      }

      // Leads Data
      if (rData?.data?.leads) {
        const leads = rData.data.leads;
        setTotals({
          missedCalls: leads?.filter((item: { queryDetails: { not_interested_date: any; }; }) => item?.queryDetails?.not_interested_date)?.length || 0,
          followUpCalls: leads?.filter((item: { queryDetails: { call_visit_meeting_consider_in_follow_up_date: any; }; }) => item?.queryDetails?.call_visit_meeting_consider_in_follow_up_date)?.length || 0,
          visitsDone: leads?.filter((item: { queryDetails: { visit_done_date: null; }; leadStatus: string; }) => item?.queryDetails?.visit_done_date != null && item.leadStatus != "notInterest")?.length || 0,

          dealsDone: leads?.filter((item: { queryDetails: { deal_done_date: null; }; leadStatus: string; }) => item?.queryDetails?.deal_done_date != null && item.leadStatus === "deal-done")?.length || 0,
          meetingsDone:
            leads?.filter((item: { queryDetails: { meeting_done_date: null; }; leadStatus: string; }) => item.queryDetails?.meeting_done_date != null && item.leadStatus != "notInterest")?.length || 0,
        });
      }

      // Incentive Data
      if (rData?.data?.incentiveData?.length > 0) {
        setIncentiveData({
          totalIncentiveAll: rData.data.incentiveData[0].totalIncentiveAll || 0,
          totalIncentiveLast3Months: rData.data.incentiveData[0].totalIncentiveLast3Months || 0,
          totalSellRevenueAll: rData.data.incentiveData[0].totalSellRevenueAll || 0,
          totalSellRevenueLast3Months: rData.data.incentiveData[0].totalSellRevenueLast3Months || 0
        });
      }
    };

    if (!isFetching) fetchData();
  }, [rData, isFetching, staffId]);

  // useEffect(() => {
  //   if (isLoading || SisSuccess || isFetching) {
  //     dispatch(loader(true));
  //   } else {
  //     dispatch(loader(false));
  //   }

  //   if (isError || SisError) {
  //     toast.error((error as any)?.data?.message || "An error occurred");
  //   }
  // }, [isLoading, isError, error, SisError, SisSuccess, isFetching]);

  const calculateDateRange = (tab: string) => {
    const today = new Date();
    let startDate: Date, endDate: Date;

    switch (tab) {
      case "Today":
        startDate = endDate = today;
        break;
      case "Weekly":
        const startOfWeek = new Date(today);
        const dayOfWeek = today.getDay();
        const diffToTuesday = dayOfWeek === 0 ? -5 : (dayOfWeek === 1 ? -6 : 2); // Adjust to Tuesday
        startOfWeek.setDate(today.getDate() - dayOfWeek + diffToTuesday);
        startDate = startOfWeek;
        endDate = today;
        break;
      case "Monthly":
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate = startOfMonth;
        endDate = today;
        break;
      default:
        startDate = endDate = today;
    }

    setDateRange({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
  };

  useEffect(() => {
    if (selectedView !== "Custom") {
      calculateDateRange(selectedView);
    }
  }, [selectedView]);

  const data: any = {
    today: {
      target: (isSuccess && rData?.data?.Target?.today) ? rData?.data?.Target?.today : [1, 0, 0, 0],
      achieved: [totals.followUpCalls, totals.visitsDone, totals.meetingsDone, totals.dealsDone],
    },
    weekly: {
      target: (isSuccess && rData?.data?.Target?.weekly) ? rData?.data?.Target?.weekly : [1, 0, 0, 0],
      achieved: [totals.followUpCalls, totals.visitsDone, totals.meetingsDone, totals.dealsDone],
    },
    monthly: {
      target: (isSuccess && rData?.data?.Target?.monthly) ? rData?.data?.Target?.monthly : [1, 0, 0, 0],
      achieved: [totals.followUpCalls, totals.visitsDone, totals.meetingsDone, totals.dealsDone],
    },
  };

  const barChartData = ["Calls", "Visits", "Meetings", "Deal Done"].map((label, index) => ({
    name: label,
    Achieved: data[selectedView.toLowerCase()]?.achieved[index] || 0,
    Remaining: (data[selectedView.toLowerCase()]?.target[index] || 0) -
      (data[selectedView.toLowerCase()]?.achieved[index] || 0),
  }));

  const lineChartData = Past6Months.labels.map((month, index) => ({
    month,
    Visits: Past6Months.visits[index],
    'Deals Done': Past6Months.dealDone[index],
    Meetings: Past6Months.meetings[index],
  }));

      const [hierarchyLoading, setHierarchyLoading] = useState(true);
  
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
  
      useEffect(() => {
          if (!Sdata?.data) return;
  
          // The API already handles the filtering, so we can use the data directly
          setFilteredStaffOptions(Sdata.data);
  
          // Default to current user if available
          if (Sdata.data.some((staff: any) => staff._id === currentUserId)) {
              setStaffId(currentUserId);
          }
      }, [Sdata, currentUserId]);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex justify-between items-center mb-4 px-4 rounded-md">
          <Header header="Team Performance" />
        </div>

        <div className="bg-gradient-to-r from-pink-600 to-indigo-600 p-4 rounded-2xl">
          <div className="w-full flex flex-row items-center justify-center">
            {/* {(role_ === 1 || role_ === 2) && (
              <div className="flex flex-row items-center justify-center w-1/2">
                <span className="text-sm text-white px-2">Select Staff</span>
                <select
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg bg-[#004aad] text-white p-2 w-40"
                >
                  <option value="" disabled>Select</option>
                  {SisSuccess && Sdata?.data?.map((option: any) => (
                    <option key={option._id} value={option._id}>
                      {option.userName.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            )} */}
            {(role_ === 1 || role_ === 2 || role_ === 3 || role_ === 4 || role_ === 5 || role_ === 31 || role_ === 7 || role_ === 6) && (
              <div className="flex items-center gap-2 flex-1">
                <label className="text-sm font-medium text-gray-700"></label>
                { hierarchyLoading ? (
                  <div className="flex-1 p-2 bg-gray-200 rounded animate-pulse">Loading staff...</div>
                ) : (
                  <select
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    className="flex-1 p-2 text-white bg-indigo-600 rounded-lg"
                  >
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

            <div className="flex flex-row items-center justify-center w-1/2">
              <div className="flex space-x-4">
                {["Today", "Weekly", "Monthly"].map((view) => (
                  <button
                    key={view}
                    onClick={() => setSelectedView(view)}
                    className={`px-4 py-2 rounded-lg ${selectedView === view
                      ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white"
                      : "bg-white/20 text-white"
                      }`}
                  >
                    {view}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-5 gap-4 mt-6 bg-white/10 rounded-xl p-4">
            {[
              {
                label: "Total Calls", value: isSuccess && (

                  (rData?.data?.leads?.filter((item: { queryDetails: { call_date: any; }; }) => item?.queryDetails?.call_date)?.length || 0)
                ) || 0
              },
              { label: "Followup", value: isSuccess && rData.data?.leads?.filter((item: { queryDetails: { call_visit_meeting_consider_in_follow_up_date: null; }; leadStatus: string; }) => item.queryDetails.call_visit_meeting_consider_in_follow_up_date != null && item.leadStatus != "notInterest")?.length || 0 },
              { label: "Meetings", value: isSuccess && rData?.data?.leads?.filter((item: { queryDetails: { meeting_done_date: null; }; leadStatus: string; }) => item.queryDetails?.meeting_done_date != null && item.leadStatus != "notInterest")?.length || 0 },
              { label: "Visits", value: isSuccess && rData?.data?.leads?.filter((item: { queryDetails: { visit_done_date: null; }; leadStatus: string; }) => item?.queryDetails?.visit_done_date != null && item.leadStatus != "notInterest")?.length || 0 },
              { label: "Deals Done", value: rData?.data?.leads?.filter((item: { queryDetails: { deal_done_date: null; }; leadStatus: string; }) => item?.queryDetails?.deal_done_date != null && item.leadStatus === "deal-done")?.length || 0 },
            ].map((stat, index) => (
              <div key={index} className="text-center p-3 bg-white/5 rounded-lg">
                <p className="text-white text-sm">{stat.label}</p>
                <p className="text-white text-2xl font-bold">{stat.value}</p>
                <p className="text-white/80 text-xs">{selectedView}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Incentive Section */}
        {rData?.data?.incentiveData?.length == 0 && <div className="text-center">
          <p className="text-sm font-semibold text-gray-600">Monthly Sells Target</p>
          <p className="text-xl font-bold">{rData?.data?.userData?.target || 0}</p>
        </div>}
        {rData?.data?.incentiveData?.length > 0 && (
          <div className="bg-white shadow-md rounded-lg p-4 grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600">Total Incentive</p>
              <p className="text-xl font-bold">{rData?.data?.incentiveData[0]?.totalIncentiveAll || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600">Last 3 Months Incentive</p>
              <p className="text-xl font-bold">{rData?.data?.incentiveData[0]?.totalIncentiveLast3Months || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600">Total Sales Revenue</p>
              <p className="text-xl font-bold">{rData?.data?.incentiveData[0]?.totalSellRevenueAll || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600">Last 3 Months Sales Revenue</p>
              <p className="text-xl font-bold">{rData?.data?.incentiveData[0]?.totalSellRevenueLast3Months || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600">Sells Target</p>
              <p className="text-xl font-bold">{rData?.data?.userData?.target || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600">Your Achievement</p>
              <p className="text-xl font-bold">{rData?.data?.currentMonthData
              [0]?.currentMonthSellRevenue || 0}</p>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-6">
          {/* Target vs Achievement Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-700">Target vs Achievement</h2>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Achieved" stackId="a" fill="#3F51B5" />
                  <Bar dataKey="Remaining" stackId="a" fill="#C6180A" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Past 6 Months Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-700">Achievement (Past 6 Months)</h2>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Visits" stroke="#3F51B5" />
                  <Line type="monotone" dataKey="Deals Done" stroke="#FF5722" />
                  <Line type="monotone" dataKey="Meetings" stroke="#4CAF50" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamPerformance;