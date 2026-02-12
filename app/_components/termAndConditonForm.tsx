"use client"
import React, { useState, useEffect } from 'react';
import { useG_Term_ConditionsQuery, useC_Term_ConditionsMutation } from '@app/_api_query/termsConditions/termsconditions.api';
import { loader } from '../_api_query/store'
import { useDispatch_, useSelector_ } from "@/store";
import { toast } from "react-toastify";
import { MdClose } from 'react-icons/md';
const TermsAndConditionsCreateScreen = ({ type_, setPop, termsContent, setTermsContent, id }: any) => {
    const dispatch = useDispatch_();
    const [createTerms] = useC_Term_ConditionsMutation();

    const handleSaveTerms = async () => {
        try {
            dispatch(loader(true));
            const res = await createTerms({
                content: termsContent,
                type_: type_,
                _id: id
            }).unwrap();
            dispatch(loader(false));
            setPop(false)

            toast.success("Terms and conditions created successfully",);

        } catch (error) {
            dispatch(loader(false));
            setPop(false)

            toast.success("There was an issue saving the terms.",);

        }
    };
    return (
        <div onClick={(e) => { e.stopPropagation(); }} className="fixed inset-0 bg-black/30 z-50 flex justify-center items-center overflow-y-auto py-4">
            <div onClick={(e) => { e.stopPropagation() }} className="bg-white rounded-xl  w-full max-w-md relative max-h-[90vh] overflow-y-auto">
                <div className="flex flex-row  p-4 pb-4 justify-center items-baseline relative">
                    <p className="font-bold  text-2xl">{type_ == 'update' ? 'Update' : 'Create'} Terms and Conditions</p>
                    <div className=" bg-[#004aad] absolute right-4 p-1 rounded-full" onClick={(e) => { e.stopPropagation(); setPop(false); }}>
                        <MdClose size={20} color="White" />
                    </div>
                </div>
                <div className='w-full flex-1 p-4'>
                    <textarea
                        className='h-32 w-full border border-gray-300 rounded-lg p-2' 
                        placeholder="Enter Terms and Conditions here..."
                        value={termsContent}
                        onChange={(e) => setTermsContent(e.target.value)} 
                    />
                </div>
                <div
                    onClick={handleSaveTerms}
                    className='w-1/2 bg-[#4CAF50] mx-auto text-center rounded my-1'
                >
                    {type_ === 'update' ? 'Update Terms' : 'Create Terms'}
                </div>
            </div>
        </div>
    );
};

export default TermsAndConditionsCreateScreen;
