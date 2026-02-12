import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FaWindowClose } from 'react-icons/fa';
import { MdClose } from 'react-icons/md';

import { useC_LeadMutation } from './../../app/_api_query/Leads/leads.api';
import { useDispatch_ } from "./../../store";
import { loader } from "./../_api_query/store";
import axios from "axios";
import { toast } from "react-toastify";

export default function LeadForm({
    setLeadForm,
    leadFormData,
    setLeadFormData
}: any) {
    const {
        control,
        handleSubmit,
        formState: { errors },
        setValue
    } = useForm();

    const dispatch = useDispatch_();
    const [C_Lead] = useC_LeadMutation();
    const [urlData, setUrl] = useState<any>("");
    const [imageData, setImageData] = useState<any>("");

    const submit = async (data: any) => {
        try {
            dispatch(loader(true));

            const submitData = leadFormData
                ? { ...leadFormData, ...data }
                : data;

            await C_Lead(submitData).unwrap();

            toast.success(leadFormData
                ? "Lead updated successfully"
                : "Lead created successfully"
            );

            // Reset form and close
            setLeadForm(false);
            setLeadFormData(null);
            dispatch(loader(false));
        } catch (error) {
            dispatch(loader(false));
            setLeadForm(false);
            setLeadFormData(null);
            toast.error("Failed to process lead");
        }
    };

    useEffect(() => {
        if (leadFormData) {
            // Populate form with existing data
            const fields = [
                "name", "email", "phone",
                "address", "source"
            ];
            fields.forEach(field =>
                setValue(field, leadFormData[field] || '')
            );
        }
    }, [leadFormData, setValue]);

    // Render input field with consistent styling
    const renderInputField = (
        name: string,
        label: string,
        rules?: any
    ) => (
        <div className="mb-4">
            <label
                htmlFor={name}
                className="block text-sm font-medium text-gray-700 mb-2"
            >
                {label}
            </label>
            <Controller
                control={control}
                name={name}
                rules={rules}
                render={({ field: { onChange, value } }) => (
                    <>
                        <input
                            id={name}
                            value={value || ''}
                            onChange={onChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                                       focus:outline-none focus:ring-2 focus:ring-[#004aad] 
                                       transition-all duration-300"
                        />
                        {errors[name] && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors[name]?.message as string}
                            </p>
                        )}
                    </>
                )}
            />
        </div>
    );

    return (
        <div 
            className="fixed inset-0 bg-black/30 z-50 flex justify-center items-center overflow-y-auto py-4"
            onClick={() => {
                setLeadForm(false);
                setLeadFormData(null);
            }}
        >
            <div 
                className="bg-white rounded-xl p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button 
                    className="absolute top-2 right-2 bg-[#004aad] p-2 rounded-full 
                               hover:bg-[#003a8d] transition-colors"
                    onClick={() => {
                        setLeadForm(false);
                        setLeadFormData(null);
                    }}
                >
                    <MdClose size={20} color="White" />
                </button>
    
                <h2 className="text-center text-xl font-bold mb-4">
                    {leadFormData ? 'Edit Lead' : 'Add Lead'}
                </h2>
    
                <form onSubmit={handleSubmit(submit)} className="space-y-3">
                    {renderInputField('name', 'Name', { 
                        required: "Name is required" 
                    })}
                    
                    {renderInputField('email', 'Email')}
                    
                    {renderInputField('phone', 'Phone', {
                        required: "Phone number is required",
                        validate: (v: string) => {
                            if (String(v).length !== 10) {
                                return "Phone number must be 10 digits";
                            }
                            if (!/^\d+$/.test(v)) {
                                return "Phone number must be numeric";
                            }
                            return true;
                        }
                    })}
                    
                    {renderInputField('address', 'Address')}
                    
                    {renderInputField('source', 'Source')}
    
                    <button 
                        type="submit"
                        className="w-full bg-[#004aad] text-white py-3 rounded-lg 
                                   hover:bg-[#003a8d] transition-colors 
                                   font-semibold text-base mt-4"
                    >
                        Submit
                    </button>
                </form>
            </div>
        </div>
    )
}