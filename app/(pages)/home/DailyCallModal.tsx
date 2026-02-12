import {
  Bell, X, Eye, Users, Boxes, TrendingUp,
  FileBarChart2, FileText, ReceiptText, AlarmClock,
  CalendarDays, PhoneCall, CalendarCheck, PhoneIncoming,
  CalendarClock, CheckCircle, PowerOff, PhoneOff, Flame,
  HelpCircle, History, Target, BarChart2
} from "lucide-react";

interface DailyCallResult {
  date: number;
  fullDate: string;
  callTargetAchieved: boolean;
  calls: number;
  callTarget: number;
}
interface DailyCallModalProps {
  visible: boolean;
  data: DailyCallResult | null;
  onClose: () => void;
}

const DailyCallModal = ({ visible, data, onClose }: DailyCallModalProps) => {

  const formatDateWithSuffix = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();

  const getDaySuffix = (d: number) => {
    if (d > 3 && d < 21) return 'th';
    switch (d % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  return `${day}${getDaySuffix(day)} ${month} ${year}`;
};

  if (!visible || !data) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden border border-indigo-200">
        <div className="border-b border-indigo-100 p-4 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-blue-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-indigo-100">
              <Target className="text-indigo-600" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-indigo-900">
              Daily Call Target - {formatDateWithSuffix(data.fullDate)}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-indigo-200 transition-colors">
            <X className="text-indigo-600" size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
              <p className="text-sm text-indigo-600 font-medium">Daily Target</p>
              <p className="text-2xl font-bold text-indigo-800">{data.callTarget}</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
              <p className="text-sm text-indigo-600 font-medium">Calls Made</p>
              <p className="text-2xl font-bold text-indigo-800">{data.calls}</p>
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${data.callTargetAchieved
            ? 'bg-green-50 border-green-100'
            : 'bg-red-50 border-red-100'
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {data.callTargetAchieved ? 'Target Achieved' : 'Target Not Met'}
                </p>
                <p className="text-xs text-gray-500">
                  {data.callTargetAchieved
                    ? 'Great job! You exceeded your daily target.'
                    : 'Keep going! Try to reach your target next time.'}
                </p>
              </div>
              <div className={`p-2 rounded-full ${data.callTargetAchieved
                ? 'bg-green-100 text-green-600'
                : 'bg-red-100 text-red-600'
                }`}>
                {data.callTargetAchieved ? (
                  <CheckCircle size={24} />
                ) : (
                  <Flame size={24} />
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Performance Summary</h4>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Completion</span>
              <span className="text-sm font-bold text-indigo-700">
                {Math.min(100, Math.round((data.calls / data.callTarget) * 100))}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full ${data.callTargetAchieved ? 'bg-green-500' : 'bg-red-500'
                  }`}
                style={{
                  width: `${Math.min(100, Math.round((data.calls / data.callTarget) * 100))}%`
                }}
              ></div>
            </div>
          </div>
        </div>

        <div className="border-t border-indigo-100 p-4 flex justify-end bg-indigo-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyCallModal;