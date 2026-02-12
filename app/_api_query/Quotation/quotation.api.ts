import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { baseUrl } from '../index';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiWrapper from './../../_helpers/ApiWrapper';

const quotation_Api = createApi({
  reducerPath: 'quotation',
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
  tagTypes: ['quotation'],
  endpoints: (builder) => ({
    G_Quatation: builder.query({
      query: ({ searchTerm }) => {
        return ({
          url: `quotation${searchTerm ? `?searchTerm=${searchTerm}` : ''}`,
          method: "GET",
        });
      },
      providesTags: ['quotation']
    }),
    
    C_Quatation: builder.mutation({
      query: (body) => ({
        url: "quotation",
        method: "POST",
        body: body,
      }),
      invalidatesTags: ['quotation']
    }),
    D_Quatation: builder.mutation({
      query: (checkedAllItems) => ({
        url: `quotation`,
        method: "DELETE",
        body:checkedAllItems
      }),
      invalidatesTags: ['quotation']
    }),
    U_Quatation: builder.mutation({
      query: ({id,updatedData}) => ({
        url: `quotation?id=${id}`,
        method: 'PUT',
        body: updatedData,
      }),
      invalidatesTags: ['quotation']
    }),
    
  }),
});

export const { useU_QuatationMutation, useG_QuatationQuery, useC_QuatationMutation, useD_QuatationMutation } = quotation_Api;
export default quotation_Api;
