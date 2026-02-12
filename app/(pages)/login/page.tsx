"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useLoginMutation } from "../../_api_query/auth/auths.api";
import { toast } from "react-toastify";
import logoImage from '../../../assets/images/Ameya Innovex Logo.png';
import { loader, setUserHierarchy } from "../../_api_query/store";
import Image from "next/image";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { HierarchyService } from "../../services/hierarchyService";
import { useSelector_ } from "../../../store";

interface IFormInputs {
  user: string;
  password: string;
}

const Login = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [Login] = useLoginMutation();
  const [eye, setEye] = useState<boolean>(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<IFormInputs>();

  // // Replace these:
  // const globalState = useSelector_((state) => state);
  // // const hierarchyState = useSelector_((state) => state.store.hierarchy);

  // // With more specific selectors:
  // const hierarchyState = useSelector_((state) => state.store?.hierarchy || null);

  // Console log the state whenever it changes
  // useEffect(() => {
  //   console.log("Global State:", globalState);
  //   console.log("Hierarchy State:", hierarchyState);
  // }, [globalState, hierarchyState]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (typeof window !== "undefined") {
          const token = localStorage.getItem("accessToken");
          const refreshToken = localStorage.getItem("refreshToken");

          if (token && refreshToken) {
            // If user is already logged in, fetch hierarchy data
            const userData = localStorage.getItem("user");
            const comUserData = localStorage.getItem("comUserId");

            if (userData && comUserData) {
              const user = JSON.parse(userData);
              const comUser = JSON.parse(comUserData);

              console.log("Auth check - User data:", user);
              console.log("Auth check - ComUser data:", comUser);

              try {
                await fetchAndSetHierarchy(comUser.userId, comUser.companyId || comUser.compId);
              } catch (error) {
                console.error("Error fetching hierarchy on auth check:", error);
              }
            }

            router.replace("/home");
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
      }
    };

    checkAuth();
  }, [router, dispatch]);

  const togglePasswordVisibility = () => {
    setEye(!eye);
  };

  // const fetchAndSetHierarchy = async (userId: string, companyId: string) => {
  //   try {
  //     console.log("Fetching hierarchy for:", { userId, companyId });

  //     const hierarchyData = await HierarchyService.fetchUserHierarchy(userId, companyId);
  //     console.log("Hierarchy Data from Service:", hierarchyData);

  //     // Dispatch only if we have valid data
  //     if (hierarchyData?.currentUser) {
  //       dispatch(setUserHierarchy(hierarchyData));
  //       localStorage.setItem('userHierarchy', JSON.stringify(hierarchyData));
  //     } else {
  //       console.warn("Invalid hierarchy data structure received");
  //       toast.warning("Hierarchy data incomplete");
  //     }
  //   } catch (error: any) {
  //     console.error("Error fetching hierarchy:", error);
  //     // Show more specific error message
  //     toast.error(error.message || "Failed to load user hierarchy data");
  //     throw error; // Re-throw to allow login to continue
  //   }
  // };
  // In your login page, ensure hierarchy is properly dispatched:
  const fetchAndSetHierarchy = async (userId: string, companyId: string) => {
    try {
      const hierarchyData = await HierarchyService.fetchUserHierarchy(userId, companyId);

      // Validate and transform data if needed
      const processedData = {
        currentUser: hierarchyData.currentUser,
        immediateManager: hierarchyData.immediateManager,
        allManagers: hierarchyData.allManagers || [],
        immediateSubordinates: hierarchyData.immediateSubordinates || [],
        allSubordinates: hierarchyData.allSubordinates || [],
        hierarchyMap: hierarchyData.hierarchyMap || {}
      };

      dispatch(setUserHierarchy(processedData));
      localStorage.setItem('userHierarchy', JSON.stringify(processedData));
    } catch (error) {
      console.error("Error fetching hierarchy:", error);
    }
  };

  const onSubmit: SubmitHandler<IFormInputs> = async (data: IFormInputs) => {
    if (isRedirecting) return;

    try {
      setIsRedirecting(true);
      dispatch(loader(true));

      const res = await Login(data).unwrap();
      console.log("Login Response:", res);

      // Store auth tokens and user data
      localStorage.setItem("accessToken", res?.data?.accessToken);
      localStorage.setItem("refreshToken", res?.data?.refreshToken);
      localStorage.setItem("comUserId", JSON.stringify(res.data.comUserId));
      localStorage.setItem("role", JSON.stringify(res.data.role));

      const userData = {
        ...res.data.user,
        role: res.data.role,
        userId: res.data.comUserId.userId,
        companyId: res.data.comUserId.compId,
        createdBy: res.data.user.createdBy,
        subordinate: res.data.user.subordinate
      };

      localStorage.setItem("user", JSON.stringify(userData));

      // Debug logs
      console.log("Stored user data:", userData);
      console.log("ComUserId:", res.data.comUserId);

      // Fetch and set hierarchy data with proper error handling
      try {
        await fetchAndSetHierarchy(
          res.data.comUserId.userId,
          res.data.comUserId.compId
        );
      } catch (hierarchyError) {
        console.error("Hierarchy fetch failed during login:", hierarchyError);
        // Don't block login if hierarchy fetch fails
      }

      toast.success("Login Successful");

      // Wait a bit longer for hierarchy to be set
      setTimeout(() => {
        dispatch(loader(false));
        router.replace("/home");
      }, 500);

    } catch (error: any) {
      setIsRedirecting(false);
      dispatch(loader(false));
      console.error("Login error:", error);
      toast.error(`Login Failed: ${error.data?.message || 'An error occurred'}`);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Background Image Container - Set to exactly half screen height */}
      <div className="h-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            // backgroundImage: 'url("/images/property360jpg.jpg")',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black opacity-30"></div>
        </div>
      </div>

      {/* Form Container - Positioned immediately below the image */}
      <div className="h-1/2 bg-gray-50 dark:bg-gray-900 flex items-start justify-center">
        <div className="w-full max-w-md bg-white dark:bg-[#1c1f28] p-6 rounded-lg shadow-lg -mt-6">
          <div className="flex flex-col items-center">
            {/* <Image src={logoImage} alt="Ameya Innovex Logo" width={100} height={100} /> */}
            <h1 className="text-3xl font-extrabold text-[#004aad] text-center mt-2">Login</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
            <Controller
              control={control}
              rules={{ required: "Email or Username is required" }}
              render={({ field: { onChange, value = '' } }) => (
                <div className="mb-4">
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Email or Username"
                    className="w-full py-3 px-6 border-2 border-[#22232e] rounded-lg dark:text-white focus:outline-none focus:ring-2 focus:ring-[#004aad]"
                  />
                  {errors.user && <span className="text-xs text-red-500">{errors.user.message}</span>}
                </div>
              )}
              name="user"
              defaultValue=""
            />

            <Controller
              control={control}
              rules={{ required: "Password is required" }}
              render={({ field: { onChange, value } }) => (
                <div className="mb-2 relative">
                  <input
                    type={eye ? "password" : "text"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Password"
                    className="w-full py-3 px-6 border-2 border-[#22232e] rounded-lg dark:text-white focus:outline-none focus:ring-2 focus:ring-[#004aad]"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {eye ? <FaEye size={24} color="blue" /> : <FaEyeSlash size={24} color="blue" />}
                  </button>
                  {errors.password && <span className="text-xs text-red-500">{errors.password.message}</span>}
                </div>
              )}
              name="password"
            />

            <button
              type="submit"
              disabled={isRedirecting}
              className={`w-full py-3 px-6 ${isRedirecting ? 'bg-gray-400' : 'bg-[#004aad] hover:bg-[#003b8c]'} rounded-lg text-white font-semibold text-lg mt-4 focus:outline-none`}
            >
              {isRedirecting ? 'Logging in...' : 'Submit'}
            </button>
          </form>
          <div className=" flex flex-row justify-between">
            <div onClick={() => { router.push('/public_pages') }} className="">
              <p className="basis-2/12 text-end  text-sm  text-[#004aad] ">Privacy Policy</p>
            </div>
            <div onClick={() => { router.push('/ForgetPassword') }} className="">
              <p className="basis-2/12 text-end  text-sm  text-[#004aad] ">Forget Password</p>
            </div>
          </div>

          <div onClick={() => { router.push('/DeleteAccount') }} className="">
            <p className="basis-2/12 text-start  text-sm  text-[#004aad] ">Delete Account</p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Login;