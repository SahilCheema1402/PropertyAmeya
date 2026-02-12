// attendance.api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import ApiWrapper from './../../_helpers/ApiWrapper';
import { baseUrl } from '../index';

export const attendanceApi = createApi({
  reducerPath: 'attendanceApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/`,
    prepareHeaders: (headers) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        const user = localStorage.getItem('comUserId');

        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }

        if (user) {
          try {
            const parsedUser = JSON.parse(user);
            headers.set(
              'user',
              JSON.stringify({
                _id: parsedUser.userId,
                company: { _id: parsedUser.compId },
                role: parsedUser.roleId,
              })
            );
          } catch (err) {
            console.error('Invalid user data in localStorage', err);
          }
        }
      }

      return headers;
    }

  }),
  tagTypes: ['Attendance'],
  endpoints: (builder) => ({
    // Get user's attendance status (for menu display)
    getAttendanceStatus: builder.query({
      query: (params) => {
        const query = new URLSearchParams(params).toString();
        return `attendance/status?${query}`;
      },
      providesTags: ['Attendance'],
    }),


    // Get attendance summary (for admin dashboard)
    getAttendanceSummary: builder.query({
      query: () => 'attendance/summary',
      providesTags: ['Attendance'],
    }),

    // Get user's attendance records
    getUserAttendance: builder.query({
      query: (params) => {
        const query = new URLSearchParams(params).toString();
        return `attendance/user?${query}`;
      },
      providesTags: ['Attendance'],
    }),
    // Check-in
    checkIn: builder.mutation({
      query: (body) => ({
        url: 'attendance',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Attendance'],
    }),

    // Check-out
    checkOut: builder.mutation({
      query: (body) => ({
        url: 'attendance/checkout',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Attendance'],
    }),

    // Update attendance (admin only)
    updateAttendance: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `attendance/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: ['Attendance'],
    }),

    getAllAttendance: builder.query({
      query: ({ userIds, start, end }) => {
        const params = new URLSearchParams();
        if (userIds?.length) params.set('userId', userIds[0]);
        if (start) params.set('start', start);
        if (end) params.set('end', end);
        return `attendance/admin?${params.toString()}`;
      },
      providesTags: ['Attendance'],
    }),



  }),
});

export const {
  useGetAttendanceStatusQuery,
  useGetAttendanceSummaryQuery,
  useGetUserAttendanceQuery,
  useGetAllAttendanceQuery,
  useCheckInMutation,
  useCheckOutMutation,
  useUpdateAttendanceMutation,
} = attendanceApi;