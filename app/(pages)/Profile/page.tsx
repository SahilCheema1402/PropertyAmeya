"use client"
import React, { useState, useEffect } from 'react';
import { useUserMutation } from '@app/_api_query/staff/staffs.api';
import { useChangePasswordMutation } from '@app/_api_query/staff/staffs.api';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useDispatch } from 'react-redux';
import { loader } from "../../_api_query/store";
import Header from '@app/_components/header';
import Sidebar from '@app/_components/Sidebar';
import { toast } from "react-toastify";
const UserProfile = () => {
    const [fetchData, { isSuccess, data, isError }] = useUserMutation();
    useEffect(() => {
        fetchData({});
    }, []);

    const dispatch = useDispatch()
    const [isEditing, setIsEditing] = useState(false);
    const [firstName, setFirstName] = useState(data?.data?.userDetail?.userName || "");
    const [address, setAddress] = useState(data?.data?.userDetail?.address || "");
    const [email, setEmail] = useState(data?.data?.userDetail?.email || "");
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const [passwordError, setPasswordError] = useState('');
    useEffect(() => {
        if (isSuccess) {
            setFirstName(data?.data?.userName)
            setEmail(data?.data?.email)
            setAddress(data?.data?.address)
        }

    }, []);
    const [changePassword] = useChangePasswordMutation();
    const handlePasswordChange = (e: any) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
        setPasswordError('');
    };

    const updatePassword = async () => {
        if (!passwordData.currentPassword) {
            setPasswordError("Current password is required");
            return;
        }

        if (passwordData.newPassword.length < 8) {
            setPasswordError("Password must be at least 8 characters");
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError("New passwords don't match");
            return;
        }

        dispatch(loader(true));
        try {
            const res: any = await changePassword(
                passwordData
            ).unwrap();
            toast.success("Password updated successfully");
            setPasswordError('');
            setShowPasswordForm(false);
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error) {
            toast.error("Failed to update password");
            setPasswordError("Failed to update password. Please check your current password.");
        } finally {
            dispatch(loader(false));
        }
    };

    const updateStaff = async () => {
        dispatch(loader(true))
        async function APi() {
            try {

                // const res: any = await userUpdate({
                //   body: {
                //     userName: firstName, address, email
                //   }, _id: data?.data?.userDetail?._id
                // }).unwrap();

                setIsEditing(false)
                dispatch(loader(false))

            } catch (error: any) {
                setIsEditing(false)


                dispatch(loader(false))
            }
        }
        APi()

    };


    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 overflow-hidden ">
                <div className="px-4 relative flex flex-row items-center">
                    <Header header="User Profile" />

                </div>
                <div className=" overflow-y-auto  h-full w-full px-2 pb-10">
                    <div className='flex-1 px-4  '>
                        <div className='flex-row  justify-between items-center '>

                            {/* <div onClick={() => setIsEditing(!isEditing)}>
                            <Icon name={isEditing ? "check" : "pencil"} size={32} color={colorMode} />
                        </div> */}
                        </div>

                        <div className='flex flex-row items-center '>
                            <div className='flex flex-row items-center mx-auto relative justify-center  h-[150px] w-[150px] rounded-full border-2 border-blue-500'>
                                <p className='font-extrabold text-[120px]  absolute pb-4 text-blue-500'>
                                    {data?.data?.userName?.split('')[0].toUpperCase()}
                                </p>
                            </div>
                        </div>
                        {/* Password Change Section */}
                        <div className="mt-6 mb-6 flex justify-center">
                            <button
                                onClick={() => setShowPasswordForm(!showPasswordForm)}
                                className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition shadow-md"
                            >
                                {showPasswordForm ? 'Cancel' : 'Change Password'}
                            </button>
                        </div>

                        {showPasswordForm && (
                            <div className="mt-4 p-6 border border-gray-300 rounded-lg bg-white shadow-md max-w-md mx-auto">
                                <h3 className="text-xl font-semibold mb-4 text-center">Change Password</h3>

                                <div className="space-y-4">
                                    {/* Current Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Current Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.current ? "text" : "password"}
                                                name="currentPassword"
                                                value={passwordData.currentPassword}
                                                onChange={handlePasswordChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                                                placeholder="Current password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('current')}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            >
                                                {showPasswords.current ? (
                                                    <FaEye size={24} color="blue" />
                                                ) : (
                                                    <FaEyeSlash size={24} color="blue" />


                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* New Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.new ? "text" : "password"}
                                                name="newPassword"
                                                value={passwordData.newPassword}
                                                onChange={handlePasswordChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                                                placeholder="New password (min 8 characters)"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('new')}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            >
                                                {showPasswords.new ? (
                                                    <FaEye size={24} color="blue" />
                                                ) : (
                                                    <FaEyeSlash size={24} color="blue" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirm New Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Confirm New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.confirm ? "text" : "password"}
                                                name="confirmPassword"
                                                value={passwordData.confirmPassword}
                                                onChange={handlePasswordChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                                                placeholder="Confirm new password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('confirm')}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            >
                                                {showPasswords.confirm ? (
                                                    <FaEye size={24} color="blue" />
                                                ) : (
                                                    <FaEyeSlash size={24} color="blue" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {passwordError && (
                                        <div className="text-red-500 text-sm text-center">{passwordError}</div>
                                    )}

                                    <div className="flex justify-center pt-2">
                                        <button
                                            onClick={updatePassword}
                                            className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition shadow-md"
                                        >
                                            Update Password
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex pt-6 flex-row flex-wrap gap-y-4">
                            <div className="px-3 py-4 mb-2 border-[1px] relative border-gray-400 rounded-xl  text-xs  w-full">
                                <p className="absolute top-0 left-0 text-xs -mt-5">Name</p>
                                {isEditing ?
                                    <input
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="text-base"
                                        placeholder="Enter Your Name"
                                        disabled={!isEditing}
                                    />
                                    : <p>{data?.data?.userName
                                        ? data.data.userName.charAt(0).toUpperCase() +
                                        data.data.userName.slice(1, -1) +
                                        data.data.userName.slice(-1).toUpperCase()
                                        : ""}</p>}
                            </div>

                            <div className="px-3 py-4 border-[1px] relative border-gray-400 rounded-xl  text-xs  mb-4  w-full">
                                <p className="absolute top-0 left-0 text-xs  dark:bg-transparent dark:text-white -mt-4">Phone Number</p>
                                <p>{data?.data?.phone}</p>
                            </div>
                            <div className="px-3 py-4 border-[1px] relative border-gray-400 rounded-xl  text-xs mb-4 w-full">
                                <p className="absolute top-0 left-0 text-xs -mt-4">Address</p>
                                {isEditing ? <input
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="text-base"
                                    placeholder={"Enter Your Address"}
                                    disabled={!isEditing}
                                /> : <p>{data?.data?.address || "Address is not available"}</p>}
                            </div>

                            <div className="px-3 py-4 border-[1px] relative border-gray-400 rounded-xl  text-xs  mb-4 dark:text-gray-200 w-full">
                                <p className="absolute top-0 left-0 text-xs -mt-5">Email Address</p>
                                {isEditing ? <input
                                    value={email}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="text-base"
                                    placeholder={"Enter your email address"}
                                    disabled={!isEditing}
                                /> : <p> {data?.data?.email || "Email address is not available"} </p>}
                            </div>
                            <div className="px-3 py-4 border-[1px] relative border-gray-400 rounded-xl  text-xs  mb-4 dark:text-gray-200 w-full">
                                <p className="absolute top-0 left-0 text-xs -mt-5">Designation</p>
                                <p> {data?.data?.designation || "Designation is not available"} </p>
                            </div>
                            <div className="px-3 py-4 border-[1px] relative border-gray-400 rounded-xl  text-xs  mb-4 dark:text-gray-200 w-full">
                                <p className="absolute top-0 left-0 text-xs -mt-5">Aadhar Number</p>
                                {isEditing ? <input
                                    value={email}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="text-base"
                                    placeholder={"Enter your aadhar number"}
                                    disabled={!isEditing}
                                /> : <p> {data?.data?.aadhar_no || " Aadhar is not available"} </p>}
                            </div>
                            <div className="px-3 py-4 border-[1px] relative border-gray-400 rounded-xl  text-xs  mb-4 dark:text-gray-200 w-full">
                                <p className="absolute top-0 left-0 text-xs -mt-5">Pan Number</p>
                                {isEditing ? <input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="text-base"
                                    placeholder={"Enter your Pan number"}
                                    disabled={!isEditing}
                                /> : <p> {data?.data?.aadhar_no || " Pan is not available"} </p>}
                            </div>
                            <div className="px-3 py-4 border-[1px] relative border-gray-400 rounded-xl  text-xs  mb-4 dark:text-gray-200 w-full">
                                <p className="absolute top-0 left-0 text-xs -mt-5">Emergency Contact Details</p>
                                {isEditing ? <input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="text-base"
                                    placeholder={"Enter your Emergency Contact Details Number"}
                                    disabled={!isEditing}
                                /> : <p> {data?.data?.emergency_contact_details || "Emergency Contact Number is not available"} </p>}
                            </div>
                            <div className="px-3 py-4 border-[1px] relative border-gray-400 rounded-xl  text-xs  mb-4 dark:text-gray-200 w-full">
                                <p className="absolute top-0 left-0 text-xs -mt-5">Date of Birth</p>
                                {isEditing ? <input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="text-base"
                                    placeholder={"Enter your Date of Birth"}
                                    disabled={!isEditing}
                                /> : <p> {data?.data?.date_of_birth || "Date of Birth is not available"} </p>}
                            </div>
                            <div className="px-3 py-4 border-[1px] relative border-gray-400 rounded-xl  text-xs  mb-4 dark:text-gray-200 w-full">
                                <p className="absolute top-0 left-0 text-xs -mt-5">marriage_anniversary</p>
                                {isEditing ? <input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="text-base"
                                    placeholder={"Enter your Date of Birth"}
                                    disabled={!isEditing}
                                /> : <p> {data?.data?.marriage_anniversary || "Date of Birth is not available"} </p>}
                            </div>
                            <div className="px-3 py-4 border-[1px] relative border-gray-400 rounded-xl  text-xs  mb-4 dark:text-gray-200 w-full">
                                <p className="absolute top-0 left-0 text-xs -mt-5">Father Name</p>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="text-base"
                                        placeholder="Enter your Father Name"
                                        disabled={!isEditing}
                                    />
                                ) : (
                                    <p>{data?.data?.father_name || "Father Name is not available"}</p>
                                )}

                            </div>

                            <div className="px-3 py-4 border-[1px] relative border-gray-400 rounded-xl  text-xs  mb-4 dark:text-gray-200 w-full">
                                <p className="absolute top-0 left-0 text-xs -mt-5">Salary</p>
                                <p> {data?.data?.salary || "Salary is not available"} </p>
                            </div>
                            <div className="px-3 py-4 border-[1px] relative border-gray-400 rounded-xl  text-xs  mb-4 dark:text-gray-200 w-full">
                                <p className="absolute top-0 left-0 text-xs -mt-5">Sales Target</p>
                                <p> {data?.data?.target || "Sales Target is not available"} </p>
                            </div>
                            <div className="px-3 py-4 border-[1px] relative border-gray-400 rounded-xl  text-xs  mb-4 dark:text-gray-200 w-full">
                                <p className="absolute top-0 left-0 text-xs -mt-5">Call Target</p>
                                <p> {data?.data?.callTarget || "Call Target is not available"} </p>
                            </div>
                            <div className="px-3 py-4 border-[1px] relative border-gray-400 rounded-xl  text-xs  mb-4 dark:text-gray-200 w-full">
                                <p className="absolute top-0 left-0 text-xs -mt-5">Followup Target</p>
                                <p> {data?.data?.followupTarget || "Followup Target is not available"} </p>
                            </div>
                            <div className="px-3 py-4 border-[1px] relative border-gray-400 rounded-xl  text-xs  mb-4 dark:text-gray-200 w-full">
                                <p className="absolute top-0 left-0 text-xs -mt-5">Meeting Target</p>
                                <p> {data?.data?.meetingTarget || "Meeting Target is not available"} </p>
                            </div>
                        </div>

                        {isEditing && (
                            <div
                                className={`bg-blue-500 mx-4 p-2 w-1/3 rounded-full flex justify-center items-center`}
                                onClick={updateStaff}
                            >
                                <p className={`text-white text-lg`}>Save</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>

    );
};

export default UserProfile;
