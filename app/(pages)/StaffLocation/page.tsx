"use client"
import React, { useEffect, useState } from 'react';
import Header from '@app/_components/header';
import { loader, setUserHierarchy } from "./../../_api_query/store";
import { useDispatch_ } from "@/store";
import { toast } from "react-toastify";
import Sidebar from '@app/_components/Sidebar';
import { useAuth } from "@app/_components/useAuth";
import { HierarchyService } from "@app/services/hierarchyService";
import { useG_locationQuery } from '@app/_api_query/termsConditions/termsconditions.api';

const StaffLocation = () => {

    const [role_, setRole_] = useState<number>(1);
    const [accessibleUserIds, setAccessibleUserIds] = useState<string[]>([]);
    const [hierarchyLoading, setHierarchyLoading] = useState(true);
    const { getAuthHeaders } = useAuth();
    const [currentUser, setCurrentUser] = useState<any>(null);
    const dispatch: any = useDispatch_();
    const [searchp, setSearchp] = useState('');
    useEffect(() => {
        const loadHierarchy = async () => {
            try {
                const storedHierarchy = localStorage.getItem('userHierarchy');
                if (storedHierarchy) {
                    const parsed = JSON.parse(storedHierarchy);
                    dispatch(setUserHierarchy(parsed));
                }

                // Optionally refresh hierarchy data
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const comUser = JSON.parse(localStorage.getItem('comUserId') || '{}');

                if (user.userId && comUser.compId) {
                    const freshData = await HierarchyService.fetchUserHierarchy(user.userId, comUser.compId);
                    dispatch(setUserHierarchy(freshData));
                }
            } catch (error) {
                console.error("Error loading hierarchy:", error);
            } finally {
                setHierarchyLoading(false);
            }
        };

        loadHierarchy();
    }, [dispatch]);

    // const { data, isError, isSuccess, isLoading, error, isFetching, refetch } = useG_locationQuery({});

    const { data, isError, isSuccess, isLoading, error, isFetching, refetch } = useG_locationQuery(
        {
            userIds: accessibleUserIds
        },
        {
            skip: hierarchyLoading
        }
    );


    useEffect(() => {
        if (isLoading || isFetching) {
            dispatch(loader(true))
        } else {
            dispatch(loader(false))
        }
        if (isError) {
            toast.error((error as any)?.data?.message || "An error occurred");

        }
    }, [isLoading, isSuccess, isError, error, isFetching]);

    const openGoogleMap = (latitude: any, longitude: any) => {
        const url = `https://www.google.com/maps?q=${Number(latitude)},${Number(longitude)}`;
        window.open(url, "_blank");
    };

    return (
        <div className="flex h-screen bg-gray-100">

            <Sidebar /> {/* Add your Sidebar component here */}

            <div className="flex-1 flex flex-col overflow-hidden">

                <div className="flex flex-col md:flex-row justify-between items-center mb-4  py-4 bg-white shadow-sm">

                    <Header header="Staff Location" />
                     {currentUser && (
                        <div className="text-sm font-semibold text-gray-600 mr-4">
                            Viewing: {currentUser.userName} and team
                        </div>
                    )}
                </div>
                <div className=" flex-1 overflow-y-scroll">
                    {/* Search Bar */}
                    <div className="w-full my-4">
                        <input
                            placeholder="Search location"
                            value={searchp}
                            onChange={(e) => setSearchp(e.target.value)}
                            style={{
                                height: 40,
                                borderColor: '#ccc',
                                borderWidth: 1,
                                borderRadius: 4,
                                paddingLeft: 10,
                            }}
                        />
                    </div>

                    {isSuccess && data?.data?.length > 0 ?
                        data?.data
                            .filter((item: any) => {
                                return searchp
                                    ? item.staffId?.userName.toLowerCase().includes(searchp.toLowerCase())
                                    : true;
                            })?.map((item: any, i: number) => (

                                <div key={i} className="w-full my-2  bg-slate-200 rounded-md space-y-6 p-2">
                                    {/* My Locations */}
                                    <div className='w-full flex flex-col '>
                                        <div className=' w-full flex justify-between'>
                                            <p className=" text-lg font-bold uppercase text-center mx-auto">{item?.staffId?.userName}</p>

                                        </div>

                                        {/* Share Location Button */}
                                        <div className="flex flex-row justify-between items-center">
                                            <p className="text-sm uppercase ">{item?.address}</p>
                                            <div
                                                onClick={() => openGoogleMap(item?.latitude, item?.longitude)}
                                                className="flex items-center cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                            >
                                                Share Location
                                            </div>
                                        </div>

                                    </div>


                                </div>
                            )) : <div className="w-full flex justify-center items-center">
                            <p className="p-xl  p-black font-bold">No Location Found!</p>
                        </div>}
                </div>
            </div>
        </div>
    );
};

export default StaffLocation;
