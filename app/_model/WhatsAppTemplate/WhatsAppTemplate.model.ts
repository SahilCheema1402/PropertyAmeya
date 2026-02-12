import { Company, User } from "./../../_const/const";
import mongoose, { Schema, model, models } from "mongoose";

const WhatsAppTemplateSchema = new mongoose.Schema({
    companyId: {
        type: Schema.Types.ObjectId,
        ref: Company.Name,
        required: [true, "Company Id is missing"]
    },
    template: {
        type: String,
        required: true,
        default: `*Dear {clientName},*

*Greetings from Property 360 Degree Pvt Ltd!!*

We are pleased to share exclusive commercial investment opportunities at *Noida* now with a *Buyback Guarantee* ensuring complete investment security and strong appreciation potential.

🏢 *Civitech Santoni* – Corporate Suites, Sector 16B
✨ 1st Time in NCR – Corporate Suites with Swimming Pool & Club Facility

📍 Prime Location – Adjacent to Data Center Hub

✔ High Demand • Strong Business Growth

💼 *Fully Furnished Corporate Suites*
*1st transfer free

📈 *Buyback Guarantee*

Book your Corporate Suite today!

Kindly call back at your convenience for more details.

*Regards,*
{userName}
{designation}
Property 360 Degree Pvt Ltd`
    },
    lastUpdatedBy: {
        type: Schema.Types.ObjectId,
        ref: User.schemaName,  // Changed from User.Name to User.schemaName
        required: [true, "User Id is missing"]
    },
    lastUpdatedAt: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Add indexes if needed
WhatsAppTemplateSchema.index({ companyId: 1 });

export default models.WhatsAppTemplate || model('WhatsAppTemplate', WhatsAppTemplateSchema);