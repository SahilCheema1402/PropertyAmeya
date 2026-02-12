import React, { useState } from "react";
import { loader, form } from "./../_api_query/store";
import { useDispatch_ } from "./../../store";
import { useEffect } from "react";
import { useD_QueryMutation, useU_LeadMutation } from './../_api_query/Leads/leads.api';
import { Controller, useForm } from "react-hook-form";
import { useG_STAFFQuery } from './../_api_query/staff/staffs.api';
import { toast } from "react-toastify"
import { FaPlus, FaSave, FaSpinner, FaWindowClose, FaFire, FaExclamationTriangle, FaBell, FaTrash } from 'react-icons/fa'
import { MdClose, MdOutlineInventory } from 'react-icons/md';
import ReactModal from 'react-modal';
import { MdEdit } from 'react-icons/md';
import { FaRupeeSign } from 'react-icons/fa';
import { usePathname } from "next/navigation";
import { DateTime } from "luxon";
import { PiPaintBucketFill } from "react-icons/pi";
import { useRouter } from "next/navigation";

// Define types for status and call status mappings
type StatusCallStatusMap = {
    fresh: string[];
    followup: string[];
    notInterest: string[];
    'Deal Done': string[];
};

type CallStatusStatusMap = {
    'Switch Off': string[];
    'Ringing': string[];
    'Call Back': string[];
    'Wrong No': string[];
    'Call Picked': string[];
    'Visit Done': string[];
    'Meeting Done': string[];
};

