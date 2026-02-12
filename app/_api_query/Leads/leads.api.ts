import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { baseUrl } from '../index';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiWrapper from './../../_helpers/ApiWrapper';

const lead_mdm_Api = createApi({
  reducerPath: 'Lead',
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/`,
    prepareHeaders: async (headers) => {
      await ApiWrapper()
      const token = await localStorage.getItem('accessToken');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  tagTypes: ['mdm', 'leads', 'widget-leads'],
  endpoints: (builder) => ({

    CU_MDM: builder.mutation({
      query: (body) => {
        return ({
          url: "leadfield",
          method: "post",
          body,
        })
      },
      invalidatesTags: ['mdm']
    }),

    U_MDM: builder.mutation({
      query: (body) => {
        return ({
          url: "leadfield",
          method: "put",
          body,
        })
      },
      invalidatesTags: ['mdm']
    }),
    D_MDM: builder.query({
      query: () => {
        return ({
          url: "leadfield",
          method: "delete",
        })
      },
      providesTags: ['mdm']
    }),
    G_MDM: builder.query({
      query: () => {
        return ({
          url: "leadfield",
          method: "get",
        })
      },
      providesTags: ['mdm']
    }),
    downloadLeads: builder.mutation<Blob, {
      selectedStatus?: string;
      leadType?: string;
      search?: string;
      downloadAll?: boolean;
    }>({
      query: (params) => ({
        url: 'lead/download',
        method: 'POST',
        body: params,
        timeout: 300000, // 5 minutes timeout
        responseHandler: (response) => response.blob(),
      }),
      // Add loading state handling
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          // You can dispatch loading actions here
          console.log('Download started for:', arg);
          await queryFulfilled;
          console.log('Download completed successfully');
        } catch (error) {
          console.error('Download failed:', error);
          // Handle error appropriately
        }
      },
    }),
    G_Customer: builder.query({
      query: ({ search, page, limit }) => {

        return ({
          url: `customer?search=${search}&page=${page}&limit=${limit}`,
          method: "get",
        })
      },
      providesTags: ['leads']
    }),
    G_Lead: builder.query({
      query: ({ page, limit, search, leadType, selectedStatus, staffId, startDate, endDate }) => {
        const isPhoneSearch = search && /^\d{10}$/.test(search.replace(/\D/g, ''));

        return {
          url: `lead?page=${page}&limit=${limit}&search=${encodeURIComponent(search || '')}&leadType=${leadType}&selectedStatus=${selectedStatus}&staffId=${staffId || ''}&startDate=${startDate || ''}&endDate=${endDate || ''}`,
          method: "get",
          timeout: isPhoneSearch ? 30000 : 60000,
        };
      },
      keepUnusedDataFor: 30, // Keep cache for 30 seconds
      providesTags: (result, error, arg) => [
        { type: 'leads', id: 'LIST' },
        { type: 'leads', id: `${arg.selectedStatus}-${arg.leadType}-${arg.search}` }
      ],
      // Add transformation to handle phone search results
      transformResponse: (response: any, meta, arg) => {
        if (response.message === "phone_search_results") {
          return {
            ...response,
            isPhoneSearchResult: true
          };
        }
        return response;
      },
      // Add custom cache key for better caching
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const { page, limit, search, leadType, selectedStatus } = queryArgs;
        return `${endpointName}-${selectedStatus}-${leadType}-${search || 'no-search'}-${page}-${limit}`;
      }
    }),
    G_Lead_Counts: builder.query({
      query: ({ staffId, startDate, endDate, search }) => ({
        url: `lead/count?staffId=${staffId || ''}&startDate=${startDate || ''}&endDate=${endDate || ''}&search=${encodeURIComponent(search || '')}`,
        method: "get",
      }),
      // Cache counts for 60 seconds
      keepUnusedDataFor: 60,
      providesTags: ['leads'],
    }),
    G_Employee_Lead: builder.query({
      query: ({ staffId, search, leadType, page, limit, selectedStatus }) => {
        return ({
          url: `employeeLeads?page=${page}&limit=${limit}&id=${staffId}&search=${search}&leadType=${leadType}&selectedStatus=${selectedStatus}`,
          method: "get",
        })
      },
      providesTags: ['leads']
    }),
    I_Lead: builder.mutation({
      query: (body) => ({
        url: `lead`, // Ensure this matches your backend route
        method: "PATCH", // Use uppercase for HTTP methods
        body,
        headers: {
          'Content-Type': 'multipart/form-data', // Ensure the correct content type
        },
      }),
    }),

    C_Lead: builder.mutation({
      query: (body) => {
        return ({
          url: `lead?id=${body?._id}`,
          method: "post",
          body
        })
      },
      invalidatesTags: ['leads']
    }),
    C_ExcelBulk_Lead: builder.mutation({
      query: (data) => {
        return ({
          url: `employeeLeads`,
          method: "post",
          body: JSON.stringify({ uniqueData: data }),
        })
      },
      invalidatesTags: ['leads']
    }),
    F_Lead: builder.mutation({
      query: (data) => {
        return ({
          url: `employeeLeads`,
          method: "delete",
        })
      },
      invalidatesTags: ['leads']
    }),
    U_Lead: builder.mutation({
      query: (body) => {
        return ({
          url: "lead",
          method: "put",
          body
        })
      },
      invalidatesTags: ['leads']
    }),

    markHotProspect: builder.mutation({
      query: (body) => {
        return ({
          url: "lead",
          method: "put",
          body: {
            _id: body._id,
            type_: "markHotProspect",
            isHotProspect: body.isHotProspect
          }
        })
      },
      invalidatesTags: ['leads']
    }),

    // New mutation for marking Suspect
    markSuspect: builder.mutation({
      query: (body) => {
        return ({
          url: "lead",
          method: "put",
          body: {
            _id: body._id,
            type_: "markSuspect",
            isSuspect: body.isSuspect
          }
        })
      },
      invalidatesTags: ['leads']
    }),
    D_Lead: builder.mutation({
      query: (body) => {
        return ({
          url: "lead",
          method: "delete",
        })
      },
      invalidatesTags: ['leads']
    }),
    getMultiFilterData: builder.query({

      query: (url) => {
        return {
          url: `${url}`,
          method: "get",
        }
      },
      providesTags: ['leads']
    }),

    Home_Report: builder.query({
      query: ({ dateRange, staffId, leadType }) => ({
        url: `lead/home`,
        method: "get",
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          staffId,
          leadType
        }
      }),
      providesTags: ['leads']
    }),

    Home_WidgetLeads: builder.query({
      query: ({ status, dateRange, staffId, leadType, page = 1, limit = 50 }) => ({
        url: `lead/widget-leads`,
        method: "get",
        params: {
          status,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          staffId,
          leadType,
          page,
          limit
        }
      }),
      providesTags: (result, error, { status }) => [
        { type: 'widget-leads', id: status }
      ],
      // Add caching for 5 minutes
      keepUnusedDataFor: 300,
      // Transform response to only get needed data
      transformResponse: (response: any) => ({
        ...response,
        data: response.data?.map((lead: any) => ({
          name: lead.name,
          phone: lead.phone,
          source: lead.source || lead.queryDetails?.leadType || 'N/A',
          assign: lead.assign || [],
        })) || []
      })
    }),

    // Add these to your existing endpoints
    G_Rechurn_Leads: builder.query({
      query: ({ page, limit, search, thresholdDays, lastAssignedTo }) => {
        // Build the URL with all parameters
        let url = `lead/rechurn?page=${page}&limit=${limit}&search=${search}&thresholdDays=${thresholdDays}`;

        // Only add lastAssignedTo parameter if it has a value
        if (lastAssignedTo && lastAssignedTo.trim() !== '') {
          url += `&lastAssignedTo=${lastAssignedTo}`;
        }

        return {
          url: url,
          method: "get",
        };
      },
      providesTags: ["leads"],
    }),

    Move_To_Rechurn: builder.mutation({
      query: ({ leadIds, thresholdDays }) => {
        return {
          url: `lead/rechurn?thresholdDays=${thresholdDays}`,
          method: "post",
          body: { leadIds },
        };
      },
      invalidatesTags: ["leads"],
    }),

    Check_Rechurn_Leads: builder.query<{ success: boolean; count: number; message: string }, number>({
      query: (thresholdDays) => ({
        url: `lead/rechurn/check?thresholdDays=${thresholdDays}`,
        method: "get"
      }),
      providesTags: ["leads"],
    }),

    // Keep these the same - they don't need threshold parameters
    assignRechurnLeads: builder.mutation({
      query: ({ leadIds, staffId, assignAt, updateAt }) => ({
        url: "lead/rechurn",
        method: "PATCH",
        body: { leadIds, staffId, assignAt, updateAt }
      }),
      invalidatesTags: ['leads']
    }),

    assignSingleRechurnLead: builder.mutation({
      query: ({ leadId, staffId, updateAt, assignAt }) => ({
        url: "lead/rechurn",
        method: "PUT",
        body: { leadId, staffId, assignAt, updateAt }
      }),
      invalidatesTags: ['leads']
    }),
    D_Query: builder.mutation({
      query: (body) => {
        return {
          url: "lead/delete_querry",
          method: "DELETE",
          body,
        }
      },
      invalidatesTags: ['leads']
    }),


  }),
});

export const { useD_QueryMutation,useG_Lead_CountsQuery, useAssignRechurnLeadsMutation, useAssignSingleRechurnLeadMutation, useLazyCheck_Rechurn_LeadsQuery, useG_Rechurn_LeadsQuery, useMove_To_RechurnMutation, useCU_MDMMutation, useDownloadLeadsMutation, useG_MDMQuery, useU_MDMMutation, useC_LeadMutation, useD_LeadMutation, useG_LeadQuery, useU_LeadMutation, useI_LeadMutation, useD_MDMQuery, useG_Employee_LeadQuery, useC_ExcelBulk_LeadMutation, useGetMultiFilterDataQuery, useG_CustomerQuery, useF_LeadMutation, useHome_ReportQuery, useLazyHome_WidgetLeadsQuery } = lead_mdm_Api;
export default lead_mdm_Api;
