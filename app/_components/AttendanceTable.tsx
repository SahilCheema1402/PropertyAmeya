// app/_components/AttendanceTable.tsx
'use client';
import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Calendar, Loader2, Download } from 'lucide-react';
import { format, parseISO, subMonths } from 'date-fns';
import {
  useGetAllAttendanceQuery,
  useGetUserAttendanceQuery,
} from '@app/_api_query/attendance/attendance.api';
import { useG_STAFFQuery } from '@app/_api_query/staff/staffs.api';
import { UserRoles } from '@app/_enums/enums';
import { Button } from '@headlessui/react';
import { setNotification, setUserHierarchy } from "@app/_api_query/store";
import { useDispatch_ } from "@/store";
import { HierarchyService } from "@app/services/hierarchyService";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import DatePicker from 'react-datepicker';
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';


interface AttendanceRecord {
  _id: string;
  userName?: string;
  date: string;
  checkIn: Date;
  checkOut?: Date;
  checkInLocation?: { address?: string };
  checkOutLocation?: { address?: string };
  status: 'Full Day' | 'Half Day' | 'Absent';
  totalHours?: number;
}

interface AttendanceTableProps {
  userId: string | null;
  role: number | null;
}

export default function AttendanceTable({ userId, role }: AttendanceTableProps) {
  const [dateRange, setDateRange] = useState({
    start: subMonths(new Date(), 1),
    end: new Date(),
  });
  const [staffId, setStaffId] = useState<string>("");
  const [filteredStaffOptions, setFilteredStaffOptions] = useState<any[]>([]);
  const dispatch = useDispatch_();
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  console.log("selectedStaffselectedStaffselectedStaffselectedStaffselectedStaff0", selectedStaff)
  const [userData, setUserData] = useState<any>({});
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [hierarchyLoading, setHierarchyLoading] = useState(true);
  const userHierarchy = useSelector((state: any) => state.store.userHierarchy);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log("User Data from localStorage:", user);
    setUserData(user);
    setCurrentUserId(user.userId);
  }, []);

  const { data: Sdata, isError: SisError, isSuccess: SisSuccess, isLoading: staffLoading } = useG_STAFFQuery(
    currentUserId,
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: false
    }
  );

  const cap = (s: string = '') =>
    s
      .toLowerCase()
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');


  const start = dateRange.start ? format(dateRange.start, 'yyyy-MM-dd') : undefined;
  const end = dateRange.end ? format(dateRange.end, 'yyyy-MM-dd') : undefined;

  const attendanceQueryParams: any = {};

  if (selectedStaff !== null && selectedStaff !== '') {
    attendanceQueryParams.userId = selectedStaff;
  }

  if (start && end) {
    attendanceQueryParams.start = start;
    attendanceQueryParams.end = end;
  }

  const { data, isLoading } = role === UserRoles.SuperAdmin || role === UserRoles.Admin
    ? useGetAllAttendanceQuery(
      { userIds: selectedStaff ? [selectedStaff] : [], start, end },
      { skip: !userId }
    )
    : useGetUserAttendanceQuery(
      { userId, start, end },
      { skip: !userId }
    );

  const getAttendanceStatus = (record: AttendanceRecord) => {
    // Only calculate status if both check-in and check-out exist
    if (record.checkIn && record.checkOut && record.totalHours !== undefined) {
      if (record.totalHours >= 9) {
        return 'Full Day';
      } else if (record.totalHours >= 6) {
        return 'Half Day';
      } else {
        return 'Absent';
      }
    }
    // Return null if only one punch exists
    return null;
  };


  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
    setDateRange(prev => ({
      ...prev,
      [type]: new Date(e.target.value),
    }));
  };

  const formatTime = (date?: Date) => {
    if (!date) return '--';
    return format(new Date(date), 'hh:mm a');
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'MMM dd, yyyy');
  };

  const exportToExcel = () => {
  if (!data || data.length === 0) return;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Attendance Report');

  // 1️⃣ Add header row
  const headers = [
    'User Name',
    'Date', 
    'Year',
    'Check In',
    'Check In Location',
    'Check Out', 
    'Check Out Location',
    'Total Hours',
    'Status'
  ];

  worksheet.addRow(headers);

  // 2️⃣ Style header cells
  const styleHeaderCell = (cell: ExcelJS.Cell, color: string) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: color }
    };
    cell.font = { 
      bold: true, 
      color: { argb: 'FFFFFFFF' }, // White text
      size: 12 
    };
    cell.alignment = { 
      vertical: 'middle', 
      horizontal: 'center' 
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  };

  const styleDataCell = (cell: ExcelJS.Cell) => {
    cell.alignment = { 
      vertical: 'middle', 
      horizontal: 'center' 
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  };

  // 3️⃣ Apply blue background to header row
  const headerRow = worksheet.getRow(1);
  for (let i = 1; i <= headers.length; i++) {
    styleHeaderCell(headerRow.getCell(i), 'FF4F46E5'); // Blue background
  }

  // 4️⃣ Add data rows
  data.forEach((record: AttendanceRecord) => {
    const status = getAttendanceStatus(record);
    const dateObj = new Date(record.date);
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    const year = dateObj.getFullYear();

    const row = worksheet.addRow([
      cap(record.userName) || 'Unknown',
      formattedDate,
      year,
      formatTime(record.checkIn),
      record.checkInLocation?.address || 'N/A',
      formatTime(record.checkOut),
      record.checkOutLocation?.address || 'N/A',
      record.totalHours?.toFixed(2) || '--',
      status || '--'
    ]);

    // Style data cells
    for (let i = 1; i <= headers.length; i++) {
      styleDataCell(row.getCell(i));
    }
  });

  // 5️⃣ Adjust column widths
  worksheet.columns.forEach((col, index) => {
    const headerLength = headers[index]?.length || 10;
    col.width = Math.max(headerLength + 2, 15); // Minimum 15, or header length + padding
  });

  // Set specific widths for certain columns
  worksheet.getColumn(1).width = 20; // User Name
  worksheet.getColumn(2).width = 12; // Date
  worksheet.getColumn(3).width = 8;  // Year
  worksheet.getColumn(4).width = 12; // Check In
  worksheet.getColumn(5).width = 25; // Check In Location
  worksheet.getColumn(6).width = 12; // Check Out
  worksheet.getColumn(7).width = 25; // Check Out Location
  worksheet.getColumn(8).width = 12; // Total Hours
  worksheet.getColumn(9).width = 12; // Status

  // 6️⃣ Save Excel file
  workbook.xlsx.writeBuffer().then((buffer) => {
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    saveAs(blob, `Attendance_Report_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  });
};

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
        toast.error("Failed to load user hierarchy");
      } finally {
        setHierarchyLoading(false);
      }
    };

    loadHierarchy();
  }, [dispatch]);

  useEffect(() => {
    if (!Sdata?.data) return;

    // Filter staff based on hierarchy if user is not super admin
    let filteredStaff = Sdata.data;
    if (role !== UserRoles.SuperAdmin && userHierarchy) {
      filteredStaff = Sdata.data.filter((staff: any) => {
        return userHierarchy.some((h: any) => h.userId === staff._id);
      });
    }

    // Always include the current user in the list
    if (!filteredStaff.some((staff: any) => staff._id === currentUserId)) {
      const currentUser = Sdata.data.find((staff: any) => staff._id === currentUserId);
      if (currentUser) {
        filteredStaff.unshift(currentUser);
      }
    }

    setFilteredStaffOptions(filteredStaff);

    if (filteredStaff.some((staff: any) => staff._id === currentUserId)) {
      setStaffId(currentUserId);
    }
  }, [Sdata, currentUserId, role, userHierarchy]);

  const isAdmin = role === UserRoles.SuperAdmin || role === UserRoles.Admin;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-lg font-semibold text-gray-800">
          {isAdmin ? 'Team Attendance' : 'My Attendance'}
        </h2>

        {isAdmin && (
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex flex-col">
              <label className="text-sm text-gray-600">From:</label>
              <DatePicker
                selected={dateRange.start}
                onChange={(date: Date | null) => {
                  if (date) setDateRange(prev => ({ ...prev, start: date }));
                }}
                dateFormat="dd/MM/yyyy"
                className="border rounded p-1 text-sm"
                maxDate={new Date()}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-gray-600">To:</label>
              <DatePicker
                selected={dateRange.end}
                onChange={(date: Date | null) => {
                  if (date) setDateRange(prev => ({ ...prev, end: date }));
                }}
                dateFormat="dd/MM/yyyy"
                className="border rounded p-1 text-sm"
                maxDate={new Date()}
              />
            </div>


            <div className="flex flex-col">
              <label className="text-sm text-gray-600">Filter by Staff</label>
              {staffLoading || hierarchyLoading ? (
                <div className="p-2 bg-gray-200 rounded animate-pulse">Loading staff...</div>
              ) : (
                <select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="border rounded p-1 text-sm"
                >
                  <option value="">All Staff</option>
                  {filteredStaffOptions.map((staff: any) => (
                    <option key={staff._id} value={staff._id}>
                      {cap(staff.userName)}
                      {staff._id === currentUserId ? " (You)" : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-gray-600">Download</label>
              <Button
  onClick={exportToExcel}
  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
>
  <Download className="h-4 w-4" />
  Export Excel
</Button>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {isAdmin && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Date
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Check In
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Check Out
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Hours
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="px-6 py-4 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
                </td>
              </tr>
            ) : data?.length > 0 ? (
              data.map((record: AttendanceRecord) => {

                const status = getAttendanceStatus(record);
                return (
                  <tr key={record._id} className="hover:bg-gray-50">
                    {isAdmin && (
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {cap(record?.userName) || 'Unknown User'}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(record.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-blue-500" />
                        {formatTime(record.checkIn)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {record.checkInLocation?.address || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {record.checkOut ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-green-500" />
                          {formatTime(record.checkOut)}
                        </div>
                      ) : (
                        '--'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {record.checkOutLocation?.address || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {record.totalHours?.toFixed(2) || '--'}
                    </td>
                    <td className="px-6 py-4">
                      {status ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status === 'Full Day'
                              ? 'bg-green-100 text-green-800'
                              : status === 'Half Day'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                        >
                          {status === 'Full Day' ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : status === 'Half Day' ? (
                            <Clock className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {status}
                        </span>
                      ) : (
                        '--'
                      )}
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="px-6 py-4 text-center text-sm text-gray-500">
                  No attendance records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}