export default function QueryTable({ setLeadForm, setLeadIndex, id, setQueryForm, setQueryFormType_, selectedStatus }: any) {
    const { control, handleSubmit, formState: { errors }, reset, setValue } = useForm({});
    const dispatch = useDispatch_();
    const [editingQueryIndex, setEditingQueryIndex] = useState<number | null>(null);
    const [editedQuery, setEditedQuery] = useState<any>(null);
    const [currentUserId, setCurrentUserId] = useState<string>("");
    const [userData, setUserData] = useState<any>({});
    const router = useRouter();
    const capitalizeFirstLetter = (str: string) => {
        if (!str) return "";
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    const [D_query] = useD_QueryMutation(); // Add this hook
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ isOpen: boolean; queryId: string; queryIndex: number }>({
        isOpen: false,
        queryId: '',
        queryIndex: -1
    });

    // Add this function to handle query deletion
    const handleDeleteQuery = async (queryId: string, queryIndex: number) => {
        try {
            setIsDeleting(queryId);
            dispatch(loader(true));

            const res = await D_query({
                queryId,
                leadId: id._id
            }).unwrap();

            if (res.success) {
                toast.success("Query deleted successfully");
                setDeleteConfirmModal({ isOpen: false, queryId: '', queryIndex: -1 });
                // You might want to refresh the lead data here or update local state
            } else {
                toast.error(res.message || "Failed to delete query");
            }
        } catch (error: any) {
            console.error("Delete query error:", error);
            toast.error(error.data?.message || "Failed to delete query");
        } finally {
            setIsDeleting(null);
            dispatch(loader(false));
        }
    };

    // Add this function to open confirmation modal
    const openDeleteConfirm = (queryId: string, queryIndex: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteConfirmModal({
            isOpen: true,
            queryId,
            queryIndex
        });
    };

    // Add this function to close confirmation modal
    const closeDeleteConfirm = () => {
        setDeleteConfirmModal({
            isOpen: false,
            queryId: '',
            queryIndex: -1
        });
    };

    const handleMarkAsInventory = () => {
        // Create a query string with lead details
        const queryParams = new URLSearchParams();
        queryParams.append('name', id?.name || '');
        queryParams.append('phone', id?.phone || '');
        queryParams.append('email', id?.email || '');
        queryParams.append('source', id?.source || '');
        queryParams.append('address', id?.address || '');

        // Open new tab with inventory form and query params
        const inventoryUrl = `/inventory?${queryParams.toString()}`;
        window.open(inventoryUrl, '_blank');

        // Close the lead form
        setLeadForm(false);
        setQueryFormType_(null);
    };
    useEffect(() => {
        // Client-side only
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        console.log("User Data from localStorage:", user);
        setUserData(user);
        setCurrentUserId(user.userId);
    }, []);

    // Helper function to check if lead can be marked as Hot Prospect
    const canMarkAsHotProspect = (leadStatus: string, callStatus: string) => {
        const validCallStatuses = ['Call Picked', 'Visit Done', 'Meeting Done'];
        return leadStatus === 'followup' && validCallStatuses.includes(callStatus);
    };

    // Helper function to check if lead can be marked as Suspect
    const canMarkAsSuspect = (leadStatus: string, callStatus: string) => {
        return leadStatus === 'fresh' && (!callStatus || callStatus === 'Call Back');
    };

    // Function to handle Hot Prospect marking
    const handleMarkAsHotProspect = async () => {
        try {
            dispatch(loader(true));
            const res = await U_lead({
                _id: id._id,
                type_: "markHotProspect",
                isHotProspect: !id.isHotProspect
            }).unwrap();
            toast.success(id.isHotProspect ? "Removed from Hot Prospects" : "Marked as Hot Prospect");
        } catch (error) {
            console.error("Hot Prospect update error:", error);
            toast.error("Failed to update Hot Prospect status");
        } finally {
            dispatch(loader(false));
        }
    };

    // Function to handle Suspect marking
    const handleMarkAsSuspect = async () => {
        try {
            dispatch(loader(true));
            const res = await U_lead({
                _id: id._id,
                type_: "markSuspect",
                isSuspect: !id.isSuspect
            }).unwrap();
            toast.success(id.isSuspect ? "Removed from Suspects" : "Marked as Suspect");
        } catch (error) {
            console.error("Suspect update error:", error);
            toast.error("Failed to update Suspect status");
        } finally {
            dispatch(loader(false));
        }
    };

    // Function to handle toggle query addition permission (Admin only)
    const handleToggleQueryAddition = async () => {
        try {
            setIsTogglingQueryAddition(true);
            dispatch(loader(true));
            const res = await U_lead({
                _id: id._id,
                type_: "toggleQueryAddition",
                query: {
                    allowQueryAddition: !localAllowQueryAddition
                }
            }).unwrap();
            toast.success(res.data?.allowQueryAddition ? "Query addition enabled" : "Query addition disabled");
            // Update the local state to reflect the change immediately
            setLocalAllowQueryAddition(res.data?.allowQueryAddition);
        } catch (error: any) {
            console.error("Toggle query addition error:", error);
            toast.error(error.data?.message || "Failed to toggle query addition permission");
        } finally {
            dispatch(loader(false));
            setIsTogglingQueryAddition(false);
        }
    };

    // Check if user is admin (role 1 or 2)
    const isAdmin = () => {
        return userData?.role === 1 || userData?.role === 2 || role_ == 1 || role_ == 2;
    };

    // Determine if + button should be enabled
    const isPlusButtonEnabled = () => {
        // If no queries exist, enable by default
        if (queryData.length === 0) {
            return true;
        }
        // If queries exist, check the allowQueryAddition toggle
        return localAllowQueryAddition === true;
    };

    // Function to handle instant ringing remark
    const handleInstantRingingRemark = async (queryId: string, queryIndex: number) => {
        try {
            dispatch(loader(true));
            const res = await U_lead({
                _id: queryId,
                type_: "remarks",
                remarks: "Phone was ringing, no response from client",
                leadIndex: queryIndex,
                query: {}
            }).unwrap();
            toast.success("Ringing remark added successfully");
        } catch (error) {
            console.error("Ringing remark error:", error);
            toast.error("Failed to add ringing remark");
        } finally {
            dispatch(loader(false));
        }
    };

    const handleEditQuery = (queryIndex: number) => {
        setEditingQueryIndex(queryIndex);
        const query = queryData[queryIndex];
        setEditedQuery({
            ...query,
            // Ensure we have default values for status fields
            status: query.status || '',
            call_status: query.call_status || ''
        });
        setAddRemarks(true);
    };

    // Define status mappings with proper types
    const validStatusCallStatusMap: StatusCallStatusMap = {
        'fresh': ['Ringing', 'Call Back', 'Wrong No', 'Switch Off'],
        'followup': ['Call Picked', 'Meeting Done', 'Visit Done'],
        'notInterest': [], // Any call status is allowed
        'Deal Done': ['Call Picked', 'Meeting Done', 'Visit Done']
    };

    const validCallStatusStatusMap: CallStatusStatusMap = {
        'Ringing': ['fresh'],
        'Call Back': ['fresh'],
        'Wrong No': ['fresh'],
        'Switch Off': ['fresh'],
        'Call Picked': ['followup', 'Deal Done'],
        'Meeting Done': ['followup', 'Deal Done'],
        'Visit Done': ['followup', 'Deal Done']
    };

    const validateStatusChange = (newStatus: keyof StatusCallStatusMap, currentCallStatus: string): boolean => {
        // If status has specific call status requirements
        if (validStatusCallStatusMap[newStatus]?.length > 0) {
            return validStatusCallStatusMap[newStatus].includes(currentCallStatus);
        }
        return true; // No restrictions for this status
    };

    const validateCallStatusChange = (newCallStatus: keyof CallStatusStatusMap, currentStatus: string): boolean => {
        // If call status has specific status requirements
        if (validCallStatusStatusMap[newCallStatus]?.length > 0) {
            return validCallStatusStatusMap[newCallStatus].includes(currentStatus);
        }
        return true; // No restrictions for this call status
    };

    // Updated renderEditableField function with validation only on save
    const renderEditableField = (label: string, value: any, fieldName: string, type = "text") => {
        const editableFields = [
            'followup_date',
            'visit_done',
            'exp_visit_date',
            'visitDoneBy',
            'meetingDoneBy',
            'budget',
            'size',
            'status',
            'call_status'
        ];

        if (editingQueryIndex !== null && editableFields.includes(fieldName)) {
            return (
                <div className="flex flex-col">
                    <span className="font-semibold text-[#71757d]">
                        {label} {fieldName === 'followup_date' && <span className="text-red-500">*</span>}
                    </span>
                    {type === "date" ? (
                        <input
                            type="date"
                            value={
                                editedQuery[fieldName]
                                    ? new Date(editedQuery[fieldName]).toISOString().split("T")[0]
                                    : ""
                            }
                            onChange={(e) =>
                                setEditedQuery({
                                    ...editedQuery,
                                    [fieldName]: new Date(e.target.value).toISOString(),
                                })
                            }
                            className="border p-1 rounded"
                            required={fieldName === "followup_date"}
                            max={
                                fieldName === "visit_done" || fieldName === "meeting_done"
                                    ? new Date().toISOString().split("T")[0] // ✅ disable future
                                    : undefined // ✅ allow future for others like followup_date
                            }
                        />

                    ) : type === "select" ? (
                        <select
                            value={editedQuery[fieldName] || ''}
                            onChange={(e) => {
                                const newValue = e.target.value;
                                setEditedQuery({
                                    ...editedQuery,
                                    [fieldName]: newValue
                                });
                            }}
                            className="border p-1 rounded"
                        >
                            {fieldName === 'status' && (
                                <>
                                    <option value="">Select Status</option>
                                    <option value="fresh">Fresh</option>
                                    <option value="followup">Followup</option>
                                    <option value="notInterest">Not Interest</option>
                                    <option value="Deal Done">Deal Done</option>
                                </>
                            )}
                            {fieldName === 'call_status' && (
                                <>
                                    <option value="">Select Call Status</option>
                                    <option value="Switch Off">Switch Off</option>
                                    <option value="Ringing">Ringing</option>
                                    <option value="Call Back">Call Back</option>
                                    <option value="Wrong No">Wrong No</option>
                                    <option value="Call Picked">Call Picked</option>
                                    <option value="Visit Done">Visit Done</option>
                                    <option value="Meeting Done">Meeting Done</option>
                                </>
                            )}
                            {fieldName === 'visitDoneBy' && (
                                <>
                                    <option value="">Select Employee</option>
                                    {staffData?.data?.map((staff: any) => (
                                        <option key={staff._id} value={staff._id}>
                                            {capitalizeFirstLetter(staff.userName)}
                                        </option>
                                    ))}
                                </>
                            )}

                            {fieldName === 'meetingDoneBy' && (
                                <>
                                    <option value="">Select Employee</option>
                                    {staffData?.data?.map((staff: any) => (
                                        <option key={staff._id} value={staff._id}>
                                            {capitalizeFirstLetter(staff.userName)}
                                        </option>
                                    ))}
                                </>
                            )}

                        </select>
                    ) : (
                        <input
                            type={type}
                            value={editedQuery[fieldName] || ''}
                            onChange={(e) => setEditedQuery({
                                ...editedQuery,
                                [fieldName]: e.target.value
                            })}
                            className="border p-1 rounded"
                        />
                    )}
                </div>
            );
        } else {
            return (
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-[#71757d]">{label}</span>
                    <span className="text-[#71757d] capitalize">
                        {type === "date" && value ? formatDateToDDMMYYYY(value) : value || 'Not specified'}
                    </span>
                </div>
            );
        }
    };

    // Updated unified save function that handles both field updates and remarks
    const saveEditedQueryWithRemarks = async () => {
        // Block “Fresh” when call-status is Call Picked / Visit Done / Meeting Done
        if (["Call Picked", "Visit Done", "Meeting Done"].includes(editedQuery.call_status) && editedQuery.status === "fresh") {
            toast.error("Wrong combination: select either Follow-up or Deal Done");
            return;
        }
        // Mandatory status check for specific call statuses
        if (["Call Picked", "Visit Done", "Meeting Done"].includes(editedQuery.call_status) && !editedQuery.status) {
            toast.error("Status is required");
            return;
        }
        if (editingQueryIndex === null || !editedQuery) return;

        // Check if followup_date is provided when editing
        if (!editedQuery.followup_date) {
            toast.error("Followup date is required");
            return;
        }

        // Check if remarks are provided
        const remarksValue = control._formValues.remarks;
        if (!remarksValue) {
            toast.error("Please enter remarks");
            return;
        }

        // VALIDATION ONLY HAPPENS HERE - NOT DURING SELECTION
        if (editedQuery.status && editedQuery.call_status) {
            if (!validateStatusChange(editedQuery.status as keyof StatusCallStatusMap, editedQuery.call_status)) {
                toast.error(`Invalid status combination: Cannot have status ${editedQuery.status} with call status ${editedQuery.call_status}`);
                return;
            }

            if (!validateCallStatusChange(editedQuery.call_status as keyof CallStatusStatusMap, editedQuery.status)) {
                toast.error(`Invalid call status combination: Cannot have call status ${editedQuery.call_status} with status ${editedQuery.status}`);
                return;
            }
        }

        try {
            dispatch(loader(true));
            setIsSubmitting(true);

            // First update the query fields
            const cleanQuery = {
                followup_date: editedQuery.followup_date,
                visit_done: editedQuery.visit_done,
                exp_visit_date: editedQuery.exp_visit_date,
                visitDoneBy: editedQuery.visitDoneBy,
                meetingDoneBy: editedQuery.meetingDoneBy,
                budget: editedQuery.budget,
                size: editedQuery.size,
                status: editedQuery.status,
                call_status: editedQuery.call_status,
                updateAt: DateTime.now().setZone('Asia/Kolkata'),
                call_date: DateTime.now().setZone('Asia/Kolkata')
            };

            // Update fields
            await U_lead({
                _id: editedQuery._id,
                type_: "update",
                leadIndex: editingQueryIndex,
                query: cleanQuery
            }).unwrap();

            // Then add remarks
            await U_lead({
                _id: editedQuery._id,
                type_: "remarks",
                remarks: remarksValue,
                leadIndex: editingQueryIndex,
                query: cleanQuery
            }).unwrap();

            toast.success("Query and remarks updated successfully");
            setEditingQueryIndex(null);
            setEditedQuery(null);
            setAddRemarks(false);
            reset();

        } catch (error) {
            console.error("Update error:", error);
            toast.error("Failed to update query and remarks");
        } finally {
            dispatch(loader(false));
            setIsSubmitting(false);
        }
    };

    const pathname = usePathname();
    // const { data: staffData } = useG_STAFFQuery(currentUserId);
    const { data: staffData, isSuccess: SisSuccess } = useG_STAFFQuery('');
    const [addRemarks, setAddRemarks] = useState<boolean>(false)
    const [modalQueryIndex, setModalQueryIndex] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [role_, setRole] = useState<any>(1);
    const [U_lead] = useU_LeadMutation();
    const [isTogglingQueryAddition, setIsTogglingQueryAddition] = useState(false);
    const [localAllowQueryAddition, setLocalAllowQueryAddition] = useState<boolean>(id.allowQueryAddition ?? true);

    const getStaffNameById = (staffId: string) => {
        if (!staffData?.data || !staffId) return "Not specified";

        const staffMember = staffData.data.find((staff: any) => staff._id === staffId);
        return staffMember ? capitalizeFirstLetter(staffMember.userName) : "Unknown staff";
    };


    useEffect(() => {
        function roleFetch() {
            if (typeof window !== "undefined") {
                const role = localStorage.getItem("role");
                setRole(role);
            }
        }
        roleFetch();
    }, [role_]);

    const customModalStyles: ReactModal.Styles = {
        overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(2px)'
        },
        content: {
            position: 'relative' as const,
            inset: 'auto',
            width: '80%',
            maxWidth: '800px',
            maxHeight: '80vh',
            margin: 'auto',
            padding: '20px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            background: 'white',
            overflow: 'auto',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }
    };

    function formatDateToDDMMYYYY(datetimeString: string | number | Date) {
        if (!datetimeString) {
            return 'Date not available';
        }

        const date: any = new Date(datetimeString);

        if (isNaN(date)) {
            return 'Invalid date format';
        }

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}-${month}-${year}`;
    }

    // Legacy submit function for direct remarks (keeping for compatibility)
    const submit = async (data: any) => {
        const remarksValue = control._formValues.remarks;

        if (!remarksValue) {
            toast.error("Please enter remarks");
            return;
        }

        try {
            dispatch(loader(true));
            const res = await U_lead({
                _id: data,
                type_: "remarks",
                remarks: remarksValue,
                leadIndex: null,
                query: {
                    ...data
                },
            }).unwrap();
            toast.success("Remarks added successfully");
            setLeadForm(false);
            reset();
            setAddRemarks(false);

        } catch (error: any) {
            console.error("Update error:", error);
            toast.error(error.data?.message || "Failed to add remarks");
        } finally {
            dispatch(loader(false));
        }
    };

    const openModal = (queryIndex: number) => {
        setModalQueryIndex(queryIndex);
    };

    const closeModal = () => {
        setModalQueryIndex(null);
    };

    const formatDate = (dateString: any) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear().toString().slice(-2);

        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;

        return `${day}-${month}-${year} ${hours}:${minutes}:${seconds} ${ampm}`;
    };

    const getQueryData = () => {
        if (id.queryDetails && Array.isArray(id.queryDetails) && id.queryDetails.length > 0) {
            return id.queryDetails;
        }

        if (id.query && Array.isArray(id.query) && id.query.length > 0) {
            if (typeof id.query[0] === 'object' && id.query[0]._id) {
                return id.query;
            }
        }

        return [];
    };

    const queryData = getQueryData();

    return (
        <div onClick={(e) => {
            e.stopPropagation();
            setLeadForm(null);
            setQueryFormType_(null);
        }} className="fixed inset-0 bg-black/30 dark:bg-zinc-700/50 z-10 flex justify-center items-center p-4">
            {/* Delete Confirmation Modal */}
            <ReactModal
                isOpen={deleteConfirmModal.isOpen}
                onRequestClose={closeDeleteConfirm}
                style={customModalStyles}
                contentLabel="Delete Confirmation"
                ariaHideApp={false}
            >
                <div className="w-full h-full p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-red-600">Confirm Deletion</h2>
                        <button
                            onClick={closeDeleteConfirm}
                            className="bg-gray-300 p-2 rounded-full cursor-pointer hover:bg-gray-400"
                        >
                            <MdClose size={20} color="black" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <p className="text-gray-700">
                            Are you sure you want to delete this query? This action cannot be undone and the data will be permanently deleted.
                        </p>

                        <div className="flex space-x-4 justify-end">
                            <button
                                onClick={closeDeleteConfirm}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteQuery(deleteConfirmModal.queryId, deleteConfirmModal.queryIndex)}
                                disabled={isDeleting === deleteConfirmModal.queryId}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400"
                            >
                                {isDeleting === deleteConfirmModal.queryId ? (
                                    <div className="flex items-center">
                                        <FaSpinner className="animate-spin mr-2" />
                                        Deleting...
                                    </div>
                                ) : (
                                    "Delete Permanently"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </ReactModal>
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    setQueryFormType_(null);
                }}
                className="w-full max-w-2xl max-h-[95vh] bg-[#f7f7fd] rounded-xl flex flex-col overflow-auto"
            >
                {/* Header with Add, Hot Prospect/Suspect, and Close buttons */}
                <div className="flex justify-between items-center p-4 sticky top-0 bg-[#f7f7fd] z-10">
                    <div className="flex space-x-2">
                        {/* Add Query Button - Only show when enabled */}
                        {isPlusButtonEnabled() && (
                            <div
                                className="bg-[#004aad] cursor-pointer hover:bg-[#003c8d] p-2 rounded-full"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setQueryForm(true);
                                    setQueryFormType_('add')
                                }}
                                title="Add New Query"
                            >
                                <FaPlus size={22} color="white" />
                            </div>
                        )}

                        <div
                            className="bg-green-500 px-3 py-2 rounded-full cursor-pointer flex items-center gap-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsInventory();
                            }}
                            title="Mark as Inventory"
                        >
                            <PiPaintBucketFill size={22} color="white" />
                            <span className="text-white font-medium">Inventory</span>
                        </div>

                        {/* Hot Prospect Button - Only show if conditions are met */}
                        {canMarkAsHotProspect(id.leadStatus, id.call_status) && (
                            <div
                                className={`p-2 rounded-full cursor-pointer ${id.isHotProspect
                                    ? 'bg-orange-500 hover:bg-orange-600'
                                    : 'bg-gray-400 hover:bg-orange-500'
                                    }`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsHotProspect();
                                }}
                                title={id.isHotProspect ? "Remove from Hot Prospects" : "Mark as Hot Prospect"}
                            >
                                <FaFire size={22} color="white" />
                            </div>
                        )}

                        {/* Suspect Button - Only show if conditions are met */}
                        {canMarkAsSuspect(id.leadStatus, id.call_status) && (
                            <div
                                className={`p-2 rounded-full cursor-pointer ${id.isSuspect
                                    ? 'bg-red-500 hover:bg-red-600'
                                    : 'bg-gray-400 hover:bg-red-500'
                                    }`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsSuspect();
                                }}
                                title={id.isSuspect ? "Remove from Suspects" : "Mark as Suspect"}
                            >
                                <FaExclamationTriangle size={22} color="white" />
                            </div>
                        )}

                        {/* Admin Query Addition Toggle - Only show for admins */}
                        {isAdmin() && (
                            <div className="flex items-center space-x-2 bg-white rounded-full px-3 py-2 shadow-md">
                                <span className="text-sm font-medium text-gray-700">Query Addition</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleQueryAddition();
                                    }}
                                    disabled={isTogglingQueryAddition}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${localAllowQueryAddition ? 'bg-blue-600' : 'bg-gray-300'
                                        } ${isTogglingQueryAddition ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    title={localAllowQueryAddition ? "Disable query addition" : "Enable query addition"}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${localAllowQueryAddition ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        )}
                    </div>

                    <div
                        className="bg-[#004aad] p-2 rounded-full cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            setLeadForm(null);
                        }}
                    >
                        <MdClose size={22} color="white" />
                    </div>
                </div>

                {id ? (
                    <div className="px-4 space-y-4 overflow-y-auto">
                        {/* Personal Details Section */}
                        <div className="bg-white rounded-lg p-4 shadow-md">
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="text-xl font-bold text-gray-700">Personal Details</h2>
                                {/* Status Badges */}
                                <div className="flex space-x-2">
                                    {id.isHotProspect && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                            <FaFire className="mr-1" size={12} />
                                            Hot Prospect
                                        </span>
                                    )}
                                    {id.isSuspect && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            <FaExclamationTriangle className="mr-1" size={12} />
                                            Suspect
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="flex items-center">
                                    <span className="font-semibold text-gray-600 mr-2">Name:</span>
                                    <span className="text-gray-700 capitalize">{id.name}</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="font-semibold text-gray-600 mr-2">Mobile:</span>
                                    <span className="text-gray-700 uppercase">{id?.phone}</span>
                                </div>
                                {id?.alternate && (
                                    <div className="flex items-center">
                                        <span className="font-semibold text-gray-600 mr-2">Alternate Number:</span>
                                        <span className="text-gray-700 uppercase">{id.alternate}</span>
                                    </div>
                                )}
                                <div className="flex items-center">
                                    <span className="font-semibold text-gray-600 mr-2">Email:</span>
                                    <span className="text-gray-700">{id.email || "Email not present"}</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="font-semibold text-gray-600 mr-2">Address:</span>
                                    <span className="text-gray-700 capitalize">{id.address || "Address not present"}</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="font-semibold text-gray-600 mr-2">Source:</span>
                                    <span className="text-gray-700">{id.source || "Source not present"}</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="font-semibold text-gray-600 mr-2">Lead Status:</span>
                                    <span className="text-gray-700 capitalize">{id.leadStatus}</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="font-semibold text-gray-600 mr-2">Call Status:</span>
                                    <span className="text-gray-700 capitalize">{id.call_status || "Not specified"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Queries Section */}
                        <div className="space-y-4">
                            {queryData.length > 0 ? (
                                queryData.map((items: any, index: number) => (
                                    <div key={index} className="bg-white rounded-lg p-4 shadow-md relative">
                                        {/* Action Buttons Row */}
                                        <div className="absolute top-2 right-2 flex space-x-2">
                                            {/* Instant Ringing Button */}
                                            {/* <div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleInstantRingingRemark(items._id, index);
                                                }}
                                                className="bg-yellow-500 hover:bg-yellow-600 rounded-full w-8 h-8 flex justify-center items-center cursor-pointer"
                                                title="Add instant ringing remark"
                                            >
                                                <FaBell color="white" size={14} />
                                            </div> */}

                                            {/* Save Button - Only show when editing */}
                                            {editingQueryIndex === index && (
                                                <button
                                                    onClick={saveEditedQueryWithRemarks}
                                                    className="bg-green-500 hover:bg-green-600 rounded-full w-8 h-8 flex justify-center items-center cursor-pointer"
                                                    title="Save changes and remarks"
                                                >
                                                    <FaSave color="white" size={14} />
                                                </button>
                                            )}

                                            {/* Edit Button */}
                                            <div
                                                onClick={(e) => {
                                                    dispatch(form(items));
                                                    e.stopPropagation();
                                                    setQueryForm(true);
                                                    setQueryFormType_('update');
                                                    setLeadIndex(index);
                                                }}
                                                className="bg-[#e5e5e5] hover:bg-gray-300 rounded-full w-8 h-8 flex justify-center items-center cursor-pointer"
                                                title="Edit in form"
                                            >
                                                <MdEdit color="gray" size={14} />
                                            </div>

                                            {(userData?.role === 1 || userData?.role === 2 || userData?.role === 31 || role_ === 1 || role_ === 2 || role_ === 31) && (
                                                <div
                                                    onClick={(e) => openDeleteConfirm(items._id, index, e)}
                                                    className="bg-red-500 hover:bg-red-600 rounded-full w-8 h-8 flex justify-center items-center cursor-pointer"
                                                    title="Delete Query"
                                                >
                                                    <FaTrash color="white" size={14} />
                                                </div>
                                            )}

                                        </div>

                                        {/* Query Details Grid */}
                                        <div className="grid grid-cols-2 gap-4 text-sm pt-10">
                                            {renderEditableField('Followup Date', items.followup_date, 'followup_date', 'date')}
                                            {renderEditableField('Visit Done', items.visit_done, 'visit_done', 'date')}
                                            {renderEditableField('Expected Visit Date', items.exp_visit_date, 'exp_visit_date', 'date')}
                                            {renderEditableField('Visit Done With', getStaffNameById(items.visitDoneBy), 'visitDoneBy', 'select')}
                                            {renderEditableField('Meeting Done With', getStaffNameById(items.meetingDoneBy), 'meetingDoneBy', 'select')}
                                            {renderEditableField('Budget', items.budget, 'budget', 'number')}
                                            {renderEditableField('Size', items.size, 'size')}
                                            {renderEditableField('Call Status', items.call_status, 'call_status', 'select')}
                                            {renderEditableField('Status', items.status, 'status', 'select')}

                                            {/* Non-editable fields */}
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold text-[#71757d]">Lead Type</span>
                                                <span className="text-[#71757d] capitalize">{items.leadType || 'Not specified'}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold text-[#71757d]">Project</span>
                                                <span className="text-[#71757d] capitalize">{items.project || 'Not specified'}</span>
                                            </div>
                                            {items.leadType !== 'commercial' && (
                                                <div className="flex justify-between items-center">
                                                    <span className="font-semibold text-[#71757d]">BHK</span>
                                                    <span className="text-[#71757d] capitalize">{items.bhk || 'Not specified'}</span>
                                                </div>
                                            )}
                                            {items.leadType !== 'commercial' && (
                                                <div className="flex justify-between items-center">
                                                    <span className="font-semibold text-[#71757d]">Floor</span>
                                                    <span className="text-[#71757d] capitalize">{items.floor || 'Not specified'}</span>
                                                </div>
                                            )}
                                            {items.leadType === 'rent' && (
                                                <div className="flex justify-between items-center">
                                                    <span className="font-semibold text-[#71757d]">Shifting Date</span>
                                                    <span className="text-[#71757d] capitalize">
                                                        {items.shifting_date ? formatDateToDDMMYYYY(items.shifting_date) : 'Not specified'}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold text-[#71757d]">Type</span>
                                                <span className="text-[#71757d] capitalize">{items.type || 'Not specified'}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold text-[#71757d]">Total Calls Made</span>
                                                <span className="text-[#71757d] capitalize">{items?.remarksDetails?.length || 0}</span>
                                            </div>
                                        </div>

                                        {/* Remarks Section */}
                                        <div className="mt-4 flex justify-between items-center">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-semibold text-[#71757d]">Remarks</span>
                                                <button
                                                    onClick={() => handleEditQuery(index)}
                                                    className="hover:bg-gray-100 p-1 rounded-full"
                                                    title="Add remarks and edit fields"
                                                >
                                                    <FaPlus size={20} color="#2563EB" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => openModal(index)}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                            >
                                                {items?.remarksDetails && items.remarksDetails.length > 0
                                                    ? items.remarksDetails[items.remarksDetails.length - 1]?.title
                                                    : 'No remarks yet'}
                                            </button>
                                        </div>

                                        {/* Modal for Remarks History */}
                                        <ReactModal
                                            isOpen={modalQueryIndex === index}
                                            onRequestClose={closeModal}
                                            style={customModalStyles}
                                            contentLabel="Remarks History"
                                            ariaHideApp={false}
                                        >
                                            <div className="w-full h-full">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h2 className="text-xl font-semibold">Remarks History</h2>
                                                    <button
                                                        onClick={closeModal}
                                                        className="bg-[#004aad] p-2 rounded-full cursor-pointer"
                                                    >
                                                        <MdClose size={20} color="white" />
                                                    </button>
                                                </div>

                                                <div className="space-y-4 overflow-y-auto max-h-[60vh]">
                                                    {items?.remarksDetails && Array.isArray(items.remarksDetails) && items.remarksDetails.length > 0 ? (
                                                        items.remarksDetails.slice().reverse().map((remark: any, remarkIndex: number) => (
                                                            <div key={remarkIndex} className="p-4 border rounded-lg hover:bg-gray-50">
                                                                <div className="flex flex-col space-y-2">
                                                                    <div>
                                                                        <p className="uppercase text-sm font-semibold text-blue-600">
                                                                            {remark?.user || 'Unknown User'}:
                                                                        </p>
                                                                        <p className="text-base text-gray-700">{remark?.title || 'No details available'}</p>
                                                                    </div>
                                                                    <span className="text-xs text-gray-500">
                                                                        Created At: {remark?.createAt ? formatDate(remark.createAt) : 'Date not available'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="p-4 border rounded-lg text-center text-gray-500">
                                                            No remarks available
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </ReactModal>

                                        {/* Add Remarks Section - Shows when editing */}
                                        {addRemarks && editingQueryIndex === index && (
                                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                                <h3 className="text-lg font-semibold text-gray-700 mb-3">Add Remarks & Update Fields</h3>
                                                <Controller
                                                    control={control}
                                                    render={({ field: { onChange, value } }) => (
                                                        <div className="space-y-2">
                                                            <label className="block text-sm font-medium text-gray-700">
                                                                Remarks <span className="text-red-500">*</span>
                                                            </label>
                                                            <div className="relative">
                                                                <textarea
                                                                    value={value || ""}
                                                                    onChange={(e) => onChange(e.target.value)}
                                                                    placeholder="Add detailed remarks about the call"
                                                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 pb-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                    rows={4}
                                                                    required
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => onChange("I called this client but it is ringing")}
                                                                    className="absolute bottom-3 right-3 bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1"
                                                                    title="Quick ringing remark"
                                                                >
                                                                    <FaBell size={10} />
                                                                    Ringing
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                    name="remarks"
                                                    defaultValue=""
                                                />
                                                <div className="flex space-x-2 mt-4">
                                                    <button
                                                        onClick={saveEditedQueryWithRemarks}
                                                        disabled={isSubmitting}
                                                        className={`flex-1 py-2 rounded-lg ${isSubmitting
                                                            ? 'bg-gray-400 cursor-not-allowed'
                                                            : 'bg-[#004aad] hover:bg-[#003c8d]'
                                                            } text-white font-medium`}
                                                    >
                                                        {isSubmitting ? 'Saving...' : 'Save Changes & Add Remarks'}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingQueryIndex(null);
                                                            setEditedQuery(null);
                                                            setAddRemarks(false);
                                                            reset();
                                                        }}
                                                        className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white rounded-lg p-4 shadow-md text-center text-gray-500">
                                    No queries available
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center items-center h-64">
                        <p className="text-2xl font-semibold text-gray-500">No Data Found</p>
                    </div>
                )}
            </div>
        </div>
    );
}