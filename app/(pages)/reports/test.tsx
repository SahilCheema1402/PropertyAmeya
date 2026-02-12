"use client"

import React, { useState, useEffect } from 'react';
// import { div, p, ScrollView, button, Appearance, Pressable, Modal } from 'react-native';
import Header from './../../_components/header';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartOptions } from 'chart.js';
import DatePicker from "react-datepicker";
import 'react-datepicker/dist/react-datepicker.css';

// import { BarChart } from "react-native-chart-kit";
// import { Dimensions } from "react-native";
// import DateTimePicker from 'react-native-ui-datepicker';
import { useDispatch_, useSelector_ } from "./../../../store";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { Picker } from '@react-native-picker/picker';
import { useG_STAFFQuery } from './../../_api_query/staff/staffs.api';
import { useG_ReportQuery } from './../../_api_query/report/report.api';
// import Icon from "react-native-vector-icons/MaterialCommunityIcons";
// const screenWidth = Dimensions.get("window").width;
import { loader } from "./../../_api_query/store";
// import Toast from "react-native-toast-message";
import { toast } from "react-toastify";
import Sidebar from './../../_components/Sidebar';

const ReportsScreen = () => {
  // const [isDarkTheme, setIsDarkTheme] = useState(Appearance.getColorScheme() === 'dark');
  const [activeTab, setActiveTab] = useState("Today");
  const [dateRange, setDateRange] = useState<any>(
    // { startDate: new Date(), endDate: new Date() }
  );
  const [role_, setRole] = useState<any>(1)
  const [staffId, setStaffId] = useState("")
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSelectingStartDate, setIsSelectingStartDate] = useState(true);
  const [leadType, setLeadType] = useState<string>('all');
  const [popUpVisible, setPopUpVisible] = useState(false);
  const [modalData, setModalData] = useState([]);
  const dispatch = useDispatch_();
  const { data: Sdata, isError: SisError, isSuccess: SisSuccess, isLoading: SisLoading } = useG_STAFFQuery({}, { refetchOnMountOrArgChange: true })
  const { data: rData, isError, isSuccess, isLoading, error, refetch, isFetching } = useG_ReportQuery({ dateRange, staffId, leadType }, { refetchOnMountOrArgChange: true });
  // Calculate counts for each day of the week
  const calculateWeeklyProgress = (rData: any[]) => {
    const progressCounts = [0, 0, 0, 0, 0, 0, 0]; // Array to store counts for SUN, MON, TUE, WED, THU, FRI, SAT

    rData.forEach(item => {
      const dateFields = ['meeting_done_date', 'visit_done_date', 'deal_done_date', 'followup_date'];
      dateFields?.forEach(field => {
        if (item[field] !== null) {
          const date = new Date(item[field]);
          const dayOfWeek = date?.getDay(); // Get the day of the week (0: SUN, 1: MON, ..., 6: SAT)
          progressCounts[dayOfWeek] += 1; // Increment the count for that day
        }
      });
    });

    return progressCounts;
  };
  ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
  let progressData = [0, 0, 0, 0, 0, 0, 0]; // Default empty data

  // Calculate weekly progress only if isSuccess is true
  if (isSuccess && rData && rData?.data) {
    progressData = calculateWeeklyProgress(rData?.data); // Calculate progress counts
  }

  // Update the chart data
  const chartData = {
    labels: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"],
    datasets: [
      {
        data: progressData,
        backgroundColor: 'rgba(75, 192, 192, 0.2)', // Bar color
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true, // Makes the chart responsive
    maintainAspectRatio: false, // Allows for custom height/width
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          maxRotation: 0, // Prevents labels from rotating
        },
      },
      y: {
        beginAtZero: true, // Starts the Y-axis from 0
        ticks: {
          stepSize: 10, // Y-axis intervals (can be customized)
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const, // Explicitly set the type for position (ensuring it's one of the valid options)
      },
    },
  };

  const openPopUp = (data: any) => {
    setModalData(data);
    setPopUpVisible(true);
  };


  // useEffect(() => {
  //   const listener = ({ colorScheme }: any) => {
  //     setIsDarkTheme(colorScheme === 'dark');
  //   };
  //   Appearance.addChangeListener(listener);
  // }, [isDarkTheme]);

  const calculateDateRange = (tab: string) => {
    const today = new Date();
    let startDate, endDate;

    if (tab === "Today") {
      startDate = endDate = today;
    } else if (tab === "Week") {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startDate = startOfWeek;
      endDate = today;
    } else if (tab === "Month") {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      startDate = startOfMonth;
      endDate = today;
    }

    setDateRange({ startDate, endDate });
    // makeApiCall({ startDate, endDate });
  };


  const handleCustomTabPress = () => {
    setIsSelectingStartDate(true);
    setShowDatePicker(true);
  };

  

  const handleDateConfirm = (date: { toISOString: () => any; }) => {
    if (isSelectingStartDate) {
      // Convert startDate to ISO string before updating state
      setDateRange({ ...dateRange, startDate: date.toISOString() });
      setIsSelectingStartDate(false); // Switch to selecting end date
    } else {
      // Convert endDate to ISO string before updating state
      setDateRange({ ...dateRange, endDate: date.toISOString() });
      setShowDatePicker(false); // Hide date picker after selecting end date
      // Optionally, you can dispatch the action or make an API call here
    }
  };

  

  const handleDateChange = (date: any) => {
    handleDateConfirm(date);
  };

  useEffect(() => {
    if (activeTab !== "Custom") {
      calculateDateRange(activeTab);
    }
  }, [activeTab]);
  useEffect(() => {
    // const listener = ({ colorScheme }: any) => {
    //   setIsDarkTheme(colorScheme === 'dark');
    // };
    // Appearance.addChangeListener(listener);
    async function roleFetch() {
      const role = await localStorage.getItem('role');
      setRole(role)
    }
    roleFetch()
  }, []);
  useEffect(() => {
    if (isLoading || SisLoading || isFetching) {
      dispatch(loader(true))
    } else {
      dispatch(loader(false))
    }
    // if (isError || SisError) {
    //   Toast.show({
    //     type: "error",
    //     text1: "Error",
    //     text2: `${(error as any)?.data?.message}`,
    //     text2Style: {
    //       fontSize: 10,
    //       height: "auto",
    //       overflow: 'scroll',
    //     },
    //     text1Style: {
    //       fontSize: 16
    //     }
    //   })
    // }

  }, [isLoading, isSuccess, isError, error, SisError, SisLoading, SisSuccess, isFetching]);

  const handleChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
    setLeadType(event.target.value);
  };

  return (
    <div className="flex h-screen bg-gray-100 ">
      <Sidebar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2 space-y-6 overflow-scroll ">
        <div className="flex justify-between items-center mb-4 px-4 rounded-md" >
          <Header header="Reports" />
        </div>
        {/* <ScrollView className="bg-white "> */}
        {(role_ == 1 || role_ == 2) && (
          <div className="flex flex-row my-2 px-1 w-full items-center justify-between">
            {/* User Dropdown */}
            <div className="flex flex-col w-1/3 pr-2">
              <p className="text-sm px-2">User</p>
              <div className="border-[#fdfdfe] border-[1px] w-full rounded-lg bg-[#004aad]">
                <select
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  className="w-full h-8 text-white bg-[#004aad] rounded-lg px-2" // Blue background
                >
                  {SisSuccess && Sdata?.data?.map((option: any) => (
                    <option key={option.value} label={option.userName.toUpperCase()} value={option._id} />
                  ))}
                </select>
              </div>
            </div>

            {/* Lead Dropdown */}
            <div className="flex flex-col w-1/3 pl-2">
              <p className="text-sm px-2">Lead</p>
              <div className="border-[#fbfbfc] border-[1px] w-full rounded-lg bg-[#004aad]">
                <select
                  value={leadType}
                  onChange={handleChange}
                  className="w-full h-8 text-white bg-[#004aad] rounded-lg px-2" // Blue background
                >
                  <option value="all">All Lead</option>
                  <option value="rent">Rent Lead</option>
                  <option value="residential">Residential Lead</option>
                  <option value="commercial">Commercial Lead</option>
                </select>
              </div>
            </div>
          </div>
        )}


        {/* Filter Tabs */}
        <div className="flex mb-6 w-full justify-evenly">
          {["Today", "Week", "Month", "Custom"].map((tab, index) => (
            <button
              key={index}
              onClick={() => {
                setActiveTab(tab);
                if (tab === "Custom") handleCustomTabPress();
              }}
              className={(
                activeTab === tab
                  ? "bg-blue-500 px-4 py-2 rounded-full"
                  : "bg-gray-200 px-4 py-2 rounded-full"
              )}
            >
              <p
                className={(
                  activeTab === tab ? "text-white text-sm" : "text-gray-600 text-sm"
                )}
              >
                {tab}
              </p>
            </button>
          ))}
        </div>

        {/* Circle Progress Metrics */}
        <div className="flex justify-between mb-6">
          {[
            {
              label: "TOTAL CALLS PLACED",
              value: rData?.data.filter((item: { call_date: null; }) => item?.call_date != null)?.length, // Filter based on call_date
              color: "green-500"
            },
            {
              label: "Followup Calls",
              value: rData?.data.filter((item: { call_date: null; }) => item?.call_date != null)?.length - rData?.data.filter((item: { ringing_switch_off_date: null; }) => item?.ringing_switch_off_date != null).length,
              color: "#004aad"
            },
            {
              label: "MISSED CALLS",
              value: rData?.data.filter((item: { ringing_switch_off_date: null; }) => item?.ringing_switch_off_date != null)?.length, // Filter for missed calls
              color: "#FF0000"
            }
          ].map((item, index) => (
            <div key={index} className="flex flex-col items-center">
              <div style={{
                borderRadius: item.label !== "TOTAL CALLS PLACED" ? 9999 : 0, // rounded-full equivalent
                borderWidth: item.label !== "TOTAL CALLS PLACED" ? 4 : 0, // border-4 equivalent
                borderColor: item.color, // Dynamically set border color
              }} className="w-20 h-20 flex justify-center items-center">
                <p className={`text-lg ${item.label == "TOTAL CALLS PLACED" ? "text-4xl" : ""} font-bold text-gray-700`}>
                  {item.value || 0}
                </p>
              </div>
              <p className="text-sm text-gray-600 mt-2">{item.label}</p>
            </div>
          ))}
        </div>


        <div style={{ flex: 1 }}>
          {/* <ScrollView horizontal contentContainerStyle={{ flexGrow: 1 }}> */}
          <Bar data={chartData} options={chartOptions} />


          {/* </ScrollView> */}
        </div>
        {isSuccess && rData?.data && (
          <div>

            <button onClick={() => openPopUp(rData.data.filter((item: { call_date: null; }) => item.call_date != null))}>
              <div className="flex-row justify-between p-semibold items-center px-3 py-1">
                <p className="p-lg font-bold p-gray-600">Total Placed Calls</p>
                <p className="p-lg font-bold p-gray-700">{rData.data.filter((item: { call_date: null; }) => item.call_date != null)?.length || 0}</p>
              </div>
            </button>

            <button onClick={() => openPopUp(rData.data.filter((item: { followup_date: null; }) => item.followup_date != null))}>
              <div className="flex-row justify-between items-center px-7 py-1">
                <p className="p-base p-gray-600">Followup</p>
                <p className="p-base font-bold p-gray-700">{rData.data.filter((item: { followup_date: null; }) => item.followup_date != null)?.length || 0}</p>
              </div>
            </button>
            {/* Total Meetings */}
            <button onClick={() => openPopUp(rData.data.filter((item: { meeting_done_date: null; }) => item.meeting_done_date != null))}>
              <div className="flex-row justify-between items-center px-7 py-1">
                <p className="p-base p-gray-600">Meeting</p>
                <p className="p-base font-bold p-gray-700">
                  {rData?.data.filter((item: { meeting_done_date: null; }) => item.meeting_done_date != null)?.length || 0}
                </p>
              </div>
            </button>

            {/* Total Visits */}
            <button onClick={() => openPopUp(rData.data.filter((item: { visit_done_date: null; }) => item.visit_done_date != null))}>

              <div className="flex-row justify-between items-center px-7 py-1">
                <p className="p-base p-gray-600">Visit</p>
                <p className="p-base font-bold p-gray-700">
                  {rData?.data.filter((item: { visit_done_date: null; }) => item?.visit_done_date != null)?.length || 0}
                </p>
              </div>
            </button>
            <button onClick={() => openPopUp(rData.data.filter((item: { deal_done_date: null; }) => item.deal_done_date != null))}>

              <div className="flex-row justify-between items-center px-7 py-1">
                <p className="p-base p-gray-600">Deal Done</p>
                <p className="p-base font-bold p-gray-700">{rData?.data.filter((item: { deal_done_date: null; }) => item?.deal_done_date != null)?.length || 0}</p>
              </div>
            </button>


          </div>
        )}


        <div className=' flex flex-col  '>
          {/* DateTimePicker */}
          {showDatePicker && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                right: 0,
                zIndex: 10,
                backgroundColor: '#fff',
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 8,
              }}
            >
              <DatePicker
          selected={isSelectingStartDate ? dateRange.startDate : dateRange.endDate}
          onChange={handleDateChange}
          dateFormat="dd/MM/yyyy"
          inline // Optional, if you want the calendar inline
        />
            </div>
          )}
        </div>
        {/* </ScrollView> */}
        {popUpVisible && (
          <PopUpToReport reportData={modalData} setPopUpVisible={setPopUpVisible} />
        )}
      </div>
    </div>
  );
};

