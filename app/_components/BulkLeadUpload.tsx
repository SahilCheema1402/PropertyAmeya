import React, { useState, ChangeEvent } from 'react';
import { toast } from 'react-toastify';
import { Loader2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useC_ExcelBulk_LeadMutation } from './../_api_query/Leads/leads.api';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { MdClose } from '@node_modules/react-icons/md';

interface BulkLeadUploadProps {
  onClose: () => void;
  onSuccess?: () => void;
}

interface ApiResponse {
  data?: {
    success: boolean;
    data: {
      uniqueLeadsCount: number;
      duplicateLeadsCount: number;
      duplicateLeads: Array<any>;
    };
  };
  error?: FetchBaseQueryError & {
    data?: {
      message: string;
    };
  };
}

const BulkLeadUpload: React.FC<BulkLeadUploadProps> = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duplicateLeads, setDuplicateLeads] = useState<Array<any>>([]);
  const [showDownload, setShowDownload] = useState(false);
  const [uploadExcelLead] = useC_ExcelBulk_LeadMutation();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        selectedFile.type === 'application/vnd.ms-excel') {
        setFile(selectedFile);
        setShowDownload(false);
        setDuplicateLeads([]);
      } else {
        toast.error('Please upload only Excel files (.xlsx or .xls)');
      }
    }
  };

  const downloadDuplicateLeads = () => {
    if (duplicateLeads.length === 0) {
      toast.error('No duplicate leads to download');
      return;
    }

    try {
      // Create a new workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(duplicateLeads);

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Duplicate Leads');

      // Generate the Excel file
      XLSX.writeFile(wb, 'duplicate_leads.xlsx');
      
      toast.success('Duplicate leads downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download duplicate leads');
    }
  };

  const processExcelFile = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      setIsProcessing(true);
      setShowDownload(false);

      const reader = new FileReader();
      reader.onload = async (e: ProgressEvent<FileReader>) => {
        try {
          const target = e.target;
          if (!target?.result) {
            toast.error('Error reading file');
            return;
          }
          const data = target.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const excelData = XLSX.utils.sheet_to_json(worksheet);

          // Upload the processed data
          const response = await uploadExcelLead(excelData) as any; // Changed to any for debugging
          // Handle different response formats
          const responseData = response.data ?? response;
          const duplicateLeads = responseData.data?.duplicateLeads ?? responseData.duplicateLeads;
          const duplicateLeadsCount = responseData.data?.duplicateLeadsCount ?? responseData.duplicateLeadsCount;
          const uniqueLeadsCount = responseData.data?.uniqueLeadsCount ?? responseData.uniqueLeadsCount;


          if (duplicateLeadsCount > 0 && Array.isArray(duplicateLeads)) {
            setDuplicateLeads(duplicateLeads);
            setShowDownload(true);
          } else {
            setShowDownload(false);
          }

          toast.success(
            `Upload successful! Added ${uniqueLeadsCount} new leads. ${duplicateLeadsCount} duplicates found.`
          );

          // Only close if no duplicates
          if (duplicateLeadsCount === 0) {
            onSuccess?.();
          }
        } catch (error) {
          console.error('Processing error:', error);
          toast.error('Error processing Excel file');
        } finally {
          setIsProcessing(false);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to process file');
      setIsProcessing(false);
    }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Bulk Lead Upload</h2>
          <button
            className="bg-[#004aad] p-1 rounded-full hover:bg-[#003a8d] transition-colors"
            onClick={onClose}
          >
            <MdClose size={16} color="white" />
          </button>
        </div>

        <div className="mb-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer text-blue-600 hover:text-blue-800"
            >
              {file ? file.name : 'Click to upload Excel file'}
            </label>
            <p className="text-sm text-gray-500 mt-2">
              Required columns: Name, Mobile, Email Id, Source, Address
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Optional: Alternate (alternate phone number)
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-4 items-center">
          {showDownload && duplicateLeads.length > 0 && (
            <button
              onClick={downloadDuplicateLeads}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Download size={18} />
              Download Duplicates ({duplicateLeads.length})
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={processExcelFile}
            disabled={!file || isProcessing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2"
          >
            {isProcessing && <Loader2 className="animate-spin" size={18} />}
            {isProcessing ? 'Processing...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkLeadUpload;