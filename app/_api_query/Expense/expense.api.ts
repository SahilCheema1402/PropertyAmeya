import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { baseUrl } from '../index';
import ApiWrapper from '../../_helpers/ApiWrapper';

const expense_Api = createApi({
  reducerPath: 'Expense',
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
  tagTypes: ['expense'],
  endpoints: (builder) => ({
    C_Expenses: builder.mutation({
        query: (body) => {
          return ({
            url: `expense`,
            method: "post",
            body
          })
        },
        invalidatesTags: ['expense']
      }),
      D_Expenses: builder.mutation({
        query: (data) => {
          return ({
            url: `expense?id=${data._id}`,
            method: "delete",
            
          })
        },
        invalidatesTags: ['expense']
      }),
      // G_Expenses: builder.query({
      //   query: ({activeTab}) => {
      //     return ({
      //       url: `expense?search=${activeTab}`,
      //       method: "get",
      //     })
      //   },
      //   providesTags: ['expense']
      // }),
      G_Expenses: builder.query({
        query: ({activeTab}) => {
          // Handle custom date range format (YYYY-MM-DD_YYYY-MM-DD)
          // or standard search terms (Today, Monthly, Half-yearly, Yearly)
          const searchParam = encodeURIComponent(activeTab);
          
          return ({
            url: `expense?search=${searchParam}`,
            method: "get",
          })
        },
        providesTags: ['expense'],
        // Force refetch when activeTab changes
        forceRefetch: ({ currentArg, previousArg }) => {
          return currentArg?.activeTab !== previousArg?.activeTab;
        }
      }),
  }),
});

export const {useC_ExpensesMutation,useG_ExpensesQuery,useD_ExpensesMutation} = expense_Api;
export default expense_Api;
