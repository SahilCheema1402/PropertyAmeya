import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { baseUrl } from '../index';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiWrapper from './../../_helpers/ApiWrapper';
const leadScore_Api = createApi({
  reducerPath: 'LeadScore',
  baseQuery: fetchBaseQuery({ baseUrl: `${baseUrl}/`,
    prepareHeaders:async(headers)=>{
      await ApiWrapper(null);      
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
  tagTypes: ['leadscore'],
  endpoints: (builder) => ({
    CU_LeadScore: builder.mutation({
      query: (body) => {
        return ({
          url: "leadScore",
          method: "post",
          body,
        })
      },
      invalidatesTags: ['leadscore']
    }),
    G_LeadScore: builder.query({
      query: ({id,service}) => {
        return ({
          url: `leadScore?id=${id}&service=${service}`,
          method: "get",
        })
      },
      providesTags:['leadscore']
    }),
    deleteLeadScore: builder.mutation({
      query: () => ({
          url: 'leadScore', // Replace with your actual endpoint
          method: 'DELETE',
      }),
      invalidatesTags: ['leadscore'],
  }),
    P_LeadScore: builder.mutation({
      query: ({ id, userId }) => ({
          url: `leadScore?id=${id}`,
          method: 'patch',
          body: { userId },
      }),
      invalidatesTags: ['leadscore'],
  }),
  }),
});

export const {useCU_LeadScoreMutation,useG_LeadScoreQuery,useP_LeadScoreMutation,useDeleteLeadScoreMutation} = leadScore_Api;
export default leadScore_Api;
