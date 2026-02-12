import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { baseUrl } from '../index';
import ApiWrapper from './../../_helpers/ApiWrapper';

// Define types for better type safety
interface DateRange {
  startDate: string;
  endDate: string;
}

interface ReportQueryParams {
  dateRange: DateRange;
  staffId: string;
  leadType: string;
  allowedStaffIds?: string[]; 
}

interface DailyCallsQueryParams {
  month: string; // Format: YYYY-MM
  staffId?: string;
}

interface User {
  userId: string;
  compId: string;
}

// Types for the daily calls response
interface DailyCallResult {
  date: number;
  fullDate: string;
  callTargetAchieved: boolean;
  calls: number;
  callTarget: number;
}

interface DailyCallsResponse {
  month: string;
  userData: {
    userName: string;
    email: string;
  };
  dailyCallTarget: number;
  dailyResults: DailyCallResult[];
}

const report_Api = createApi({
  reducerPath: 'Report',
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/`,
    prepareHeaders: async (headers) => {
      await ApiWrapper();
      const token = localStorage.getItem('accessToken');
      const user = localStorage.getItem('comUserId');

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      if (user) {
        try {
          const parsedUser: User = JSON.parse(user);
          headers.set('user', JSON.stringify({
            _id: parsedUser.userId,
            company: { _id: parsedUser.compId },
          }));
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }

      return headers;
    }
  }),
  tagTypes: ['report', 'dailyCalls'],
  endpoints: (builder) => ({
    G_Report: builder.query<any, ReportQueryParams>({
      query: ({dateRange, staffId, leadType}) => ({
        url: `report`,
        method: "get",
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          staffId,
          leadType
        }
      }),
      providesTags: ['report']
    }),
    G_Excel_Report: builder.mutation<any, ReportQueryParams>({ 
    query: ({dateRange, allowedStaffIds}) => ({ 
        url: `report`, 
        method: "post", 
        params: { 
            startDate: dateRange.startDate, 
            endDate: dateRange.endDate,
        },
        body: {
            allowedStaffIds: allowedStaffIds // Send staff IDs in body
        }
    }), 
    invalidatesTags: ['report'] 
}),
    G_TargetVsAchievement: builder.query<any, ReportQueryParams>({
      query: ({ dateRange, staffId, leadType }) => ({
        url: 'targetVsAchievement',
        method: "get",
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          staffId,
          leadType
        }
      }),
      providesTags: ['report']
    }),
    P_TargetVsAchievement: builder.mutation<any, ReportQueryParams>({
      query: ({ dateRange, staffId, leadType }) => ({
        url: 'targetVsAchievement',
        method: "POST",
        body: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          staffId,
          leadType
        }
      }),
      invalidatesTags: ['report']
    }),
    // New endpoint for daily calls data
    G_DailyCalls: builder.query<DailyCallsResponse, DailyCallsQueryParams>({
      query: ({ month, staffId }) => {
        const params: Record<string, string> = { month };
        if (staffId) {
          params.staffId = staffId;
        }
        
        return {
          url: 'targetVsAchievement/dailyTarget',
          method: "GET",
          params
        };
      },
      providesTags: ['dailyCalls']
    }),
  }),
});

export const { 
  useG_ReportQuery,
  useP_TargetVsAchievementMutation, 
  useG_TargetVsAchievementQuery,
  useG_Excel_ReportMutation,
  useG_DailyCallsQuery // New hook for daily calls
} = report_Api;

export default report_Api;