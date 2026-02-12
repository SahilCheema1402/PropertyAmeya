"use client"
import React, { useEffect, useState } from 'react';
import Header from '@app/_components/header';
import TermsAndConditionsCreate from '@app/_components/termAndConditonForm';
import { loader } from "./../../_api_query/store";
import { useDispatch_ } from "@/store";
import { toast } from "react-toastify";
import { useG_Term_ConditionsQuery,useD_Term_ConditionsMutation } from '@app/_api_query/termsConditions/termsconditions.api';
import { FaPlus } from '@node_modules/react-icons/fa';
import Sidebar from '@app/_components/Sidebar';
import { MdDelete } from '@node_modules/react-icons/md';
import { HiMiniPencil } from "react-icons/hi2";
const TermsAndConditionsScreen = () => {
    const [pop, setPop] = useState(false);
    const [type_, setType_] = useState<any>("");
    const [role_, setRole] = useState<any>(1)
    const [termsContent, setTermsContent] = useState<string>('');
    const [id, setId] = useState<string>('');
    const dispatch = useDispatch_();
    const { data: Sdata, isError: SisError, isSuccess: SisSuccess, isLoading: SisLoading, isFetching: SFetching, refetch: sRetch } = useG_Term_ConditionsQuery({}, { refetchOnMountOrArgChange: true })
    const [deleteTerms] = useD_Term_ConditionsMutation();
    useEffect(() => {
        if (type_ == "update" && SisSuccess) {
            setTermsContent(Sdata?.data[0]?.content)
            setId(Sdata?.data[0]?._id)
        }
        else {
            setTermsContent('')
            setId('')
        }
    }, [SFetching, type_, SisSuccess]);
    useEffect(() => {
        if (SFetching || SisLoading) {
            dispatch(loader(true));
            return;
        }
        if (SisSuccess) {
            dispatch(loader(false));
            return;
        }
        if (SisError) {
            dispatch(loader(false));
            return;
        }
    }, [dispatch, SisSuccess, SisError, SFetching, SisLoading,]);

    useEffect(() => {
   
        async function roleFetch() {
            const role = await localStorage.getItem('role');
            setRole(role)
        }
        roleFetch()
    }, []);

    const handleDeleteTerm = async (id: any) => {
        try {
            dispatch(loader(true));
            const res = await deleteTerms(id).unwrap();
            sRetch()
            toast.success( "Terms and Conditions Deleted Successfully");
            dispatch(loader(false));

        } catch (error: any) {
            dispatch(loader(false));
            sRetch()
            toast.error( "Terms and Conditions Deleted Failed");

        }
    };

    return (
<div className="flex h-screen bg-gray-100">
          
          <Sidebar /> {/* Add your Sidebar component here */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="mt-[30px] px-4 relative flex flex-row items-center">
                <Header header="Terms and Conditions" />
                {(role_ == 1 || role_ == 2) ? <div className="bg-[#004aad] absolute left-4 flex flex-row gap-x-1 items-center rounded-lg pl-1 pr-4 py-1" onClick={() => { setType_("add"); setPop(true) }}>
                    <FaPlus color="#fff" size={22} />
                    <p className="text-white font-semibold text-base">Add</p>
                </div> : ""}
            </div>
            <div className='mb-4 overflow-y-auto'>
                {SisSuccess && Sdata?.data.length > 0 ? <div className=' flex flex-row justify-end gap-2 p-3'>
                    <div
                        onClick={() => { setType_("update"); setPop(true) }}
                        className={`p-2 rounded-full  bg-[#004aad] mt-4}`}
                    >
                        <HiMiniPencil color="#fff"  />
                     
                    </div>
                    <div
                        onClick={() => handleDeleteTerm(Sdata?.data[0]._id)}
                        className={`p-2 rounded-full  bg-red-500 mt-4}`}
                    >
                        <MdDelete color="#fff" />
                    
                    </div>
                </div> : ""}
                {SisSuccess && Sdata?.data.length > 0 ? (
                    Sdata?.data[0]?.content.split('\n').map((line: string, index: number) => {
                        // Helper function to check if the line is a heading (1 or 2 words)
                        const isHeading = (line: string) => {
                            const words = line.trim().split(/\s+/); // Split by spaces and trim extra spaces
                            return words.length <= 3; // If line has 1 or 2 words, it's a heading
                        };

                        return (
                            <div key={index} className="mb-4">
                                {isHeading(line) ? (
                                    // Heading style
                                    <p className="text-lg font-bold mb-1">{line}</p>
                                ) : (
                                    // Content style with padding (px-4)
                                    <p className="text-base leading-6 mb-1 px-4">{line}</p>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="w-full flex justify-center items-center">
                        <p className="text-xl text-black font-bold">No Data Found!</p>
                    </div>
                )}



            </div>
            </div>
            {pop && <TermsAndConditionsCreate type_={type_} setPop={setPop} termsContent={termsContent} setTermsContent={setTermsContent} id={id} />}
        </div>
    );
};

export default TermsAndConditionsScreen;
