import { InventoryType, OptionConfig } from './../types'

export const Lead = {
    Name:'Lead',
    schemaName:'Leads'
}
export const Attendance = {
    Name:'Attendance',
    schemaName:'Attendances'
}
export const LeadScore = {
    Name:'LeadScore',
    schemaName:'ILeadScores'
}
export const User = {
    Name:'user',
    schemaName:'Users'
}
export const Query = {
    Name:'Query',
    schemaName:'Querys'
}
export const List = {
    Name:'List',
    schemaName:'Lists'
}
export const Project = {
    Name:'Project',
    schemaName:'Projects'
}
export const Remark = {
    Name:'Remark',
    schemaName:'Remarks'
}
export const Staff = {
    Name:'Staff',
    schemaName:'Staffs'
}
export const Company = {
    Name:'Company',
    schemaName:'Companys'
}
export const LeadField = {
    Name:'LeadField',
    schemaName:'LeadFields'
}
export const Inventory={
    Name: 'Inventory',
    schemaName: 'Inventorys',
}
export const InventoryField = {
    Name:'InventoryField',
    schemaName:'InventoryFields'
}
export const Group={
    Name: 'group',
    schemaName: 'groups',
}
export const Links={
    Name:'Link',
    schemaName:'Links'
}
export const Quotation = {
    Name:'Quotation',
    schemaName:'Quotations'
}

export const OPTIONS_CONFIG: Record<InventoryType, OptionConfig> = {
    rent: {
      projects: [
        'Panchsheel Green 1', 'Panchsheel Green 2', 'Ajnara Homes',
        'French Appartment', 'Gaur Saundryam', 'EV 2', 'Cherry County',
        'Aims Green Avenue', 'Golf Home', 'Other'
      ],
      bhk: [
        '2 BHK', '2BHK + Study', '3 BHK', '3BHK + Study',
        '3BHK + Servant', '3BHK + Store', '4 BHK', '4 BHK + Study',
        '4BHK + Servant', '4 BHK + Store'
      ]
    },
    residential: {
      projects: [
        'Panchsheel Green 1', 'Panchsheel Green 2', 'Ajnara Homes',
        'French Appartment', 'Gaur Saundryam', 'Cherry County',
        'EV 2', 'Aims Green Avenue', 'Golf Home', 'Other'
      ],
      bhk: [
        '2 BHK', '2BHK + Study', '3 BHK', '3BHK + Study',
        '3BHK + Store', '3BHK + Servant', '4 BHK', '4 BHK + Study',
        '4BHK + Servant', '4 BHK + Store'
      ]
    },
    commercial: {
      projects: [
        'GWSS', 'Civitech Santony', 'Bhutani 62 Avenue', 'Golden I',
        'NX-One', 'Golden Grande', 'Irish Trehan', 'M3M The Line',
        'Ace YXP', 'Ace 153', 'CRC Flagship', 'EON', 'Other'
      ],
      bhk: [
        'Office Space', 'Studio App', 'Society Shop', 'Retail Shop',
        'Industrial land', 'Commercial land'
      ]
    }
  };
  
  export const visitTimeOptions = [
    { label: 'Anytime', value: 'Anytime' },
    { label: 'Weekend', value: 'Weekend' },
    { label: 'Call before visit', value: 'Call before visit' }
  ];
  
  export const tenantOptions = [
    { label: 'Yes', value: 'Yes' },
    { label: 'No', value: 'No' }
  ];
  
  export const statusOptions = [
    'Available',
    'Done By Other',
    'Plan Drop Out',
    'Deal Done'
  ].map(s => ({
    label: s,
    value: s
  }));
  
  export const typeOptions = [
    'Raw Flat',
    'Semi Furnished',
    'Fully Furnished'
  ].map(t => ({
    label: t,
    value: t
  }));
export const Notification = {
    Name:'Notification',
    schemaName:'Notifications'
}
export const SalesNotification = {
    Name:'SalesNotification',
    schemaName:'SalesNotification'
}
export const Log = {
    Name:'Log',
    schemaName:'Logs'
}
export const Expense = {
    Name:'Expense',
    schemaName:'Expenses'
}
export const Location = {
  Name:'Location',
  schemaName:'Locations'
}
export const TermsAndConditons = {
    Name:'TermsAndConditon',
    schemaName:'TermsAndConditons'
}
export const EmployeeTermsandConditons = {
    Name:'EmployeeTermsandConditon',
    schemaName:'EmployeeTermsandConditons'
}
