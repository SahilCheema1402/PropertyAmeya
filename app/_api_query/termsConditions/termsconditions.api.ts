import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { baseUrl } from '../index';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiWrapper from './../../_helpers/ApiWrapper';
const termsConditionsApi = createApi({
  reducerPath: 'Terms',
  baseQuery: fetchBaseQuery({ baseUrl: `${baseUrl}/`,
    prepareHeaders: async (headers) => {
        await ApiWrapper()
        const token =  localStorage.getItem('accessToken');
        const user =  localStorage.getItem('comUserId'); 
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
  tagTypes: ['terms'],
  endpoints: (builder) => ({
    C_Term_Conditions: builder.mutation({
      query: (body) => {
        return ({
          url: "terms_and_conditions",
          method: "post",
          body,
        })
      },
      invalidatesTags: ['terms']
    }),

    G_Term_Conditions: builder.query({
      query: () => ({
        url: "terms_and_conditions",
        method: "GET",
      }),
    
    }),
    D_Term_Conditions: builder.mutation({
       query: (id) => {
        return ({
          url: `terms_and_conditions?id=${id}`,
          method: "delete",         
        })
      },
      invalidatesTags: ['terms']
    }),

    P_Term_Conditions: builder.mutation({
      query: (termsContent) => {
        return {
          url: "terms_and_conditions",
          method: "PATCH",
          body: termsContent, 
        };
      },
      invalidatesTags: ['terms'],
    }),
    Show_Term_Conditions: builder.mutation({
      query: () => {
        return {
          url: "terms_and_conditions",
          method: "options",
        };
      },
      invalidatesTags: ['terms'],
    }),
    C_location: builder.mutation({
      query: ({address,location}) => {
        return {
          url: "location",
          method: "post",
          body:{address,location}
        };
      },
      invalidatesTags: ['terms'],
    }),

    G_location: builder.query({
      query: () => ({
        url: "location",
        method: "GET",
      }),
    
    }),
  }),
});

export const {useC_Term_ConditionsMutation,useD_Term_ConditionsMutation,useG_Term_ConditionsQuery,useP_Term_ConditionsMutation,useShow_Term_ConditionsMutation,useC_locationMutation ,useG_locationQuery } = termsConditionsApi;
export default termsConditionsApi;
