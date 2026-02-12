import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@app/_Database/db";
import AttendanceModel from '@app/_model/Attendance/attendance.model';

export async function PUT(req: NextRequest) {
  await dbConnect();
  const body = await req.json();
  const { userId, lat, lng, address } = body;

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  const today = new Date().toISOString().split('T')[0];
  const attendance = await AttendanceModel.findOne({ userId, date: today });

  if (!attendance) {
    return NextResponse.json({ error: 'Check-in not found' }, { status: 404 });
  }

  const checkOutTime = new Date();
  const checkInTime = new Date(attendance.checkIn);
  
  const totalHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
  
  let status: 'Full Day' | 'Half Day' | 'Absent' = 'Absent';
  if (totalHours >= 9) status = 'Full Day';
  else if (totalHours >= 6) status = 'Half Day';

  attendance.checkOut = checkOutTime;
  attendance.checkOutLocation = { lat, lng, address: address || 'Address not available' };
  attendance.totalHours = Number(totalHours.toFixed(2));
  attendance.status = status;
  attendance.updatedAt = new Date();

  await attendance.save();

  return NextResponse.json(attendance);
}