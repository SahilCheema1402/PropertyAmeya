import { useMemo } from "react";
import { Bell, X } from "lucide-react";

interface StaffMember {
  _id: string;
  userName: string;
}

interface Lead {
  phone: string;
  name?: string;
  source?: string;
  assign?: string[];
}

interface TodaysFollowUpModalProps {
  visible: boolean;
  data: Lead[] | null;
  isLoading: boolean;
  onClose: () => void;
  onViewLead: (phone: string) => void;
  staffData: { data: StaffMember[] } | null;
}

const TodaysFollowUpModal = ({
  visible,
  data,
  isLoading,
  onClose,
  onViewLead,
  staffData,
}: TodaysFollowUpModalProps) => {
  if (!visible) return null;

  // Create a mapping of staff IDs to names
  const staffMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (staffData?.data) {
      staffData.data.forEach((staff: StaffMember) => {
        const name = staff.userName
          ? staff.userName.charAt(0).toUpperCase() + staff.userName.slice(1)
          : "Unknown";
        map[staff._id] = name;
      });
    }
    return map;
  }, [staffData]);

  const capitalizeFirst = (str?: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : "N/A";

  // Function to get assignee names
  const getAssigneeNames = (assignIds: string[]) => {
    if (!assignIds || !Array.isArray(assignIds)) return "N/A";

    return assignIds.map((id) => staffMap[id] || "Unknown").join(", ");
  };

  // Function to get the latest assignee name
const getLatestAssigneeName = (assignIds: string[]) => {
  if (!assignIds?.length) return "N/A";
  return staffMap[assignIds[0]] || "Unknown";
};




  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-pink-200">
        <div className="border-b border-pink-100 p-4 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-pink-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-indigo-100">
              <Bell className="text-pink-600" size={24} />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-indigo-900">
              Today's Follow-ups ({data?.length || 0})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-pink-200 transition-colors"
          >
            <X className="text-indigo-600" size={20} />
          </button>
        </div>

        <div className="bg-pink-50 p-2 md:p-3 grid grid-cols-12 text-xs md:text-sm font-medium text-pink-800">
          <span className="col-span-3">Name</span>
          <span className="col-span-3">Phone</span>
          <span className="col-span-3">Source</span>
          <span className="col-span-3">Assignee</span>
        </div>

        <div className="overflow-y-auto max-h-[60vh] md:max-h-[70vh]">
          {isLoading ? (
            <div className="flex flex-col md:flex-row justify-center items-center h-64 p-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-600"></div>
              <p className="mt-4 md:mt-0 md:ml-4 text-gray-500 text-center">
                Loading today's follow-ups...
              </p>
            </div>
          ) : data && data.length > 0 ? (
            data.map((lead: Lead, i: number) => (
              <div
                key={i}
                onClick={() => onViewLead(lead.phone)}
                className="border-b border-pink-100 hover:bg-indigo-50 cursor-pointer transition-colors"
              >
                <div className="grid grid-cols-12 gap-2 p-2 md:p-3 items-center">
                  <span className="col-span-3 font-medium text-gray-800 truncate">
                    {capitalizeFirst(lead?.name) || "N/A"}
                  </span>
                  <span className="col-span-3 text-gray-600 truncate">
                    {lead?.phone || "N/A"}
                  </span>
                  <span className="col-span-3 text-gray-600 truncate">
                    {capitalizeFirst(lead?.source) || "N/A"}
                  </span>
                  <span className="col-span-3 text-gray-600 truncate">
                    {getLatestAssigneeName(lead.assign || [])}
                  </span>
                </div>
                {/* Mobile-only source display */}
                {lead?.source && (
                  <div className="md:hidden px-2 pb-2 text-xs text-gray-500">
                    Source: {lead.source}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-400">
              <p className="text-base md:text-lg">
                No follow-ups scheduled for today
              </p>
              <p className="text-xs md:text-sm mt-2">
                Check back later or add new leads
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-pink-100 p-3 flex justify-end bg-indigo-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm md:text-base"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodaysFollowUpModal;