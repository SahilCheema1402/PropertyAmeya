"use client"
import React from "react";
import { useForm, Controller } from 'react-hook-form';
import { useDispatch_, useSelector_ } from "@/store";
import { useC_ExpensesMutation } from "@app/_api_query/Expense/expense.api";
import {loader} from '../_api_query/store'
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { MdClose } from 'react-icons/md';
export default function MasterForm({form_, type_, setPop }: any) {
    const { control, handleSubmit, setValue, formState: { errors }, reset } = useForm();
    const [expenseType, setExpenseType] = useState<string>('');
    const [categoryOptions, setCategoryOptions] = useState<any>([]);
    const [expenseAdd] = useC_ExpensesMutation();
    useEffect(() => {
        if ( form_&& type_ == "update") {
            setValue("amount", form_?.amount)
            setValue("category", form_?.category)
            setValue("notes", form_?.notes)
            setValue("paidTo", form_?.paidTo)
            setExpenseType(form_.expenseType)
        }
    }, [form_, type_]);

    useEffect(() => {
        if (expenseType === 'office') {
            setCategoryOptions([
                { label: 'Salary', value: 'salary' },
                { label: 'Marketing', value: 'marketing' },
                { label: 'Incentive', value: 'incentive' },
                { label: 'Stationery', value: 'stationery' },
                { label: 'Miscellaneous', value: 'miscellaneous' },
                { label: 'Mobile Recharge', value: 'mobile_recharge' },
                { label: 'Wifi Recharge', value: 'wifi_recharge' },
                { label: 'Office Expense', value: 'office_expense' },
                { label: 'Convence', value: 'convence' },
                { label: 'Electricity', value: 'electricity' },
                { label: 'Maintenance', value: 'maintenance' },
                { label: 'Other', value: 'Other' },
            ]);
        } else if (expenseType === 'personal') {
            setCategoryOptions([
                { label: 'Home Minister', value: 'home_minister' },
                { label: 'Aaryan', value: 'aaryan' },
                { label: 'Grossery', value: 'grossery' },
                { label: 'Vegetables & Fruits', value: 'vegetables&fruits' },
                { label: 'Maintenance', value: 'maintenance' },
                { label: 'Recharge', value: 'recharge' },
                { label: 'IGL', value: 'IGL' },
                { label: 'Cloths', value: 'cloths' },
                { label: 'Medical', value: 'medical' },
                { label: 'EMI', value: 'emi' },
                { label: 'Maid', value: 'maid' },
                { label: 'Vehicle', value: 'Vehicle' },
                { label: 'Gifts', value: 'gifts' },
                { label: 'Travels', value: 'travels' },
                { label: 'Investment', value: 'investment' },
                { label: 'LIC', value: 'LIC' },
                { label: 'Other', value: 'Other' },
            ]);
        }
    }, [expenseType]);
    const dispatch = useDispatch_();
    const onSubmit = async (data: any) => {
        data.expenseType = expenseType
        try {
            dispatch(loader(true));
            const res = await expenseAdd({
                data,
                _id: type_ == "update" ? form_._id : '',
                type_,
            }).unwrap()
            toast.success(" Expenses created Successfully");

            setExpenseType('')
            setPop(false)
            dispatch(loader(false));

        } catch (error: any) {
            dispatch(loader(false));
            setExpenseType('')
            setPop(false)
            toast.error((error as any)?.data?.message || "Expenses created Failed");
         
        };

    }


    return (

        <div onClick={(e) => { e.stopPropagation(); setPop(false) }} className="fixed inset-0 bg-black/30 z-50 flex justify-center items-center overflow-y-auto py-4">
            <div onClick={(e) => { e.stopPropagation() }} className="bg-white rounded-xl p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
                <div className="flex flex-row px-4 pb-4 justify-center items-baseline relative">
                    <p className="font-semibold text-xl">{"Expense Form"}</p>
                    <div className=" bg-[#004aad] absolute right-4 p-1 rounded-full" onClick={(e) => { e.stopPropagation(); setPop(false) }}>
                      <MdClose size={20} color="White" />
                    </div>
                </div>
                <div >
                    <div>
                        {/* Lead Type Dropdown */}
                        <p className="text-sm px-2 py-1">Expenses Type</p>
                        <div className="dark:placeholder:text-white placeholder:text-black dark:text-black w-full border-[#22232e] border-[1px] text-lg h-fit  rounded-lg ">
                           
                            <select
                                    value={expenseType}
                                    onChange={(e) => setExpenseType(e.target.value)}
                                    className="bg-gradient-to-r from-blue-500 to-blue-700 text-white bg-[#004aad] w-full  p-2 rounded-lg"
                                >
                                    <option value="office">Office Expenses</option>
                                    <option value="personal">Personal Expenses</option>
                                 
                                </select>
                        </div>

                        <div className="w-full">
                            <p className="text-sm px-2 py-1">Category</p>
                            <Controller
                                control={control}
                                name="category"
                                rules={{ required: 'Category is required' }}
                                render={({ field: { onChange, value } }) => (
                                    <div>
                                        <div className="dark:placeholder:text-white placeholder:text-black dark:text-black w-full border-[#22232e] border-[1px] text-lg h-fit  rounded-lg ">
                                            <select
                                                value={value}
                                                onChange={onChange}
                                                className="border p-2 w-full"
                                            >
                                                {categoryOptions.map((option: { value: any; label: any; }) => (
                                                    <option key={option.value} label={option.label} value={option.value} />
                                                ))}
                                            </select>

                                        </div>
                                                
                                    </div>


                                )}
                            />
                        </div>

                    </div>
                    <div>
                        <p className="text-sm px-2 py-1">Name</p>
                        <Controller
                            control={control}
                            name="paidTo"
                            render={({ field: { onChange, value } }) => (
                                <input
                                    value={value}
                                    onChange={(e) => onChange(e.target.value)}
                                    placeholder="Enter Name "
                                    className="dark:placeholder:text-white placeholder:text-black dark:text-black w-full border-[#22232e] border-[1px] py-3 text-lg h-fit px-6 rounded-lg "
                                />
                            )}
                        />
                    </div>
                    <div>
                        <p className="text-sm px-2 py-1">Amount</p>
                        <Controller
                            control={control}
                            name="amount"
                            rules={{ required: 'Amount is required' }}
                            render={({ field: { onChange, value } }) => (
                                <input
                                    value={value}
                                    onChange={(e) => onChange(e.target.value)}
                                    placeholder="Enter Amount "
                                   
                                  className="dark:placeholder:text-white placeholder:text-black dark:text-black w-full border-[#22232e] border-[1px] py-3 text-lg h-fit px-6 rounded-lg "
                                />
                            )}
                        />
                        {errors.amount && <p className="text-red-500"><>{errors.amount.message}</></p>}

                    </div>
                    <div>
                        <p className="text-sm px-2 py-1">Notes</p>
                        <Controller
                            control={control}
                            name="notes"
                            render={({ field: { onChange, value } }) => (
                                <input
                                    value={value}
                                    onChange={(e) => onChange(e.target.value)}
                                    placeholder="Enter Notes "
                                   className="dark:placeholder:text-white placeholder:text-black dark:text-black w-full border-[#22232e] border-[1px] py-3 text-lg h-fit px-6 rounded-lg "
                                />
                            )}
                        />
                    </div>
                    {/* Submit Button */}
                    <div className="bg-[#004aad] py-4 rounded-lg mt-4" onClick={handleSubmit(onSubmit)}>
                        <p className="text-lg font-semibold text-center text-white">Submit</p>
                    </div>
                </div>
            </div>
        </div>
    )
}