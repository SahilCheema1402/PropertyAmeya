import axios from 'axios';
import { baseUrl } from "./../../app/_api_query/index";
import { useRouter } from 'next/router';
export default async function refreshToken(callback?: any) {
  try {
    const token = localStorage.getItem('refreshToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const accesstoken = await axios.post(`${baseUrl}/token`);
      localStorage.setItem('accessToken', accesstoken?.data?.data?.accessToken);
      return await callback || null;
    }
  } catch (error: any) {
    if (error?.response?.status === 405) { 
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      const router = useRouter();
      router.push('/');
    }
  }
}
