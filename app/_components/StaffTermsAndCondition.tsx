"use client";

import React, { useEffect, useState } from 'react';
import { useDispatch_ } from "@/store";
import { loader } from "../_api_query/store";
import { useG_Term_ConditionsQuery, useP_Term_ConditionsMutation } from '../_api_query/termsConditions/termsconditions.api';
import { toast } from 'react-toastify';
import { X } from 'lucide-react';

const TermsAndConditionsScreen = ({showFetchData}: {showFetchData: () => void}) => { 
    const [role_, setRole] = useState<number>(1);
    const [termsContent, setTermsContent] = useState<string>('');
    const dispatch = useDispatch_();

    const { 
        data: Sdata, 
        isError: SisError, 
        isSuccess: SisSuccess, 
        isLoading: SisLoading, 
        isFetching: SFetching, 
        refetch: sRetch 
    } = useG_Term_ConditionsQuery({}, { refetchOnMountOrArgChange: true });

    const [acceptTerms] = useP_Term_ConditionsMutation();

    useEffect(() => {
        if (SFetching || SisLoading) {
            dispatch(loader(true));
            return;
        }
        if (SisSuccess || SisError) {
            dispatch(loader(false));
        }
    }, [dispatch, SisSuccess, SisError, SFetching, SisLoading]);

    useEffect(() => {
        const roleFetch = async () => {
            const role = localStorage.getItem('role');
            setRole(Number(role));
        };
        roleFetch();
    }, []);

    useEffect(() => {
        if (SisSuccess) {
            setTermsContent(Sdata?.data[0]?.content || "");
        }
    }, [SisSuccess]);

    const handleAcceptTerm = async () => {
        try {
            dispatch(loader(true));
            const res = await acceptTerms({termsContent}).unwrap();
            await sRetch();
            toast.success("Terms and Conditions Accepted Successfully");
            showFetchData();
            dispatch(loader(false));
        } catch (error: any) {
            console.error("Error:", error);
            showFetchData();
            await sRetch();
            dispatch(loader(false));
            toast.error(`Terms and Conditions Acceptance Failed: ${error.data.message}`);
        }
    };

    return (
        <div className="fixed z-[999] inset-0 bg-black/30 flex justify-center items-center">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md max-h-[90vh] rounded-xl overflow-hidden shadow-xl">
                <div className="relative p-4">
                    <button 
                        onClick={() => showFetchData()} 
                        className="absolute top-2 right-2 bg-[#004aad] p-1 rounded-full"
                    >
                        <X size={16} color="white" />
                    </button>
                    
                    <div className="overflow-y-auto max-h-[70vh] p-4 bg-purple-100">
                        {SisSuccess && Sdata?.data.length > 0 ? (
                            Sdata?.data[0]?.content.split('\n').map((line: string, index: number) => {
                                const isHeading = (line: string) => {
                                    const words = line.trim().split(/\s+/);
                                    return words.length <= 3;
                                };

                                return (
                                    <div key={index} className="mb-4">
                                        {isHeading(line) ? (
                                            <h3 className="text-lg font-bold mb-1">{line}</h3>
                                        ) : (
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

                        {SisSuccess && Sdata?.data.length > 0 && (
                            <div className="flex flex-row justify-between mt-8">
                                <button 
                                    className="bg-red-500 px-6 py-3 rounded-lg shadow-md"
                                    onClick={() => showFetchData()}
                                >
                                    <span className="text-white text-lg font-bold">Decline</span>
                                </button>
                                <button 
                                    className="bg-green-500 px-6 py-3 rounded-lg shadow-md"
                                    onClick={handleAcceptTerm}
                                >
                                    <span className="text-white text-lg font-bold">Accept</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsAndConditionsScreen;