import { IUser } from './../_interface/user.interface';
import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

export async function Authorization(AccessToken: string) {
    try {
        const { payload } = await jwtVerify(
            AccessToken, 
            new TextEncoder().encode(process.env.NEXTAUTH_SECRET!)
        );
        
        if (!payload.access) {
            return false;
        }
        // console.log('Access Token payload:', payload);
        // Parse and validate the access payload
        const parsedAccess = JSON.parse(payload?.access as string);
        // console.log('Parsed Access Token:', parsedAccess);
        return parsedAccess;
    } catch (error) {
        console.error('Token verification error:', error);
        return false;
    }
}

export async function Authorization_RefreshToken(refreshToken: string, user: IUser) {
    try {
        if (!refreshToken || !user.refreshToken) {
            return "AMS_Error";
        }
        
        if (user.refreshToken !== refreshToken) {
            return "AMS_Error";
        }
        
        return true;
    } catch (error) {
        console.error('Refresh token verification error:', error);
        return "AMS_Error";
    }
}

export async function Role_Authorization(user: Partial<IUser>, roles: number[]) {
    try {
        const userRole = typeof user === "string" 
            ? JSON.parse(user as any).role 
            : user.role;
            
        if (!roles?.includes(userRole)) {
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Role authorization error:', error);
        return false;
    }
}

export async function CORS(allowedOrigins: string[], request: NextRequest) {
    try {
        const origin = request.headers.get('origin') ?? '';
        
        // Add your production domain to allowedOrigins
        const productionOrigins = [
            ...allowedOrigins,
            'https://property360.iameya.com/',
        
            process.env.NEXT_PUBLIC_SITE_URL,      // From env variable
        ];
        
        // Allow all origins in development
        if (process.env.NODE_ENV === 'development') {
            return true;
        }
        
        const isAllowedOrigin = productionOrigins.some(allowed => {
            if (allowed && allowed.includes('*')) {
                // Handle wildcard domains
                const pattern = new RegExp('^' + allowed.replace('*', '.*') + '$');
                return pattern.test(origin);
            }
            return allowed === origin;
        });
        
        if (!isAllowedOrigin) {
            return false;
        }

        return true;
    } catch (error) {
        return false;
    }
}

// Add a helper function to handle response headers
export function addCorsHeaders(response: NextResponse, origin: string) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
}