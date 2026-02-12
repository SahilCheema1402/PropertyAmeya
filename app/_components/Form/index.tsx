import React from "react";
import { useForm, Controller } from 'react-hook-form';
import { useDispatch_, useSelector_ } from "./../../../store";
import { useG_MDMQuery, useU_LeadMutation } from './../../_api_query/Leads/leads.api';
import { loader } from "./../../_api_query/store";
import { useEffect, useState } from "react";
import { MdClose } from 'react-icons/md';
import DatePickerC from "react-datepicker";
import DatePicker from "./../datePicker"
import { form } from './../../_api_query/store';
import { FaCalendarAlt } from 'react-icons/fa';
import { FaPlus } from 'react-icons/fa'
import { useRouter } from "next/navigation";
import { toast } from "react-toastify"
import { useG_STAFFQuery } from "@app/_api_query/staff/staffs.api";

export default function MasterForm({ refetch, setQueryForm: setLeadForm, id, type_, setQueryFormType_, leadIndex, setLeadIndex }: any) {

    const form_: any = useSelector_((state) => state.store.form);
    const { control, handleSubmit, setValue, formState: { errors }, reset, clearErrors } = useForm();
    const [leadType, setLeadType] = useState<string>('rent');
    const [status, setStatus] = useState<string>('');
    const [projectOptions, setProjectOptions] = useState<any>([]);
    const [statusOptions, setStatusOptions] = useState<any>([]);
    const [bhkOptions, setBhkOptions] = useState<any>([]);
    const [typeOptions, setTypeOptions] = useState<any>([]);
    const [newProject, setNewProject] = useState<string>('');
    const [addProject, setAddProject] = useState<boolean>(false)
    const [location, setLocation] = useState<string>('');
    const [purpose, setPurpose] = useState<string>('');
    const [call_status, setCall_status] = useState<string>('');
    const [role_, setRole] = useState<any>(1)
    const [token, setToken] = useState("");
    const [user, setUser] = useState("");
    const [userId, setUserId] = useState<any>("");
    const loading = useSelector_((state) => state.store.loader);
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        async function fetchUsers() {
            try {
                const response = await fetch('/api/v1/user', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'user': JSON.stringify(user)
                    }
                });
                const data = await response.json();
                if (data.success) {
                    setUsers(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch users:", error);
            }
        }
        fetchUsers();
    }, [token, user]);

    const { data: Sdata, isError: SisError, isSuccess: SisSuccess, isLoading: SisLoading } = useG_STAFFQuery("", { refetchOnMountOrArgChange: true });

    useEffect(() => {
        // Invalid call statuses for non-fresh leads
        const invalidCallStatuses = ['Switch Off', 'Ringing', 'Call Back', 'Wrong No'];
        const nonFreshStatuses = ['follow-up', 'Not Interested', 'Deal Done', 'Location Issue', 'Budget Issue', ' Plan Postponed'];

        // If status is not fresh and call_status is invalid, reset call_status
        if (nonFreshStatuses.includes(status) && invalidCallStatuses.includes(call_status)) {
            setCall_status('Call Picked'); // Set to a valid default
            toast.warning('Call status automatically changed to "Call Picked" as the lead status indicates customer interaction.');
        }
    }, [status, call_status]);

    const getAvailableCallStatusOptions = () => {
        const invalidCallStatuses = ['Switch Off', 'Ringing', 'Call Back', 'Wrong No'];
        const nonFreshStatuses = ['follow-up', 'Not Interested', 'Deal Done', 'Location Issue', 'Budget Issue', ' Plan Postponed'];

        if (nonFreshStatuses.includes(status)) {
            // Filter out invalid options for non-fresh leads
            return callStatusOptions.filter(option => !invalidCallStatuses.includes(option.value));
        }

        return callStatusOptions; // Return all options for fresh leads
    };

    useEffect(() => {
        if (form_ && type_ == "update") {

            const formatDate = (dateString: string | number | Date) =>
                dateString ? new Date(dateString).toISOString() : null;


            setValue("bhk", form_.bhk)
            setValue("budget", form_.budget)
            setValue("closing_amount", form_.closing_amount)
            setValue("floor", form_.floor)
            // setValue("exp_visit_date", form_?.exp_visit_date)
            setValue("phone", form_?.phone)
            setValue("project", form_.project)
            setValue("location", form_.location)
            setValue("purpose", form_.purpose)
            setValue("status", form_.status)
            setValue("type", form_.type)
            setValue("name", form_?.name)
            setValue("reason", form_.reason)
            setValue("unit_no", form_.unitNo)
            setValue("remarks", form_.remarks)
            setValue("exp_visit_date", formatDate(form_?.exp_visit_date));
            setValue("followup_date", formatDate(form_?.followup_date));
            setValue("shifting_date", formatDate(form_?.shifting_date));
            setValue("visit_done", formatDate(form_?.visit_done));
            setValue("meeting_done", formatDate(form_?.meeting_done));
            // setValue("followup_date", formatDate(form_?.followup_date));
            // setValue("shifting_date", form_.shifting_date)
            // setValue("visit_done", form_.visit_done)
            setValue("leadType", form_.leadType)
            setValue("sell_revenue", form_.sell_revenue)
            setValue("call_status", form_.call_status)
            // setValue("meeting_done", form_.meeting_done)
            setValue("lead_actual_slab", form_.lead_actual_slab)
            setValue("discount", form_.discount)
            setValue("actual_revnue", form_.actual_revnue)
            setValue("sell_revenue", form_.sell_revenue)
            setValue("incentive_slab", form_.incentive_slab)
            setValue("size", form_.size)
            setLeadType(form_.leadType)
            setStatus(form_.status)
            setRole(form_.role_)
            setLocation(form_.location)
            setPurpose(form_.purpose)
            setCall_status(form_.call_status)

        }
    }, [form_, type_]);

    useEffect(() => {
        if (leadType === 'rent') {
            setProjectOptions([
                { value: 'Select ...', label: '...' },
                { label: 'Panchsheel Green 1', value: 'Panchsheel Green 1' },
                { label: 'Panchsheel Green 2', value: 'Panchsheel Green 2' },
                { label: 'Ajnara Homes', value: 'Ajnara Homes' },
                { label: 'French Apprtment', value: 'French Apprtment' },
                { label: 'Gaur Saundryam', value: 'Gaur Saundryam' },
                { label: 'EV 2', value: 'EV 2' },
                { label: 'Aims Green Avenue', value: 'Aims Green Avenue' },
                { label: 'Golf Home', value: 'Golf Home' },
                { label: 'Other', value: 'Other' },


                // Add other Rent projects here
            ]);
            setStatusOptions([
                { value: 'Select ...', label: '...' },
                { label: 'Follow-up', value: 'follow-up' },
                { label: 'Not Interested', value: 'Not Interested' },
                { label: 'Location Issue', value: 'Location Issue' },
                { label: 'Budget Issue', value: 'Budget Issue' },
                { label: 'Deal Done', value: 'Deal Done' },
            ]);
            setBhkOptions([
                { value: 'Select ...', label: '...' },
                { label: '2 BHK', value: '2 BHK' },
                { label: '2BHK + Study', value: '2BHK + Study' },
                { label: '3 BHK', value: '3 BHK' },
                { label: '3BHK + Study', value: '3BHK + Study' },
                { label: '3BHK + Servant ', value: '3BHK + Servant ' },
                { label: '3BHK + 3T + Servant + Store', value: '3BHK + 3T + Servant + Store' },
                { label: '4 BHK', value: '4 BHK' },
                { label: '4 BHK + Study', value: '4 BHK + Study' },
                { label: '4BHK + Servant', value: '4BHK + Servant' },
                { label: '4 BHK + Store', value: '4 BHK + Store' },
            ]);
            setTypeOptions([
                { value: 'Select ...', label: '...' },
                { label: 'Raw Flat', value: 'Raw Flat' },
                { label: 'Semi Furnished', value: 'Semi Furnished' },
                { label: 'Fully Furnished', value: 'Fully Furnished' },
            ]);
        } else if (leadType === 'residential') {
            setProjectOptions([
                { value: 'Select ...', label: '...' },
                { label: 'Panchsheel Green 1', value: 'Panchsheel Green 1' },
                { label: 'Panchsheel Green 2', value: 'Panchsheel Green 2' },
                { label: 'Ajnara Homes', value: 'Ajnara Homes' },
                { label: 'French Apartment', value: 'French Apartment' },
                { label: 'Gaur Saundryam', value: 'Gaur Saundryam' },
                { label: 'Cherry County', value: 'Cherry County' },
                { label: 'EV 2', value: 'EV 2' },
                { label: 'Aims Green Avenue', value: 'Aims Green Avenue' },
                { label: 'Golf Home', value: 'Golf Home' },
                { label: 'Other', value: 'Other' },


            ]);
            setStatusOptions([
                { value: 'Select ...', label: '...' },
                { label: 'Follow-up', value: 'follow-up' },
                { label: 'Not Interested', value: 'Not Interested' },
                { label: 'Location Issue', value: 'Location Issue' },
                { label: 'Budget Issue', value: 'Budget Issue' },
                { label: 'Deal Done', value: 'Deal Done' },
                { label: ' Plan Postponed', value: ' Plan Postponed' },
            ]);
            setBhkOptions([
                { value: 'Select ...', label: '...' },
                { label: '2 BHK', value: '2 BHK' },
                { label: '2BHK + Study', value: '2BHK + Study' },
                { label: '3 BHK', value: '3 BHK' },
                { label: '3BHK + Study', value: '3BHK + Study' },
                { label: '3BHK + Servant ', value: '3BHK + Servant ' },
                { label: '3BHK + 3T + Servant + Store', value: '3BHK + 3T + Servant + Store' },
                { label: '4 BHK', value: '4 BHK' },
                { label: '4 BHK + Study', value: '4 BHK + Study' },
                { label: '4BHK + Servant', value: '4BHK + Servant' },
                { label: '4 BHK + Store', value: '4 BHK + Store' },

            ]);

            setTypeOptions([
                { value: 'Select ...', label: '...' },
                { label: 'Raw Flat', value: 'Raw Flat' },
                { label: 'Semi Furnished', value: 'Semi Furnished' },
                { label: 'Fully Furnished', value: 'Fully Furnished' },
            ]);
        } else if (leadType === 'commercial') {
            setProjectOptions([
                { value: 'Select ...', label: '...' },
                { label: 'GWSS', value: 'GWSS' },
                { label: 'Civitech Santony', value: 'Civitech Santony' },
                { label: 'Bhutani 62 Avenue', value: 'Bhutani 62 Avenue' },
                { label: 'Golden I', value: 'Golden I' },
                { label: 'NX - One', value: 'NX - One' },
                { label: 'Golden Grande', value: 'Golden Grande' },
                { label: 'Irish Trehan ', value: 'Irish Trehan ' },
                { label: 'M3M The Line', value: 'M3M The Line' },
                { label: 'Ace YXP', value: 'Ace YXP' },
                { label: 'Ace 153', value: 'Ace 153' },
                { label: 'CRC Flagship', value: 'CRC Flagship' },
                { label: 'EON', value: 'EON' },
                { label: 'Other', value: 'Other' },


            ]);
            setStatusOptions([
                { value: 'Select ...', label: '...' },
                { label: 'Follow-up', value: 'follow-up' },
                { label: 'Not Interested', value: 'Not Interested' },
                { label: 'Deal Done', value: 'Deal Done' },
            ]);
            setBhkOptions([
                { value: 'Select ...', label: '...' },
                { label: 'Office Space', value: 'Office Space' },
                { label: 'Studio App', value: 'Studio app' },
                { label: 'Society Shop', value: 'Society Shop' },
                { label: 'Retail Shop', value: 'Retail Shop' },
                { label: 'Industrial land', value: 'Industrial land' },
                { label: 'Commercial land', value: 'Commercial land' },
                // Add other types for commercial
            ]);
            setTypeOptions([
                { value: 'Select ...', label: '...' },
                { label: 'Raw Flat', value: 'Raw Flat' },
                { label: 'Semi Furnished', value: 'Semi Furnished' },
                { label: 'Fully Furnished', value: 'Fully Furnished' },
            ]);
        }
    }, [leadType]);

    const locationOptions = [
        { value: 'Select Location', label: '...' },
        { value: 'Noida Extension', label: 'Noida Extension' },
        { value: 'Yamuna expressway', label: 'Yamuna expressway' },
        { value: 'Noida expressway', label: 'Noida expressway' },
        { value: 'Sector 62', label: 'Sector 62' },
        { value: 'Other', label: 'Other' }
    ];

    const callStatusOptions = [
        { value: 'Select Call', label: '...' },
        { value: 'Switch Off', label: 'Switch Off' },
        { value: 'Ringing', label: 'Ringing' },
        { value: 'Wrong No', label: 'Wrong No' },
        { value: 'Call Back', label: 'Call Back' },
        { value: 'Call Picked', label: 'Call Picked' },
        { value: 'Visit Done', label: 'Visit Done' },
        { value: 'Meeting Done', label: 'Meeting Done' },
    ];

    interface Option {
        value: string;
        label: string;
    }

    useEffect(() => {
        function roleFetch() {
            if (typeof window !== "undefined") {
                const role = localStorage.getItem("role");
                const token = localStorage.getItem("accessToken") || "";
                const user = localStorage.getItem("comUserId") || "";
                const userId = localStorage.getItem("UserId");
                setToken(token);
                setUser(user || "");
                setUserId(userId);
                setRole(role);
            }
        }
        roleFetch();
    }, [token, user, role_]);
    // Function to handle adding a new project to the dropdown
    const handleAddProject = () => {
        if (newProject) {
            setProjectOptions((prevState: any) => [
                ...prevState,
                { label: newProject, value: newProject },
            ]);
            setNewProject('');
            setAddProject(false)
        }
    };
    const dispatch = useDispatch_();
    const { data, isSuccess, isLoading, isError, error } = useG_MDMQuery({});
    const [U_lead] = useU_LeadMutation();
    const router = useRouter();
    // const [isDarkTheme, setIsDarkTheme] = useState(Appearance.getColorScheme() === 'dark');

    const onSubmit = async (data: any) => {
        if (["Call Picked", "Visit Done", "Meeting Done"].includes(call_status) && !status) {
            toast.error("Status is required");
            return;
        }
        data.leadType = leadType
        data.status = status
        data.location = location
        data.purpose = purpose
        data.name = id?.name
        data.phone = id?.phone
        data.call_status = call_status
        if (call_status === "Visit Done") {
            data.visitDoneBy = data.visitDoneBy || userId;
        }
        if (call_status === "Meeting Done") {
            data.meetingDoneBy = data.meetingDoneBy || userId;
        }
        const { remarks, ...filteredData } = data;
        try {
            dispatch(loader(true));
            const res = await U_lead({
                query: {
                    ...(type_ === "update" ? filteredData : data),
                    visitDoneBy: call_status === "Visit Done" ? data.visitDoneBy : undefined,
                    meetingDoneBy: call_status === "Meeting Done" ? data.meetingDoneBy : undefined
                },
                _id: type_ == "update" ? form_ ? form_._id : id._id : id._id,
                type_,
                leadIndex
            }).unwrap()
            toast.success("Success")
            setPurpose("")
            setLocation("")
            setStatus("")
            setLeadType('rent')
            // refetch()
            dispatch(loader(false));
            router.push('/Leads')
        } catch (error: any) {
            dispatch(loader(false));
            toast.error("error")
        };
        setLeadForm(false);
        dispatch(form({}));
        setLeadIndex(NaN);
        // refetch()
        setQueryFormType_(null);
    }
    useEffect(() => {
        if (isLoading) {
            dispatch(loader(true))
        } else {
            dispatch(loader(false))
        }
        if (isError) {
            toast.error("error")
        }
    }, [isLoading, isSuccess, data])

    const purposeOptions: Option[] = [
        { value: 'Rental Income', label: 'Rental Income' },
        { value: 'Appreciation', label: 'Appreciation' },
        { value: 'Self Use', label: 'Self Use' },
    ];

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

    return (

        <div
            onClick={(e) => {
                e.stopPropagation();
                setLeadForm(false);
                dispatch(form({}));
                setQueryFormType_(null);
            }}
            className="fixed inset-0 bg-black/30 dark:bg-zinc-700/50 z-20 flex justify-center items-center p-4"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl max-h-[95vh] bg-white rounded-xl overflow-auto"
            >

                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-semibold">
                        {type_ === 'add' ? "Lead Details Form" : "Lead Update Form"}
                    </h2>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setLeadForm(false);
                            setQueryFormType_(null);
                        }}
                        className="bg-[#004aad] p-2 rounded-full"
                    >
                        <MdClose size={22} color="white" />
                    </button>
                </div>
                {/* <ScrollView> */}
                <div className="p-4 space-y-4">
                    {/* Personal Details Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-gray-600 block mb-1">Name</label>
                            <p className="w-full border border-gray-300 p-3 rounded-lg">{id?.name}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600 block mb-1">Mobile</label>
                            <p className="w-full border border-gray-300 p-3 rounded-lg">{id?.phone}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600 block mb-1">Email</label>
                            <p className="w-full border border-gray-300 p-3 rounded-lg">{id?.email || "Email not available"}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600 block mb-1">Address</label>
                            <p className="w-full border border-gray-300 p-3 rounded-lg">{id?.address || "Address not available"}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600 block mb-1">Source</label>
                            <p className="w-full border border-gray-300 p-3 rounded-lg">{id?.source || "source not available"}</p>
                        </div>
                        {/* <button
                            onClick={handleMarkAsInventory}
                            className="ml-4 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        >
                            Mark as Inventory
                        </button> */}

                    </div>
                    <div>
                        {/* Lead Type Dropdown */}
                        <p className="text-sm px-2 py-1">Call Status</p>
                        <div className="dark:placeholder:text-white placeholder:text-black dark:text-black w-full border-[#22232e] border-[1px] text-lg h-fit  rounded-lg ">
                            <select
                                value={call_status}
                                onChange={(e) => setCall_status(e.target.value)}
                                className="border p-2 w-full rounded-lg"
                            >
                                {getAvailableCallStatusOptions().map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {/* Lead Type */}
                    {(call_status == "Visit Done" || call_status == "Meeting Done" || call_status == "Call Picked") && <>
                        <div>
                            <label className="text-sm text-gray-600 block mb-1">Lead Type</label>
                            <select
                                value={leadType}
                                onChange={(e) => setLeadType(e.target.value)}
                                className="w-full border border-gray-300 p-3 rounded-lg"
                            >
                                <option value="rent">Rent Lead</option>
                                <option value="residential">Residential Lead</option>
                                <option value="commercial">Commercial Lead</option>
                                {/* <option value="inventory">Inventory</option> */}
                            </select>
                        </div>

                        {/* Dynamic Project Dropdown */}
                        <div>
                            <div className="flex flex-row w-full justify-between">
                                <p className="text-sm px-2 py-1">Project</p>
                                <button
                                    onClick={() => setAddProject(true)}
                                    className="w-7 h-7 flex items-center justify-center bg-transparent border-none cursor-pointer"
                                >
                                    <FaPlus size={20} color="#2563EB" />
                                </button>
                            </div>

                            <Controller
                                control={control}
                                name="project"
                                render={({ field: { onChange, value } }) => (
                                    <div className="dark:placeholder:text-white placeholder:text-black dark:text-black w-full border-[#22232e] border-[1px] text-lg h-fit  rounded-lg ">
                                        <select
                                            value={value}
                                            onChange={(e) => onChange(e.target.value)}
                                            className="dark:placeholder:text-white placeholder:text-black dark:text-black w-full border-[#22232e] border-[1px] py-3 text-lg h-fit px-6 rounded-lg"
                                        >
                                            {projectOptions.map((option: { value: any; label: any; }) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            />
                        </div>
                        {/* If the user selects 'Add New Project', show an input field to enter a new project */}
                        {addProject && (
                            <div>
                                <p className="text-sm px-2 py-1">Enter New Project</p>
                                <input
                                    type="text"
                                    value={newProject}
                                    onChange={(e) => setNewProject(e.target.value)}
                                    placeholder="Enter project name"
                                    className="dark:placeholder:text-white placeholder:text-black dark:text-black w-full border-[#22232e] border-[1px] py-2 text-lg h-fit px-6 rounded-lg"
                                />
                                <button
                                    onClick={handleAddProject}
                                    className="bg-blue-500 p-3 mt-2 rounded w-full text-white text-center"
                                >
                                    Add Project
                                </button>
                            </div>
                        )}
                        <div>
                            <p className="text-sm px-2 py-1">Budget</p>
                            <Controller
                                control={control}
                                name="budget"
                                render={({ field: { onChange, value } }) => (
                                    <input
                                        type="tel"
                                        value={value}
                                        onChange={onChange}
                                        placeholder="Enter Budget"
                                        className="w-full border-[#22232e] border-[1px] py-2 text-lg h-fit px-6 rounded-lg dark:placeholder:text-white placeholder:text-black dark:text-black"
                                    />
                                )}
                            />
                        </div>
                        {/* Dynamic BHK Dropdown */}
                        <div>
                            <p className="text-sm px-2 py-1" >{leadType == "commercial" ? "Type" : "BHK"}</p>
                            <Controller
                                control={control}
                                name="bhk"
                                render={({ field: { onChange, value } }) => (
                                    <div className="dark:placeholder:text-white placeholder:text-black dark:text-black w-full border-[#22232e] border-[1px] text-lg h-fit  rounded-lg ">
                                        <select
                                            value={value}
                                            onChange={onChange}
                                            className="border p-2 rounded-lg w-full"
                                        >
                                            {bhkOptions.map((option: { value: any; label: any; }) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            />
                        </div>
                        {(leadType == "rent" || leadType == "residential") && <div>
                            <p className="text-sm px-2 py-1">Floor</p>
                            <Controller
                                control={control}
                                name="floor"
                                render={({ field: { onChange, value } }) => (
                                    <input
                                        type="text"
                                        value={value}
                                        onChange={onChange}
                                        placeholder="enter floor"
                                        className="border p-2 rounded-lg w-full"
                                    />
                                )}
                            />
                        </div>}
                        {(leadType == "residential") && <div>
                            <p className="text-sm px-2 py-1">Size</p>
                            <Controller
                                control={control}
                                name="size"
                                render={({ field: { onChange, value } }) => (
                                    <input
                                        value={value}
                                        onChange={onChange}
                                        placeholder="Enter Size "
                                        className="flex-1 dark:text-black text-lg border p-2 rounded-lg"
                                    />
                                )}
                            />
                        </div>}

                        <div className="flex flex-row space-x-4">
                            {/* Shifting Date */}
                            {leadType == "rent" && (
                                <div className="flex-1">
                                    <p className="text-sm px-2 py-1">Shifting Date</p>
                                    <Controller
                                        control={control}
                                        name="shifting_date"
                                        render={({ field }) => (
                                            <div className="flex-row items-center w-full">
                                                <DatePicker name="shifting_date" setValue={setValue} clearErrors={clearErrors} value={field.value} />
                                            </div>
                                        )}
                                    />
                                </div>
                            )}

                            {/* Exp Visit Date */}
                            <div className="flex-1">
                                <p className="text-sm px-2 py-1">Exp Visit Date</p>
                                <Controller
                                    control={control}
                                    name="exp_visit_date"
                                    render={({ field }) => (
                                        <div className="flex-row items-center w-full">
                                            <DatePicker name="exp_visit_date" dateFormat="dd/MM/yyyy" setValue={setValue} clearErrors={clearErrors} value={field.value} />
                                        </div>
                                    )}
                                />
                            </div>

                            {/* Followup Date */}
                            <div className="flex-1">
                                <p className="text-sm px-2 py-1">Followup Date</p>
                                <Controller
                                    control={control}
                                    name="followup_date"
                                    render={({ field }) => (
                                        <div className="flex-row items-center w-full">
                                            <DatePicker
                                                name="followup_date"
                                                setValue={setValue}
                                                dateFormat="dd/MM/yyyy"
                                                clearErrors={clearErrors}
                                                value={field.value}  // Pass current value
                                            />
                                        </div>
                                    )}
                                />
                            </div>
                        </div>



                        {/* Dynamic Type Dropdown */}
                        {(leadType == "rent" || leadType == "residential") && <div>
                            <p className="text-sm px-2 py-1">Type</p>
                            <Controller
                                control={control}
                                name="type"
                                render={({ field: { onChange, value } }) => (
                                    <div className="dark:placeholder:text-white placeholder:text-black dark:text-black w-full border-[#22232e] border-[1px] text-lg h-fit  rounded-lg ">
                                        <select
                                            value={value}
                                            onChange={onChange}
                                            className="border p-2 w-full rounded-lg"
                                        >
                                            {typeOptions.map((option: { value: any, label: any }) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            />
                        </div>}
                        {leadType == "commercial" && (<div>
                            <div>
                                {/* Lead Type Dropdown */}
                                <p className="text-sm px-2 py-1">Purpose</p>
                                <div className="dark:placeholder:text-white placeholder:text-black dark:text-black w-full border-[#22232e] border-[1px] text-lg h-fit  rounded-lg ">
                                    <select
                                        value={purpose}
                                        onChange={(e) => setPurpose(e.target.value)}
                                        className="border p-2 w-full rounded-lg"
                                    >
                                        {purposeOptions.map((option: { value: any, label: any }) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>


                            </div>
                            <div>
                                {/* Lead Type Dropdown */}
                                <p className="text-sm px-2 py-1">Location</p>
                                <div className="dark:placeholder:text-white placeholder:text-black dark:text-black w-full border-[#22232e] border-[1px] text-lg h-fit  rounded-lg ">
                                    <select
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        className="border p-2 w-full rounded-lg"
                                    >
                                        {locationOptions.map((option: { label: any, value: any }) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>


                            </div>
                        </div>
                        )}

                        {(call_status == "Visit Done") && (
                            <>
                                <div>
                                    <p className="text-sm px-2 py-1">Visit Done</p>
                                    <Controller
                                        control={control}
                                        name="visit_done"
                                        render={({ field }) => (
                                            <div className="flex-row items-center w-full">
                                                <DatePicker
                                                    name="visit_done"
                                                    setValue={setValue}
                                                    clearErrors={clearErrors}
                                                    value={field.value}
                                                    maxDate={field.name === "visit_done" ? new Date() : undefined} // ✅ only for visit_done
                                                />
                                            </div>
                                        )}
                                    />
                                </div>

                                <div>
                                    <p className="text-sm px-2 py-1">Visit Done With</p>
                                    <Controller
                                        control={control}
                                        name="visitDoneBy"
                                        render={({ field: { onChange, value } }) => (
                                            <select
                                                value={value || userId}
                                                onChange={onChange}
                                                className="w-full border-[#22232e] border-[1px] py-2 text-lg h-fit px-6 rounded-lg dark:placeholder:text-white placeholder:text-black dark:text-black"
                                            >
                                                {SisSuccess && Sdata?.data?.map((staff: any) => (
                                                    <option key={staff._id} value={staff._id}>
                                                        {staff.userName.toUpperCase()}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    />
                                </div>

                            </>
                        )}

                        {(call_status == "Meeting Done") &&
                            <div>
                                <p className="text-sm px-2 py-1 ">Meeting Done</p>
                                <Controller
                                    control={control}
                                    name="meeting_done"
                                    render={({ field }) => (

                                        <div className="flex-row items-center w-full">
                                            <DatePicker name="ExpVisitDate" setValue={setValue} clearErrors={clearErrors} value={field.value} maxDate={new Date()} />
                                        </div>
                                    )}
                                />
                            </div>
                        }
                        {(call_status == "Meeting Done") && (
                            <div>
                                <p className="text-sm px-2 py-1">Meeting Done With</p>
                                <Controller
                                    control={control}
                                    name="meetingDoneBy"
                                    render={({ field: { onChange, value } }) => (
                                        <select
                                            value={value || userId}
                                            onChange={onChange}
                                            className="w-full border-[#22232e] border-[1px] py-2 text-lg h-fit px-6 rounded-lg dark:placeholder:text-white placeholder:text-black dark:text-black"
                                        >
                                            {SisSuccess && Sdata?.data?.map((staff: any) => (
                                                <option key={staff._id} value={staff._id}>
                                                    {staff.userName.toUpperCase()}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                />
                            </div>
                        )}

                        {/* Status Dropdown */}
                        <div>
                            <p className="text-sm px-2 py-1">Status</p>
                            <Controller
                                control={control}
                                name="status"
                                render={({ field: { onChange, value } }) => (
                                    <div className="dark:placeholder:text-white placeholder:text-black dark:text-black w-full border-[#22232e] border-[1px] text-lg h-fit  rounded-lg ">
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                            className="border p-2 w-full rounded-lg"
                                        >
                                            {statusOptions?.map((option: { value: any, label: any }) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            />
                            {["Call Picked", "Visit Done", "Meeting Done"].includes(call_status) && !status && (
                                <p className="text-sm text-red-600 mt-1">Status is required</p>
                            )}
                        </div>
                        {status == "Deal Done" &&
                            <div className="flex flex-col ">
                                <div>
                                    <p className="text-sm px-2 py-1">Closing Amount</p>
                                    <Controller
                                        control={control}
                                        name="closing_amount"
                                        render={({ field: { onChange, value } }) => (
                                            <input
                                                value={value}
                                                onChange={onChange}
                                                placeholder="Enter Closing Amount"
                                                // placeholderTextColor={`${isDarkTheme ? "black" : "grey"}`}
                                                className="dark:placeholder:text-white placeholder:text-black dark:text-black w-full border-[#22232e] border-[1px] py-3 text-lg h-fit px-6 rounded-lg"
                                            />
                                        )}
                                    />
                                </div>
                                <div>
                                    <p className="text-sm px-2 py-1">Unit no</p>
                                    <Controller
                                        control={control}
                                        name="unit_no"
                                        render={({ field: { onChange, value } }) => (
                                            <input
                                                value={value}
                                                onChange={onChange}
                                                placeholder="Enter Unit no"
                                                // placeholderTextColor={`${isDarkTheme ? "black" : "grey"}`}
                                                className="dark:placeholder:text-white placeholder:text-black dark:text-black w-full border-[#22232e] border-[1px] py-3 text-lg h-fit px-6 rounded-lg"
                                            />
                                        )}
                                    />
                                </div>
                                {leadType == "commercial" && <div>
                                    <p className="text-sm px-2 py-1">Project</p>
                                    <Controller
                                        control={control}
                                        name="project"
                                        render={({ field: { onChange, value } }) => (
                                            <input
                                                value={value}
                                                onChange={onChange}
                                                placeholder="Enter project"
                                                // placeholderTextColor={`${isDarkTheme ? "black" : "grey"}`}
                                                className="dark:placeholder:text-white placeholder:text-black dark:text-black w-full border-[#22232e] border-[1px] py-3 text-lg h-fit px-6 rounded-lg"
                                            />
                                        )}
                                    />
                                </div>}

                            </div>

                        }
                        {status == "Not Interested" && <div>
                            <p className="text-sm px-2 py-1">Reason</p>
                            <Controller
                                control={control}
                                name="reason"
                                render={({ field: { onChange, value } }) => (
                                    <input
                                        value={value}
                                        onChange={onChange}
                                        placeholder="Enter Reason"
                                        // placeholderTextColor={`${isDarkTheme ? "black" : "grey"}`}
                                        className="dark:placeholder:text-white placeholder:text-black dark:text-black w-full border-[#22232e] border-[1px] py-3 text-lg h-fit px-6 rounded-lg"
                                    />
                                )}
                            />
                        </div>}
                        {(role_ == 1 || role_ == 2) && type_ == "update" && status == "Deal Done" && (
                            <div className="space-y-4">
                                {/* Lead Actual Slab */}
                                <div>
                                    <p className="text-sm px-2 py-1">Lead Actual Slab</p>
                                    <Controller
                                        control={control}
                                        name="lead_actual_slab"
                                        render={({ field: { onChange, value } }) => (
                                            <input
                                                value={value}
                                                onChange={onChange}
                                                placeholder="Enter Lead Actual Slab"
                                                className="dark:placeholder:text-white placeholder:text-black dark:text-black w-full border-[#22232e] border-[1px] py-3 text-lg h-fit px-6 rounded-lg"
                                            />
                                        )}
                                    />
                                </div>

                                {/* Discount */}
                                <div>
                                    <p className="text-sm px-2 py-1">Discount</p>
                                    <Controller
                                        control={control}
                                        name="discount"
                                        render={({ field: { onChange, value } }) => (
                                            <input
                                                value={value}
                                                onChange={onChange}
                                                placeholder="Enter Discount"
                                                className="dark:placeholder:text-white placeholder:text-black dark:text-black w-full border-[#22232e] border-[1px] py-3 text-lg h-fit px-6 rounded-lg"
                                            />
                                        )}
                                    />
                                </div>

                                {/* Actual Revenue */}
                                <div>
                                    <p className="text-sm px-2 py-1">Actual Revenue</p>
                                    <Controller
                                        control={control}
                                        name="actual_revenue"
                                        render={({ field: { onChange, value } }) => (
                                            <input
                                                value={value}
                                                onChange={onChange}
                                                placeholder="Enter Actual Revenue"
                                                className="dark:placeholder:text-white placeholder:text-black dark:text-black w-full border-[#22232e] border-[1px] py-3 text-lg h-fit px-6 rounded-lg"
                                            />
                                        )}
                                    />
                                </div>

                                {/* Incentive Slab */}
                                <div>
                                    <p className="text-sm px-2 py-1">Incentive Slab</p>
                                    <Controller
                                        control={control}
                                        name="incentive_slab"
                                        render={({ field: { onChange, value } }) => (
                                            <input
                                                value={value}
                                                onChange={onChange}
                                                placeholder="Enter Incentive Slab"
                                                className="dark:placeholder:text-white placeholder:text-black dark:text-black w-full border-[#22232e] border-[1px] py-3 text-lg h-fit px-6 rounded-lg"
                                            />
                                        )}
                                    />
                                </div>

                                {/* Sales Revenue */}
                                {(role_ == 1 || role_ == 2) && type_ == "update" && <div>
                                    <p className="text-sm px-2 py-1">Sales Revenue</p>
                                    <Controller
                                        control={control}
                                        name="sell_revenue"
                                        render={({ field: { onChange, value } }) => (
                                            <input
                                                value={value}
                                                onChange={onChange}
                                                placeholder="Enter Sales Revenue"
                                                className="dark:placeholder:text-white placeholder:text-black dark:text-black w-full border-[#22232e] border-[1px] py-3 text-lg h-fit px-6 rounded-lg"
                                            />
                                        )}
                                    />
                                </div>}
                            </div>
                        )}
                        {/* Remarks */}
                        {type_ !== "update" &&
                            <div>
                                <p className="text-sm px-2 py-1">Remarks</p>
                                <Controller
                                    control={control}
                                    name="remarks"

                                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                                        <>
                                            <input
                                                value={value}
                                                onChange={onChange}
                                                placeholder="Enter Remarks"
                                                // placeholderTextColor={`${isDarkTheme ? "black" : "grey"}`}
                                                className="dark:placeholder:text-white placeholder:text-black dark:text-black w-full border-[#22232e] border-[1px] py-3 text-lg h-fit px-6 rounded-lg"
                                            />
                                            {error && <p style={{ color: 'red' }}>{error.message}</p>}
                                        </>
                                    )}
                                />
                            </div>}
                    </>}
                    {/* Submit Button */}
                    {!loading && <button className="bg-[#004aad] py-4  mt-4 w-full bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg" onClick={handleSubmit(onSubmit)}>
                        <p className="text-lg font-semibold text-center text-white">Submit</p>
                    </button>}
                </div>

                {/* </ScrollView> */}
            </div>
        </div>

    )
}