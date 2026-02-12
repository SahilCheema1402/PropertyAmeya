'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faRupeeSign } from '@fortawesome/free-solid-svg-icons';

interface QueryDetails {
  leadType: string;
  project?: string;
  size?: string;
  budget?: string;
  bhk?: string;
  floor?: string;
  purpose?: string;
  location?: string;
  shifting_date?: string | Date;
  followup_date?: string | Date;
  exp_visit_date?: string | Date;
  type?: string;
  call_status?: string;
  visit_done?: string | Date;
  meeting_done?: string | Date;
  status?: string;
  reason?: string;
  closing_amount?: string;
}

interface ReportItem {
  _id: string;
  name: string;
  phone: string;
  source: string;
  queryDetails: QueryDetails;
  call_date: string | null;
  followup_date: string | null;
  meeting_done_date: string | null;
  visit_done_date: string | null;
  deal_done_date: string | null;
  ringing_switch_off_date: string | null;
}

interface PopUpToReportProps {
  reportData: ReportItem[];
  setPopUpVisible: (visible: boolean) => void;
}

const PopUpToReport: React.FC<PopUpToReportProps> = ({ reportData, setPopUpVisible }) => {
  const [selectedData, setSelectedData] = useState<QueryDetails | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (modalVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [modalVisible]);

  const openModal = (item: QueryDetails) => {
    setSelectedData(item);
    setModalVisible(true);
  };

  function formatDateToDDMMYYYY(datetimeString: string | number | Date) {
    if (!datetimeString) {
      return 'Date not available';
    }

    const date = new Date(datetimeString);

    if (isNaN(date.getTime())) {
      return 'Invalid date format';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }

  if (reportData?.length === 0) {
    return (
      <div 
        className="fixed inset-0 bg-black/30 dark:bg-zinc-700/50 z-50 flex justify-center items-center"
        onClick={(e) => {
          e.stopPropagation();
          setPopUpVisible(false);
        }}
      >
        <div 
          className="bg-white rounded-xl p-6 w-[90%] max-w-lg mx-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="text-center">
            <h2 className="text-xl text-black font-bold">No Data Found!</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/30 dark:bg-zinc-700/50 z-40 flex justify-center items-center overflow-hidden"
      onClick={(e) => {
        e.stopPropagation();
        setPopUpVisible(false);
      }}
    >
      <div 
        className="relative bg-white rounded-xl p-4 w-[95%] max-w-4xl mx-auto max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="border-b-2 border-b-gray-300 p-3 flex flex-row items-center sticky top-0 bg-white z-10">
          <div className="font-semibold text-lg text-gray-600/70 basis-5/12 px-4">Name</div>
          <div className="font-semibold text-lg text-gray-600/70 basis-3/12 px-2">Phone</div>
          <div className="font-semibold text-lg text-gray-600/70 px-2">Source</div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {reportData
            ?.sort((a, b) => (a.name && b.name ? a.name.localeCompare(b.name) : 0))
            ?.map((item) => (
              <div
                key={item._id}
                onClick={() => openModal(item.queryDetails)}
                className="border-b-[1px] border-b-gray-300 w-full p-3 flex flex-row justify-between items-center cursor-pointer hover:bg-gray-50"
              >
                <div className="flex flex-row items-center justify-start gap-x-2 px-2">
                  <div className="bg-[#004aad] px-2 py-[2px] flex flex-row justify-center items-center rounded-full">
                    <span className="text-white font-semibold text-lg">
                      {item?.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-gray-600/70">
                      {item?.name?.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="basis-4/12 flex flex-row items-center justify-start gap-x-4">
                  <span className="font-semibold text-xs text-gray-600/70">
                    {item?.phone?.toUpperCase()}
                  </span>
                </div>

                <div className="basis-4/12 flex flex-row items-center justify-start gap-x-4">
                  <span className="font-semibold text-xs text-gray-600/70">
                    {item?.source?.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
        </div>

        {modalVisible && selectedData && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white w-[95%] max-w-2xl rounded-lg p-6 my-4 mx-auto max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white pb-4 flex justify-between items-center">
                <h3 className="text-lg font-bold">Query Details</h3>
                <button
                  className="bg-[#004aad] p-2 rounded-full hover:bg-[#003987] transition-colors"
                  onClick={() => setModalVisible(false)}
                >
                  <FontAwesomeIcon icon={faTimes} className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="space-y-4">
                <DetailRow label="Lead Type" value={selectedData.leadType} />
                <DetailRow label="Project" value={selectedData.project} />
                
                {selectedData.leadType === "residential" && (
                  <DetailRow label="Size" value={selectedData.size} />
                )}
                
                <DetailRow
                  label={
                    <span className="flex items-center">
                      Budget
                      <FontAwesomeIcon icon={faRupeeSign} className="w-3 h-3 ml-1 text-gray-500" />
                    </span>
                  }
                  value={selectedData.budget}
                />

                {selectedData.leadType !== "commercial" && (
                  <>
                    <DetailRow label="BHK" value={selectedData.bhk} />
                    <DetailRow label="Floor" value={selectedData.floor} />
                  </>
                )}

                {selectedData.leadType === "commercial" && (
                  <>
                    <DetailRow label="Purpose" value={selectedData.purpose} />
                    <DetailRow label="Location" value={selectedData.location} />
                  </>
                )}

                {selectedData.leadType === "rent" && (
                  <DetailRow
                    label="Shifting Date"
                    value={formatDateToDDMMYYYY(selectedData.shifting_date || '')}
                  />
                )}

                <DetailRow
                  label="Followup Date"
                  value={formatDateToDDMMYYYY(selectedData.followup_date || '')}
                />

                <DetailRow
                  label="Exp Visit Date"
                  value={formatDateToDDMMYYYY(selectedData.exp_visit_date || '')}
                />

                <DetailRow label="Type" value={selectedData.type} />
                <DetailRow label="Call Status" value={selectedData.call_status} />

                {selectedData.call_status === "Visit Done" && (
                  <DetailRow
                    label="Visit Date"
                    value={formatDateToDDMMYYYY(selectedData.visit_done || '')}
                  />
                )}

                {selectedData.call_status === "Meeting Done" && (
                  <DetailRow
                    label="Meeting Date"
                    value={formatDateToDDMMYYYY(selectedData.meeting_done || '')}
                  />
                )}

                <DetailRow label="Status" value={selectedData.status} />

                {selectedData.status === "Not Interested" && (
                  <DetailRow label="Reason" value={selectedData.reason} />
                )}

                {selectedData.status === "Deal Done" && (
                  <DetailRow label="Closing Amount" value={selectedData.closing_amount} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface DetailRowProps {
  label: string | React.ReactNode;
  value?: string | null;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value }) => (
  <div className="flex flex-row justify-between items-center">
    <div>
      <span className="text-[#71757d] text-base font-semibold capitalize">
        {label}
      </span>
    </div>
    <div className="flex flex-row justify-end">
      <span className="text-[#71757d] font-semibold text-base text-end capitalize">
        {value || 'Not Available'}
      </span>
    </div>
  </div>
);

export default PopUpToReport;