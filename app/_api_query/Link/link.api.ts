import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { baseUrl } from '../index';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiWrapper from './../../_helpers/ApiWrapper';

const link_Api = createApi({
    reducerPath: 'Link',
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
    tagTypes: ['links'],
    endpoints: (builder) => ({
        CU_Links: builder.mutation({
            query: (formData) => {
 return ({
                    url: "links",
                    method: "post",
                    body:formData,
                    headers: {
                        'Content-Type': 'multipart/form-data',
                      },
              
                })
            },
            invalidatesTags: ['links']
        }),
        U_Links: builder.mutation({
            query: ({ id, userId }) => ({
                url: `links?id=${id}`,
                method: 'PUT',
                body: { userId },
            }),
            invalidatesTags: ['links'],
        }),
        G_Links: builder.query({
            query: () => {
                return ({
                    url: "links",
                    method: "GET",
                })
            },
            providesTags: ['links']
        }),


        P_Links: builder.mutation({
            query: ({ id, userId }) => ({
                url: `links?id=${id}`,
                method: 'PATCH',
                body: { userId },
            }),
            invalidatesTags: ['links'],
        }),
        D_Links: builder.mutation({
            query: (id) => ({
                url: `links?id=${id.id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['links'],
        }),

    }),
});

export const { useCU_LinksMutation,useD_LinksMutation,useG_LinksQuery,useP_LinksMutation,useU_LinksMutation } = link_Api;
export default link_Api;
