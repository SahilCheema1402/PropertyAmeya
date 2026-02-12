"use client"
import React, { useEffect, useState } from 'react';
import { useG_ADMIN_STAFFQuery, useUserDisableMutation } from './../../_api_query/staff/staffs.api';
import { useDispatch, useSelector } from 'react-redux';
import Staff from './../../_components/Staff/StaffForm';
import StaffDetails from './../../_components/Staff/StaffDetails';
import { FaPlus } from 'react-icons/fa';
import Header from './../../_components/header';
import Sidebar from "./../../_components/Sidebar"
import { toast } from "react-toastify";
import { loader } from "../../_api_query/store";
const StaffPage = () => {
    const dispatch = useDispatch();
    const [staffAdd, setStaffAdd] = useState<any>(false);
    const [staffData, setStaffData] = useState<any>(false)
    const [selectedFeedBack, setSelectedFeedBack] = useState<any>(null);
    const { data, isLoading, isError, refetch, isSuccess } = useG_ADMIN_STAFFQuery({});
    const [staffDisable] = useUserDisableMutation();

    useEffect(() => {
        refetch();
    }, []);

    const handleToggleUser = async (userId: any, action: string) => {
        try {
            dispatch(loader(true));
            await staffDisable({ userId, action }).unwrap()
            refetch()
            toast.success("Staff update Successfully");

            dispatch(loader(false));
        } catch (error: any) {
            console.error(error.message);
            dispatch(loader(false));
            refetch()
            toast.error(error.response?.data?.message || "Staff update failed");
        }
    };
    return (
        <div className="flex h-screen bg-gray-100">

            <Sidebar />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 overflow-hidden ">
                <div className="flex justify-between items-center mb-4 px-4 rounded-md" >
                    <button className="bg-[#004aad] flex items-center gap-x-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg text-white" onClick={() => setStaffAdd(true)}>
                        <FaPlus color="#fff" size={22} />
                        <span className="text-white font-semibold text-base">Staff</span>
                    </button>
                    <Header header="All Employees" />
                </div>



                <div className="flex-1 overflow-y-auto">
                    <div className="flex flex-col bg-white w-full my-2 px-4 rounded-lg">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 border-b border-gray-300 py-2 mb-2 font-bold">
                            <p className="col-span-1 text-center">Sr No.</p>
                            <p className="col-span-3">Name of Staff</p>
                            <p className="col-span-3">Designation</p>
                            <p className="col-span-3">Subordinates</p>
                            <p className="col-span-2 text-center">Status</p>
                        </div>

                        <div className="overflow-y-auto max-h-96">
                            {isSuccess && data?.data?.length > 0 ? (
                                [...data?.data]
                                    .sort((a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0))
                                    .map((item, index) => (
                                        <div
                                            className="grid grid-cols-12 items-center border-b border-gray-200 py-2 cursor-pointer hover:bg-gray-50"
                                            key={item._id}
                                            onClick={() => { setStaffData(true), setSelectedFeedBack(item) }}
                                        >
                                            <p className="col-span-1 text-center">{index + 1}</p>
                                            <p className="col-span-3 text-blue-500 uppercase">{item?.userName}</p>
                                            <p className="col-span-3 text-xs">{item?.designation}</p>
                                            <p className="col-span-3 text-xs">{item?.subordinate?.length || 0}</p>
                                            <div
                                                className="col-span-2 flex justify-center"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={item?.isActive}
                                                    onChange={async (e) => {
                                                        const checked = e.target.checked;
                                                        const action = checked ? "enable" : "disable";
                                                        await handleToggleUser(item._id, action);
                                                    }}
                                                    className="w-4 h-4 text-[#004aad] bg-gray-100 border-gray-300 rounded focus:ring-[#004aad] focus:ring-2"
                                                />
                                            </div>
                                        </div>
                                    ))
                            ) : (
                                <div className="w-full flex justify-center items-center py-4">
                                    <p className="text-xl text-black font-bold">No Data Found!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>


                {staffAdd && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1 }}>
                        <Staff setStaffAdd={setStaffAdd} refetch={refetch} />
                    </div>
                )}
                {staffData && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1 }}>
                    <StaffDetails setStaffData={setStaffData} selectedFeedBack={selectedFeedBack} refetch={refetch} />
                </div>}
            </div>
        </div>
    );
};


export default StaffPage;
