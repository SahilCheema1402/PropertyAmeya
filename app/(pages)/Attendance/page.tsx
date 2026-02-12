// app/attendance/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import {
  useGetAttendanceStatusQuery,
} from '@app/_api_query/attendance/attendance.api';
import { skipToken } from '@reduxjs/toolkit/query';
import AttendanceStatus from '@app/_components/AttendanceStatus';
import CheckInOutButton from '@app/_components/CheckInOutButton';
import AttendanceTable from '@app/_components/AttendanceTable';
import Sidebar from '@app/_components/Sidebar';
import Header from '@app/_components/header';
import { UserRoles } from '@app/_enums/enums';
import AttendanceSummary from '@app/_components/AttendanceSummary';

export default function AttendancePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<number | null>(null);
  const [token, setToken] = useState("");
  const [user, setUser] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setRole(user.role);
    setUserId(user.userId);
    setToken(localStorage.getItem('accessToken') || '');
    setUser(localStorage.getItem('comUserId') || '');
  }, []);

  const isAdmin = role !== null && [UserRoles.SuperAdmin, UserRoles.Admin].includes(role);

  const { data: status, refetch: refetchStatus } = useGetAttendanceStatusQuery(
    userId ? { userId } : skipToken,
    { pollingInterval: 30000 }
  );

  // if (!userId || role === null) {
  //   return <div className="flex justify-center items-center h-screen">Loading user data...</div>;
  // }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-slate-100 text-gray-900">
      <Sidebar />

      <div className="flex-1 p-6 space-y-6">
        <Header header="Attendance" />

        {/* Status Section */}
        <div className="rounded-xl shadow-lg bg-gradient-to-r from-blue-500 to-blue-700 text-white p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Today's Status</h2>
            <CheckInOutButton status={status} />
          </div>
          <div className="bg-white/20 rounded-lg p-4">
            <AttendanceStatus status={status} />
          </div>
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div className="rounded-xl shadow-lg bg-white p-6 border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Team Attendance Overview</h2>
            <div className="bg-slate-50 rounded-md p-4">
              <AttendanceSummary />
            </div>
          </div>
        )}

        {/* Table Section */}
        <div className="rounded-xl shadow-lg bg-white p-6 border border-slate-200">
          <AttendanceTable userId={userId} role={role} />
        </div>
      </div>
    </div>
  );
}