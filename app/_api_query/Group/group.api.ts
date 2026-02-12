import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { baseUrl } from '../index';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiWrapper from './../../_helpers/ApiWrapper';

const group_Api = createApi({
    reducerPath: 'Group',
    baseQuery: fetchBaseQuery({
        baseUrl: `${baseUrl}/`,
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
    tagTypes: ['group'],
    endpoints: (builder) => ({
        CU_GROUP: builder.mutation({
            query: (body) => {
                return ({
                    url: "group",
                    method: "post",
                    body,
                })
            },
            invalidatesTags: ['group']
        }),
        U_Group: builder.mutation({
            query: ({ id, userId }) => ({
                url: `group?id=${id}`,
                method: 'PUT',
                body: { userId },
            }),
            invalidatesTags: ['group'],
        }),
        G_Group: builder.query({
            query: () => {
                return ({
                    url: "group",
                    method: "GET",
                })
            },
            providesTags: ['group']
        }),
        R_Group: builder.mutation({
            query: ({ id, userId }) => ({
                url: `group?id=${id}`,
                method: 'OPTIONS',
                body: { userId },
            }),
            invalidatesTags: ['group'],
        }),
        P_Group: builder.mutation({
            query: ({ id, userId }) => ({
                url: `group?id=${id}`,
                method: 'PATCH',
                body: { userId },
            }),
            invalidatesTags: ['group'],
        }),
        D_Group: builder.mutation({
            query: (id) => ({
                url: `group?id=${id.id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['group'],
        }),

    }),
});

export const { useCU_GROUPMutation,useD_GroupMutation,useG_GroupQuery,useP_GroupMutation,useU_GroupMutation,useR_GroupMutation } = group_Api;
export default group_Api;
