// import mongoose from "mongoose";
// // Define the interface for the unit information



export interface IInventory {
    _id:mongoose.Schema.Types.ObjectId;
    name: string;
    company: mongoose.Schema.Types.ObjectId;
    mobile: string;
    project: string;
    inventory: string;
    bhk: string;
    type: string;
    email:string;
    expected_rent:string;
    demand?: string;
    available_date?: Date;
    deal_closing_date?: Date;
    closing_amount?: string;
    expVisitTime?: string;
    landing_amount?:string;
    tenant?: string;
    status: string;
    facing?: string;
    area?: string;
    dimension?: string;
    inventoryType?: string;
    amount?: string;
    purpose?: string;
    registry?: string;
    location?: string;
    landing: string;
    tenant_mobile_no?: string;
    tower_no: string;
    unit_no: string;
    createAt: Date;
    updateAt: Date;
    parking?: string;
    parking_type?: string;
    front?: string;
    height?: string;
    createdBy: mongoose.Schema.Types.ObjectId;
    remarks: {
        type: mongoose.Schema.Types.ObjectId
    }[],  
}


import mongoose from "mongoose";

export interface IInventoryField {
    _id:mongoose.Schema.Types.ObjectId,
    fields:{
        name:string,
        header:string,
        type_:string,
        dropdown:string[],
        multiDropdown:boolean,
        show:string,
        validations:{
            required_:boolean,
            email:boolean,
            phone:boolean,
            customFunc:string
        },
        filter:boolean
    }[],
    remarks:{
        type:mongoose.Schema.Types.ObjectId
    }[],
    user:mongoose.Schema.Types.ObjectId,
    company:mongoose.Schema.Types.ObjectId,
    createAt:Date,
    updateAt:Date,
}
