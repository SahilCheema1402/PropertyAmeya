import mongoose, { Model, Schema, model, models } from "mongoose";
import { Project } from "@app/_const/const";
import { User, Company } from "@app/_const/const";
import { IProject } from "@app/_interface/project.interface";
import { string } from "@node_modules/zod";

const projectSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId()
    },
    project_name: { type: String, required: true },
    company: {
        type: Schema.Types.ObjectId,
        ref: Company.Name,
        required: [true, "Company Id is missing"]
    },
    client_name: { type: String, },
    product: { type: String, },
    size: { type: String, },
    floor: { type: String, },
    payment_plan: { type: String, },
    BSP: { type: String },
    discount: { type: String },
    view_plc: { type: String },
    conner_plc: { type: String },
    floor_plc: { type: String },
    edc: { type: String, },
    idc: { type: String },
    itc: { type: String },
    ffc: { type: String },
    note1:{ type: String },
    note2:{ type: String },
    note3:{ type: String },
    note4:{ type: String },
    gst:{ type: String },
    other_possession_charges:{ type: String },
    other_additional_charges:{ type: String },
    leastRent: { type: String },
    power_backup_qty: { type: String },
    power_backup_price: { type: String },
    on_booking: { type: String },
    within_thirty__Days: { type: String, },
    on_possession: { type: String },
    others:[{
        name:String,
        value:String
    }],
    createAt: {type: Date},
    updateAt: {type: Date},
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: User.Name,
        required: [true, "User Id is missing"]
    },

}, { timestamps: true });

export default models[Project.schemaName] as Model<IProject> || model<IProject>(Project.schemaName, projectSchema);



