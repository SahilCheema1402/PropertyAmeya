import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { baseUrl } from '../index';
import ApiWrapper from './../../_helpers/ApiWrapper';

const newlead_mdm_Api = createApi({
  reducerPath: 'NewLead',
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/`,
    prepareHeaders: async (headers) => {
      await ApiWrapper()
      const token = localStorage.getItem('accessToken');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
    timeout: 15000, // 15 second timeout
  }),
  tagTypes: ['mdm', 'newleads'],
  endpoints: (builder) => ({
    NG_Lead: builder.query({
      query: ({page, limit, search, leadType, selectedStatus, startDate, endDate}) => {
        // Build query params more efficiently
        const params = new URLSearchParams({
          page: page?.toString() || '1',
          limit: Math.min(limit || 10, 250).toString(), // Cap at 250
        });

        // Only add non-empty params
        if (search && search.trim()) params.append('search', search.trim());
        if (leadType) params.append('leadType', leadType);
        if (selectedStatus) params.append('selectedStatus', selectedStatus);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        return {
          url: `newLead?${params.toString()}`,
          method: "GET",
        };
      },
      keepUnusedDataFor: 30, // Cache for 30 seconds instead of 0
      providesTags: (result, error, arg) => [
        { type: 'newleads', id: 'LIST' },
        // Tag by search/filter params for selective invalidation
        { type: 'newleads', id: `${arg.page}-${arg.limit}-${arg.search || ''}-${arg.startDate || ''}-${arg.endDate || ''}` }
      ],
      // Transform response to include pagination metadata
      transformResponse: (response: { data?: { pagination?: any } } | any) => {
        if (response && typeof response === 'object') {
          return {
            ...response,
            pagination: response.data?.pagination || {}
          };
        }
        return { data: response, pagination: {} };
      },
      // Only refetch on mount if data is stale
      // refetchOnMountOrArgChange is not a valid endpoint option in RTK Query
    }),
  }),
});

export const {useNG_LeadQuery} = newlead_mdm_Api;
export default newlead_mdm_Api;