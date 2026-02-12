import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { baseUrl } from '../index';
import ApiWrapper from './../../_helpers/ApiWrapper';

const whatsappTemplateApi = createApi({
  reducerPath: 'whatsappTemplate',
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/`,
    prepareHeaders: async (headers) => {
      await ApiWrapper();
      const token = await localStorage.getItem('accessToken');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  tagTypes: ['whatsapp-template'],
  endpoints: (builder) => ({
    
    // Get WhatsApp Template
    getWhatsAppTemplate: builder.query({
      query: () => ({
        url: 'whatsapp-template',
        method: 'GET',
      }),
      providesTags: ['whatsapp-template'],
      // Cache for 5 minutes since template doesn't change often
      keepUnusedDataFor: 300,
    }),

    // Update WhatsApp Template
    updateWhatsAppTemplate: builder.mutation({
      query: (body) => ({
        url: 'whatsapp-template',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['whatsapp-template'],
      // Show success message
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          console.log('Template updated successfully');
        } catch (error) {
          console.error('Failed to update template:', error);
        }
      },
    }),

    // Reset WhatsApp Template to Default
    resetWhatsAppTemplate: builder.mutation({
      query: () => ({
        url: 'whatsapp-template',
        method: 'POST',
      }),
      invalidatesTags: ['whatsapp-template'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          console.log('Template reset to default successfully');
        } catch (error) {
          console.error('Failed to reset template:', error);
        }
      },
    }),

  }),
});

export const {
  useGetWhatsAppTemplateQuery,
  useUpdateWhatsAppTemplateMutation,
  useResetWhatsAppTemplateMutation,
} = whatsappTemplateApi;

export default whatsappTemplateApi;