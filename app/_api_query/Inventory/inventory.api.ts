import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { baseUrl } from '../index';
import ApiWrapper from '../../_helpers/ApiWrapper';

const inventoryApi = createApi({
  reducerPath: 'Inventory',
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/`,
    prepareHeaders: async (headers) => {
      await ApiWrapper()
      const token = localStorage.getItem('accessToken');
      const user = localStorage.getItem('comUserId'); 
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

  tagTypes: ['Inventory'],
  endpoints: (builder) => ({
    // Get inventory with basic search and filter
    G_Inventory: builder.query({
      query: ({search, leadType, page, limit}) => {
        return ({
          url: `inventory?search=${search || ''}&leadType=${leadType || ''}&page=${page || 1}&limit=${limit || 10}`,
          method: "get",
        })
      },
      providesTags: ['Inventory']
    }),

    // Enhanced multi-filter query
    getMultiFilterInventoryData: builder.query({
      query: (url) => ({
        url: `${url}`,
        method: "get",
      }),
      providesTags: ['Inventory'],
      // Transform response to add helpful metadata
      transformResponse: (response: any) => {
        return {
          ...response,
          data: {
            ...response.data,
            // Add computed fields for easier UI handling
            isEmpty: !response.data?.fields_?.length,
            hasFilters: response.data?.filtersCount > 0,
            summary: {
              total: response.data?.count || 0,
              showing: response.data?.fields_?.length || 0,
              filtered: response.data?.filtersCount > 0
            }
          }
        };
      }
    }),

    // Get filter options for dropdowns (helpful for dynamic filter generation)
    getFilterOptions: builder.query({
      query: () => ({
        url: 'inventory/filter-options',
        method: 'get'
      }),
      providesTags: ['Inventory']
    }),

    // Upload files
    I_Lead: builder.mutation({
      query: (body) => ({
        url: `inventory`,
        method: "PATCH",
        body,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),
    }),

    // Create inventory
    C_Inventory: builder.mutation({
      query: (body) => ({
        url: `inventory`,
        method: "post",
        body
      }),
      invalidatesTags: ['Inventory']
    }),

    // Update inventory
    U_Lead: builder.mutation({
      query: (body) => ({
        url: "inventory",
        method: "put",
        body
      }),
      invalidatesTags: ['Inventory']
    }),

    // Delete inventory
    D_Lead: builder.mutation({
      query: (id) => ({
        url:`inventory?id=${id}`,
        method: "delete",
      }),
      invalidatesTags: ['Inventory']
    }),

    // Get inventory statistics for dashboard
    getInventoryStats: builder.query({
      query: () => ({
        url: 'inventory/stats',
        method: 'get'
      }),
      providesTags: ['Inventory']
    }),

    // Export filtered inventory data
    exportInventoryData: builder.mutation({
      query: (filters) => ({
        url: 'inventory/export',
        method: 'post',
        body: { filters },
        responseHandler: (response) => response.blob()
      })
    }),

    // Bulk update inventory
    bulkUpdateInventory: builder.mutation({
      query: (body) => ({
        url: 'inventory/bulk-update',
        method: 'put',
        body
      }),
      invalidatesTags: ['Inventory']
    }),

    // Get similar inventory based on current item
    getSimilarInventory: builder.query({
      query: (inventoryId) => ({
        url: `inventory/similar/${inventoryId}`,
        method: 'get'
      }),
      providesTags: ['Inventory']
    })
  }),
});

export const {
  useC_InventoryMutation,
  useD_LeadMutation,
  useG_InventoryQuery,
  useU_LeadMutation,
  useI_LeadMutation,
  useGetMultiFilterInventoryDataQuery,
  useGetFilterOptionsQuery,
  useGetInventoryStatsQuery,
  useExportInventoryDataMutation,
  useBulkUpdateInventoryMutation,
  useGetSimilarInventoryQuery
} = inventoryApi;

export default inventoryApi;