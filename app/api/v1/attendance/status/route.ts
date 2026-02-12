// app/api/v1/attendance/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@app/_Database/db";
import AttendanceModel from '@app/_model/Attendance/attendance.model';

export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  const today = new Date().toISOString().split('T')[0];
  const attendance = await AttendanceModel.findOne({ userId, date: today });

  // Check if late (arrived after 10 AM local time)
  let isLate = false;
  if (attendance) {
    const checkInTime = new Date(attendance.checkIn);
    const localHours = checkInTime.getHours(); // Gets hours in local timezone
    isLate = localHours >= 10;
  }

  return NextResponse.json({
    checkedIn: !!attendance,
    checkedOut: !!attendance?.checkOut,
    late: isLate,
    checkInTime: attendance?.checkIn,
    checkOutTime: attendance?.checkOut
  });
}