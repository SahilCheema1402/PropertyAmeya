import RemindersModel from './../../app/_model/Reminders/reminders.model';
import DB from "./../_Database/db";
const moment = require('moment-timezone');


exports.handler = async () => {
    try {

        await DB();

        const todayMidnight = moment().startOf('day').toDate();

        // Find tasks where nextExecutionDate is today
        const reminToRepeat = await RemindersModel.find({
            nextExecutionDate: {
                $gte: todayMidnight,
                $lt: moment(todayMidnight).add(1, 'days').toDate()
            }
        });

        for (let rem of reminToRepeat) {
            const newRemin = new RemindersModel({
                name: rem.name,
                title: rem.title,
                startDate: rem.startDate,
                dueDate: rem.dueDate,
                tat: rem.tat,
                tatMiss: rem.tatMiss,
                status: rem.status,
                priority: rem.priority,
                reminder: '',
                repeatOption: rem.repeatOption,
                owner: rem.owner,
                tasklist: rem.tasklist,
                companyId: rem.companyId,
                createdBy: rem.createdBy,
                nextExecutionDate: rem.nextExecutionDate,
                lastExecutedAt: todayMidnight,
            });

            await newRemin.save();

            // Update the original reminder's nextExecutionDate based on repeat type
            let newExecutionDate = moment(rem.nextExecutionDate);
            const rOption = rem.repeatOption.split(' ')[0].toLowerCase();

            switch (rOption) {
                case 'daily':
                    newExecutionDate.add(1, 'days');
                    break;
                case 'weekly':
                    newExecutionDate.add(1, 'weeks');
                    break;
                case 'monthly':
                    newExecutionDate.add(1, 'months');
                    break;
                case 'yearly':
                    newExecutionDate.add(1, 'years');
                    break;
                default:
                    console.error('Unknown repeatType:', rOption);
                    break;
            }

            // Update the reminder's nextExecutionDate
            rem.nextExecutionDate = newExecutionDate.startOf('day').toDate();
            rem.lastExecutedAt = todayMidnight;
            await rem.save();
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Tasks processed successfully' }),
        };

    } catch (error:any) {
        console.error('Error processing tasks:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error', error: error.message }),
        };
    }
};