export default ReportsScreen;

function PopUpToReport({ reportData, setPopUpVisible }: any) {
  const [selectedData, setSelectedData] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const openModal = (item: any) => {
    setSelectedData(item);
    setModalVisible(true);
  };
  if (reportData?.length == 0) {
    return (
      <button onClick={(e) => { e.stopPropagation(), setPopUpVisible(false) }} className="h-full w-screen bg-black/30 dark:bg-zinc-700/50 absolute left-0 bottom-0 z-10 flex justify-center items-center ">
        <button className="max-h-4/6 min-h-fit bg-white rounded-xl px-4 py-8 flex flex-col w-[80%]">
          <div className="w-full flex justify-center items-center">
            <p className="p-xl  p-black font-bold">No Data Found!</p>
          </div>
        </button>
      </button>
    )
  }
  function formatDateToDDMMYYYY(datetimeString: string | number | Date) {

    if (!datetimeString) {
      return 'Date not available';
    }

    const date: any = new Date(datetimeString);


    if (isNaN(date)) {
      return 'Invalid date format';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }
  return (
    <button onClick={(e) => { e.stopPropagation(), setPopUpVisible(false) }} className="h-full w-screen bg-black/30 dark:bg-zinc-700/50 absolute left-0 bottom-0 z-10 flex justify-center items-center ">
      <button className=" min-h-fit bg-white rounded-xl px-4 py-8 flex flex-col w-[90%]">
        <div className="border-b-2 border-b-gray-300 basis-1/12  p-3 flex flex-row items-center ">
          <div className=""></div>

          <p className="font-semibold p-lg p-gray-600/70 basis-5/12   px-4">Name</p>
          <p className="font-semibold p-lg p-gray-600/70 basis-3/12   px-2">Phone</p>
          <p className="font-semibold p-lg p-gray-600/70  px-2">Source</p>

        </div>
        {/* <ScrollView> */}
        {reportData?.sort((a: any, b: any) => {
          if (a.name && b.name) {
            return a.name.localeCompare(b.name); // Sorting alphabetically by 'name'
          }
          return 0;
        })?.map((item: any) => (
          <button
            key={item._id}
            onClick={() => openModal(item.queryDetails)}
            className="border-b-[1px] border-b-gray-300 w-full p-3 flex flex-row justify-between items-center"
          >

            <div className=" flex flex-row items-center justify-start gap-x-2 px-2">
              <div className="bg-[#004aad] px-2 py-[2px] flex flex-row justify-center items-center rounded-full">
                <p className="p-white font-semibold p-lg">
                  {item?.name?.split('')[0]?.toUpperCase()}
                </p>
              </div>

              <div>
                <p className="font-semibold p-[10px] p-gray-600/70">
                  {item?.name?.toUpperCase()}
                </p>
              </div>



            </div>
            <div className=" basis-4/12  flex flex-row items-center justify-start gap-x-4">
              <p className=" font-semibold p-[10px] p-gray-600/70">{item?.phone?.toUpperCase()}</p>
            </div>

            <div className=" basis-4/12  flex flex-row items-center justify-start gap-x-4 ">
              <p className=" font-semibold p-[10px] p-gray-600/70">{item?.source?.toUpperCase()}</p>
            </div>

          </button>
        ))}
        {/* </ScrollView> */}
        {/* <Modal
          visible={modalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        > */}
          <div className="flex-1 justify-center items-center  bg-opacity-50">
            <div className="bg-white w-11/12 rounded-lg p-4">
              <div className="flex flex-row px-4  justify-end items-center">
                <button className=" bg-[#004aad]  p-1 rounded-full" onClick={() => setModalVisible(false)}>
                  {/* <Icon name="window-close" size={16} color="white" /> */}
                </button>
              </div>
              <p className="p-lg font-bold mb-2 p-center">Query Details</p>
              {selectedData ? (
                // <ScrollView>
                <div className="flex flex-col justify-between px-2">

                  <div className="flex flex-row justify-between">
                    <div className="">
                      <p className="p-[#71757d] p-base p-wrap font-semibold capitalize">
                        Lead Type
                      </p>
                    </div>
                    <div className=" flex flex-row justify-end">
                      <p className="p-[#71757d] font-semibold p-base p-wrap p-end capitalize">
                        {selectedData?.leadType}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row justify-between">
                    <div className="">
                      <p className="p-[#71757d] p-base p-wrap font-semibold capitalize">
                        Project
                      </p>
                    </div>
                    <div className=" flex flex-row justify-end">
                      <p className="p-[#71757d] font-semibold p-base p-wrap p-end capitalize">
                        {selectedData?.project || 'Not Available'}
                      </p>
                    </div>
                  </div>
                  {selectedData?.leadType == "residential" && <div className="flex flex-row justify-between">
                    <div className="">
                      <p className="p-[#71757d] p-base p-wrap font-semibold capitalize">
                        Size
                      </p>
                    </div>
                    <div className=" flex flex-row justify-end">
                      <p className="p-[#71757d] font-semibold p-base p-wrap p-end capitalize">
                        {selectedData?.size || 'Not Available'}
                      </p>
                    </div>
                  </div>}
                  <div className="flex flex-row justify-between">
                    <div className="">
                      <p className="p-[#71757d] p-base p-wrap font-semibold capitalize">
                        budget
                        {/* (<Icon name="currency-inr" size={15} color="#6b7280" />) */}
                      </p>
                    </div>
                    <div className=" flex flex-row justify-end">
                      <p className="p-[#71757d] font-semibold p-base p-wrap p-end capitalize">
                        {selectedData?.budget || 'Not Available'}
                      </p>
                    </div>
                  </div>
                  {(selectedData?.leadType != "commercial") && <div className="flex flex-row justify-between">
                    <div className="">
                      <p className="p-[#71757d] p-base p-wrap font-semibold capitalize">
                        BHK
                      </p>
                    </div>
                    <div className=" flex flex-row justify-end">
                      <p className="p-[#71757d] font-semibold p-base p-wrap p-end capitalize">
                        {selectedData?.bhk || 'Not Available'}
                      </p>
                    </div>
                  </div>}
                  {(selectedData?.leadType != "commercial") && <div className="flex flex-row justify-between">
                    <div className="">
                      <p className="p-[#71757d] p-base p-wrap font-semibold capitalize">
                        Floor
                      </p>
                    </div>
                    <div className=" flex flex-row justify-end">
                      <p className="p-[#71757d] font-semibold p-base p-wrap p-end capitalize">
                        {selectedData?.floor || 'Not Available'}
                      </p>
                    </div>
                  </div>}
                  {(selectedData?.leadType == "commercial") && <div className="flex flex-row justify-between">
                    <div className="">
                      <p className="p-[#71757d] p-base p-wrap font-semibold capitalize">
                        Purpose
                      </p>
                    </div>
                    <div className=" flex flex-row justify-end">
                      <p className="p-[#71757d] font-semibold p-base p-wrap p-end capitalize">
                        {selectedData?.purpose || 'Not Available'}
                      </p>
                    </div>
                  </div>}
                  {(selectedData?.leadType == "commercial") && <div className="flex flex-row justify-between">
                    <div className="">
                      <p className="p-[#71757d] p-base p-wrap font-semibold capitalize">
                        Location
                      </p>
                    </div>
                    <div className=" flex flex-row justify-end">
                      <p className="p-[#71757d] font-semibold p-base p-wrap p-end capitalize">
                        {selectedData?.location || 'Not Available'}
                      </p>
                    </div>
                  </div>}
                  {(selectedData?.leadType == "rent") && <div className="flex flex-row justify-between">
                    <div className="">
                      <p className="p-[#71757d] p-base p-wrap font-semibold capitalize">
                        Shifting Date
                      </p>
                    </div>
                    <div className=" flex flex-row justify-end">
                      <p className="p-[#71757d] font-semibold p-base p-wrap p-end capitalize">
                        {formatDateToDDMMYYYY(selectedData?.shifting_date) || 'Not Available'}
                      </p>
                    </div>
                  </div>}
                  <div className="flex flex-row justify-between">
                    <div className="">
                      <p className="p-[#71757d] p-base p-wrap font-semibold capitalize">
                        Followup Date
                      </p>
                    </div>
                    <div className=" flex flex-row justify-end">
                      <p className="p-[#71757d] font-semibold p-base p-wrap p-end capitalize">
                        {formatDateToDDMMYYYY(selectedData?.followup_date) || 'Not Available'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-row justify-between">
                    <div className="">
                      <p className="p-[#71757d] p-base p-wrap font-semibold capitalize">
                        Exp Visit Date
                      </p>
                    </div>
                    <div className=" flex flex-row justify-end">
                      <p className="p-[#71757d] font-semibold p-base p-wrap p-end capitalize">
                        {formatDateToDDMMYYYY(selectedData?.exp_visit_date) || 'Not Available'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-row justify-between">
                    <div className="">
                      <p className="p-[#71757d] p-base p-wrap font-semibold capitalize">
                        Type
                      </p>
                    </div>
                    <div className=" flex flex-row justify-end">
                      <p className="p-[#71757d] font-semibold p-base p-wrap p-end capitalize">
                        {selectedData?.type || 'Not Available'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row justify-between">
                    <div className="">
                      <p className="p-[#71757d] p-base p-wrap font-semibold capitalize">
                        Call Status
                      </p>
                    </div>
                    <div className=" flex flex-row justify-end">
                      <p className="p-[#71757d] font-semibold p-base p-wrap p-end capitalize">
                        {selectedData?.call_status || 'Not Available'}
                      </p>
                    </div>
                  </div>
                  {selectedData?.call_status == "Visit Done" && <div className="flex flex-row justify-between">
                    <div className="">
                      <p className="p-[#71757d] p-base p-wrap font-semibold capitalize">
                        Visit Date
                      </p>
                    </div>
                    <div className=" flex flex-row justify-end">
                      <p className="p-[#71757d] font-semibold p-base p-wrap p-end capitalize">
                        {formatDateToDDMMYYYY(selectedData?.visit_done) || 'Not Available'}
                      </p>
                    </div>
                  </div>}
                  {selectedData?.call_status == "Meeting Done" && <div className="flex flex-row justify-between">
                    <div className="">
                      <p className="p-[#71757d] p-base p-wrap font-semibold capitalize">
                        Meeting Date
                      </p>
                    </div>
                    <div className=" flex flex-row justify-end">
                      <p className="p-[#71757d] font-semibold p-base p-wrap p-end capitalize">
                        {formatDateToDDMMYYYY(selectedData?.meeting_done) || 'Not Available'}
                      </p>
                    </div>
                  </div>}
                  <div className="flex flex-row justify-between">
                    <div className="">
                      <p className="p-[#71757d] p-base p-wrap font-semibold capitalize">
                        Status
                      </p>
                    </div>
                    <div className=" flex flex-row justify-end">
                      <p className="p-[#71757d] font-semibold p-base p-wrap p-end capitalize">
                        {selectedData?.status || 'Not Available'}
                      </p>
                    </div>
                  </div>
                  {selectedData?.status == "Not Interested" && <div className="flex flex-row justify-between">
                    <div className="">
                      <p className="p-[#71757d] p-base p-wrap font-semibold capitalize">
                        Reason
                      </p>
                    </div>
                    <div className=" flex flex-row justify-end">
                      <p className="p-[#71757d] font-semibold p-base p-wrap p-end capitalize">
                        {selectedData?.reason || 'Not Available'}
                      </p>
                    </div>
                  </div>}
                  {selectedData?.status == "Deal Done" && <div className="flex flex-row justify-between">
                    <div className="">
                      <p className="p-[#71757d] p-base p-wrap font-semibold capitalize">
                        Closing Amount
                      </p>
                    </div>
                    <div className=" flex flex-row justify-end">
                      <p className="p-[#71757d] font-semibold p-base p-wrap p-end capitalize">
                        {selectedData?.closing_amount || 'Not Available'}
                      </p>
                    </div>
                  </div>}
                </div>
                // </ScrollView>
              ) : (
                <p>No Details Available</p>
              )}
            </div>
          </div>
        {/* </Modal> */}
      </button>
    </button>
  )
}

