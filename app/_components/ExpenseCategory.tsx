"use client"
import React from "react";
import { useEffect, useState } from "react";
import { useD_ExpensesMutation } from "@app/_api_query/Expense/expense.api";
import { loader } from "./../_api_query/store";
import { MdClose } from 'react-icons/md';
import { useDispatch_ } from "@/store";
import { toast } from "react-toastify";
import { MdDelete } from '@node_modules/react-icons/md';
import { HiMiniPencil } from "react-icons/hi2";
export default function MasterForm({ setPop, setCategory, categoryData,setType_ ,setForm_}: any) {
 
    const [expenseDelete_] = useD_ExpensesMutation();
     const dispatch = useDispatch_();

    const formatCurrency = (amount: any) => {
        return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
    };
    const formatDate = (dateString: string | number | Date) => {
        const date = new Date(dateString);
        return date.toLocaleString("en-IN", {
            weekday: "long", // "Monday"
            year: "numeric", // "2025"
            month: "long", // "January"
            day: "numeric", // "11"
            hour: "2-digit", // "06"
            minute: "2-digit", // "41"
            second: "2-digit", // "19"
            hour12: true, // Show AM/PM
        });
    };
    const handleDeleteExpense = async (data:any) => {
        try {
            dispatch(loader(true));
            const res = await expenseDelete_(data).unwrap();
             toast.success(
                        "Expense Deleted successfully"
                        
                        );
                setCategory(false)
            dispatch(loader(false));

        } catch (error: any) {
            dispatch(loader(false));
            setCategory(false)
            toast.error(
                "Expense Deleted Failed"
                
                );
        }
    };

    return (

        <div onClick={(e) => { e.stopPropagation(); setCategory(false) }} className="fixed inset-0 bg-black/30 z-50 flex justify-center items-center overflow-y-auto py-4">
            <div onClick={(e) => { e.stopPropagation() }} className="bg-white rounded-xl p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
                <div className="flex flex-row px-4  justify-center items-baseline relative">
                    <p className="text-[#004aad] text-center text-2xl  font-extrabold uppercase">{categoryData[0]?.category}</p>
                    <div className=" bg-[#004aad] absolute right-2 p-1 rounded-full" onClick={(e) => { e.stopPropagation(); setCategory(false) }}>
                                            <MdClose size={20} color="White" />
                      
                    </div>
                </div>
                <div >
                    <div className="w-full  py-6">
                        {categoryData?.length === 0 ? (
                            <p className="text-center text-gray-500">No expenses found</p>
                        ) : (categoryData ?.sort((a: any, b: any) => new Date(b.createAt).getTime() - new Date(a.createAt).getTime())?.map((category: any) => (
                            <div className="flex flex-col bg-gray-100   mb-3">
                                <div className="w-full flex flex-row justify-end p-2 gap-2 items-center rounded-lg">
                                    <div className=" bg-[#004aad]  p-1 rounded-full" onClick={() => { setPop(true); setType_("update"); setCategory(false);setForm_(category)}}>
                                     <HiMiniPencil color="#fff"  />
                                    </div>
                                    <div className=" bg-[#004aad]   p-1 rounded-full" onClick={() => { handleDeleteExpense(category)}}>
                                     <MdDelete color="#fff" />
                                    </div>
                                </div>
                                <div key={category} className="w-full p-2  flex flex-row justify-between items-center rounded-lg  shadow-lg hover:shadow-xl transition-all">
                                    <div>
                                        {category?.paidTo && <p className="text-lg font-bold">{category?.paidTo}</p>}
                                        {category?.notes && <p className="text-sm text-gray-500">{category?.notes}</p>}
                                        <p className="text-sm text-gray-500">{formatDate(category?.createAt)}</p>
                                    </div>
                                    <p className="text-blue-500 text-lg">{formatCurrency(category?.amount)}</p>
                                </div>
                            </div>
                        )))}
                    </div>
                </div>
            </div>
        </div>
    )
}