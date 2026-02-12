import {
  Bell, X, Eye, Users, Boxes, TrendingUp,
  FileBarChart2, FileText, ReceiptText, AlarmClock,
  CalendarDays, PhoneCall, CalendarCheck, PhoneIncoming,
  CalendarClock, CheckCircle, PowerOff, PhoneOff, Flame,
  HelpCircle, History, Target, BarChart2
} from "lucide-react";
import { FixedSizeList as List } from 'react-window';


const OptimizedWidgetModal = ({ widget, data, isLoading, visible, onClose, onViewLead }: any) => {
  if (!visible || !widget) return null;

  const Row = ({ index, style }: { index: number; style: any }) => {
    const lead = data?.data?.[index];
    if (!lead) return null;

    return (
      <div style={style} className="border-b border-gray-100 hover:bg-gray-50">
        <div className="grid grid-cols-12 gap-2 p-3 items-center">
          <span className="col-span-4 text-gray-800 truncate">
            {lead?.name || 'N/A'}
          </span>
          <span className="col-span-3 text-gray-600">
            {lead?.phone || 'N/A'}
          </span>
          <span className="col-span-3 text-gray-600 truncate">
            {lead?.source || 'N/A'}
          </span>
          <div className="col-span-2">
            <button
              onClick={() => onViewLead(lead.phone)}
              className="p-1 text-indigo-600 hover:text-indigo-800 transition-colors"
              title="View Details"
            >
              <Eye className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-pink-200">
        <div className="border-b border-pink-100 p-4 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-pink-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-indigo-100">
              {widget.icon}
            </div>
            <h3 className="text-xl font-semibold text-indigo-900">
              {widget.name} Leads ({isLoading ? '...' : data?.data?.length || 0})
            </h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-pink-200 transition-colors">
            <X className="text-indigo-600" size={20} />
          </button>
        </div>

        <div className="bg-pink-50 p-3 grid grid-cols-12 gap-2 text-sm font-medium text-pink-800">
          <span className="col-span-4">Name</span>
          <span className="col-span-3">Phone</span>
          <span className="col-span-3">Source</span>
          <span className="col-span-2">Action</span>
        </div>

        <div style={{ height: '400px' }}>
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-600"></div>
            </div>
          ) : data?.data?.length > 0 ? (
            <List
              height={400}
              width="100%"
              itemCount={data.data.length}
              itemSize={70}
            >
              {Row}
            </List>
          ) : (
            <div className="p-8 text-center text-gray-400">
              <p>No leads found for this status</p>
            </div>
          )}
        </div>

        <div className="border-t border-pink-100 p-3 flex justify-end bg-indigo-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OptimizedWidgetModal;