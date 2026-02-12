"use client"

import React, { useEffect, useState } from "react";
import Header from "./../../_components/header";
import { useG_Employee_LeadQuery } from './../../_api_query/Leads/leads.api';
import { loader } from "./../../_api_query/store";
import { useDispatch_ } from "./../../../store";
import QueryForm from './../../_components/Form/index';
import LeadForm from "./../../_components/LeadForm";
import QueryTable from "./../../_components/Query";
import PopUpToAddLead from "./../../_components/PopUpToAddLead";
import TableRow from "./../../_components/TableRow";
import { useG_STAFFQuery, useA_STAFFMutation } from "./../../_api_query/staff/staffs.api";
import { toast } from "react-toastify";
import Sidebar from "./../../_components/Sidebar";
import { FaSearch } from 'react-icons/fa';
import { clearUserSelection, toggleUserSelection } from '../../_api_query/store';
import { useSelector } from "react-redux";
import { setNotification, setUserHierarchy } from "@app/_api_query/store";
import { HierarchyService } from "@app/services/hierarchyService";

export default function Lead() {
  const [pop, setPop] = useState(false);
  const [leadForm, setLeadForm] = useState(false);
  const [leadFormData, setLeadFormData] = useState(null);
  const [queryForm, setQueryForm] = useState(false);
  const dispatch = useDispatch_();
  const [queryFormType_, setQueryFormType_] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('fresh');
  const [staffId, setStaffId] = useState<string>("");
  const [assignId, setAssignId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [leadType, setLeadType] = useState<string>('all');
  const [role_, setRole] = useState<any>(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [id, setId] = useState(null);
  const [leadIndex, setLeadIndex] = useState(NaN);
  const [statusChanging, setStatusChanging] = useState(false);

  // Get selected user IDs from Redux store
  const selectedUserIds = useSelector((state: any) => state.store.selectedUserIds);
  const [LeadAssign] = useA_STAFFMutation();

  // Role 31 special assignment logic
  const ROLE_31_ASSIGNABLE_STATUSES = ['fresh', 'notInterest'];
  const [userData, setUserData] = useState<any>({});
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    async function roleFetch() {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setRole(user.role);
      setUserData(user);
      setCurrentUserId(user.userId);
    }
    roleFetch();
  }, []);

  // Clear user selection on mount
  useEffect(() => {
    dispatch(clearUserSelection());
  }, []);

  const [filteredStaffOptions, setFilteredStaffOptions] = useState<any[]>([]);

  // Check if current status allows special assignment for role 31
  const shouldBypassHierarchy = role_ === 31 && ROLE_31_ASSIGNABLE_STATUSES.includes(selectedStatus);
  const isRole31SpecialAssignment = shouldBypassHierarchy;

  const { data, isError, isSuccess, isLoading, error, refetch, isFetching } = useG_Employee_LeadQuery(
    { staffId, search, leadType, page, limit, selectedStatus },
    { refetchOnMountOrArgChange: true }
  );

  // Updated staff query to handle role 31 bypass logic
  const { data: Sdata, isError: SisError, isSuccess: SisLoading, isLoading: staffLoading } = useG_STAFFQuery(
    {
      userId: currentUserId,
      bypassHierarchy: shouldBypassHierarchy
    },
    { 
      refetchOnMountOrArgChange: true,
      refetchOnFocus: false
    }
  );

  const handleStatusChange = async (status: string) => {
    setStatusChanging(true);
    setSelectedStatus(status);
    // Add a small delay to ensure UI updates
    await new Promise(resolve => setTimeout(resolve, 200));
    setStatusChanging(false);
  };

  // Handle bulk user selection
  const handleToggleUser = (userId: any) => {
    dispatch(toggleUserSelection(userId));
  };

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

    console.log('Staff filtering debug for employee leads:', {
      role_,
      selectedStatus,
      isRole31SpecialAssignment,
      staffCount: Sdata.data.length,
      staffList: Sdata.data.map((s: { userName: any; }) => s.userName)
    });

    // The API already handles the filtering based on bypassHierarchy parameter
    setFilteredStaffOptions(Sdata.data);

    // Only set default to current user if no staff is currently selected
    // This prevents resetting the selection when changing status tabs
    if (!staffId && Sdata.data.some((staff: any) => staff._id === currentUserId)) {
      setStaffId(currentUserId);
    }
    
    // If the currently selected staff is not in the new filtered options,
    // then reset to current user (this handles cases where permissions change)
    if (staffId && !Sdata.data.some((staff: any) => staff._id === staffId)) {
      if (Sdata.data.some((staff: any) => staff._id === currentUserId)) {
        setStaffId(currentUserId);
      }
    }
  }, [Sdata, currentUserId, role_, selectedStatus]);

  // Updated submit function with role 31 logic
  const submit = async () => {
    try {
      if (!assignId) {
        return toast.error("Assign Staff is not selected");
      }
      if (selectedUserIds.length === 0) {
        return toast.error("Lead is not selected");
      }

      // Check if role 31 is trying to assign non-allowed statuses
      if (role_ === 31 && !ROLE_31_ASSIGNABLE_STATUSES.includes(selectedStatus)) {
        return toast.error(`Role 31 can only assign ${ROLE_31_ASSIGNABLE_STATUSES.join(' and ')} leads`);
      }

      console.log('Employee leads assignment debug:', {
        role_,
        selectedStatus,
        isRole31SpecialAssignment,
        assignId,
        selectedStaffName: filteredStaffOptions.find(s => s._id === assignId)?.userName
      });

      dispatch(loader(true));
      const obj = {
        assignId,
        selectedUserIds,
        isRole31SpecialAssignment // Pass the special assignment flag
      };

      const res = await LeadAssign(obj).unwrap();
      setAssignId(null);
      refetch();
      dispatch(clearUserSelection());
      
      if (isRole31SpecialAssignment) {
        toast.success("Lead Assigned Successfully (Special Assignment)");
      } else {
        toast.success("Lead Assigned Successfully");
      }
      dispatch(loader(false));
    } catch (error: any) {
      dispatch(loader(false));
      setAssignId(null);
      refetch();
      dispatch(clearUserSelection());
      console.error("Assignment error:", error);
      
      if (error.response?.status === 401) {
        toast.error("Session expired. Please try again.");
      } else {
        toast.error(error?.data?.message || error?.response?.data?.message || "Failed to assign lead");
      }
    }
  };

  // Auto-submit when assignId and selectedUserIds are both set
  useEffect(() => {
    if (assignId && selectedUserIds.length > 0) {
      submit();
    }
  }, [assignId]);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-4">
          <Header header="Employee Leads" />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* Gradient Header Section */}
            <div className="bg-gradient-to-r from-pink-600 to-indigo-600 p-6 rounded-2xl">
              {/* Staff Assignment and Selection */}
              {(role_ == 1 || role_ == 2 || role_ == 3 || role_ == 31 || role_ == 4 || role_ == 6 || role_ == 7) && (
                <div className="flex space-x-4 mb-4">
                  <div className="flex-1">
                    <label className="text-white text-sm mb-1 block">
                      Assign To:
                      {isRole31SpecialAssignment && (
                        <span className="text-yellow-200 text-sm ml-1">(Any Staff)</span>
                      )}
                    </label>
                    {hierarchyLoading ? (
                      <div className="w-full bg-gray-200 rounded-lg p-2 animate-pulse">Loading staff...</div>
                    ) : (
                      <select
                        value={assignId || ''}
                        onChange={(e) => setAssignId(e.target.value)}
                        className="w-full bg-blue-600 text-white rounded-lg p-2"
                      >
                        <option value="">Select Staff</option>
                        {filteredStaffOptions.map((option: any) => (
                          <option key={option._id} value={option._id}>
                            {option.userName.toUpperCase()}
                            {option._id === currentUserId ? " (You)" : ""}
                            {isRole31SpecialAssignment && (
                              <span className="text-green-400"> ✓</span>
                            )}
                          </option>
                        ))}
                      </select>
                    )}
                    {isRole31SpecialAssignment && (
                      <div className="text-yellow-200 text-xs mt-1">
                        Special assignment privileges active
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="text-white text-sm mb-1 block">
                      View Staff:
                      {role_ === 31 && (
                        <span className="text-yellow-200 text-sm ml-1">(All Staff Visible)</span>
                      )}
                    </label>
                    {hierarchyLoading ? (
                      <div className="w-full bg-gray-200 rounded-lg p-2 animate-pulse">Loading staff...</div>
                    ) : (
                      <select
                        value={staffId}
                        onChange={(e) => setStaffId(e.target.value)}
                        className="w-full bg-blue-600 text-white rounded-lg p-2"
                      >
                        {filteredStaffOptions.map((option: any) => (
                          <option key={option._id} value={option._id}>
                            {option.userName.toUpperCase()}
                            {option._id === currentUserId ? " (You)" : ""}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )}

              {/* Role 31 Status Restriction Info */}
              {role_ === 31 && !ROLE_31_ASSIGNABLE_STATUSES.includes(selectedStatus) && (
                <div className="bg-yellow-500/20 border border-yellow-300 rounded-lg p-3 mb-4">
                  <p className="text-yellow-100 text-sm">
                    ⚠️ You can only assign leads from "Fresh" and "Not Interested" status tabs to any staff.
                  </p>
                </div>
              )}

              {/* Search Bar */}
              <div className="flex items-center bg-white/20 rounded-full px-4 py-2 mb-6">
                <FaSearch className="text-white mr-2" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search"
                  className="w-full bg-transparent text-white placeholder-white/80 focus:outline-none"
                />
              </div>

              {/* Status Filters with Role 31 highlighting */}
              <div className="bg-white/10 rounded-xl p-4 flex justify-center space-x-4">
                {[
                  { status: 'fresh', color: 'orange', label: 'Fresh' },
                  { status: 'followup', color: 'green', label: 'Follow-up' },
                  { status: 'notInterest', color: 'red', label: 'Not Interested' },
                  { status: 'deal-done', color: 'yellow', label: 'Deal Done' }
                ].map((item) => {
                  const statusKey = item.status
                    .split('-')
                    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                    .join('');

                  const canAssignThisStatus = role_ !== 31 || ROLE_31_ASSIGNABLE_STATUSES.includes(item.status);

                  return (
                    <button
                      key={item.status}
                      onClick={() => handleStatusChange(item.status)}
                      disabled={statusChanging}
                      className={`px-6 py-2 rounded-lg flex items-center gap-2 relative ${
                        selectedStatus === item.status
                          ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white'
                          : 'bg-white/20 text-white'
                        } ${statusChanging ? 'opacity-50' : ''} ${
                          role_ === 31 && canAssignThisStatus ? 'ring-2 ring-yellow-400' : ''
                        }`}
                    >
                      {statusChanging && selectedStatus === item.status ? (
                        <div className="w-3 h-3 border-t-2 border-b-2 border-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <div className={`w-3 h-3 bg-${item.color}-500 rounded-full`} />
                          {`${item.label} (${data?.data?.[`Total${statusKey}`] || 0})`}
                          {role_ === 31 && canAssignThisStatus && (
                            <span className="text-yellow-400 text-xs ml-1">✓</span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="border rounded-lg px-3 py-2"
              >
                {[10, 20, 50, 100, 250].map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => page > 1 && setPage(page - 1)}
                  className="p-2 rounded-full bg-gray-600 text-white disabled:opacity-50"
                  disabled={page === 1}
                >
                  ←
                </button>
                <span className="font-semibold text-xl">{page}</span>
                <button
                  onClick={() => setPage(page + 1)}
                  className="p-2 rounded-full bg-gray-600 text-white"
                >
                  →
                </button>
              </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4">
                <div className="overflow-x-auto">
                  {/* Table Header */}
                  <div className="flex gap-7 items-center justify-center bg-gray-100 p-4 border-b">
                    <input
                      type="checkbox"
                      className=" mr-2"
                      checked={data?.data?.fields_?.every((item: { _id: any }) =>
                        selectedUserIds.includes(item._id)
                      )}
                      onChange={() => {
                        const allIds = data?.data?.fields_?.map((item: { _id: any }) => item._id);
                        if (data?.data?.fields_?.every((item: { _id: any }) =>
                          selectedUserIds.includes(item._id)
                        )) {
                          handleToggleUser([]);
                        } else {
                          handleToggleUser(allIds);
                        }
                      }}
                    />
                    <p className="font-semibold text-gray-700 basis-3/12">Name</p>
                    {/* Show Assigned User column only for admin or role 31 viewing specific staff */}
                    {(role_ == 1 || role_ === 31) && staffId === "678642d40797483103969bc5" && (
                      <p className="font-semibold text-gray-700 basis-3/12">Assigned User</p>
                    )}
                    <p className="font-semibold text-gray-700 basis-5/12 mr-5">Call Status</p>
                    <p className="font-semibold text-gray-700 basis-4/12 mr-4">Created At</p>
                    <p className="font-semibold text-gray-700 basis-5/12">Last Called At</p>
                    <p className="font-semibold text-gray-700 basis-6/12">Total Calls Made</p>
                    <p className="font-semibold text-gray-700 basis-6/12">Action</p>
                  </div>

                  {/* Table Body */}
                  <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
                    {statusChanging ? (
                      <div className="flex justify-center items-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
                      </div>
                    ) : isSuccess && data?.data?.fields_?.length > 0 ? (
                      [...data.data.fields_]
                        .sort((a: any, b: any) => a.name?.localeCompare(b.name))
                        .map((lead_: any) => (
                          <TableRow
                            key={lead_._id}
                            setId={setId}
                            lead_={lead_}
                            setLeadForm={setLeadForm}
                            setLeadFormData={setLeadFormData}
                            selectedStatus={selectedStatus}
                            search={search}
                            leadType={leadType}
                            isLeadsPageE={true}
                            showAssignedUser={(role_ == 1 || role_ === 31) && staffId === "678642d40797483103969bc5"}
                          />
                        ))
                    ) : (
                      <div className="text-center py-10 font-semibold text-gray-400">
                        {isLoading ? 'Loading...' : 'No Data Found!'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Role 31 Assignment Info Box */}
            {role_ === 31 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Role 31 Special Privileges:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Can view all staff members' leads across all statuses</li>
                  <li>• Can assign Fresh and Not Interested leads to any staff member</li>
                  <li>• Assignment restrictions apply only to Fresh and Not Interested statuses</li>
                  <li>• Other statuses are view-only for assignment purposes</li>
                </ul>
              </div>
            )}

            {/* Modals */}
            {pop && <PopUpToAddLead setPop={setPop} setLeadForm={setLeadForm} />}
            {queryForm && (
              <QueryForm
                leadIndex={leadIndex}
                setLeadIndex={setLeadIndex}
                setQueryForm={setQueryForm}
                setQueryFormType_={setQueryFormType_}
                id={id}
                type_={queryFormType_}
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
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}