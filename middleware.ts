export const runtime = "nodejs";

import { NextRequest, NextFetchEvent,NextResponse } from 'next/server';
import HandleResponse from './app/_utils/response';
import { headers, cookies } from 'next/headers'
import {CORS,Role_Authorization,Authorization_RefreshToken,Authorization} from './app/_middelware/Auth.middleware';
import { IUser } from './app/_interface/user.interface';
import {UserRoles} from './app/_enums/enums';
import { NextApiRequest } from 'next';
export interface CustomNextRequest extends NextRequest {
  user?: Partial<IUser>
}
// const allowedOrigins = ['https://localhosst:3000/']

// const corsOptions = {
//   'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
//   'Access-Control-Allow-Headers': 'Content-Type, Authorization',
// }
const baseUrl = '/api/v1'
const authRoutes = [ // Authenctication url's
  // {url:`${baseUrl}/user`,method:'post',roles:[UserRoles['SuperAdmin'],UserRoles['Admin']]}, // user Create By Super Admin
  {url:`${baseUrl}/user`,method:'put',roles:[UserRoles['SuperAdmin'],UserRoles['Admin']]}, // user get
  {url:`${baseUrl}/user`,method:'patch',roles:[UserRoles['SuperAdmin'],UserRoles['Admin']]}, // user get
  {url:`${baseUrl}/project`,method:'get',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/project`,method:'post',roles:[UserRoles['SuperAdmin'],UserRoles['Admin']]},
  {url:`${baseUrl}/lead`,method:'get',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/lead/call_status`,method:'post',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/lead/count`,method:'get',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/lead/download`,method:'post',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/newLead`,method:'get',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/customer`,method:'get',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/lead`,method:'post',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/lead`,method:'put',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/staff`,method:'patch',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/staff`,method:'get',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/staffs`,method:'patch',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/staffs`,method:'get',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/staff`,method:'put',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/leadScore`,method:'get',roles:[UserRoles['SuperAdmin'],UserRoles['Admin']]},
  {url:`${baseUrl}/leadScore`,method:'post',roles:[UserRoles['SuperAdmin'],UserRoles['Admin']]},
  {url:`${baseUrl}/lead`,method:'delete',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/targetVsAchievement`,method:'get',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/targetVsAchievement/dailyTarget`,method:'get',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/report`,method:'get',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/lead/home`,method:'get',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/lead/widget-leads`,method:'get',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/inventory`,method:'get',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/employeeLeads`,method:'get',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/employeeLeads`,method:'put',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/employeeLeads`,method:'delete',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/expense`,method:'get',roles:[UserRoles['SuperAdmin'],UserRoles['Admin']]},
  {url:`${baseUrl}/expense`,method:'post',roles:[UserRoles['SuperAdmin'],UserRoles['Admin']]},
  {url:`${baseUrl}/expense`,method:'delete',roles:[UserRoles['SuperAdmin'],UserRoles['Admin']]},
  {url:`${baseUrl}/notification`,method:'get',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/saleNotification`,method:'get',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/employeeLeads`,method:'post',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/multiFilter`,method:'get',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/terms_and_conditions`,method:'get',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/terms_and_conditions`,method:'patch',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/terms_and_conditions`,method:'post',roles:[UserRoles['SuperAdmin'],UserRoles['Admin']]},
  {url:`${baseUrl}/terms_and_conditions`,method:'delete',roles:[UserRoles['SuperAdmin'],UserRoles['Admin']]},
  {url:`${baseUrl}/terms_and_conditions`,method:'options',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/location`,method:'get',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/location`,method:'post',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/staffs`,method:'get',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/staffs`,method:'patch',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/lead/rechurn`,method:'get',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/lead/rechurn`,method:'put',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  {url:`${baseUrl}/lead/rechurn`,method:'patch',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},

  {url:`${baseUrl}/whatsapp-template`,method:'put',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['Sales Coordinator']]},

  {url:`${baseUrl}/whatsapp-template`,method:'post',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['Sales Coordinator']]},
  {url:`${baseUrl}/whatsapp-template`,method:'get',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  
  {url:`${baseUrl}/lead/rechurn`,method:'post',roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']]},
  // ATTENDANCE ROUTES
  { url: `${baseUrl}/attendance`, method: 'post', roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']] }, // Check-in
  { url: `${baseUrl}/attendance/checkout`, method: 'put', roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']] }, // Check-out
  { url: `${baseUrl}/attendance/status`, method: 'get', roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']] }, // For self-check
  { url: `${baseUrl}/attendance/summary`, method: 'get', roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']] }, // Admin dashboard summary
  { url: `${baseUrl}/attendance/user`, method: 'get', roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']] }, // Individual user records
  { url: `${baseUrl}/attendance/admin`, method: 'get', roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']] }, // Admin gets all records
  { url: `${baseUrl}/attendance/:id`, method: 'patch', roles:[UserRoles['SuperAdmin'],UserRoles['Admin'],UserRoles['VP Sales'],UserRoles['Sales Coordinator'],UserRoles['Area Manager'],UserRoles['Sales Executive'],UserRoles['Sales Manager'],UserRoles['Team Lead']] }, // Admin update



];

export async function middleware(request: CustomNextRequest) { // in token end point not able to access Refresh token

    const IndexAuth = authRoutes.findIndex((url:any)=>{
    const normalizedPath = url.url.toLocaleLowerCase().replace(/\/$/, ''); // Remove trailing slash
    const normalizedRequestPath = request.nextUrl.pathname.toLocaleLowerCase().replace(/\/$/, '');
    return (
        normalizedPath === normalizedRequestPath &&
        request.method.toLocaleLowerCase() === url.method.toLocaleLowerCase()
    );
});    
    if(request.nextUrl.pathname === "/api/v1/token"){
      const response = NextResponse.next({
        request:request
      })
      return response
    }
    if(IndexAuth >=0){
        const { headers } = request;
        const authHeader = headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
          return HandleResponse({type:"UNAUTHORIZED",message:"AccessToken Is Expired Or Not valid"})
        }
        const token = authHeader.split(' ')[1];
        const user = await Authorization(token)
        if(!user){
          return HandleResponse({type:"UNAUTHORIZED",message:"some thing is wrong while authorization"})
        }
        request.user = user
        request.headers.set("user",typeof user=='string'? user:JSON.stringify(user));
      }
      if( IndexAuth >=0 && !(await Role_Authorization(request?.user!,authRoutes[IndexAuth]?.roles))){
        return HandleResponse({type:"UNAUTHORIZED",message:"Connect With Admin you are the able to access this feature"})
    }
    return NextResponse.next({
      request:request,
    });
  }