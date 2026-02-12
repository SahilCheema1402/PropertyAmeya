import React, { useState } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

type EmployeeData = {
  userName?: string;
  callTarget?: number;
  callCount?: number;
  followupTarget?: number;
  followUpCount?: number;
  uniqueFollowupCount?: number;
  meetingTarget?: number;
  meetingCount?: number;
  visitTarget?: number;
  visitCount?: number;
  notInterestedCount?: number;
  interestedCount?: number;
};

type LocalDateRange = {
  startDate: Date;
  endDate: Date;
};

type ExcelPreviewModalProps = {
  employeeData: EmployeeData[];
  localDateRange: LocalDateRange;
  onClose: () => void;
};
const getWorkingDaysCount = (startDate: Date, endDate: Date): number => {
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 3) { // Exclude Wednesday (3)
            count++;
        }
        current.setDate(current.getDate() + 1);
    }

    return count;
};
const ExcelPreviewModal: React.FC<ExcelPreviewModalProps> = ({ employeeData, localDateRange, onClose }) => {
  const [isDownloading, setIsDownloading] = useState(false);
    const workingDays = getWorkingDaysCount(localDateRange.startDate, localDateRange.endDate);

const totals = {
    callTarget: employeeData.reduce((sum, emp) => sum + Number(emp.callTarget || 0) * workingDays, 0),
    callCount: employeeData.reduce((sum, emp) => sum + Number(emp.callCount || 0), 0),
    followupTarget: employeeData.reduce((sum, emp) => sum + Number(emp.followupTarget || 0) * workingDays, 0),
    followUpCount: employeeData.reduce((sum, emp) => sum + Number(emp.followUpCount || 0), 0),
    uniqueFollowupCount: employeeData.reduce((sum, emp) => sum + Number(emp.uniqueFollowupCount || 0), 0),
    meetingTarget: employeeData.reduce((sum, emp) => sum + Number(emp.meetingTarget || 0) * workingDays, 0),
    meetingCount: employeeData.reduce((sum, emp) => sum + Number(emp.meetingCount || 0), 0),
    visitTarget: employeeData.reduce((sum, emp) => sum + Number(emp.visitTarget || 0), 0),
    visitCount: employeeData.reduce((sum, emp) => sum + Number(emp.visitCount || 0), 0),
    notInterestedCount: employeeData.reduce((sum, emp) => sum + Number(emp.notInterestedCount || 0), 0),
    interestedCount: employeeData.reduce((sum, emp) => sum + Number(emp.interestedCount || 0), 0),
    callPending: 0,
    followupPending: 0
  };

  totals.callPending = totals.callTarget - totals.callCount;
  totals.followupPending = totals.followupTarget - totals.followUpCount;

  // Add calculated pending values
  totals.callPending = totals.callTarget - totals.callCount;
  totals.followupPending = totals.followupTarget - totals.followUpCount;

const downloadExcel = async () => {
  setIsDownloading(true);
  
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Employee Report');

    // Calculate working days excluding Wednesdays
    const workingDays = getWorkingDaysCount(localDateRange.startDate, localDateRange.endDate);

    // Add title row
    const titleRow = worksheet.addRow(['Employee Performance Report']);
    titleRow.getCell(1).font = { size: 16, bold: true };
    titleRow.getCell(1).alignment = { horizontal: 'center' };
    worksheet.mergeCells('A1:N1');
    
    // Add working days info
    const workingDaysRow = worksheet.addRow([
      `Report Period: ${localDateRange.startDate.toLocaleDateString('en-GB')} to ${localDateRange.endDate.toLocaleDateString('en-GB')} | Working Days: ${workingDays} (Excluding Wednesdays)`
    ]);
    workingDaysRow.getCell(1).font = { size: 12, italic: true };
    workingDaysRow.getCell(1).alignment = { horizontal: 'center' };
    worksheet.mergeCells('A3:N3');

    // Add empty row
    worksheet.addRow([]);

    // Create header row with merged cells for grouped columns
    const headerRow1 = worksheet.addRow([
      'User Name',
      'Call', '', '',
      'Follow-up', '', '', '',
      'Meeting', '',
      'Visit', '',
      'Not Interested',
      'Interested'
    ]);

    // Style header row 1
    headerRow1.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4472C4' }
      };
      cell.font = { color: { argb: 'FFFFFF' }, bold: true, size: 11 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Create sub-header row
    const headerRow2 = worksheet.addRow([
      '', // User Name (merged from above)
      'Target', 'Achieved', 'Pending',
      'Target', 'Achieved', 'Pending', 'Unique',
      'Target', 'Achieved',
      'Target', 'Achieved',
      'Count',
      'Count'
    ]);

    // Style header row 2
    headerRow2.eachCell((cell, colNumber) => {
      if (colNumber > 1) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '5B9BD5' }
        };
        cell.font = { color: { argb: 'FFFFFF' }, bold: true, size: 10 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    });

    // Merge cells for grouped headers
    worksheet.mergeCells('A5:A6');
    worksheet.mergeCells('B5:D5');
    worksheet.mergeCells('E5:H5');
    worksheet.mergeCells('I5:J5');
    worksheet.mergeCells('K5:L5');
    worksheet.mergeCells('M5:M6');
    worksheet.mergeCells('N5:N6');

    // Add employee data rows with adjusted targets
    employeeData.forEach((emp, index) => {
      const capitalizedUserName = emp.userName
        ? emp.userName.split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
        : '';

      // Calculate adjusted targets based on working days
      const adjustedCallTarget = (emp.callTarget || 0) * workingDays;
      const adjustedFollowupTarget = (emp.followupTarget || 0) * workingDays;
      const adjustedMeetingTarget = (emp.meetingTarget || 0) * workingDays;

      const dataRow = worksheet.addRow([
        capitalizedUserName || '',
        adjustedCallTarget,
        emp.callCount || 0,
        adjustedCallTarget - (emp.callCount || 0),
        adjustedFollowupTarget,
        emp.followUpCount || 0,
        adjustedFollowupTarget - (emp.followUpCount || 0),
        emp.uniqueFollowupCount || 0,
        adjustedMeetingTarget,
        emp.meetingCount || 0,
        emp.visitTarget || 0,
        emp.visitCount || 0,
        emp.notInterestedCount || 0,
        emp.interestedCount || 0
      ]);

      // Style data rows with alternating colors
      const fillColor = index % 2 === 0 ? 'F2F2F2' : 'FFFFFF';
      
      dataRow.eachCell((cell, colNumber) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: fillColor }
        };
        
        if (colNumber === 1) {
          cell.font = { bold: true, size: 10 };
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        } else {
          cell.font = { size: 10 };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          
          if (colNumber === 3 || colNumber === 6 || colNumber === 10) {
            const target = dataRow.getCell(colNumber - 1).value;
            const achieved = cell.value;
            
            if ((Number(achieved) ?? 0) >= (Number(target) ?? 0)) {
              cell.font = { ...cell.font, color: { argb: '008000' }, bold: true };
            } else {
              cell.font = { ...cell.font, color: { argb: 'FF0000' } };
            }
          } else if (colNumber === 4 || colNumber === 7) {
            const pendingRaw = cell.value;
            const pending = typeof pendingRaw === 'number' ? pendingRaw : Number(pendingRaw) || 0;
            if (pending <= 0) {
              cell.font = { ...cell.font, color: { argb: '008000' }, bold: true };
            } else {
              cell.font = { ...cell.font, color: { argb: 'FF6600' } };
            }
          }
        }
        
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Add summary row with adjusted totals
    const totals = {
      callTarget: employeeData.reduce((sum, emp) => sum + Number(emp.callTarget || 0) * workingDays, 0),
      callCount: employeeData.reduce((sum, emp) => sum + Number(emp.callCount || 0), 0),
      followupTarget: employeeData.reduce((sum, emp) => sum + (Number(emp.followupTarget || 0) * workingDays), 0),
      followUpCount: employeeData.reduce((sum, emp) => sum + Number(emp.followUpCount || 0), 0),
      uniqueFollowupCount: employeeData.reduce((sum, emp) => sum + Number(emp.uniqueFollowupCount || 0), 0),
      meetingTarget: employeeData.reduce((sum, emp) => sum + (Number(emp.meetingTarget || 0) * workingDays), 0),
      meetingCount: employeeData.reduce((sum, emp) => sum + Number(emp.meetingCount || 0), 0),
      visitTarget: employeeData.reduce((sum, emp) => sum + Number(emp.visitTarget || 0), 0),
      visitCount: employeeData.reduce((sum, emp) => sum + Number(emp.visitCount || 0), 0),
      notInterestedCount: employeeData.reduce((sum, emp) => sum + Number(emp.notInterestedCount || 0), 0),
      interestedCount: employeeData.reduce((sum, emp) => sum + Number(emp.interestedCount || 0), 0)
    };

    const summaryRow = worksheet.addRow([
      'TOTAL',
      totals.callTarget,
      totals.callCount,
      totals.callTarget - totals.callCount,
      totals.followupTarget,
      totals.followUpCount,
      totals.followupTarget - totals.followUpCount,
      totals.uniqueFollowupCount,
      totals.meetingTarget,
      totals.meetingCount,
      totals.visitTarget,
      totals.visitCount,
      totals.notInterestedCount,
      totals.interestedCount
    ]);

    // Style summary row
    summaryRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '366092' }
      };
      cell.font = { color: { argb: 'FFFFFF' }, bold: true, size: 11 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thick' },
        left: { style: 'thin' },
        bottom: { style: 'thick' },
        right: { style: 'thin' }
      };
    });

    // Set column widths
    worksheet.columns = [
      { width: 25 }, { width: 12 }, { width: 12 }, { width: 12 },
      { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 },
      { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 },
      { width: 15 }, { width: 12 }
    ];

    // Add footer with generation timestamp
    const footerRow = worksheet.addRow([
      `Generated on: ${new Date().toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`
    ]);
    
    footerRow.getCell(1).font = { size: 9, italic: true };
    footerRow.getCell(1).alignment = { horizontal: 'right' };
    worksheet.mergeCells(`A${worksheet.rowCount}:N${worksheet.rowCount}`);

    // Generate and download file
    const data = await workbook.xlsx.writeBuffer();
    const blob = new Blob([data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const fileName = `Employee_Report_${localDateRange.startDate.toISOString().split('T')[0]}_to_${localDateRange.endDate.toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, fileName);
  } catch (error) {
    console.error('Error generating Excel file:', error);
  } finally {
    setIsDownloading(false);
  }
};
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Excel Preview</h2>
            <p className="text-sm text-gray-600 mt-1">
              Report Period: {localDateRange.startDate.toLocaleDateString('en-GB')} to {localDateRange.endDate.toLocaleDateString('en-GB')}
            </p>
            <p className="text-sm text-gray-600">
              Working Days: {workingDays} (Excluding Wednesdays)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-180px)]">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                {/* Group Headers */}
                <tr className="bg-blue-600 text-white">
                  <th rowSpan={2} className="border border-gray-300 p-2 text-center font-semibold">
                    User Name
                  </th>
                  <th colSpan={3} className="border border-gray-300 p-2 text-center font-semibold">
                    Call
                  </th>
                  <th colSpan={4} className="border border-gray-300 p-2 text-center font-semibold">
                    Follow-up
                  </th>
                  <th colSpan={2} className="border border-gray-300 p-2 text-center font-semibold">
                    Meeting
                  </th>
                  <th colSpan={2} className="border border-gray-300 p-2 text-center font-semibold">
                    Visit
                  </th>
                  <th rowSpan={2} className="border border-gray-300 p-2 text-center font-semibold">
                    Not Interested
                  </th>
                  <th rowSpan={2} className="border border-gray-300 p-2 text-center font-semibold">
                    Interested
                  </th>
                </tr>
                {/* Sub Headers */}
                <tr className="bg-blue-500 text-white">
                  <th className="border border-gray-300 p-1 text-xs">Target</th>
                  <th className="border border-gray-300 p-1 text-xs">Achieved</th>
                  <th className="border border-gray-300 p-1 text-xs">Pending</th>
                  <th className="border border-gray-300 p-1 text-xs">Target</th>
                  <th className="border border-gray-300 p-1 text-xs">Achieved</th>
                  <th className="border border-gray-300 p-1 text-xs">Pending</th>
                  <th className="border border-gray-300 p-1 text-xs">Unique</th>
                  <th className="border border-gray-300 p-1 text-xs">Target</th>
                  <th className="border border-gray-300 p-1 text-xs">Achieved</th>
                  <th className="border border-gray-300 p-1 text-xs">Target</th>
                  <th className="border border-gray-300 p-1 text-xs">Achieved</th>
                </tr>
              </thead>
              <tbody>
                {employeeData.map((emp, index) => {
                  const capitalizedUserName = emp.userName
                    ? emp.userName.split(' ')
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ')
                    : '';

                  const adjustedCallTarget = (emp.callTarget || 0) * workingDays;
                  const adjustedFollowupTarget = (emp.followupTarget || 0) * workingDays;
                  const adjustedMeetingTarget = (emp.meetingTarget || 0) * workingDays;
                  
                  const callPending = adjustedCallTarget - (emp.callCount || 0);
                  const followupPending = adjustedFollowupTarget - (emp.followUpCount || 0);

                  return (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="border border-gray-300 p-2 font-semibold text-left">
                        {capitalizedUserName}
                      </td>
                      <td className="border border-gray-300 p-2 text-center">{adjustedCallTarget}</td>
                      <td className={`border border-gray-300 p-2 text-center ${
                        (emp.callCount || 0) >= adjustedCallTarget ? 'text-green-600 font-semibold' : 'text-red-600'
                      }`}>
                        {emp.callCount || 0}
                      </td>
                      <td className={`border border-gray-300 p-2 text-center ${
                        callPending <= 0 ? 'text-green-600 font-semibold' : 'text-orange-600'
                      }`}>
                        {callPending}
                      </td>
                      <td className="border border-gray-300 p-2 text-center">{adjustedFollowupTarget}</td>
                      <td className={`border border-gray-300 p-2 text-center ${
                        (emp.followUpCount || 0) >= adjustedFollowupTarget ? 'text-green-600 font-semibold' : 'text-red-600'
                      }`}>
                        {emp.followUpCount || 0}
                      </td>
                      <td className={`border border-gray-300 p-2 text-center ${
                        followupPending <= 0 ? 'text-green-600 font-semibold' : 'text-orange-600'
                      }`}>
                        {followupPending}
                      </td>
                      <td className="border border-gray-300 p-2 text-center">{emp.uniqueFollowupCount || 0}</td>
                      <td className="border border-gray-300 p-2 text-center">{adjustedMeetingTarget}</td>
                      <td className="border border-gray-300 p-2 text-center">{emp.meetingCount || 0}</td>
                      <td className="border border-gray-300 p-2 text-center">{emp.visitTarget || 0}</td>
                      <td className="border border-gray-300 p-2 text-center">{emp.visitCount || 0}</td>
                      <td className="border border-gray-300 p-2 text-center">{emp.notInterestedCount || 0}</td>
                      <td className="border border-gray-300 p-2 text-center">{emp.interestedCount || 0}</td>
                    </tr>
                  );
                })}
                {/* Total Row */}
                <tr className="bg-blue-800 text-white font-semibold">
                  <td className="border border-gray-300 p-2 text-center font-bold">TOTAL</td>
                  <td className="border border-gray-300 p-2 text-center">{totals.callTarget}</td>
                  <td className="border border-gray-300 p-2 text-center">{totals.callCount}</td>
                  <td className="border border-gray-300 p-2 text-center">{totals.callPending}</td>
                  <td className="border border-gray-300 p-2 text-center">{totals.followupTarget}</td>
                  <td className="border border-gray-300 p-2 text-center">{totals.followUpCount}</td>
                  <td className="border border-gray-300 p-2 text-center">{totals.followupPending}</td>
                  <td className="border border-gray-300 p-2 text-center">{totals.uniqueFollowupCount}</td>
                  <td className="border border-gray-300 p-2 text-center">{totals.meetingTarget}</td>
                  <td className="border border-gray-300 p-2 text-center">{totals.meetingCount}</td>
                  <td className="border border-gray-300 p-2 text-center">{totals.visitTarget}</td>
                  <td className="border border-gray-300 p-2 text-center">{totals.visitCount}</td>
                  <td className="border border-gray-300 p-2 text-center">{totals.notInterestedCount}</td>
                  <td className="border border-gray-300 p-2 text-center">{totals.interestedCount}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Total Records: {employeeData.length} employees
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition duration-200"
            >
              Cancel
            </button>
            <button
              onClick={downloadExcel}
              disabled={isDownloading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 transition duration-200 flex items-center gap-2"
            >
              {isDownloading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Downloading...
                </>
              ) : (
                'Download Excel'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelPreviewModal;