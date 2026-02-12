
import React, { useState } from "react";

interface Lead {
  name: string;
  email: string;
  phone: string;
  leadType: string;
  status: string;
  statusColor: string;
}

const leadsData: Lead[] = [
  {
    name: "BNI Charanjeet Singh",
    email: "jane@microsoft.com",
    phone: "(225) 555-0118",
    leadType: "Rent Lead",
    status: "Deal Done",
    statusColor: "bg-green-500",
  },
  {
    name: "BNI Charanjeet Singh",
    email: "jane@microsoft.com",
    phone: "(225) 555-0118",
    leadType: "Resale Lead",
    status: "Follow up",
    statusColor: "bg-teal-500",
  },
  {
    name: "BNI Charanjeet Singh",
    email: "jane@microsoft.com",
    phone: "(225) 555-0118",
    leadType: "Commercial Lead",
    status: "Not Interested",
    statusColor: "bg-red-500",
  },
  {
    name: "BNI Charanjeet Singh",
    email: "jane@microsoft.com",
    phone: "(225) 555-0118",
    leadType: "Commercial Lead",
    status: "Not Interested",
    statusColor: "bg-red-500",
  },
  {
    name: "BNI Charanjeet Singh",
    email: "jane@microsoft.com",
    phone: "(225) 555-0118",
    leadType: "Commercial Lead",
    status: "Deal Done",
    statusColor: "bg-green-500",
  },
  {
    name: "BNI Charanjeet Singh",
    email: "jane@microsoft.com",
    phone: "(225) 555-0118",
    leadType: "Commercial Lead",
    status: "Deal Done",
    statusColor: "bg-green-500",
  },
  {
    name: "BNI Charanjeet Singh",
    email: "jane@microsoft.com",
    phone: "(225) 555-0118",
    leadType: "Commercial Lead",
    status: "Not Interested",
    statusColor: "bg-red-500",
  },
  {
    name: "BNI Charanjeet Singh",
    email: "jane@microsoft.com",
    phone: "(225) 555-0118",
    leadType: "Commercial Lead",
    status: "Follow up",
    statusColor: "bg-teal-500",
  },
];

const LeadsTable: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // Calculate the indices for the data to display
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = leadsData.slice(indexOfFirstItem, indexOfLastItem);

  // Calculate total pages
  const totalPages = Math.ceil(leadsData.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      {/* Table Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-lg font-bold">Name</h1>
        <div className="relative">
          <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center">
            Lead Type
            <span className="ml-2">&#9662;</span> {/* Dropdown arrow */}
          </button>
        </div>
      </div>

      {/* Table */}
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="text-gray-600 border-b">
            <th className="p-3">Name</th>
            <th className="p-3">Email</th>
            <th className="p-3">Phone</th>
            <th className="p-3">Lead Type</th>
            <th className="p-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {currentData.map((lead, index) => (
            <tr
              key={index}
              className="hover:bg-gray-100 transition-colors border-b"
            >
              <td className="p-3">{lead.name}</td>
              <td className="p-3 flex items-center gap-2">
                {lead.email}
                <span className="text-purple-500">&#9993;</span> {/* Email Icon */}
              </td>
              <td className="p-3 ">
                {lead.phone}
                <span className="text-green-500">&#128222;</span> {/* Phone Icon */}
              </td>
              <td className="p-3">{lead.leadType}</td>
              <td className="p-3">
                <span
                  className={`text-white px-4 py-2 rounded-lg text-sm ${lead.statusColor}`}
                >
                  {lead.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4 text-gray-600 text-sm">
        <span>
          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, leadsData.length)} of {leadsData.length} entries
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
            disabled={currentPage === 1}
          >
            &lt;
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded-lg ${
                  page === currentPage
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                {page}
              </button>
            )
          )}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
            disabled={currentPage === totalPages}
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadsTable;
