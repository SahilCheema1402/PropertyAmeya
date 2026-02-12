import mongoose from "mongoose";

export interface IExpense {
    _id:mongoose.Schema.Types.ObjectId,
    expenseType:string,
    amount:string,
    paidTo:string,
    category:string,
    paidBy:string,
    notes:string,
    createdBy:mongoose.Schema.Types.ObjectId,
    createAt:Date,
    updateAt:Date,
}