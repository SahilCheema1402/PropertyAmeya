import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { baseUrl } from '../index';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiWrapper from './../../_helpers/ApiWrapper';

const reminders_Api = createApi({
  reducerPath: 'Reminders',
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
  tagTypes: ['reminders', 'list'],
  endpoints: (builder) => ({
    G_Reminders: builder.query({
      query: (id) => {
        return ({
          url: `reminders/?id=${id}`,
          method: "GET",
        })
      },
      providesTags:['reminders']
    }),
  C_Reminders:builder.mutation({
    query:(body)=>({
        url:"reminders",
        method:"POST",
        body:body,
    }),
    invalidatesTags:['reminders']
  }),
  U_Reminders: builder.mutation({
    query: (updatedData) => ({
      url: "reminders",
      method: 'PUT',
      body: updatedData,
    }),
    invalidatesTags:['reminders']
  }),

  // GET endpoint for a list by ID
  G_ListById: builder.query({
    query: (id) => ({
      url: `reminders/list?id=${id}`,
      method: "GET",
    }),
    providesTags: ['list'],
  }),

  C_List: builder.mutation({
    query: (body) => ({
      url: "reminders/list",
      method: "POST",
      body: body,
    }),
    invalidatesTags: ['list'],
  }),

  U_List: builder.mutation({
    query: (updatedData) => ({
      url: "reminders/list",
      method: 'PUT',
      body: updatedData,
    }),
    invalidatesTags: ['list'],
  }),
  }),
});




export const {useG_RemindersQuery, useC_RemindersMutation, useU_RemindersMutation, useC_ListMutation, useG_ListByIdQuery} = reminders_Api;
export default reminders_Api;
