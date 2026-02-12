import React, { useState, useEffect } from 'react';
import { FaEdit } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { toggleUserSelection } from './../../_api_query/store';
import { FaPhoneAlt, FaWhatsapp } from 'react-icons/fa';
import { set } from 'mongoose';
import { useGetWhatsAppTemplateQuery } from '@app/_api_query/whatsapp/whatsapp.api';

interface TableRowProps {
  setId: (lead: any) => void;
  lead_: any;
  setLeadForm?: (value: boolean) => void;
  setLeadFormData?: (lead: any) => void;
  selectedStatus: string;
  search: string;
  leadType: string;
  isLeadsPage?: boolean;
  isLeadsPageE?: boolean;
  showCreatedBy?: boolean;
  showAssignedUser?: boolean;
}

function TableRow({ setId, lead_, setLeadForm, setLeadFormData, selectedStatus, search, leadType, isLeadsPage, isLeadsPageE, showCreatedBy = false, showAssignedUser = false }: TableRowProps) {
  const [role_, setRole] = useState(0);
  const dispatch = useDispatch();
  const selectedUserIds = useSelector((state: any) => state.store.selectedUserIds);
  const { data: templateData } = useGetWhatsAppTemplateQuery(undefined, {
    
    refetchOnMountOrArgChange: false,
  });

  const [whatsappMessage, setWhatsappMessage] = useState('');

  const generateWhatsAppMessage = (template: string, lead: any, userData: any) => {
    const capitalizeWords = (str: string) =>
      str
        ? str
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
        : '';

    return template
      .replace(/{clientName}/g, lead?.name || 'Client')
      .replace(/{userName}/g, capitalizeWords(userData.userName || 'Property 360 Degree'))
      .replace(/{designation}/g, capitalizeWords(userData.designation || 'Property Consultant'))
      .replace(/{companyName}/g, 'Property 360 Degree Pvt Ltd')
      .replace(/{phone}/g, lead?.phone || '');
  };

  // Effect to update WhatsApp message when template or lead changes
  useEffect(() => {
    if (templateData?.data?.template) {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const message = generateWhatsAppMessage(templateData.data.template, lead_, userData);
      setWhatsappMessage(message);
    } else {
      // Fallback to default message if template not loaded
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const capitalizeWords = (str: string) =>
        str
          ? str
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
          : '';

      const defaultMessage = `*Dear ${lead_?.name || 'Client'},*

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
${capitalizeWords(userData.userName || 'Property 360 Degree')}
${capitalizeWords(userData.designation || 'Property Consultant')}
Property 360 Degree Pvt Ltd`;

      setWhatsappMessage(defaultMessage);
    }
  }, [templateData, lead_]);

  // Update whatsappUrl to use the dynamic message
  const phone = lead_?.phone?.replace(/\D/g, '') || '';
  const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`;
  const encodedMessage = encodeURIComponent(whatsappMessage);
  const whatsappUrl = `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}&type=phone_number&app_absent=1`;

  useEffect(() => {
    async function roleFetch() {
      const role = await localStorage.getItem('role');
      setRole(role ? parseInt(role, 10) : 0);
    }
    roleFetch();
  }, []);

  const handleToggleUser = (userId: any) => {
    dispatch(toggleUserSelection(userId));
  };

  const getRemarksCount = () => {
    const remarksDetails =
      lead_?.queryDetails?.remarksDetails ||
      lead_?.query?.[0]?.remarksDetails ||
      lead_?.remarksDetails ||
      lead_?.queryDetails?.[0]?.remarksDetails ||
      lead_?.query?.remarksDetails;

    if (remarksDetails && Array.isArray(remarksDetails)) {
      return remarksDetails.length;
    }
    return 0;
  };

  const getLatestRemarkDate = () => {
    // Try multiple possible paths where remarksDetails might be stored
    const remarksDetails =
      lead_?.queryDetails?.remarksDetails ||
      lead_?.query?.[0]?.remarksDetails ||
      lead_?.remarksDetails ||
      lead_?.queryDetails?.[0]?.remarksDetails ||
      lead_?.query?.remarksDetails;

    if (remarksDetails && Array.isArray(remarksDetails) && remarksDetails.length > 0) {
      // Create a copy of the array to avoid mutating the original
      const sortedRemarks = [...remarksDetails].sort((a, b) => {
        // Handle different possible date field names
        const dateA = new Date(a.createAt || a.createdAt || a.date || a.timestamp);
        const dateB = new Date(b.createAt || b.createdAt || b.date || b.timestamp);

        return dateB.getTime() - dateA.getTime();
      });

      const latestRemark = sortedRemarks[0];
      const remarkDate = latestRemark.createAt || latestRemark.createdAt || latestRemark.date || latestRemark.timestamp;

      if (remarkDate) {
        return new Date(remarkDate).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        });
      }
    }

    // Fallback to lead update date if no remarks found
    if (lead_?.updateAt) {
      return new Date(lead_.updateAt).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    }

    return null;
  };

  // Function to check if updateAt is older than 30 days
  const isOlderThan30Days = () => {
    if (!lead_?.updateAt) return false;
    const updateDate = new Date(lead_.updateAt);
    const currentDate = new Date();
    const thirtyDaysAgo = new Date(currentDate.getTime() - (30 * 24 * 60 * 60 * 1000));
    return updateDate < thirtyDaysAgo;
  };

  // Check if lead has assigned user with populated username - for checkbox display
  const hasAssignedUserWithName = () => {
    // Check multiple possible paths for assigned user information
    if (lead_?.assignedUsers && Array.isArray(lead_.assignedUsers) && lead_.assignedUsers.length > 0) {
      return lead_.assignedUsers[0]?.userName;
    }
    if (lead_?.assign && lead_?.assignedUser && Array.isArray(lead_.assignedUser) && lead_.assignedUser.length > 0) {
      return lead_.assignedUser[0]?.userName;
    }
    return false;
  };

  // Check if lead is assigned (has assign field) - for display logic
  const isLeadAssigned = () => {
    // Check if assign field exists and has a value (ObjectId)
    return lead_?.assign && lead_.assign !== null && lead_.assign !== undefined;
  };

  const capitalizeFirst = (str: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : str;

  const getAssignedUserName = () => {
    // Check multiple possible paths for assigned user information
    if (lead_?.assignedUsers && Array.isArray(lead_.assignedUsers) && lead_.assignedUsers.length > 0) {
      return capitalizeFirst(lead_.assignedUsers[0]?.userName || "Assigned User");
    }
    if (lead_?.assignedUser && Array.isArray(lead_.assignedUser) && lead_.assignedUser.length > 0) {
      return capitalizeFirst(lead_.assignedUser[0]?.userName || "Assigned User");
    }
    if (lead_?.assign && lead_?.assign?.userName) {
      return capitalizeFirst(lead_.assign.userName);
    }
    // If lead has assign field but no userName populated
    if (isLeadAssigned()) {
      return "Lead bank";
    }
    return "Lead bank";
  };

  // Inside the TableRow component
  const [userName, setUserName] = useState('');
  const [designation, setDesignation] = useState('');

  useEffect(() => {
    // Get the user data from localStorage
    const userData = localStorage.getItem('user');
    console.log('Retrieved user data from localStorage:', userData);
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUserName(parsedUser.userName || 'Property 360 Degree');
        setDesignation(parsedUser.designation || 'Property Consultant');
      } catch (error) {
        console.error('Error parsing user data:', error);
        setUserName('Property 360 Degree');
      }
    }
  }, []);

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
};

  // const phone = lead_?.phone?.replace(/\D/g, '') || '';
  // const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`;
  const clientName = lead_?.name || 'Client';

  const capitalizeWords = (str: string) =>
    str
      ? str
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
      : '';

  const message = `*Dear ${clientName},*

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
${capitalizeWords(userName) || 'Property 360 Degree'}
${capitalizeWords(designation) || 'Property Consultant'}
Property 360 Degree Pvt Ltd`;

  // const encodedMessage = encodeURIComponent(message);
  // const whatsappUrl = `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}&type=phone_number&app_absent=1`;

  const shouldHighlightRed = () => {
    // Only highlight in followup tab
    if (selectedStatus !== 'followup') return false;

    // Try to find the latest call date from queryDetails
    const queryDetails = lead_?.queryDetails || lead_?.query || [];

    let latestCallDate: Date | null = null;

    // Find the most recent call_date from all query details
    queryDetails.forEach((query: any) => {
      if (query.call_date) {
        const currentCallDate = new Date(query.call_date);
        if (!latestCallDate || currentCallDate > latestCallDate) {
          latestCallDate = currentCallDate;
        }
      }
    });

    // If no call date found, use updateAt as fallback
    if (!latestCallDate && lead_?.updateAt) {
      latestCallDate = new Date(lead_.updateAt);
    }

    // If still no date found, don't highlight
    if (!latestCallDate) return false;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return latestCallDate < thirtyDaysAgo;
  };

  // Function to handle edit button click
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (setLeadForm && setLeadFormData) {
      // Prepare the lead data with default values to avoid validation errors
      const leadData = {
        ...lead_,
        // Ensure we have at least empty values for required fields
        call_status: lead_?.query?.[0]?.call_status || '',
        lead_status: lead_?.lead_status || '',
        // Make sure queryDetails exists
        queryDetails: lead_?.queryDetails || [{}]
      };
      setLeadFormData(leadData);
      setLeadForm(true);
    }
  };



  return (
    <div className={`border-b-[1px] border-b-gray-300 w-full gap-2 p-3 flex flex-row items-center overflow-auto ${shouldHighlightRed() ? 'bg-red-400 border-red-200' : ''}`}>
      {/* Show checkbox for leads that are unassigned OR assigned but don't have username populated */}
      <div className="flex items-center justify-center">
        {(
          <input
            type="checkbox"
            checked={selectedUserIds.includes(lead_._id)}
            onChange={() => handleToggleUser(lead_._id)}
            className="w-4 h-4 text-[#004aad] bg-gray-100 border-gray-300 rounded focus:ring-[#004aad] focus:ring-2"
          />
        )}
      </div>

      <button className={isLeadsPage ? 'basis-7/12' : 'basis-5/12'} onClick={() => setId(lead_)}>
        <div className="flex flex-row items-center justify-start gap-x-2 px-2">
          <div className={`px-2 py-[2px] flex flex-row justify-center items-center rounded-full ${shouldHighlightRed() ? 'bg-red-600' : 'bg-[#004aad]'}`}>
            <p className="text-white font-semibold text-lg">
              {lead_?.name?.charAt(0)?.toUpperCase()}
            </p>
          </div>
          <div className="flex flex-col items-start">
            <p className={`font-semibold text-[10px] ${shouldHighlightRed() ? 'text-red-700' : 'text-gray-600/70'}`}>
              {lead_?.name?.toUpperCase()}
            </p>
          </div>
        </div>
      </button>

      {/* {showAssignedUser && (
        <button onClick={() => setId(lead_)} className="basis-3/12 flex flex-row items-center justify-start gap-x-4 px-2">
          <div>
            <p className="font-semibold text-[10px] text-gray-600/70">
              {(getAssignedUserName())}
            </p>
          </div>
        </button>
      )} */}

      {showCreatedBy && (
        <button onClick={() => setId(lead_)} className="basis-6/12 flex flex-row items-center justify-start gap-x-4 px-2 whitespace-nowrap">
          <div>
            <p className="font-semibold text-[10px] text-gray-600/70">
              {lead_?.createdByName || 'System'}
            </p>
          </div>
        </button>
      )}

      {/* FIXED: Updated the assigned user display logic */}
      {role_ == 1 && isLeadsPage && !isLeadsPageE && (
        <button onClick={() => setId(lead_)} className="basis-6/12 flex flex-row items-center justify-start gap-x-4 px-2 whitespace-nowrap">
          <div>
            <p className="font-semibold text-[10px] text-gray-600/70">
              {getAssignedUserName()}
            </p>
          </div>
        </button>
      )}

      {!isLeadsPage && !isLeadsPageE && (
        <button onClick={() => setId(lead_)} className="basis-6/12 flex flex-row items-center justify-start gap-x-4 px-2">
          <div>
            <p className="font-semibold text-[10px] text-gray-600/70">
              {lead_?.phone?.toUpperCase()}
            </p>
          </div>
        </button>
      )}

      <button onClick={() => setId(lead_)} className="basis-2/5 flex flex-row items-center justify-start gap-x-4 px-2">
        <div>
          <p className="font-semibold text-[10px] text-gray-600/70">
            {lead_?.query?.[0]?.call_status || lead_?.queryDetails?.[0]?.call_status || '-'}
          </p>
        </div>
      </button>

      <button onClick={() => setId(lead_)} className="basis-6/12 flex flex-row items-center justify-start gap-x-4 px-2">
        <div>
          <p className="font-semibold text-[10px] text-gray-600/70">
            {/* {lead_?.createAt ? new Date(lead_?.createAt).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true
            }) : '-'} */}
            {formatDateForDisplay(lead_?.createAt)}
          </p>
        </div>
      </button>

      <button onClick={() => setId(lead_)} className="basis-6/12 flex flex-row items-center justify-start gap-x-4 px-2">
        <div>
          {getLatestRemarkDate() && (
            <p className={`font-semibold text-[10px] ${shouldHighlightRed() ? 'text-red-600' : 'text-gray-600/70'}`}>
              {getLatestRemarkDate()}
            </p>
          )}
        </div>
      </button>

      <button
        onClick={() => setId(lead_)}
        className="basis-6/12 flex flex-row items-center justify-start gap-x-4 px-2"
      >
        <div>
          {getRemarksCount() > 0 && (
            <p className={`font-semibold text-[10px] ${shouldHighlightRed() ? 'text-red-600' : 'text-gray-600/70'}`}>
              {getRemarksCount()} {getRemarksCount() > 1 ? '' : ''}
            </p>
          )}
        </div>
      </button>

      <div className="basis-6/12 flex flex-row justify-end items-center gap-3 pr-2">
        {lead_?.phone && (
          <>
            <a
              href={`tel:${lead_?.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="text-blue-600 hover:text-blue-800"
            >
              <FaPhoneAlt size={18} />
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-green-600 hover:text-green-800"
              title="Send WhatsApp message"
            >
              <FaWhatsapp size={20} />
            </a>
          </>
        )}

        {role_ === 1 ? (
          <button
            onClick={handleEditClick}
            className="hover:bg-gray-100 p-2 rounded-md"
          >
            <FaEdit size={20} className="text-[#004aad]" />
          </button>
        ) : (
          <button disabled className="opacity-50 cursor-not-allowed">
            <FaEdit size={20} className="text-gray-300" />
          </button>
        )}

        <div className="basis-2/5 flex flex-row justify-end items-center gap-3 pr-2">
        </div>
      </div>
    </div>
  );
}

export default TableRow;