import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { baseUrl } from './../index';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import ApiWrapper from '@/helper/ApiWrapper';
const loginApi = createApi({
  reducerPath: 'Login',
  baseQuery: fetchBaseQuery({ baseUrl: `${baseUrl}`,
    // prepareHeaders:async(headers)=>{
    //   await ApiWrapper();      
    //   const token = await AsyncStorage.getItem('accessToken');
    //   if (token) {
    //     headers.set('Authorization', `Bearer ${token}`);
    //   }
    //   return headers;
    //   }
    
  }),
  tagTypes: ['login'],
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (body) => {
        return ({
          url: "login",
          method: "post",
          body,
        })
      },
      invalidatesTags: ['login']
    }),

    G_UserByComId: builder.query({
      query: (id) => ({
        url: `user/?id=${id}`,
        method: "GET",
      }),
    
    }),
  }),
});

export const {useLoginMutation, useG_UserByComIdQuery} = loginApi;
export default loginApi;
