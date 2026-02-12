"use client"
import React, { useState } from "react";
import { useDispatch_ } from "@/store";
import { useForgetPasswordMutation } from "@app/_api_query/staff/staffs.api";
import { toast } from "react-toastify";
import { loader } from "../../_api_query/store";
import Image from "@node_modules/next/image";
import { useRouter } from "next/navigation";
import { IoKeySharp } from "react-icons/io5";
import { FaArrowLeft } from "react-icons/fa";

const ForgotPassword = () => {
    const router = useRouter();
    const [forgetPassword] = useForgetPasswordMutation();
    const dispatch = useDispatch_();
    const [email, setEmail] = useState("")
    const submit = async () => {
        try {
            dispatch(loader(true));
            const res = await forgetPassword({ email }).unwrap();
            setEmail("")
            toast.success("Password sent to your Email ID.");
            dispatch(loader(false));
        } catch (error: any) {
            dispatch(loader(false));
            setEmail("")
            toast.error(error.response?.data?.message || "Update Forget failed");
        }
    }
    return (
        <div className=" h-screen overflow-x-hidden bg-white justify-center items-center">
            {/* Container */}
            <div className="w-6/12 mx-auto  rounded-lg  p-6 shadow-md my-10">
                <div className="bg-transparent overflow-hidden flex flex-col mb-3">
                    <Image
                        className=" mx-auto px-6  "
                        src="/images/adaptive-icon.png"
                        alt="Ameya Innovex Logo"
                        width={300}
                        height={400}
                    />
                </div>
              

                {/* Title */}
                <div className="w-full justify-center flex flex-row mx-auto">
                <p className=" text-xl font-semibold text-gray-700 mb-2">
                    Forgot password?
                   
                </p>
                <div className="h-8 w-8 rounded-full bg-[#004aad] flex items-center justify-center">
                        <IoKeySharp color={"yellow"} className="text-2xl" />
                    </div>
                </div>
                
                <p className="text-center text-sm text-gray-500 mb-6">
                    No worries, we’ll send you reset instructions.
                </p>

                {/* Email Input */}
                <input
                    type="text"
                    value={email}  // Controlled input field
                    onChange={(e) => setEmail(e.target.value)}  // Handle input change
                    className=
                    "w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-700 focus:border-[#004aad] focus:ring-1 focus:ring-[#004aad]"
                    placeholder="Enter your email"
                />

                {/* Reset Password Button */}
                <div onClick={submit} className="mt-4 w-full rounded-lg bg-[#004aad] py-3">
                    <p className="text-center text-sm font-medium text-white">
                        Reset password
                    </p>
                </div>

                {/* Back to Log In */}
                <div onClick={() => { router.push('/login') }} className="">
                    <div className="flex flex-row  items-center gap-1  ">
                        <FaArrowLeft className="text-[#004aad]" />

                        <p className="text-center text-sm font-medium text-[#004aad]">
                            Back to log in
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
