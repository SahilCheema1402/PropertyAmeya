"use client"
import React from "react";
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useDispatch_, useSelector_ } from "@/store";
import { useEffect, useState } from "react";
import {loader} from '../_api_query/store'
import { toast } from "react-toastify";
import { useC_ProjectMutation } from "@app/_api_query/Project/project.api";
import { FaPlus } from 'react-icons/fa'
import { MdClose } from 'react-icons/md';
export default function MasterForm({ projectFormData, type_, setProjectFormData, setPop,refetch }: any) {

    const { control, register, handleSubmit, setValue, formState: { errors }, reset } = useForm({
        defaultValues: {
            project_name: "",
            client_name: "",
            size: "",
            product: "",
            floor: "",
            payment_plan: "",
            BSP: "",
            discount: "",
            view_plc: "",
            conner_plc: "",
            floor_plc: "",
            edc: "",
            idc: "",
            gst:"",
            itc: "",
            ffc: "",
            note1: "",
            note2: "",
            note3: "",
            note4: "",
            leastRent: "",
            power_backup_qty: "",
            power_backup_price: "",
            on_booking: "",
            within_thirty__Days: "",
            on_possession: "",
            other_possession_charges:"",
            other_additional_charges:"",
            others: [{ name: "", value: "" }],
        },
    });
    useEffect(() => {

        if (projectFormData && type_ == "update") {
            setValue("project_name", projectFormData.project_name)
            setValue("client_name", projectFormData?.client_name)
            setValue("size", projectFormData.size)
            setValue("product", projectFormData.product)
            setValue("floor", projectFormData.floor)
            setValue("payment_plan", projectFormData.payment_plan)
            setValue("BSP", projectFormData.BSP)
            setValue("discount", projectFormData.discount)
            setValue("view_plc", projectFormData.view_plc)
            setValue("conner_plc", projectFormData.conner_plc)
            setValue("floor_plc", projectFormData.floor_plc)
            setValue("edc", projectFormData.edc)
            setValue("idc", projectFormData?.idc)
            setValue("gst", projectFormData.gst)
            setValue("itc", projectFormData.itc)
            setValue("ffc", projectFormData.ffc)
            setValue("note1", projectFormData.note1)
            setValue("note2", projectFormData.note2)
            setValue("note3", projectFormData.note3)
            setValue("note4", projectFormData.note4)
            setValue("leastRent", projectFormData.leastRent)
            setValue("power_backup_qty", projectFormData.power_backup_qty)
            setValue("power_backup_price", projectFormData.power_backup_price)
            setValue("on_booking", projectFormData.on_booking)
            setValue("within_thirty__Days", projectFormData.within_thirty__Days)
            setValue("on_possession", projectFormData.on_possession)
            setValue("other_possession_charges", projectFormData.other_possession_charges)
            setValue("other_additional_charges", projectFormData.other_additional_charges)

        }
    }, [projectFormData, type_]);

    const [role_, setRole] = useState<any>(1)
    const dispatch = useDispatch_();
    const [C_Project] = useC_ProjectMutation();

    const onSubmit = async (data: any) => {
        try {
            dispatch(loader(true));
            const res = await C_Project({
                data: data, // Pass the determined payload
                type_: type_,
                _id:type_ === "update"?projectFormData?._id:""
            }).unwrap();
            dispatch(loader(false));
            reset()
            setPop(false)
            refetch()
            toast.success(" Project created Successfully");

        } catch (error: any) {
            dispatch(loader(false));
            reset()
            refetch()
            setPop(false)
            toast.error((error as any)?.data?.message || " Project create Failed");
         
        };

    }


  useEffect(() => {
    async function roleFetch() {
      const role = localStorage.getItem('role');
      setRole(role);
    }
    roleFetch();
  }, []);
    return (

        <div onClick={(e) => { e.stopPropagation(); }}      className="fixed inset-0 bg-black/30 z-50 flex justify-center items-center overflow-y-auto py-4">
            <div onClick={(e) => { e.stopPropagation() }}     className="bg-white rounded-xl p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
                <div className="flex flex-row px-4 pb-4 justify-center items-baseline relative">
                    <p className="font-semibold p-xl">Project {type_} Form</p>
                    <div className=" bg-[#004aad] absolute right-4 p-1 rounded-full" onClick={(e) => { e.stopPropagation(); setPop(false); }}>
                        {/* <Icon name="window-close" size={16} color="white" /> */}
                                            <MdClose size={20} color="White" />
                        
                    </div>
                </div>
                <div>
                    <div className="">
                        {/* Common Fields */}
                        <div>
                            <p className="p-sm px-2 py-1">Project Name</p>
                            <Controller
                                control={control}
                                name="project_name"
                                render={({ field: { onChange, value } }) => (
                                    <input
                                        value={value}
                                        type="text"
                                        onChange={(e) => onChange(e.target.value)}
                                        placeholder="Enter Your Project Name"
                                       className="dark:placeholder:p-white placeholder:p-black dark:p-black w-full border-[#22232e] border-[1px] py-3 p-lg h-fit px-6 rounded-lg "
                                    />
                                )}
                            />
                        </div>

                        <div>
                            <p className="p-sm px-2 py-1">Client Name</p>
                            <Controller
                                control={control}
                                name="client_name"
                                render={({ field: { onChange, value } }) => (
                                    <input
                                        value={value}
                                        onChange={(e) => onChange(e.target.value)}
                                        placeholder="Enter Your Client Name"
                                    className="dark:placeholder:p-white placeholder:p-black dark:p-black w-full border-[#22232e] border-[1px] py-3 p-lg h-fit px-6 rounded-lg "
                                    />
                                )}
                            />
                        </div>
                        <div>
                            <p className="p-sm px-2 py-1">Product</p>
                            <Controller
                                control={control}
                                name="product"
                                render={({ field: { onChange, value } }) => (
                                  <input
                                        value={value}
                                        onChange={(e) => onChange(e.target.value)}
                                        placeholder="Enter Product"
                                   className="dark:placeholder:p-white placeholder:p-black dark:p-black w-full border-[#22232e] border-[1px] py-3 p-lg h-fit px-6 rounded-lg "
                                    />
                                )}
                            />
                        </div>
                        <div>
                            <p className="p-sm px-2 py-1">Size(sqft)</p>
                            <div>
                                <Controller
                                    control={control}
                                    name="size"
                                    render={({ field: { onChange, value } }) => (
                                      <input
                                            value={value}
                                            onChange={(e) => onChange(e.target.value)}
                                            placeholder="Enter Your Size"
                                        className="dark:placeholder:p-white placeholder:p-black dark:p-black w-full border-[#22232e] border-[1px] py-3 p-lg h-fit px-6 rounded-lg "
                                        />
                                    )}
                                />
                            </div>
                        </div>
                        <div>
                            <p className="p-sm px-2 py-1">Floor</p>
                            <div>
                                <Controller
                                    control={control}
                                    name="floor"
                                    render={({ field: { onChange, value } }) => (
                                      <input
                                            value={value}
                                            onChange={(e) => onChange(e.target.value)}
                                            placeholder="Enter Your Floor"
                                           className="dark:placeholder:p-white placeholder:p-black dark:p-black w-full border-[#22232e] border-[1px] py-3 p-lg h-fit px-6 rounded-lg "
                                        />
                                    )}
                                />
                            </div>
                        </div>
                        <div>
                            <p className="p-sm px-2 py-1">Payment Plan</p>
                            <Controller
                                control={control}
                                name="payment_plan"
                                render={({ field: { onChange, value } }) => (
                                  <input
                                        value={value}
                                        onChange={(e) => onChange(e.target.value)}
                                        placeholder="Enter Payment Plan"
                                    className="dark:placeholder:p-white placeholder:p-black dark:p-black w-full border-[#22232e] border-[1px] py-3 p-lg h-fit px-6 rounded-lg "
                                    />
                                )}
                            />
                        </div>
                        <div>
                            <p className="p-sm px-2 py-1">Basic Sell Price</p>
                            <Controller
                                control={control}
                                name="BSP"
                                render={({ field: { onChange, value } }) => (
                                  <input
                                        value={value}
                                        onChange={(e) => onChange(e.target.value)}
                                        placeholder="Enter Basic Sell Price"
                                    className="dark:placeholder:p-white placeholder:p-black dark:p-black w-full border-[#22232e] border-[1px] py-3 p-lg h-fit px-6 rounded-lg "
                                    />
                                )}
                            />
                        </div>
                        <div>
                            <p className="p-sm px-2 py-1">Discount</p>
                            <Controller
                                control={control}
                                name="discount"
                                render={({ field: { onChange, value } }) => (
                                  <input
                                        value={value}
                                        onChange={(e) => onChange(e.target.value)}
                                        placeholder="Enter discount"
                                    
                                        className="dark:placeholder:p-white placeholder:p-black dark:p-black w-full border-[#22232e] border-[1px] py-3 p-lg h-fit px-6 rounded-lg"
                                    />
                                )}
                            />
                        </div>
                        <div>
                            <p className="p-sm px-2 py-1">View PLC</p>
                            <Controller
                                control={control}
                                name="view_plc"
                                render={({ field: { onChange, value } }) => (
                                  <input
                                        value={value}
                                        onChange={(e) => onChange(e.target.value)}
                                        placeholder="Enter View PLC"
                                     
                                        className="dark:placeholder:p-white placeholder:p-black dark:p-black w-full border-[#22232e] border-[1px] py-3 p-lg h-fit px-6 rounded-lg"
                                    />
                                )}
                            />
                        </div>
                        <div>
                            <p className="p-sm px-2 py-1">Conner PLC</p>
                            <Controller
                                control={control}
                                name="conner_plc"
                                render={({ field: { onChange, value } }) => (
                                  <input
                                        value={value}
                                        onChange={(e) => onChange(e.target.value)}
                                        placeholder="Enter Conner PLC"
                                      className="dark:placeholder:p-white placeholder:p-black dark:p-black w-full border-[#22232e] border-[1px] py-3 p-lg h-fit px-6 rounded-lg "
                                    />
                                )}
                            />
                        </div>
                        <div>
                            <p className="p-sm px-2 py-1">Floor PLC</p>
                            <Controller
                                control={control}
                                name="floor_plc"
                                render={({ field: { onChange, value } }) => (
                                  <input
                                        value={value}
                                        onChange={(e) => onChange(e.target.value)}
                                        placeholder="Enter Floor PLC"
                                     className="dark:placeholder:p-white placeholder:p-black dark:p-black w-full border-[#22232e] border-[1px] py-3 p-lg h-fit px-6 rounded-lg "
                                    />
                                )}
                            />
                        </div>
                        <div>
                            <p className="p-sm px-2 py-1">EDC</p>
                            <Controller
                                control={control}
                                name="edc"
                                render={({ field: { onChange, value } }) => (
                                  <input
                                        value={value}
                                        onChange={(e) => onChange(e.target.value)}
                                        placeholder="Enter EDC"
                                   className="dark:placeholder:p-white placeholder:p-black dark:p-black w-full border-[#22232e] border-[1px] py-3 p-lg h-fit px-6 rounded-lg "
                                    />
                                )}
                            />
                        </div>


                        <div className="flex flex-col ">
                            
                            <div>
                                <p className="p-sm px-2 py-1">IDC</p>
                                <Controller
                                    control={control}
                                    name="idc"
                                    render={({ field: { onChange, value } }) => (
                                      <input
                                            value={value}
                                            onChange={(e) => onChange(e.target.value)}
                                            placeholder="Enter IDC"
                                            className="dark:placeholder:p-white placeholder:p-black dark:p-black w-full border-[#22232e] border-[1px] py-3 p-lg h-fit px-6 rounded-lg"
                                        />
                                    )}
                                />
                            </div>
                            <div>
                                <p className="p-sm px-2 py-1">FFC</p>
                                <Controller
                                    control={control}
                                    name="ffc"
                                    render={({ field: { onChange, value } }) => (
                                      <input
                                            value={value}
                                            onChange={(e) => onChange(e.target.value)}
                                            placeholder="Enter FFC"
                                            className="dark:placeholder:p-white placeholder:p-black dark:p-black w-full border-[#22232e] border-[1px] py-3 p-lg h-fit px-6 rounded-lg"
                                        />
                                    )}

                                />
                            </div>
                            <div>
                                <p className="p-sm px-2 py-1">Other Additional Charges</p>
                                <Controller
                                    control={control}
                                    name="other_additional_charges"
                                    render={({ field: { onChange, value } }) => (
                                      <input
                                            value={value}
                                            onChange={(e) => onChange(e.target.value)}
                                            placeholder="Enter Other Additional Charges"
                                            className="dark:placeholder:p-white placeholder:p-black dark:p-black w-full border-[#22232e] border-[1px] py-3 p-lg h-fit px-6 rounded-lg"
                                        />
                                    )}
                                />
                            </div>
                         
                        </div>
                        <div>
                            <p className="p-sm px-2 py-1">Least Rent</p>
                            <Controller
                                control={control}
                                name="leastRent"
                                render={({ field: { onChange, value } }) => (
                                  <input
                                        value={value}
                                        onChange={(e) => onChange(e.target.value)}
                                        placeholder="Enter Least Rent"
                                        className="dark:placeholder:p-white placeholder:p-black dark:p-black w-full border-[#22232e] border-[1px] py-3 p-lg h-fit px-6 rounded-lg"
                                    />
                                )}
                            />
                        </div>
                       
                        <div>
                            <p className="p-sm px-2 py-1">Other Possession Charges</p>
                            <Controller
                                control={control}
                                name="other_possession_charges"
                                render={({ field: { onChange, value } }) => (
                                  <input
                                        value={value}
                                        onChange={(e) => onChange(e.target.value)}
                                        placeholder="Enter Other Possession Charges "
                                        className="dark:placeholder:p-white placeholder:p-black dark:p-black w-full border-[#22232e] border-[1px] py-3 p-lg h-fit px-6 rounded-lg"
                                    />
                                )}
                            />
                        </div>
                        <div>
                            <p className="p-sm px-2 py-1">GST(%)</p>
                            <Controller
                                control={control}
                                name="gst"
                                render={({ field: { onChange, value } }) => (
                                  <input
                                        value={value}
                                        onChange={(e) => onChange(e.target.value)}
                                        placeholder="Enter GST"
                                        className="dark:placeholder:p-white placeholder:p-black dark:p-black w-full border-[#22232e] border-[1px] py-3 p-lg h-fit px-6 rounded-lg"
                                    />
                                )}
                            />
                        </div>
                        <div>
                            <p className="p-sm px-2 py-1">Note 1</p>
                            <Controller
                                control={control}
                                name="note1"
                                render={({ field: { onChange, value } }) => (
                                  <input
                                        value={value}
                                        onChange={(e) => onChange(e.target.value)}
                                        placeholder="Enter Note 1"
                                        className="dark:placeholder:p-white placeholder:p-black dark:p-black w-full border-[#22232e] border-[1px] py-3 p-lg h-fit px-6 rounded-lg"
                                    />
                                )}
                            />
                        </div>
                        <div>
                            <p className="p-sm px-2 py-1">Note 2</p>
                            <Controller
                                control={control}
                                name="note2"
                                render={({ field: { onChange, value } }) => (
                                  <input
                                        value={value}
                                        onChange={(e) => onChange(e.target.value)}
                                        placeholder="Enter Note 2"
                                        className="dark:placeholder:p-white placeholder:p-black dark:p-black w-full border-[#22232e] border-[1px] py-3 p-lg h-fit px-6 rounded-lg"
                                    />
                                )}
                            />
                        </div>
                        <div>
                            <p className="p-sm px-2 py-1">Note 3</p>
                            <Controller
                                control={control}
                                name="note3"
                                render={({ field: { onChange, value } }) => (
                                  <input
                                        value={value}
                                        onChange={(e) => onChange(e.target.value)}
                                        placeholder="Enter Note 3"
                                        className="dark:placeholder:p-white placeholder:p-black dark:p-black w-full border-[#22232e] border-[1px] py-3 p-lg h-fit px-6 rounded-lg"
                                    />
                                )}
                            />
                        </div>
                        <div>
                            <p className="p-sm px-2 py-1">Note 4</p>
                            <Controller
                                control={control}
                                name="note4"
                                render={({ field: { onChange, value } }) => (
                                  <input
                                        value={value}
                                        onChange={(e) => onChange(e.target.value)}
                                        placeholder="Enter Note 4"
                                        className="dark:placeholder:p-white placeholder:p-black dark:p-black w-full border-[#22232e] border-[1px] py-3 p-lg h-fit px-6 rounded-lg"
                                    />
                                )}
                            />
                        </div>

                        <div>
                            <p className="p-sm px-2 py-1">Power Backup Quantity(KVA)</p>
                            <Controller
                                control={control}
                                name="power_backup_qty"
                                render={({ field: { onChange, value } }) => (
                                  <input
                                        value={value}
                                        onChange={(e) => onChange(e.target.value)}
                                        placeholder="Enter Power Backup Quantity"
                                        className="dark:placeholder:p-white placeholder:p-black dark:p-black w-full border-[#22232e] border-[1px] py-3 p-lg h-fit px-6 rounded-lg"
                                    />
                                )}
                            />
                        </div>

                        <div>
                            <p className="p-sm px-2 py-1">Power Backup Price</p>
                            <Controller
                                control={control}
                                name="power_backup_price"
                                render={({ field: { onChange, value } }) => (
                                  <input
                                        value={value}
                                        onChange={(e) => onChange(e.target.value)}
                                        placeholder="Enter power_backup_price"
                                        className="dark:placeholder:p-white placeholder:p-black dark:p-black w-full border-[#22232e] border-[1px] py-3 p-lg h-fit px-6 rounded-lg"
                                    />
                                )}
                            />
                        </div>


                        <div>
                            <p className="p-sm px-2 py-1">On Booking(%)</p>
                            <Controller
                                control={control}
                                name="on_booking"
                                render={({ field: { onChange, value } }) => (
                                    <input
                                        value={value}
                                        onChange={(e) => onChange(e.target.value)}
                                        placeholder="Enter on Booking"
                                        className="dark:placeholder:p-white placeholder:p-black dark:p-black w-full border-[#22232e] border-[1px] py-3 p-lg h-fit px-6 rounded-lg"
                                    />
                                )}
                            />
                        </div>

                        <div>
                            <p className="p-sm px-2 py-1">Within 30 days(%)</p>
                            <Controller
                                control={control}
                                name="within_thirty__Days"
                                render={({ field: { onChange, value } }) => (
                                    <input
                                        value={value}
                                        onChange={(e) => onChange(e.target.value)}
                                        placeholder="Enter within 30 days"
                                        className="dark:placeholder:p-white placeholder:p-black dark:p-black w-full border-[#22232e] border-[1px] py-3 p-lg h-fit px-6 rounded-lg"
                                    />
                                )}
                            />
                        </div>
                        <div>
                            <p className="p-sm px-2 py-1">On Possession(%)</p>
                            <Controller
                                control={control}
                                name="on_possession"
                                render={({ field: { onChange, value } }) => (
                                    <input
                                        value={value}
                                        onChange={(e) => onChange(e.target.value)}
                                        placeholder="Enter On Possession"
                                        className="dark:placeholder:p-white placeholder:p-black dark:p-black w-full border-[#22232e] border-[1px] py-3 p-lg h-fit px-6 rounded-lg"
                                    />
                                )}
                            />
                        </div>
                        {/* <div>
                            <p className="p-base font-semibold px-2 py-1">Others</p>
                            {fields.map((item, index) => (
                                <div className="flex flex-row items-center justify-between my-1 " key={item.id}>
                                    <div className="flex-1 mr-4">
                                        <p className="p-sm font-semibold">Name</p>
                                        <Controller
                                            control={control}
                                            name={`others.${index}.name`}
                                            render={({ field: { onChange, value } }) => (
                                              <input
                                                    value={value}
                                                    onChangep={onChange}
                                                    placeholder="Enter Name"
                                                    placeholderpColor={isDarkTheme ? "white" : "gray"}
                                                    className="border border-gray-300 rounded-lg p-2 dark:p-white"
                                                />
                                            )}
                                        />
                                    </div>

                                    <div className="flex-1 mr-4">
                                        <p className="p-sm font-semibold">Value</p>
                                        <Controller
                                            control={control}
                                            name={`others.${index}.value`}
                                            render={({ field: { onChange, value } }) => (
                                              <input
                                                    value={value}
                                                    onChangep={onChange}
                                                    placeholder="Enter Value"
                                                    placeholderpColor={isDarkTheme ? "white" : "gray"}
                                                    className="border border-gray-300 rounded-lg p-2 dark:p-white"
                                                />
                                            )}
                                        />
                                    </div>

                                    <div
                                        onPress={() => (index === 0 ? append({ name: "", value: "" }) : remove(index))}
                                        className={`p-2 rounded-full ${index === 0 ? "bg-blue-500 mt-4" : "bg-red-500 mt-4"}`}
                                    >
                                        <Icon name={index === 0 ? "plus" : "delete"} size={20} color="#fff" />
                                    </div>
                                </div>
                            ))}
                        </div> */}

                        {/* Submit Button */}
                        {(type_ === "add" || ((role_ == 1 || role_ == 2) && type_ === "update")) && <div className="bg-[#004aad] py-4 rounded-lg mt-4" onClick={handleSubmit(onSubmit)}>
                            <p className="text-lg font-semibold text-center text-white">Submit</p>
                        </div>}
                    </div>

                </div>
            </div>
        </div>

    )
}