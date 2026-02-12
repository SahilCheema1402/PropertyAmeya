import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { baseUrl } from '../index';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiWrapper from './../../_helpers/ApiWrapper';
const staffApi = createApi({
  reducerPath: 'Staff',
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/`,
    prepareHeaders: async (headers) => {
      await ApiWrapper()
      const token = await localStorage.getItem('accessToken');
      const user = await localStorage.getItem('comUserId');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      if (user) {
        const parsedUser = JSON.parse(user);
        headers.set('user', JSON.stringify({
          _id: parsedUser.userId,
          company: { _id: parsedUser.compId },
        }));
      }
      return headers;
    }
  }),
  tagTypes: ['staff'],
  endpoints: (builder) => ({
    C_STAFF: builder.mutation({
      query: (body) => {
        return ({
          url: "staff",
          method: "post",
          body,
        })
      },
      invalidatesTags: ['staff']
    }),

    G_STAFF: builder.query({
      query: (params) => {

        if (typeof params === 'string') {
          return {
            url: `staff?userId=${params}`,
            method: "GET",
          };
        }

        // If params is an object (new format), use the new structure
        const { userId, bypassHierarchy = false } = params;
        return {
          url: `staff?userId=${userId}&bypassHierarchy=${bypassHierarchy}`,
          method: "GET",
        };
      },
    }),
    G_ADMIN_STAFF: builder.query({
      query: () => ({
        url: "staffs",
        method: "GET",
      }),
    }),
    U_STAFF: builder.mutation({
      query: (body) => {
        return ({
          url: "staff",
          method: "put",
          body,
        })
      },
      invalidatesTags: ['staff']
    }),
    P_STAFF: builder.mutation({
      query: (body) => {
        return ({
          url: "staff",
          method: "PATCH",
          body,
        })
      },
      invalidatesTags: ['staff']
    }),
    A_STAFF: builder.mutation({
      query: (body) => {
        return ({
          url: "staff",
          method: "OPTIONS",
          body,
        })
      },
      invalidatesTags: ['staff']
    }),
    User: builder.mutation({
      query: (body) => {
        return ({
          url: "employeeLeads",
          method: "put",
          body,
        })
      },
      invalidatesTags: ['staff']
    }),
    ForgetPassword: builder.mutation({
      query: ({ email }) => {
        return ({
          url: `login?email=${email}`,
          method: "put",

        })
      },
      invalidatesTags: ['staff']
    }),
    ChangePassword: builder.mutation({
      query: (body) => {
        return ({
          url: `staffs`,
          method: "PATCH",
          body,
        })
      },
      invalidatesTags: ['staff']
    }),
    userDisable: builder.mutation({
      query: ({ userId, action }) => ({
        url: `user`,
        method: 'PATCH',
        body: { userId, action },
      }),
      invalidatesTags: ['staff'],
    }),
    G_HIERARCHY_CHART: builder.query({
      query: (companyId) => ({
        url: `user/hierarchyChart?companyId=${companyId}`,
        method: "GET",
      }),
    }),
  }),
});

export const { useC_STAFFMutation, useG_STAFFQuery, useU_STAFFMutation, useP_STAFFMutation, useA_STAFFMutation, useUserMutation, useForgetPasswordMutation, useUserDisableMutation, useG_ADMIN_STAFFQuery, useChangePasswordMutation, useG_HIERARCHY_CHARTQuery } = staffApi;
export default staffApi;
