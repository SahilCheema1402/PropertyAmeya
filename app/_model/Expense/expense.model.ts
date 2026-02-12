import mongoose, { Model, Schema, model, models } from "mongoose";
import { User,Expense } from "@app/_const/const";
import { IExpense } from "@app/_interface/expense.interface";
const expenseSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId()
    },
    expenseType: {
        type: String,
        required: true,
        enum: ['office', 'personal'],
    },
    category: {
        type: String,
        required: true,
    },
    amount: {
        type: String,
        required: true, // Expense amount
    },
    paidTo: {
        type: String,
        default: '',
    },
 
    // Who paid for the expense (e.g., individual, company)
    paidBy: {
        type: String,
        default: '',
    },

    notes: {
        type: String,
        default: null,
    },
    createAt: { type: Date },
    updateAt: { type: Date },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: User.Name,
        required: [true, "User Id is missing"]
    },

});

export default models[Expense.schemaName] as Model<IExpense> || model<IExpense>(Expense.schemaName, expenseSchema);
//  category: {
//     type: String,
//     required: true,
//     enum: [
//       // Office categories
//       'Salary', 'Incentive', 'Stationary', 'Office Expense',
//       'Mobile Recharge', 'Electricity', 'Maintenance', 'Other Expense',
//       // Personal categories
//       'EMI', 'Electricity Recharge', 'Maintenance', 'Maid',
//       'IGC', 'Vehicle', 'Gifts',
//     ],
//   },