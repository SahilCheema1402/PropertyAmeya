import mongoose, { Model, Schema, model, models } from "mongoose";
import { Inventory } from "./../../_const/const";
import { User, Company  } from "./../../_const/const";
import { IInventory } from "./../../_interface/inventory.interface";


const inventorySchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId()
    },
    name: { type: String, required: true },
    company: {
        type: Schema.Types.ObjectId,
        ref: Company.Name,
        required: [true, "Company Id is missing"]
    },
    email: { type: String, },
    mobile: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    project: { type: String, },
    bhk: { type: String, },
    type: { type: String, },
    demand: { type: String },
    available_date: { type: Date },
    expected_rent: { type: String },
    expVisitTime: { type: String },
    deal_closing_date: { type: Date },
    landing_amount:{type:String},
    tenant: { type: String },
    status: { type: String, },
    facing: { type: String },
    area: { type: String },
    closing_amount: { type: String },
    amount: { type: String },
    dimension: { type: String },
    purpose: { type: String },
    registry: { type: String },
    location: { type: String },
    landing: { type: String, },
    parking: { type: String },
    parking_type: { type: String },
    front: { type: String },  // Add front field
    height: { type: String },
    inventory:{
        type:String,
        required: true,

    },
    inventoryType: { type: String,required: true,},
    tenant_mobile_no: {
        type: String,
    },
    tower_no: { type: String, },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: User.Name,
        required: [true, "User Id is missing"]
    },
    unit_no: { type: String, },
    createAt: {
        type: Date,
    },
    updateAt: {
        type: Date,
 },
    remarks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: User.Name,
        required: [true, 'User ID is missing']
    }],
}, { timestamps: true });

export default models[Inventory.schemaName] as Model<IInventory> || model<IInventory>(Inventory.schemaName, inventorySchema);



