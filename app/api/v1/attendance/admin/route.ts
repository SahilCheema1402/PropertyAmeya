// app/api/v1/attendance/admin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@app/_Database/db';
import AttendanceModel from '@app/_model/Attendance/attendance.model';
import { UserRoles } from '@app/_enums/enums';
import mongoose from 'mongoose';
import { HierarchyService } from '@app/services/hierarchyService';

export async function GET(req: NextRequest) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const userHeader = req.headers.get('user');

  let requester: { _id: string; role: number; company: { _id: string } } | null = null;
  try {
    requester = userHeader ? JSON.parse(userHeader) : null;
  } catch (error) {
    return NextResponse.json({ error: 'Invalid user header' }, { status: 400 });
  }

  // Debug logging
  console.log('Request received with params:', {
    userId: searchParams.get('userId'),
    start: searchParams.get('start'),
    end: searchParams.get('end')
  });

  const isAdmin = requester?.role === UserRoles.SuperAdmin || requester?.role === UserRoles.Admin;
  const userId = searchParams.get('userId');
  const startDate = searchParams.get('start');
  const endDate = searchParams.get('end');

  // Build the query
  const query: any = {};

  if (userId) {
    try {
      query.userId = new mongoose.Types.ObjectId(userId);
      console.log('Filtering by user ID:', userId);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }
  } else if (!isAdmin) {
    // Non-admin can only see their own data
    if (!requester?._id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    query.userId = new mongoose.Types.ObjectId(requester._id);
  } else {
    // Admin with no specific user filter - get all subordinate data
    if (requester?.role !== UserRoles.SuperAdmin) {
      try {
        if (!requester) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const hierarchy = await HierarchyService.fetchUserHierarchy(
          requester._id,
          requester.company._id
        );

        const subordinateIds = Array.isArray(hierarchy)
          ? hierarchy.map((h: any) => new mongoose.Types.ObjectId(h._id || h.userId))
          : (hierarchy?.allSubordinates || []).map((h: any) => new mongoose.Types.ObjectId(h._id || h.userId));

        query.userId = { $in: subordinateIds };
      } catch (error) {
        console.error('Error fetching hierarchy:', error);
        return NextResponse.json(
          { error: 'Failed to fetch user hierarchy' },
          { status: 500 }
        );
      }
    }
  }

  // Date range filter
  // if (startDate && endDate) {
  //   query.date = {
  //     $gte: startDate,
  //     $lte: endDate
  //   };
  // } else {
  //   // Default to today's date if no range provided
  //   const today = new Date().toISOString().split('T')[0];
  //   query.date = today;
  // }

  if (startDate && endDate) {
    query.date = {
      $gte: startDate,
      $lte: endDate
    };
  } else if (!userId) {
    // Only set today's date if no staff is selected
    const today = new Date().toISOString().split('T')[0];
    query.date = today;
  }
  // else: userId is selected, but no date range — show full history



  console.log('Final query:', query);

  // Get attendance records with user details
  const records = await AttendanceModel.aggregate([
    { $match: query },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: 1,
        userId: '$user._id',
        userName: '$user.userName',
        role: '$user.role',
        date: 1,
        checkIn: 1,
        checkOut: 1,
        checkInLocation: 1,
        checkOutLocation: 1,
        totalHours: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
    { $sort: { date: -1, checkIn: -1 } },
  ]);

  return NextResponse.json(records);
}