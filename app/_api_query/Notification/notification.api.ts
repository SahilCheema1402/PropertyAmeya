import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { baseUrl } from '../index';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiWrapper from './../../_helpers/ApiWrapper';

const notification_Api = createApi({
  reducerPath: 'Notification',
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/`,
    prepareHeaders: async (headers) => {
      await ApiWrapper()
      const token = await localStorage.getItem('accessToken');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  tagTypes: ['notification'],
  endpoints: (builder) => ({
    NotificationDone: builder.mutation({
        query: (body) => {
          return ({
            url: `notification`,
            method: "post",
            body
          })
        },
        invalidatesTags: ['notification']
      }),
      getNotification: builder.query({
        query: () => {
          return ({
            url: `notification`,
            method: "get",
          })
        },
        providesTags: ['notification']
      }),
      ArcheiveNotification: builder.mutation({
        query: (body) => {
          return ({
            url: `notification`,
            method: "put",
            body
          })
        },
        invalidatesTags: ['notification']
      }),
  }),
});

export const {useNotificationDoneMutation,useGetNotificationQuery,useArcheiveNotificationMutation} = notification_Api;
export default notification_Api;
