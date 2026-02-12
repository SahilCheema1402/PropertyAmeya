import DB from '@app/_Database/db';
import HandleResponse from '@app/_utils/response';
import expenseModel from '@app/_model/Expense/expense.model';
import mongoose, { FilterQuery, PipelineStage, Schema } from 'mongoose';

//Expense create and update
export async function POST(req: Request) {
    try {
        DB();
        const body = await req.json();
        const user: any = JSON.parse(req.headers.get('user') as string);
        if (!body.data) {
            return HandleResponse({ type: "BAD_REQUEST", message: "Body Data is Missing!" })
        }
        if (body.type_ === 'add') {
            const Expense = new expenseModel({
                ...body.data,
                createAt: new Date(),
                createdBy: user._id,
            })
            await Expense.save();
            return HandleResponse({ type: "SUCCESS", message: "Inventory Created Successfully" })
        }
        if (body.type_ === 'update') {
            if (body._id !== 'undefined' && body._id) {
                const ExpenseData = await expenseModel.findByIdAndUpdate(
                    new mongoose.Types.ObjectId(body._id),
                    {
                        $set: body.data, updateAt: new Date(),
                    },
                    { new: true }
                );

                return HandleResponse({ type: "SUCCESS", message: "Expenses Updated Successfully" })
            }
            else {
                return HandleResponse({
                    type: "BAD_REQUEST",
                    message: `id is required.`,
                })
            }
        }
    } catch (error: any) {
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message
        })
    }
}

// Generate an array for the last 6 months
const fillMissingMonths = () => {
    const months = [];
    const currentDate = new Date();
    for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        months.push({ year: date.getFullYear(), month: date.getMonth() + 1, totalAmount: 0 });
    }
    return months;
};

// Helper function to parse custom date range
const parseCustomDateRange = (search: string) => {
    const dates = search.split('_');
    if (dates.length !== 2) {
        throw new Error('Invalid date range format. Use YYYY-MM-DD_YYYY-MM-DD');
    }
    
    const fromDate = new Date(dates[0]);
    const toDate = new Date(dates[1]);
    
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        throw new Error('Invalid date format. Use YYYY-MM-DD');
    }
    
    if (fromDate > toDate) {
        throw new Error('From date cannot be later than to date');
    }
    
    // Set time to start and end of day
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);
    
    return { fromDate, toDate };
};

