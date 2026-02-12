"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { X } from 'lucide-react';
import { MdClose } from 'react-icons/md';
import toast from 'react-hot-toast';
import { useC_STAFFMutation, useG_STAFFQuery } from './../../../_api_query/staff/staffs.api';
import { snackbar, addStaff, loader } from './../../../_api_query/store';
import { useG_ADMIN_STAFFQuery } from './../../../_api_query/staff/staffs.api';
const categories = [
  { label: 'Employee', value: 'Employee' },
  { label: 'P&L', value: 'P&L' },
  { label: 'Channel Partner', value: 'Broker' },
];

const personalEmployees = [
  { label: 'Yes', value: 'Yes' },
  { label: 'P&L', value: 'P&L' }
];

const UserRoles = [
  // { label: 'Super Admin', value: 'SuperAdmin', role: 1 },
  // { label: 'Admin', value: 'Admin', role: 2 },
  { label: 'VP Sales', value: 'VP Sales', role: 3 },
  { label: 'Sales Coordinator', value: 'Sales Coordinator', role: 31 },
  { label: 'Area Manager', value: 'Area Manager', role: 4 },
  { label: 'Sales Executive', value: 'Sales Executive', role: 5 },
  { label: 'Sales Manager', value: 'Sales Manager', role: 7 },
  { label: 'Team Lead', value: 'Team Lead', role: 6 },
];

interface StaffProps {
  setStaffAdd: (show: boolean) => void;
  refetch: () => void;
}

const Staff: React.FC<StaffProps> = ({ setStaffAdd, refetch }) => {
  const dispatch = useDispatch();
  const [staffAdd] = useC_STAFFMutation();
  const { data: Sdata, isSuccess: SisSuccess } = useG_STAFFQuery({}, { refetchOnMountOrArgChange: true });

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();
  const [showDropdown, setShowDropdown] = useState(false);
  const { data: adminStaffData, isSuccess: isAdminSuccess } = useG_ADMIN_STAFFQuery({});
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [personalEmployee, setPersonalEmployee] = useState<string | null>(null);
  const [teamHead, setTeamHead] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState(false);
  const [selectedSubordinates, setSelectedSubordinates] = useState<string[]>([]);
  const [subordinates, setSubordinates] = useState<string[]>([]);
  const [allStaff, setAllStaff] = useState<any[]>([]);
  const [selectedDesignation, setSelectedDesignation] = useState<string | null>(null);

  useEffect(() => {
    if (isAdminSuccess && adminStaffData?.data) {
      setAllStaff(adminStaffData.data);
    }
  }, [adminStaffData, isAdminSuccess]);

  const onSubmit = (data: any) => {
    if (!selectedEmployee) {
      setCategoryError(true);
      return;
    }

    const selectedRole = UserRoles.find(role => role.value === selectedDesignation)?.role || 3;

    const roleMap: { [key: string]: number } = {
      'Employee': 3,
      'P&L': 4,
      'Broker': 5
    };

    const processedData = {
      ...data,
      subordinate: subordinates,
      role: selectedRole, // Use the role from the selected designation
      personalEmployee,
      password: data.phone,
      manager: teamHead,
      designation: selectedDesignation // Add the selected designation
    };

    dispatch(loader(true));



    staffAdd(processedData)
      .unwrap()
      .then((res: any) => {
        dispatch(addStaff(false));
        toast.success('Employee Created Successfully');
        reset();
        refetch();
        setStaffAdd(false);
        setSelectedEmployee(null);
        setPersonalEmployee(null);
        dispatch(loader(false));
      })
      .catch((error: { data: { message: any; }; }) => {
        dispatch(loader(false));
        toast.error(error?.data?.message || 'An error occurred');
      });
  };
  const dropdownRef = useRef(null);

  const toTitleCase = (str: string) =>
    str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());


  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !(dropdownRef.current as any).contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderInput = (
    name: string,
    label: string,
    placeholder: string,
    rules?: any,
    transform?: (value: string) => string
  ) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <Controller
        control={control}
        rules={rules}
        render={({ field: { onChange, onBlur, value } }) => (
          <div>
            <input
              onBlur={onBlur}
              onChange={(e) => {
                const val = transform ? transform(e.target.value) : e.target.value;
                onChange(val);
              }}
              value={value}
              placeholder={placeholder}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
            {errors[name] && (
              <p className="text-xs text-red-500 mt-1">
                {errors[name]?.message as string}
              </p>
            )}
          </div>
        )}
        name={name}
        defaultValue=""
      />
    </div>
  );

  const renderSelect = (
    label: string,
    value: string | null,
    onChange: (val: string) => void,
    options: { label: string; value: string }[],
    error?: boolean
  ) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{label} is required</p>}
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex justify-center items-center overflow-y-auto py-4"
      onClick={() => {
        setStaffAdd(false);
        // setLeadFormData(null);
      }}
    >
      <div
        className="bg-white rounded-xl p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setStaffAdd(false)}
          className="absolute top-2 right-2 bg-[#004aad] p-2 rounded-full 
                               hover:bg-[#003a8d] transition-colors"
        >
          <MdClose size={24} color='white' />
        </button>

        <h2 className="text-2xl font-semibold text-center text-[#004aad] mb-6">
          Add Employee
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {renderInput('userName', 'Name', 'Enter Name',
            { required: "Name is missing" },
            // (text) => text.toLowerCase()
          )}

          {renderInput('email', 'Email', 'Enter Your Email',
            { required: "Email is missing" },
            (text) => text.toLowerCase()
          )}

          {renderInput('phone', 'Phone Number', 'Phone Number',
            {
              required: "Phone number is missing",
              validate: (v: string) => {
                if (String(v)?.length !== 10) {
                  return "Phone Number length should be 10 digits";
                }
                if (!/^\d+$/.test(v)) {
                  return "Phone number is wrong";
                }
                return true;
              }
            }
          )}

          {renderInput('address', 'Address', 'Enter the Address')}

          {renderInput('aadhar_no', 'Aadhar Number', 'Aadhar Number',
            {
              required: "Aadhar number is missing",
              validate: (v: string) => {
                if (String(v)?.length !== 12) {
                  return "Aadhar Number length should be 12 digits";
                }
                if (!/^\d+$/.test(v)) {
                  return "Aadhar number is wrong";
                }
                return true;
              }
            }
          )}

          {renderInput('pan_no', 'PAN', 'PAN Number',
            {
              required: "PAN number is missing",
              validate: (v: string) => {
                const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
                if (!panRegex.test(v)) {
                  return "PAN number should be in the format: AAAAA9999A";
                }
                return true;
              }
            },
            (text) => text.toUpperCase()
          )}

          {renderInput('date_of_birth', 'Date of Birth', 'Enter the DOB')}
          {renderInput('marriage_anniversary', 'Marriage Anniversary', 'Enter the Marriage Anniversary')}
          {renderInput('father_name', "Father's Name", 'Enter the Father Name')}
          {renderInput('emergency_contact_details', 'Emergency Contact Details', 'Emergency Contact Details')}

          {renderSelect(
            'Type of Employee',
            selectedEmployee,
            (val) => {
              setSelectedEmployee(val);
              setCategoryError(false);
            },
            categories,
            categoryError
          )}

          {renderSelect(
            'Personal Employee',
            personalEmployee,
            setPersonalEmployee,
            personalEmployees
          )}

          {renderSelect(
            'Team Head',
            teamHead,
            setTeamHead,
            SisSuccess
              ? Sdata.data?.map((cat: any) => ({
                label: cat.userName,
                value: cat._id
              }))
              : []
          )}
          <div className="mb-4 relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subordinates</label>
            <div
              className="border rounded-md p-2 cursor-pointer bg-white"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              {subordinates.length === 0 ? (
                <span className="text-gray-500">Select Subordinates</span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {subordinates.map((id) => {
                    const user = allStaff.find((s) => s._id === id);
                    return user ? (
                      <span key={id} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                        {user.userName}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            {showDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-64 overflow-y-auto">
                {allStaff.map((staff: any) => {
                  // Remove self from subordinates if currentUserId is not defined
                  // If you have currentUserId, define it above and use this check
                  // For now, just render all staff
                  // if (staff._id === currentUserId) return null; // Prevent self

                  const isSelected = subordinates.includes(staff._id);
                  return (
                    <label
                      key={staff._id}
                      className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            const updated = isSelected
                              ? subordinates.filter((id) => id !== staff._id)
                              : [...subordinates, staff._id];
                            setSubordinates(updated);
                          }}
                        />
                        <span>{toTitleCase(staff.userName)} ({staff.designation})</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>


          {renderSelect(
            'Designation',
            selectedDesignation,
            setSelectedDesignation,
            UserRoles.map(role => ({ label: role.label, value: role.value }))
          )}
          {selectedEmployee !== 'P&L' &&
            renderInput('salary', 'Salary', 'Enter the salary')}
          {renderInput('target', 'Target', 'Enter the target')}
          {renderInput('followupTarget', 'Follow-up Target', 'Enter the  Follow-up Target')}
          {renderInput('meetingTarget', 'Meeting Target', 'Enter the meeting Target')}
          {renderInput('callTarget', 'Call  Target', 'Enter the Call Target')}
          <button
            type="submit"
            className="w-full bg-[#004aad] text-white py-3 rounded-md hover:bg-blue-700 transition"
          >
            Add Employee
          </button>
        </form>
      </div>
    </div>
  );
};

export default Staff;