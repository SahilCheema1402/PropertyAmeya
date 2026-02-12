"use client";
import React, { useEffect } from "react";
import { useRouter } from 'next/navigation';
import { X, Bell } from 'lucide-react';
import { useGetNotificationQuery, useNotificationDoneMutation, useArcheiveNotificationMutation } from "../../_api_query/Notification/notification.api";
import { setNotification } from "../../_api_query/store";

import { useDispatch_, useSelector_ } from "@/store";

const Notification = ({data,isSuccess,isLoading}:any) => {
    const router = useRouter();
 
    const [ArchieveNotificationDone, { isSuccess: AisSuccess, isError: AisError, isLoading: AisLoading }] = useArcheiveNotificationMutation();
    const [notificationDone] = useNotificationDoneMutation();
    const dispatch = useDispatch_();

    // useEffect(() => {
    //     ArchieveNotificationDone({});
    // }, []);

   

    const handleClose = () => dispatch(setNotification(false));

    return (
        <div 
            className='z-[999] bg-[#00000034] fixed inset-0 flex justify-center items-center' 
            onClick={handleClose}
        >
            <div 
                className='bg-transparent w-full h-full flex justify-end items-center z-20 overflow-hidden' 
                onClick={handleClose}
            >
                <div 
                    className='bg-[#f5f5f5] animate-slide-in dark:bg-slate-900 flex flex-col relative w-full px-4 py-4 h-screen rounded-xl overflow-hidden' 
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className='flex flex-row justify-center gap-4'>
                        <div className='rounded-md p-6 cursor-pointer flex flex-row items-center gap-x-1 text-black text-xl font-semibold dark:text-white'>
                            <Bell color="red" size={24} />
                            <span>All Notifications</span>
                        </div>
                    </div>

                    <button 
                        className="bg-[#004aad] absolute top-10 right-6 p-1 rounded-full" 
                        onClick={handleClose}
                    >
                        <X className="text-white" size={16} />
                    </button>

                    {(isSuccess && data && data?.data?.notifications?.length > 0 && !isLoading) ? (
                        <div className='h-full w-full overflow-y-scroll relative'>
                            {data?.data?.notifications?.map((noti: any, i: number) => (
                                <div
                                    onClick={() => { router.push('/customer'); handleClose(); }}
                                    key={i} 
                                    className='border-2 border-white bg-gradient-to-b mb-3 from-[#004aad]/10 to-white dark:to-slate-950 rounded-xl w-full p-4 flex relative items-start'
                                >
                                    <div className='flex-grow'>
                                        <div className="flex flex-row items-center gap-2 mb-2">
                                            <div className='shadow-lg border-[1px] border-gray-200 bg-orange-300 rounded-full p-1 flex justify-center items-center'>
                                                <Bell color="white" size={24} />
                                            </div>
                                            <span className='font-semibold text-sm capitalize flex-wrap'>{noti?.title}</span>
                                        </div>
                                        <p className='text-xs capitalize'>{noti?.description}</p>
                                        <p className="text-[10px] text-gray-500">
                                            Created At:{" "}
                                            {noti?.createAt
                                                ? noti.createAt.split('T')[0]
                                                : "Date Not Available"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className='h-full w-full text-gray-400 text-lg font-semibold text-center flex justify-center items-center'>
                            <span>No notification</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notification;