export async function GET(req: Request) {
    try {
        await DB(); 
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "Today";
  
        // Define date range for the query
        let startDate: Date;
        let endDate: Date;
        let isCustomRange = false;
  
        const currentDate = new Date();
        const lastSixMonthsStartDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 5, 1, 0, 0, 0);
        const lastSixMonthsEndDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);  
        
        // Handle different search parameters
        if (search === "Today") {
            startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0);
            endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59);
        } else if (search === "Monthly") {
            startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1, 0, 0, 0);
            endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
        } else if (search === "Half-yearly") {
            const startMonth = currentDate.getMonth() - 5;
            const startYear = startMonth < 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
            startDate = new Date(startYear, (startMonth + 12) % 12, 1, 0, 0, 0);
            endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
        } else if (search.includes('_')) {
            // Custom date range format: YYYY-MM-DD_YYYY-MM-DD
            try {
                const { fromDate, toDate } = parseCustomDateRange(search);
                startDate = fromDate;
                endDate = toDate;
                isCustomRange = true;
            } catch (error: any) {
                return HandleResponse({
                    type: "BAD_REQUEST",
                    message: error.message,
                });
            }
        } else {
            return HandleResponse({
                type: "BAD_REQUEST",
                message: "Invalid search parameter. Use Today, Monthly, Half-yearly, or custom date range (YYYY-MM-DD_YYYY-MM-DD).",
            });
        }
  
        // Query expenses within the date range
        const expenses = await expenseModel.aggregate([
            {
                $match: {
                    createAt: { $gte: startDate, $lte: endDate },
                },
            },
            {
                $group: {
                    _id: { expenseType: "$expenseType", category: "$category" },
                    totalAmount: { $sum: { $toDouble: "$amount" } },
                },
            },
            {
                $project: {
                    expenseType: "$_id.expenseType",
                    category: "$_id.category",
                    totalAmount: 1,
                    _id: 0,
                },
            },
        ]);

        const expensesExpense = await expenseModel.aggregate([
            {
                $match: {
                    createAt: { $gte: startDate, $lte: endDate },
                },
            },
        ]);

        // Handle monthly breakdown based on range type
        let monthlyExpenses = [];

        if (isCustomRange) {
            // For custom range, create month-wise breakdown within that range
            const customRangeExpenses = await expenseModel.aggregate([
                {
                    $match: {
                        createAt: { $gte: startDate, $lte: endDate },
                    },
                },
                {
                    $group: {
                        _id: {
                            year: { $year: "$createAt" },
                            month: { $month: "$createAt" },
                        },
                        totalAmount: { $sum: { $toDouble: "$amount" } },
                    },
                },
                {
                    $sort: {
                        "_id.year": 1,
                        "_id.month": 1,
                    },
                },
                {
                    $project: {
                        year: "$_id.year",
                        month: "$_id.month",
                        totalAmount: 1,
                        _id: 0,
                    },
                },
            ]);

            // Format for custom range - use shorter month names
            monthlyExpenses = customRangeExpenses.map(expense => {
                const monthNames = [
                    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
                ];
                return {
                    year: expense.year,
                    month: `${monthNames[expense.month - 1]} ${expense.year}`,
                    totalAmount: expense.totalAmount,
                };
            });
        } else {
            // Query to calculate month-wise totals for the last six months (for preset ranges)
            const lastSixMonthsExpenses = await expenseModel.aggregate([
                {
                    $match: {
                        createAt: { $gte: lastSixMonthsStartDate, $lte: lastSixMonthsEndDate },
                    },
                },
                {
                    $group: {
                        _id: {
                            year: { $year: "$createAt" },
                            month: { $month: "$createAt" },
                        },
                        totalAmount: { $sum: { $toDouble: "$amount" } },
                    },
                },
                {
                    $sort: {
                        "_id.year": 1,
                        "_id.month": 1,
                    },
                },
                {
                    $project: {
                        year: "$_id.year",
                        month: "$_id.month",
                        totalAmount: 1,
                        _id: 0,
                    },
                },
            ]);

            // Fill in missing months for last 6 months view
            const completeMonthlyExpenses = fillMissingMonths().map(month => {
                const existing = lastSixMonthsExpenses.find(
                    expense => expense.year === month.year && expense.month === month.month
                );
                return existing || month;
            });

            // Process data to create a human-readable format
            monthlyExpenses = completeMonthlyExpenses.map(expense => {
                const monthNames = [
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                ];
                return {
                    year: expense.year,
                    month: monthNames[expense.month - 1],
                    totalAmount: expense.totalAmount,
                };
            });
        }
  
        // Process data to separate office and personal expenses and calculate totals
        const officeExpenses = expenses.filter(e => e.expenseType === "office");
        const personalExpenses = expenses.filter(e => e.expenseType === "personal");
        const officeExpensesExpend = expensesExpense.filter(e => e.expenseType === "office");
        const personalExpensesExpend = expensesExpense.filter(e => e.expenseType === "personal");
        const totalOfficeExpense = officeExpenses.reduce((sum, e) => sum + e.totalAmount, 0);
        const totalPersonalExpense = personalExpenses.reduce((sum, e) => sum + e.totalAmount, 0);
        const totalExpense = totalOfficeExpense + totalPersonalExpense;
  
        // Construct response
        const response = {
            office: officeExpenses,
            personal: personalExpenses,
            officeExpend: officeExpensesExpend,
            personalExpend: personalExpensesExpend,
            lastSixMonths: monthlyExpenses,
            totals: {
                office: totalOfficeExpense,
                personal: totalPersonalExpense,
                overall: totalExpense,
            },
            dateRange: isCustomRange ? {
                from: startDate.toISOString().split('T')[0],
                to: endDate.toISOString().split('T')[0],
                isCustomRange: true,
                period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`
            } : {
                period: search,
                isCustomRange: false
            }
        };
  
        return HandleResponse({
            type: "SUCCESS",
            message: "Expenses fetched successfully",
            data: response,
        });
    } catch (error: any) {
        console.error(error);
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message || "An error occurred",
        });
    }
}

// Delete a group by ID
export async function DELETE(req: Request) {
    try {
        await DB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');    
        if (!id) {
            return HandleResponse({ type: "BAD_REQUEST", message: "Expense ID is missing" });
        }

        await expenseModel.findByIdAndDelete(id);
        return HandleResponse({
            type: "SUCCESS",
            message: "Deleted successfully",
        });
    } catch (error: any) {
        return HandleResponse({
            type: "BAD_REQUEST",
            message: error?.message
        });
    }
}