"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronLeft, Edit, Check } from 'lucide-react';
import { useU_STAFFMutation } from './../../../_api_query/staff/staffs.api';
import { snackbar, loader } from './../../../_api_query/store';
import toast from 'react-hot-toast';
import { useG_ADMIN_STAFFQuery } from './../../../_api_query/staff/staffs.api';

// Define UserRoles mapping
const UserRoles = [
    //   { label: 'Super Admin', value: 'SuperAdmin', role: 1 },
    //   { label: 'Admin', value: 'Admin', role: 2 },
    { label: 'VP Sales', value: 'VP Sales', role: 3 },
    { label: 'Sales Coordinator', value: 'Sales Coordinator', role: 31 },
    { label: 'Area Manager', value: 'Area Manager', role: 4 },
    { label: 'Sales Executive', value: 'Sales Executive', role: 5 },
    { label: 'Sales Manager', value: 'Sales Manager', role: 7 },
    { label: 'Team Lead', value: 'Team Lead', role: 6 },
];

interface StaffDetailsProps {
    setStaffData: (show: boolean) => void;
    selectedFeedBack: any;
    refetch: () => void;
}

const StaffDetails: React.FC<StaffDetailsProps> = ({ setStaffData, selectedFeedBack, refetch }) => {
    const [userUpdate] = useU_STAFFMutation();
    const dispatch = useDispatch();
    const Loading: any = useSelector<any>((state) => state?.customStore?.loading);
    const [role_, setRole] = useState<string | null>(null);

    // Ref for the modal content
    const modalRef = useRef<HTMLDivElement>(null);
    const { data: adminStaffData, isSuccess: isAdminSuccess } = useG_ADMIN_STAFFQuery({});

    // State for form fields
    const [showDropdown, setShowDropdown] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(selectedFeedBack?.userName || '');
    const [phone, setPhone] = useState(selectedFeedBack?.phone || '');
    const [selectedCategory, setSelectedCategory] = useState(selectedFeedBack?.department || null);
    const [email, setEmail] = useState(selectedFeedBack?.email || '');
    const [address, setAddress] = useState(selectedFeedBack?.address || '');
    const [aadhar_no, setAadharNo] = useState(selectedFeedBack?.aadhar_no || '');
    const [salary, setSalary] = useState(selectedFeedBack?.salary || '');
    const [target, setTarget] = useState(selectedFeedBack?.target || '');
    const [callTarget, setCallTarget] = useState(selectedFeedBack?.callTarget || '');
    const [meetingTarget, setMeetingTarget] = useState(selectedFeedBack?.meetingTarget || '');
    const [followupTarget, setfollowupTarget] = useState(selectedFeedBack?.followupTarget || '');
    // const [designation, setDesignation] = useState(selectedFeedBack?.designation || '');
    const [designation, setDesignation] = useState(
        selectedFeedBack?.designation
            ? UserRoles.find(role =>
                role.value.toLowerCase() === selectedFeedBack.designation.toLowerCase()
            )?.value || selectedFeedBack.designation
            : ''
    );
    const [personalEmployee, setpersonalEmployee] = useState(selectedFeedBack?.personalEmployee || '');
    const [pan_no, setPanNo] = useState(selectedFeedBack?.pan_no || '');
    const [date_of_birth, setDOB] = useState(selectedFeedBack?.date_of_birth || '');
    const [father_name, setFatherName] = useState(selectedFeedBack?.father_name || '');
    const [emergency_contact_details, setEmergencyContactDetails] = useState(selectedFeedBack?.emergency_contact_details || '');
    const [marriage_anniversary, setMarriageAnniversary] = useState(selectedFeedBack?.marriage_anniversary || '');
    const [subordinates, setSubordinates] = useState<string[]>(selectedFeedBack?.subordinate || []);
    const [allStaff, setAllStaff] = useState<any[]>([]);
    // Validation state
    const [errors, setErrors] = useState<any>({});

    // Get current user ID from selectedFeedBack
    const currentUserId = selectedFeedBack?._id;

    const validatePhoneNumber = (v: string) => {
        if (!v) return "Phone number is missing";
        if (String(v)?.length !== 10) return "Phone Number length should be 10 digits";
        if (!/^\d+$/.test(v)) return "Phone number is wrong";
        return true;
    };

    const handlePhoneChange = (v: string) => {
        setPhone(v);
        const validationMessage = validatePhoneNumber(v);
        if (validationMessage !== true) {
            setErrors({ phone: { message: validationMessage } });
        } else {
            setErrors({});
        }
    };

    const capitalizeWords = (str: string | undefined): string => {
        if (!str) return '';
        return str.replace(/\b\w/g, char => char.toUpperCase());
    };

    useEffect(() => {
        if (isAdminSuccess && adminStaffData?.data) {
            setAllStaff(adminStaffData.data);
        }
    }, [adminStaffData, isAdminSuccess]);

    const toTitleCase = (str: string) =>
        str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

    const updateStaff = async () => {
        dispatch(loader(true));
        try {
            if (errors?.phone) {
                dispatch(loader(false));
                dispatch(snackbar({
                    visible: true,
                    message: "Invalid Phone number"
                }));
                return;
            }

            // Find the selected designation to get the role
            const selectedRoleObj = UserRoles.find(role => role.value === designation);
            const selectedRole = selectedRoleObj ? selectedRoleObj.role : selectedFeedBack.staffRole;

            const res: any = await userUpdate({
                body: {
                    staffRole: selectedRole,
                    userName: name,
                    phone: phone,
                    address: address,
                    email: email,
                    designation: designation,
                    personalEmployee: personalEmployee,
                    salary: salary,
                    target: target,
                    pan_no: pan_no,
                    aadhar_no: aadhar_no,
                    date_of_birth: date_of_birth,
                    callTarget: callTarget,
                    meetingTarget: meetingTarget,
                    followupTarget: followupTarget,
                    marriage_anniversary: marriage_anniversary,
                    father_name: father_name,
                    emergency_contact_details: emergency_contact_details,
                    subordinate: subordinates,
                    _id: selectedFeedBack._id
                },
            }).unwrap();

            toast.success('Employee Updated Successfully');
            refetch();
            setIsEditing(false);
            setStaffData(false);
        } catch (error: any) {
            toast.error(error?.data?.message || 'An error occurred');
        } finally {
            dispatch(loader(false));
        }
    };

    // Handle click outside to close modal
    const handleClickOutside = (event: MouseEvent) => {
        if (
            modalRef.current &&
            !modalRef.current.contains(event.target as Node) &&
            !isEditing
        ) {
            setStaffData(false);
        }
    };

    // Add and remove click outside listener
    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isEditing]);

    // Simulated role fetch
    useEffect(() => {
        const role = localStorage.getItem('role');
        setRole(role);
    }, []);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !(dropdownRef.current as any).contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        console.log('Current designation:', designation);
        console.log('UserRoles:', UserRoles);
    }, [designation]);

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center p-4 overflow-y-auto">
            <div
                ref={modalRef}
                className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={() => setStaffData(false)}
                        className="text-black dark:text-white"
                    >
                        <ChevronLeft size={32} />
                    </button>
                    <h2 className="text-2xl font-semibold text-center text-[#004aad] mb-6">
                        Employee Details
                    </h2>
                    {(role_ === '1' || role_ === '2') && (
                        <button
                            onClick={() => isEditing ? updateStaff() : setIsEditing(!isEditing)}
                            className="text-black dark:text-white"
                        >
                            {isEditing ? <Check size={32} /> : <Edit size={32} />}
                        </button>
                    )}
                </div>

                {/* Details Form */}
                <div className="space-y-4">
                    {/* Form Fields */}
                    <div className="space-y-4">
                        {/* Name */}
                        <div className="relative border rounded-xl p-3 bg-[#f5f9fe] dark:bg-gray-700">
                            <label className="absolute -top-3 left-2 bg-white dark:bg-gray-700 px-1 text-xs">Name</label>
                            {isEditing ? (
                                <input
                                    value={capitalizeWords(name)}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full text-black dark:text-white bg-transparent"
                                />
                            ) : (
                                <p>{capitalizeWords(selectedFeedBack?.userName)}</p>
                            )}
                        </div>

                        {/* Phone Number */}
                        <div className="relative border rounded-xl p-3 bg-[#f5f9fe] dark:bg-gray-700">
                            <label className="absolute -top-3 left-2 bg-white dark:bg-gray-700 px-1 text-xs">Phone Number</label>
                            {isEditing ? (
                                <>
                                    <input
                                        value={phone}
                                        onChange={(e) => handlePhoneChange(e.target.value)}
                                        className="w-full text-black dark:text-white bg-transparent"
                                        type="tel"
                                    />
                                    {errors?.phone && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {errors?.phone?.message}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p>{selectedFeedBack?.phone}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="relative border rounded-xl p-3 bg-[#f5f9fe] dark:bg-gray-700">
                            <label className="absolute -top-3 left-2 bg-white dark:bg-gray-700 px-1 text-xs">Email</label>
                            {isEditing ? (
                                <input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                    className="w-full text-black dark:text-white bg-transparent lowercase"
                                />
                            ) : (
                                <p>{selectedFeedBack?.email || "Email not available"}</p>
                            )}
                        </div>

                        {/* Aadhar No */}
                        <div className="relative border rounded-xl p-3 bg-[#f5f9fe] dark:bg-gray-700">
                            <label className="absolute -top-3 left-2 bg-white dark:bg-gray-700 px-1 text-xs">Aadhar No</label>
                            {isEditing ? (
                                <input
                                    value={aadhar_no}
                                    onChange={(e) => setAadharNo(e.target.value)}
                                    className="w-full text-black dark:text-white bg-transparent"
                                />
                            ) : (
                                <p>{selectedFeedBack?.aadhar_no || "Aadhar no. not available"}</p>
                            )}
                        </div>

                        {/* Pan Number */}
                        <div className="relative border rounded-xl p-3 bg-[#f5f9fe] dark:bg-gray-700">
                            <label className="absolute -top-3 left-2 bg-white dark:bg-gray-700 px-1 text-xs">PAN No</label>
                            {isEditing ? (
                                <input
                                    value={pan_no}
                                    onChange={(e) => setPanNo(e.target.value)}
                                    className="w-full text-black dark:text-white bg-transparent"
                                />
                            ) : (
                                <p>{selectedFeedBack?.pan_no || "Pan no. not available"}</p>
                            )}
                        </div>

                        {/* DOB */}
                        <div className="relative border rounded-xl p-3 bg-[#f5f9fe] dark:bg-gray-700">
                            <label className="absolute -top-3 left-2 bg-white dark:bg-gray-700 px-1 text-xs">DOB</label>
                            {isEditing ? (
                                <input
                                    value={date_of_birth}
                                    onChange={(e) => setDOB(e.target.value)}
                                    className="w-full text-black dark:text-white bg-transparent"
                                />
                            ) : (
                                <p>{selectedFeedBack?.date_of_birth || "DOB not available"}</p>
                            )}
                        </div>

                        {/* Marriage Anniversary */}
                        <div className="relative border rounded-xl p-3 bg-[#f5f9fe] dark:bg-gray-700">
                            <label className="absolute -top-3 left-2 bg-white dark:bg-gray-700 px-1 text-xs">Marriage Anniversary</label>
                            {isEditing ? (
                                <input
                                    value={marriage_anniversary}
                                    onChange={(e) => setMarriageAnniversary(e.target.value)}
                                    className="w-full text-black dark:text-white bg-transparent"
                                />
                            ) : (
                                <p>{selectedFeedBack?.marriage_anniversary || "Marriage Anniversary not available"}</p>
                            )}
                        </div>

                        {/* Father's Name */}
                        <div className="relative border rounded-xl p-3 bg-[#f5f9fe] dark:bg-gray-700">
                            <label className="absolute -top-3 left-2 bg-white dark:bg-gray-700 px-1 text-xs">Father's Name</label>
                            {isEditing ? (
                                <input
                                    value={father_name}
                                    onChange={(e) => setFatherName(e.target.value)}
                                    className="w-full text-black dark:text-white bg-transparent"
                                />
                            ) : (
                                <p>{selectedFeedBack?.father_name || "Father's name not available"}</p>
                            )}
                        </div>

                        {/* Emergency Contact */}
                        <div className="relative border rounded-xl p-3 bg-[#f5f9fe] dark:bg-gray-700">
                            <label className="absolute -top-3 left-2 bg-white dark:bg-gray-700 px-1 text-xs">Emergency Contact Details</label>
                            {isEditing ? (
                                <input
                                    value={emergency_contact_details}
                                    onChange={(e) => setEmergencyContactDetails(e.target.value)}
                                    className="w-full text-black dark:text-white bg-transparent"
                                />
                            ) : (
                                <p>{selectedFeedBack?.emergency_contact_details || "Emergency Contact not available"}</p>
                            )}
                        </div>

                        {/* address */}
                        <div className="relative border rounded-xl p-3 bg-[#f5f9fe] dark:bg-gray-700">
                            <label className="absolute -top-3 left-2 bg-white dark:bg-gray-700 px-1 text-xs">Address</label>
                            {isEditing ? (
                                <input
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full text-black dark:text-white bg-transparent"
                                />
                            ) : (
                                <p>{selectedFeedBack?.address || "Address not available"}</p>
                            )}
                        </div>

                        {/* personal employee */}
                        <div className="relative border rounded-xl p-3 bg-[#f5f9fe] dark:bg-gray-700">
                            <label className="absolute -top-3 left-2 bg-white dark:bg-gray-700 px-1 text-xs">Personal Employee</label>
                            {isEditing ? (
                                <input
                                    value={personalEmployee}
                                    onChange={(e) => setpersonalEmployee(e.target.value)}
                                    className="w-full text-black dark:text-white bg-transparent"
                                />
                            ) : (
                                <p>{selectedFeedBack?.personalEmployee || "Personal Employee not available"}</p>
                            )}
                        </div>

                        {/* designation */}
                        {/* designation */}
                        <div className="relative border rounded-xl p-3 bg-[#f5f9fe] dark:bg-gray-700">
                            <label className="absolute -top-3 left-2 bg-white dark:bg-gray-700 px-1 text-xs">
                                Designation
                            </label>

                            {isEditing ? (
                                <select
                                    value={designation}              // ← this drives what is pre-selected
                                    onChange={(e) => setDesignation(e.target.value)}
                                    className="w-full text-black dark:text-white bg-transparent"
                                >
                                    <option value="">Select Designation</option>
                                    {UserRoles.map((role) => (
                                        <option key={role.value} value={role.value}>
                                            {role.label}
                                        </option>
                                        // ↑ removed selected={...}
                                    ))}
                                </select>
                            ) : (
                                <p>
                                    {UserRoles.find((r) => r.value.toLowerCase() === designation.toLowerCase())?.label ||
                                        designation ||
                                        'Designation not available'}
                                </p>
                            )}
                        </div>

                        {/* Salary */}
                        <div className="relative border rounded-xl p-3 bg-[#f5f9fe] dark:bg-gray-700">
                            <label className="absolute -top-3 left-2 bg-white dark:bg-gray-700 px-1 text-xs">Salary</label>
                            {isEditing ? (
                                <input
                                    value={salary}
                                    onChange={(e) => setSalary(e.target.value)}
                                    className="w-full text-black dark:text-white bg-transparent"
                                />
                            ) : (
                                <p>{selectedFeedBack?.salary || "Salary not available"}</p>
                            )}
                        </div>

                        {/* Target */}
                        <div className="relative border rounded-xl p-3 bg-[#f5f9fe] dark:bg-gray-700">
                            <label className="absolute -top-3 left-2 bg-white dark:bg-gray-700 px-1 text-xs">Sales Target</label>
                            {isEditing ? (
                                <input
                                    value={target}
                                    onChange={(e) => setTarget(e.target.value)}
                                    className="w-full text-black dark:text-white bg-transparent"
                                />
                            ) : (
                                <p>{selectedFeedBack?.target || "Sales Target not available"}</p>
                            )}
                        </div>
                        <div className="relative border rounded-xl p-3 bg-[#f5f9fe] dark:bg-gray-700">
                            <label className="absolute -top-3 left-2 bg-white dark:bg-gray-700 px-1 text-xs">Call Target</label>
                            {isEditing ? (
                                <input
                                    value={callTarget}
                                    onChange={(e) => setCallTarget(e.target.value)}
                                    className="w-full text-black dark:text-white bg-transparent"
                                />
                            ) : (
                                <p>{selectedFeedBack?.callTarget || "Call Target not available"}</p>
                            )}
                        </div>
                        <div className="relative border rounded-xl p-3 bg-[#f5f9fe] dark:bg-gray-700">
                            <label className="absolute -top-3 left-2 bg-white dark:bg-gray-700 px-1 text-xs">Followup Target</label>
                            {isEditing ? (
                                <input
                                    value={followupTarget}
                                    onChange={(e) => setfollowupTarget(e.target.value)}
                                    className="w-full text-black dark:text-white bg-transparent"
                                />
                            ) : (
                                <p>{selectedFeedBack?.followupTarget || "Followup Target not available"}</p>
                            )}
                        </div>
                        <div className="relative border rounded-xl p-3 bg-[#f5f9fe] dark:bg-gray-700">
                            <label className="absolute -top-3 left-2 bg-white dark:bg-gray-700 px-1 text-xs">Meeting Target</label>
                            {isEditing ? (
                                <input
                                    value={meetingTarget}
                                    onChange={(e) => setMeetingTarget(e.target.value)}
                                    className="w-full text-black dark:text-white bg-transparent"
                                />
                            ) : (
                                <p>{selectedFeedBack?.meetingTarget || "Meeting Target not available"}</p>
                            )}
                        </div>

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
                                                    {toTitleCase(user.userName)} ({user.designation})
                                                </span>
                                            ) : null;
                                        })}
                                    </div>
                                )}
                            </div>

                            {showDropdown && (
                                <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-64 overflow-y-auto">
                                    {allStaff.map((staff: any) => {
                                        if (staff._id === currentUserId) return null; // Prevent self

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
                    </div>

                    {/* Update Button */}
                    {isEditing && (
                        <div className="flex justify-center mt-4">
                            <button
                                onClick={updateStaff}
                                className="bg-[#388edc] text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                            >
                                Update
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StaffDetails;