'use client';

import { useGetAttendanceSummaryQuery } from '@app/_api_query/attendance/attendance.api';
import { Users, CheckCircle, Clock, Loader2 } from 'lucide-react';

export default function AttendanceSummary() {
  // Passing empty object to satisfy the expected `arg`
  const { data: summary, isLoading } = useGetAttendanceSummaryQuery({});

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );

  const cards = [
    {
      title: 'Checked In',
      icon: <Users className="h-5 w-5 text-blue-500" />,
      count: summary?.checkedInCount || 0,
      description: "Today's check-ins"
    },
    {
      title: 'Checked Out',
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      count: summary?.checkedOutCount || 0,
      description: "Today's check-outs"
    },
    {
      title: 'Late Arrivals',
      icon: <Clock className="h-5 w-5 text-yellow-500" />,
      count: summary?.lateCount || 0,
      description: 'Arrived after 10 AM'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="p-4 border rounded-lg shadow-sm bg-white hover:shadow-md transition"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">{card.title}</h3>
            {card.icon}
          </div>
          <div className="text-2xl font-bold text-gray-800">{card.count}</div>
          <p className="text-xs text-gray-500">{card.description}</p>
        </div>
      ))}
    </div>
  );
}
