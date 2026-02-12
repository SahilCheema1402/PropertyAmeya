import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { baseUrl } from '../index';
import ApiWrapper from './../../_helpers/ApiWrapper';

const projectApi = createApi({
  reducerPath: 'Project',
  baseQuery: fetchBaseQuery({ baseUrl: `${baseUrl}/`,
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
  tagTypes: ['project'],
  endpoints: (builder) => ({
    C_Project: builder.mutation({
      query: (body) => {
        return ({
          url: "project",
          method: "post",
          body,
        })
      },
      invalidatesTags: ['project']
    }),

    G_Project: builder.query({
      query: ({search,page,limit}) => ({
        url: `project?search=${search}&page=${page}&limit=${limit}`,
        method: "GET",
      }),
    
    }),
  }),
});

export const {useC_ProjectMutation, useG_ProjectQuery } = projectApi;
export default projectApi;
