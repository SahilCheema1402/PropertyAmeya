import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@app/_Database/db";
import AttendanceModel from '@app/_model/Attendance/attendance.model';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    
    if (!body.userId || !body.lat || !body.lng) {
      return NextResponse.json(
        { error: 'Missing required fields (userId, lat, lng)' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const existing = await AttendanceModel.findOne({ 
      userId: body.userId, 
      date: today 
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Already checked in today' },
        { status: 400 }
      );
    }

    const created = await AttendanceModel.create({
      userId: body.userId,
      date: today,
      checkIn: new Date(),
      checkInLocation: { 
        lat: body.lat, 
        lng: body.lng,
        address: body.address || 'Address not available'
      },
      status: 'Half Day' // Default status until checkout
    });

    return NextResponse.json(created);
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  const filter: any = {};
  if (userId) filter.userId = userId;
  if (start && end) {
    // Convert to Date objects (start of day to end of day)
    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999); // Include full end date

    filter.date = { $gte: startDate, $lte: endDate };
  }

  const records = await AttendanceModel.find(filter).sort({ date: -1 });
  return NextResponse.json(records);
}
