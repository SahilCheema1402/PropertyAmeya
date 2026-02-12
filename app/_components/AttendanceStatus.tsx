// app/_components/AttendanceStatus.tsx
'use client';
import { Clock, CheckCircle, XCircle, AlertCircle, Sunrise, Sunset } from 'lucide-react';

interface StatusProps {
  checkedIn: boolean;
  checkedOut: boolean;
  late: boolean;
  checkInTime?: Date;
  checkOutTime?: Date;
}

function formatTime(date?: Date) {
  if (!date) return '--';
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function AttendanceStatus({ status }: { status: StatusProps }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Check-in Status Card */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Sunrise className="h-5 w-5 text-yellow-500" />
            Check-in Status
          </h3>
          {status?.checkedIn ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" /> Checked In
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <XCircle className="h-3 w-3 mr-1" /> Not Checked In
            </span>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Time:</span>
            <span className="text-sm font-medium text-gray-900">
              {formatTime(status?.checkInTime)}
            </span>
          </div>
          
          {status?.late && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Status:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <AlertCircle className="h-3 w-3 mr-1" /> Late Arrival
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Check-out Status Card */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Sunset className="h-5 w-5 text-purple-500" />
            Check-out Status
          </h3>
          {status?.checkedOut ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" /> Checked Out
            </span>
          ) : status?.checkedIn ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <Clock className="h-3 w-3 mr-1" /> Pending
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              <XCircle className="h-3 w-3 mr-1" /> N/A
            </span>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Time:</span>
            <span className="text-sm font-medium text-gray-900">
              {formatTime(status?.checkOutTime)}
            </span>
          </div>
          
          {status?.checkedIn && !status?.checkedOut && (
            <div className="pt-2">
              <p className="text-xs text-gray-500">
                Remember to check out when you finish work
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}