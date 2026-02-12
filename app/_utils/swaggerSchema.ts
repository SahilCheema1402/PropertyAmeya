import mongooseToSwagger from 'mongoose-to-swagger';
import User from '../_model/user/user.model';
import LeadField from '../_model/LeadModel/Field.model';
import Lead from '../_model/LeadModel/lead.model';
import InventoryField from '../_model/Inventory/Field.model'
import Inventory from '../_model/Inventory/inventory.model'

export const userSchemaSwagger = mongooseToSwagger(User);
export const leadFieldSchemaSwagger = mongooseToSwagger(LeadField);
export const leadSchemaSwagger = mongooseToSwagger(Lead);
export const inventoryFieldSchemaSwagger = mongooseToSwagger(InventoryField);
export const inventortSchemaSwagger = mongooseToSwagger(Inventory);