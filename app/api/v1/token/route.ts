import HandleResponse from './../../../_utils/response';
import { NextRequest } from 'next/server';
import {jwtVerify,SignJWT} from 'jose';
/**
 * @swagger
 * tags:
 *   - name: Refresh_Token
 *     description: Operations related to Tokens
 * 
 * /api/v1/token:
 *   post:
 *     tags:
 *       - Refresh_Token
 *     description: Refresh Token
 *     responses:
 *       200:
 *         description: successfully!
 *       400:
 *         description: Bad request
 */
export async function POST(req: NextRequest) {
    try {
        const { headers } = req;
        const authHeader = headers.get('authorization');
        const token = authHeader?.split(' ')[1];
        if(!token){
            return HandleResponse({type:"REFRESH_TOKEN"})
        }

        const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.NEXTAUTH_SECRET!));
        if (!payload.refresh) {
            return HandleResponse({type:"REFRESH_TOKEN"})
        }
        const iat = Math.floor(Date.now()/1000);
        const exp = iat + (60 * 60);
        const accessToken = await new SignJWT({access:JSON.stringify(payload?.refresh)})
                    .setProtectedHeader({alg:"HS256",typ:"JWT"})
                    .setExpirationTime(exp)
                    .setIssuedAt(iat)
                    .setNotBefore(iat)
                    .sign(new TextEncoder().encode(process.env.NEXTAUTH_SECRET!))
        return HandleResponse({type:"SUCCESS",message:" ", data:{accessToken}})
    } catch (error:any) {
        return HandleResponse({
            type: "REFRESH_TOKEN",
        })
    }
}