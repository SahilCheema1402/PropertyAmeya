"use client";

import React, { useEffect } from "react";
import { useG_DailyCallsQuery } from "@app/_api_query/report/report.api";
import { MdErrorOutline } from "react-icons/md";

interface YesterdayTargetBannerProps {
  staffId: string;
}

const YesterdayTargetBanner: React.FC<YesterdayTargetBannerProps> = ({
  staffId,
}) => {

  // Get yesterday's date
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // Format date to YYYY-MM for API
  const formatMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  const {
    data: dailyCallsData,
    isLoading,
    error,
  } = useG_DailyCallsQuery({
    month: formatMonth(yesterday),
    staffId,
  }) as { data: any; isLoading: boolean; error: any };

  // Debug logging
  useEffect(() => {
    console.log("YesterdayTargetBanner Debug:");
    console.log("Yesterday date:", yesterday.toISOString());
    console.log("Month for API:", formatMonth(yesterday));
    console.log("StaffId:", staffId);
    console.log("IsLoading:", isLoading);
    console.log("Error:", error);
    console.log(
      "DailyCallsData:",
      JSON.stringify(dailyCallsData, null, 2)
    );
  }, [dailyCallsData, isLoading, error, yesterday, staffId]);

  if (isLoading || error || !dailyCallsData) return null;

  // Get yesterday's data
  const yesterdayDay = yesterday.getDate();
  const yesterdayData = dailyCallsData.data?.dailyResults?.find(
    (item: any) => item.date === yesterdayDay
  );

  if (!yesterdayData || yesterdayData.callTargetAchieved) return null;

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="mx-4 mb-4 flex items-center rounded-xl border border-red-700 bg-red-600 p-4 text-white shadow">
      {/* Icon */}
      <div className="mr-3">
        <MdErrorOutline size={24} />
      </div>

      {/* Content */}
      <div className="flex-1">
        <p className="font-semibold text-sm">Target Not Achieved Yesterday</p>
        <p className="mt-1 text-xs">
          {formatDate(yesterday)}: {yesterdayData.calls || 0}/
          {yesterdayData.callTarget || 0} calls
        </p>
      </div>

      {/* Badge */}
      <div className="rounded-full bg-red-700 px-3 py-1 text-xs font-medium">
        Missed
      </div>
    </div>
  );
};

export default YesterdayTargetBanner;
