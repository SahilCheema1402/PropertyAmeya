import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@app/_Database/db";
import AttendanceModel from '@app/_model/Attendance/attendance.model';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  const query: any = { userId: new mongoose.Types.ObjectId(userId) };

  if (start && end) {
    query.date = {
      $gte: start,
      $lte: end
    };
  }

  const records = await AttendanceModel.find(query)
    .populate({
      path: 'userId',
      select: 'userName email role phone' 
    })
    .sort({ date: -1 })
    .lean();

  const formattedRecords = records.map(record => ({
    ...record,
    checkIn: new Date(record.checkIn),
    checkOut: record.checkOut ? new Date(record.checkOut) : null,
    _id: record._id.toString(),
    userId: {
      ...record.userId,
      _id: record.userId._id.toString()
    }
  }));

  return NextResponse.json(formattedRecords);
}
