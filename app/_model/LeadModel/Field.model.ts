import mongoose, {Model, Schema, model, models} from "mongoose";
import {IField} from './../../_interface/leadField.interface';
import {User,Company,LeadField} from './../../_const/const';
const docSchema = new Schema<IField>({
    _id:{
        type:mongoose.Schema.Types.ObjectId,
        default:()=>new mongoose.Types.ObjectId()
    },
    fields:[{
        name:{
            type:String,
            required:[true,"Name for Backend Is missing"]
        },
        header:{
            type:String,
            required:[true,"Header Is missing"]
        },
        type_:{
            type:String,
            required:[true,"Type_ Is missing"]
        },
        show:{
            type:String,
            required:[true,"Show Is missing"]
        },
        dropdown:[{
            type:String,
        }],
        multiDropdown:Boolean,
        validations:{
            required_:{
                type:Boolean,
                default:false
            },
            email:{
                type:Boolean,
                default:false
            },
            phone:{
                type:Boolean,
                default:false
            },
            customFunc:String
        },
        filter:{
            type:Boolean,
            default:false
        }
    }],
    remarks:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:User.Name,
        required:[true,'User ID is missing']
    }],
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:User.Name,
        required:[true,'User ID is missing']
    },
    company:{
        type:mongoose.Schema.Types.ObjectId,
        ref:Company.Name,
        required:[true,'User ID is missing']
    },
    createAt:{
        type:Date,
        default:new Date()
    },
    updateAt:{
        type:Date,
        default:new Date()
    }
},{strict:true});
export default models[LeadField.schemaName] as Model<IField> || model<IField>(LeadField.schemaName, docSchema);