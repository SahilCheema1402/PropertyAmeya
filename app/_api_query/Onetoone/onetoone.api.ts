import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { baseUrl } from '../index';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiWrapper from './../../_helpers/ApiWrapper';

const onetoone_Api = createApi({
  reducerPath: 'Onetoone',
  baseQuery: fetchBaseQuery({ baseUrl: `${baseUrl}/`,
    prepareHeaders:async(headers)=>{
      await ApiWrapper()
      const token = await localStorage.getItem('accessToken');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
      }
  }),
  tagTypes: ['onetoone'],
  endpoints: (builder) => ({
    G_OTO: builder.query({
      query: (id) => {
        return ({
          url: `onetoone?id=${id}`,
          method: "GET",
        })
      },
      providesTags:['onetoone']
    }),
  C_OTO:builder.mutation({
    query:(body)=>({
        url:"onetoone",
        method:"POST",
        body:body,
    }),
    invalidatesTags:['onetoone']
  }),
  U_OTO: builder.mutation({
    query: (updatedData) => ({
      url: "onetoone",
      method: 'PUT',
      body: updatedData,
    }),
    invalidatesTags:['onetoone']
  }),
  }),
});

export const {useG_OTOQuery,useC_OTOMutation, useU_OTOMutation} = onetoone_Api;
export default onetoone_Api;
