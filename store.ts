import { configureStore } from '@reduxjs/toolkit';
import store_ from './app/_api_query/store';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import loginApi from './app/_api_query/auth/auths.api';
import LeadApi from './app/_api_query/Leads/leads.api';
import LeadScoreApi from './app/_api_query/LeadScore/leadScore.api';
import Onetoone_Api from './app/_api_query/Onetoone/onetoone.api';
import reminders_Api from './app/_api_query/Reminders/reminders.api';
import quotation_Api from './app/_api_query/Quotation/quotation.api';
import inventory_Api from './app/_api_query/Inventory/inventory.api';
import group_Api from './app/_api_query/Group/group.api';
import link_Api from './app/_api_query/Link/link.api';
import staffApi from './app/_api_query/staff/staffs.api';
import reports_Api from './app/_api_query/report/report.api';
import termsConditions_Api from './app/_api_query/termsConditions/termsconditions.api';
import projectApi from '@app/_api_query/Project/project.api';
import expense_Api from '@app/_api_query/Expense/expense.api';
import notification_Api from '@app/_api_query/Notification/notification.api';
import saleNotificationApi  from '@app/_api_query/SaleNotification/saleNotification.api';
import { attendanceApi } from '@app/_api_query/attendance/attendance.api';
import newLeadapi from '@app/_api_query/NewLeads/newlead.api';
import whatsappTemplateApi from '@app/_api_query/whatsapp/whatsapp.api';
// import targetAchievement_Api from './app/_api_query/TargetVsAchievement/TargetVsAchievement.api';

const store = configureStore({
  reducer: {
    store:store_,
    [loginApi.reducerPath]:loginApi.reducer,
    [LeadApi.reducerPath]:LeadApi.reducer,
    [newLeadapi.reducerPath]:newLeadapi.reducer,
    [LeadScoreApi.reducerPath]:LeadScoreApi.reducer,
    [Onetoone_Api.reducerPath] :Onetoone_Api.reducer,
    [reminders_Api.reducerPath] :reminders_Api.reducer,
    [quotation_Api.reducerPath]:quotation_Api.reducer,
    [inventory_Api.reducerPath]:inventory_Api.reducer,
    [group_Api.reducerPath]:group_Api.reducer,
    [link_Api.reducerPath]:link_Api.reducer,
    [staffApi.reducerPath]:staffApi.reducer,
    [reports_Api.reducerPath]:reports_Api.reducer,
    [termsConditions_Api.reducerPath]:termsConditions_Api.reducer,
    [projectApi.reducerPath]:projectApi.reducer,
    [expense_Api.reducerPath]:expense_Api.reducer,
    [notification_Api.reducerPath]:notification_Api.reducer,
     [saleNotificationApi.reducerPath]: saleNotificationApi.reducer,
     [attendanceApi.reducerPath]: attendanceApi.reducer,
    [whatsappTemplateApi.reducerPath]: whatsappTemplateApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(loginApi.middleware,
    LeadApi.middleware,
    newLeadapi.middleware,
    LeadScoreApi.middleware,
    Onetoone_Api.middleware,
    reminders_Api.middleware,
    quotation_Api.middleware,
    group_Api.middleware,
    link_Api.middleware,
    inventory_Api.middleware,
    staffApi.middleware,
    reports_Api.middleware,
    termsConditions_Api.middleware,
    projectApi.middleware,
    expense_Api.middleware,
   notification_Api.middleware,
   saleNotificationApi.middleware,
   attendanceApi.middleware,
    whatsappTemplateApi.middleware
    ),
});

type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;
export const useDispatch_ = () => useDispatch<AppDispatch>();
export const useSelector_: TypedUseSelectorHook<RootState> = useSelector;
export default store;