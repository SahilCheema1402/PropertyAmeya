// app/api/v1/attendance/summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@app/_Database/db";
import AttendanceModel from '@app/_model/Attendance/attendance.model';

export async function GET(req: NextRequest) {
  await dbConnect();
  
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const startOfDay = new Date(today);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  // Get all check-ins for today
  const todayAttendance = await AttendanceModel.find({
    date: today
  });

  // Count checked in users
  const checkedInCount = todayAttendance.length;

  // Count checked out users
  const checkedOutCount = todayAttendance.filter(a => a.checkOut).length;

  // Count late users (checked in after 10 AM)
  const lateCount = todayAttendance.filter(a => {
    const checkInTime = new Date(a.checkIn);
    return checkInTime.getHours() >= 10;
  }).length;

  return NextResponse.json({
    checkedInCount,
    checkedOutCount,
    lateCount
  });
}