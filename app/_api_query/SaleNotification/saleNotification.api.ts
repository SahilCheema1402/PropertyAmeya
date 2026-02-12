import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { baseUrl } from '../index';
import ApiWrapper from './../../_helpers/ApiWrapper';


const saleNotificationApi = createApi({
 reducerPath: 'SaleNotification',
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/`,
    prepareHeaders: async (headers) => {
      await ApiWrapper();
      const token = await localStorage.getItem('accessToken');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  tagTypes: ['SalesNotifications'],
  endpoints: (builder) => ({
    
    getSalesNotifications: builder.query({
        query: () => {
          return ({
            url: `saleNotification`,
            method: "get",
          })
        },
        providesTags: ['SalesNotifications']
      }),

      createSaleNotification: builder.mutation({
        query: (body) => {
          return ({
            url: `saleNotification`,
            method: "post",
            body
          })
        },
        invalidatesTags: ['SalesNotifications']
      })
      
  }),
});

export const { 
  useGetSalesNotificationsQuery,
  useCreateSaleNotificationMutation
} = saleNotificationApi ;
export default saleNotificationApi;
