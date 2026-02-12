'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch_ } from './../../../store';
import { useG_STAFFQuery } from './../../_api_query/staff/staffs.api';
import { useG_ReportQuery, useG_Excel_ReportMutation } from './../../_api_query/report/report.api';
import { loader, setUserHierarchy } from './../../_api_query/store'
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Header from './../../_components/header';
import Sidebar from './../../_components/Sidebar';
import PopUpToReport from './reportModal';
import { HierarchyService } from '@app/services/hierarchyService';
import ExcelJS from 'exceljs';
import ExcelPreviewModal from './ExcelPreviewModal';
import { saveAs } from 'file-saver';

// Add this utility function near the top of your file
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

const ReportsScreen = () => {
    const [activeTab, setActiveTab] = useState<"Today" | "Week" | "Month" | "Custom">("Today");
    const [staffId, setStaffId] = useState<string>("");
    const [leadType, setLeadType] = useState<'all' | 'rent' | 'residential' | 'commercial'>('all');
    const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
    const [modalData, setModalData] = useState<ReportItem[]>([]);
    const [popUpVisible, setPopUpVisible] = useState(false);
    const [role_, setRole] = useState<number>(1);
    const [employeeData, setEmployeeData] = useState<EmployeeReport[]>([]);
    const [dateSelectionStep, setDateSelectionStep] = useState<'start' | 'end'>('start');
    const [showPreview, setShowPreview] = useState(false);

    // Memoized date range state
    const [localDateRange, setLocalDateRange] = useState(() => {
        const today = new Date();
        return {
            startDate: new Date(today.setHours(0, 0, 0, 0)),
            endDate: new Date(today.setHours(23, 59, 59, 999))
        };
    });

    const [dateRange, setDateRange] = useState<DateRange>(() => {
        const today = new Date();
        const start = new Date(today.setHours(0, 0, 0, 0));
        const end = new Date(today.setHours(23, 59, 59, 999));
        return {
            startDate: start.toISOString(),
            endDate: end.toISOString()
        };
    });

    const dispatch = useDispatch_();

    // Interfaces (keeping your existing interfaces)
    interface DateRange {
        startDate: string;
        endDate: string;
    }

    interface Staff {
        _id: string;
        userName: string;
    }

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
        call_date?: string | Date;
    }

    interface ReportItem {
        _id: string;
        name: string;
        phone: string;
        source: string;
        queryDetails: QueryDetails;
        call_date: string | null;
        call_visit_meeting_consider_in_follow_up_date: string | null;
        followup_date: string | null;
        meeting_done_date: string | null;
        visit_done_date: string | null;
        deal_done_date: string | null;
        ringing_switch_off_date: string | null;
        not_interested_date: string | null;
        interested_date: string | null;
        unique_followup: string | null;
        leadStatus?: string;
        firstFollowupDate?: string;
    }

    interface MetricCard {
        label: string;
        value: number;
        color: string;
    }

    interface StatItem {
        label: string;
        value: number;
        dateField: keyof Pick<ReportItem, 'call_date' | 'call_visit_meeting_consider_in_follow_up_date' | 'meeting_done_date' | 'visit_done_date' | 'deal_done_date' | 'interested_date' | 'not_interested_date' | 'unique_followup'>;
    }

    interface ChartDataPoint {
        name: string;
        value: number;
    }

    interface EmployeeReport {
        visitTarget: number;
        meetingCount: number;
        callTarget: number;
        userName: string;
        totalCallTarget: number;
        callCount: number;
        followupTarget: number;
        followUpCount: number;
        uniqueFollowupCount: number;
        meetingTarget: number;
        visitCount: number;
        notInterestedCount: number;
        interestedCount: number;
    }

    // Memoized user data
    const [userData, setUserData] = useState<any>({});
    const [currentUserId, setCurrentUserId] = useState<string>("");

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setUserData(user);
        setCurrentUserId(user.userId);
        setRole(user.role || 1); // Set role here as well
    }, []);

    // Special bypass condition for role 31 (same logic as leads page)
    const shouldBypassHierarchy = role_ === 31;
    const isRole31SpecialAccess = shouldBypassHierarchy;

    // Updated staff query with bypass hierarchy option for role 31
    const { data: Sdata, isError: SisError, isSuccess: SisSuccess, isLoading: staffLoading } = useG_STAFFQuery(
        {
            userId: currentUserId,
            bypassHierarchy: shouldBypassHierarchy
        },
        {
            refetchOnMountOrArgChange: true,
            refetchOnFocus: false,
            skip: !currentUserId // Skip query if no user ID
        }
    );

    // Debounced query parameters to prevent excessive API calls
    const [debouncedParams, setDebouncedParams] = useState({ dateRange, staffId, leadType });

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedParams({ dateRange, staffId, leadType });
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [dateRange, staffId, leadType]);

    const {
        data: reportData,
        isError: reportIsError,
        isLoading: reportIsLoading,
        error: reportError,
        isFetching: reportIsFetching
    } = useG_ReportQuery(debouncedParams, {
        skip: !currentUserId || !debouncedParams.dateRange.startDate // Skip if no user or date range
    });

    const [fetchData, { isSuccess, data, isError, isLoading }] = useG_Excel_ReportMutation();

    // Memoized helper functions
    const isFollowup = useCallback((item: any) => {
        return item?.queryDetails?.call_visit_meeting_consider_in_follow_up_date !== null &&
            item.leadStatus !== "notInterest" &&
            item.leadStatus !== "fresh";
    }, []);

    const isUniqueFollowup = useCallback((item: any, dateRange: DateRange) => {
        const followupDate = item?.queryDetails?.call_visit_meeting_consider_in_follow_up_date;
        if (!followupDate) return false;

        const followupDateObj = new Date(followupDate);
        const startDateObj = new Date(dateRange.startDate);
        const endDateObj = new Date(dateRange.endDate);

        endDateObj.setHours(23, 59, 59, 999);
        startDateObj.setHours(0, 0, 0, 0);

        const isInRange = followupDateObj >= startDateObj && followupDateObj <= endDateObj;

        return isInRange &&
            item.leadStatus === "followup" &&
            item.firstFollowupDate &&
            !item?.queryDetails?.visit_done_date &&
            !item?.queryDetails?.meeting_done_date &&
            !item?.queryDetails?.deal_done_date &&
            !item?.queryDetails?.ringing_date &&
            !item?.queryDetails?.switch_off_date &&
            !item?.queryDetails?.wrong_no_date &&
            !item?.queryDetails?.not_interested_date &&
            !item?.queryDetails?.interested_date;
    }, []);

    const isUniqueFollowupInRange = useCallback((item: any) => {
        return isUniqueFollowup(item, dateRange);
    }, [dateRange, isUniqueFollowup]);

    // Memoized calculations to prevent unnecessary recalculations
    const calculatedMetrics = useMemo(() => {
        if (!reportData?.data?.length) {
            return {
                totalCalls: 0,
                followupCalls: 0,
                notInterested: 0,
                weeklyProgress: [0, 0, 0, 0, 0, 0, 0],
                hourlyProgress: { labels: [], data: [] },
                statItems: []
            };
        }

        const data = reportData.data;

        // Calculate metrics
        const totalCalls = data.filter((item: any) => item?.queryDetails?.call_date)?.length || 0;
        const followupCalls = data.filter(isFollowup)?.length || 0;
        const notInterested = data.filter((item: any) =>
            item?.queryDetails?.not_interested_date != null &&
            item.leadStatus == "notInterest"
        )?.length || 0;

        // Weekly progress
        const progressCounts: number[] = [0, 0, 0, 0, 0, 0, 0];
        data.forEach((item: any) => {
            const dateFields = ['meeting_done_date', 'visit_done_date', 'deal_done_date', 'call_visit_meeting_consider_in_follow_up_date'];
            dateFields.forEach(field => {
                if (item[field]) {
                    const date = new Date(item[field] as string);
                    const dayOfWeek = date.getDay();
                    progressCounts[dayOfWeek] += 1;
                }
            });
        });

        // Hourly progress
        const intervalCounts = new Array(12).fill(0);
        const intervalLabels = [];
        for (let i = 0; i < 24; i += 2) {
            const startHour = i.toString().padStart(2, '0');
            const endHour = (i + 2).toString().padStart(2, '0');
            intervalLabels.push(`${startHour}:00-${endHour}:00`);
        }

        const callData = data.filter((item: any) => item?.queryDetails?.call_date);
        callData.forEach((item: any) => {
            try {
                const callDate = item.queryDetails.call_date;
                if (callDate) {
                    const date = new Date(callDate);
                    if (!isNaN(date.getTime())) {
                        const hour = date.getHours();
                        const intervalIndex = Math.floor(hour / 2);
                        if (intervalIndex >= 0 && intervalIndex < 12) {
                            intervalCounts[intervalIndex] += 1;
                        }
                    }
                }
            } catch (error) {
                console.error('Error processing call date:', error);
            }
        });

        // Stat items
        const statItems = [
            {
                label: "Total Placed Calls",
                value: totalCalls,
                dateField: 'call_date' as const
            },
            {
                label: "Followup",
                value: followupCalls,
                dateField: 'call_visit_meeting_consider_in_follow_up_date' as const
            },
            {
                label: "Unique Followup",
                value: data.filter(isUniqueFollowupInRange)?.length || 0,
                dateField: 'unique_followup' as const
            },
            {
                label: "Meeting",
                value: data.filter((item: any) =>
                    item?.queryDetails?.meeting_done_date != null &&
                    item.leadStatus != "notInterest"
                )?.length || 0,
                dateField: 'meeting_done_date' as const
            },
            {
                label: "Visit",
                value: data.filter((item: any) =>
                    item?.queryDetails?.visit_done_date != null &&
                    item?.queryDetails?.call_status === "Visit Done"
                )?.length || 0,
                dateField: 'visit_done_date' as const
            },
            {
                label: "Deal Done",
                value: data.filter((item: any) =>
                    item?.queryDetails?.deal_done_date != null &&
                    item.leadStatus === "deal-done"
                )?.length || 0,
                dateField: 'deal_done_date' as const
            },
            {
                label: "Interested",
                value: data.filter((item: any) =>
                    item?.queryDetails?.interested_date != null &&
                    item.leadStatus != "notInterest"
                )?.length || 0,
                dateField: 'interested_date' as const
            },
            {
                label: "Not Interested",
                value: notInterested,
                dateField: 'not_interested_date' as const
            }
        ];

        return {
            totalCalls,
            followupCalls,
            notInterested,
            weeklyProgress: progressCounts,
            hourlyProgress: { labels: intervalLabels, data: intervalCounts },
            statItems
        };
    }, [reportData?.data, isFollowup, isUniqueFollowupInRange]);

    // Memoized metric cards
    const metricCards: MetricCard[] = useMemo(() => [
        {
            label: "TOTAL CALLS PLACED",
            value: calculatedMetrics.totalCalls,
            color: "border-green-500"
        },
        {
            label: "FOLLOW-UP CALLS",
            value: calculatedMetrics.followupCalls,
            color: "border-blue-600"
        },
        {
            label: "NOT INTERESTED",
            value: calculatedMetrics.notInterested,
            color: "border-red-500"
        }
    ], [calculatedMetrics]);

    // Memoized chart data
    const chartData = useMemo(() => ({
        labels: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"],
        data: calculatedMetrics.weeklyProgress
    }), [calculatedMetrics.weeklyProgress]);

    const downloadExcel = useCallback(() => {
        if (!employeeData || employeeData.length === 0) return;

        // Calculate working days excluding Wednesdays
        const workingDays = getWorkingDaysCount(localDateRange.startDate, localDateRange.endDate);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Employee Report');

        // Add title row
        const titleRow = worksheet.addRow(['Employee Performance Report']);
        titleRow.getCell(1).font = { size: 16, bold: true };
        titleRow.getCell(1).alignment = { horizontal: 'center' };
        worksheet.mergeCells('A1:N1');

        // Add working days info (only once)
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
        headerRow1.eachCell((cell, colNumber) => {
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
        employeeData.forEach((emp: any, index) => {
            const capitalizedUserName = emp.userName
                ? emp.userName.split(' ')
                    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ')
                : '';

            // Calculate adjusted targets based on working days
            const dailyCallTarget = emp.callTarget || 0;
            const adjustedCallTarget = dailyCallTarget * workingDays;

            const dailyFollowupTarget = emp.followupTarget || 0;
            const adjustedFollowupTarget = dailyFollowupTarget * workingDays;

            const dailyMeetingTarget = emp.meetingTarget || 0;
            const adjustedMeetingTarget = dailyMeetingTarget * workingDays;

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

                // Style based on column type
                if (colNumber === 1) {
                    // User name column
                    cell.font = { bold: true, size: 10 };
                    cell.alignment = { horizontal: 'left', vertical: 'middle' };
                } else {
                    // Number columns
                    cell.font = { size: 10 };
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };

                    // Color-code achievement vs target
                    if (colNumber === 3 || colNumber === 6 || colNumber === 10) {
                        const target = dataRow.getCell(colNumber - 1).value as number;
                        const achieved = cell.value as number;

                        if (achieved >= target) {
                            cell.font = { ...cell.font, color: { argb: '008000' }, bold: true };
                        } else {
                            cell.font = { ...cell.font, color: { argb: 'FF0000' } };
                        }
                    } else if (colNumber === 4 || colNumber === 7) {
                        const pending = cell.value as number;
                        if (pending <= 0) {
                            cell.font = { ...cell.font, color: { argb: '008000' }, bold: true };
                        } else {
                            cell.font = { ...cell.font, color: { argb: 'FF6600' } };
                        }
                    }
                }

                // Add borders
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });

        // Add summary row with adjusted totals
        const summaryRow = worksheet.addRow([
            'TOTAL',
            employeeData.reduce((sum, emp) => sum + Number(emp.callTarget || 0) * workingDays, 0),
            employeeData.reduce((sum, emp) => sum + Number(emp.callCount || 0), 0),
            employeeData.reduce((sum, emp) => sum + (Number(emp.callTarget || 0) * workingDays - Number(emp.callCount || 0)), 0),
            employeeData.reduce((sum, emp) => sum + (Number(emp.followupTarget || 0) * workingDays), 0),
            employeeData.reduce((sum, emp) => sum + Number(emp.followUpCount || 0), 0),
            employeeData.reduce((sum, emp) => sum + (Number(emp.followupTarget || 0) * workingDays - Number(emp.followUpCount || 0)), 0),
            employeeData.reduce((sum, emp) => sum + Number(emp.uniqueFollowupCount || 0), 0),
            employeeData.reduce((sum, emp) => sum + (Number(emp.meetingTarget || 0) * workingDays), 0),
            employeeData.reduce((sum, emp) => sum + Number(emp.meetingCount || 0), 0),
            employeeData.reduce((sum, emp) => sum + Number(emp.visitTarget || 0), 0),
            employeeData.reduce((sum, emp) => sum + Number(emp.visitCount || 0), 0),
            employeeData.reduce((sum, emp) => sum + Number(emp.notInterestedCount || 0), 0),
            employeeData.reduce((sum, emp) => sum + Number(emp.interestedCount || 0), 0)
        ]);

        // Style summary row
        summaryRow.eachCell((cell, colNumber) => {
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
            { width: 25 }, // User Name
            { width: 12 }, // Call Target
            { width: 12 }, // Call Achieved
            { width: 12 }, // Call Pending
            { width: 12 }, // Followup Target
            { width: 12 }, // Followup Achieved
            { width: 12 }, // Followup Pending
            { width: 12 }, // Unique Followup
            { width: 12 }, // Meeting Target
            { width: 12 }, // Meeting Achieved
            { width: 12 }, // Visit Target
            { width: 12 }, // Visit Achieved
            { width: 15 }, // Not Interested
            { width: 12 }, // Interested
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
        workbook.xlsx.writeBuffer().then((data) => {
            const blob = new Blob([data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const fileName = `Employee_Report_${localDateRange.startDate.toISOString().split('T')[0]}_to_${localDateRange.endDate.toISOString().split('T')[0]}.xlsx`;
            saveAs(blob, fileName);
        });
    }, [employeeData, localDateRange]);

    const handleStatItemClick = useCallback((dateField: string) => {
        if (!reportData?.data?.length) {
            setModalData([]);
            setPopUpVisible(true);
            return;
        }

        let filteredData = reportData.data.filter((item: any) => {
            if (dateField == 'call_visit_meeting_consider_in_follow_up_date') {
                return isFollowup(item);
            }
            else if (dateField == 'call_date') {
                const fieldValue = item?.queryDetails?.[dateField];
                return fieldValue && !isNaN(new Date(fieldValue).getTime());
            }
            else if (dateField == 'meeting_done_date') {
                const fieldValue = item?.queryDetails?.[dateField];
                return fieldValue && !isNaN(new Date(fieldValue).getTime()) &&
                    item.leadStatus != "notInterest";
            }
            else if (dateField == 'visit_done_date') {
                const fieldValue = item?.queryDetails?.[dateField];
                return fieldValue && !isNaN(new Date(fieldValue).getTime()) &&
                    item?.queryDetails?.call_status === "Visit Done";
            }
            else if (dateField == 'deal_done_date') {
                const fieldValue = item?.queryDetails?.[dateField];
                return fieldValue && !isNaN(new Date(fieldValue).getTime()) &&
                    item.leadStatus === "deal-done";
            }
            else if (dateField == 'interested_date') {
                const fieldValue = item?.queryDetails?.[dateField];
                return fieldValue && !isNaN(new Date(fieldValue).getTime()) &&
                    item.leadStatus != "notInterest" && item.leadStatus === "followup";
            }
            else if (dateField == 'not_interested_date') {
                const fieldValue = item?.queryDetails?.[dateField];
                return fieldValue && !isNaN(new Date(fieldValue).getTime()) &&
                    item.leadStatus === "notInterest";
            }
            else if (dateField == 'unique_followup') {
                return isUniqueFollowup(item, dateRange);
            }
            return false;
        });

        if (dateField === 'unique_followup') {
            filteredData = reportData.data.filter(isUniqueFollowupInRange);
        }

        if (filteredData.length === 0) {
            setModalData([]);
            setPopUpVisible(true);
            return;
        }

        const transformedData = filteredData.map((item: any) => ({
            _id: item._id,
            name: item.name || '',
            phone: item.phone || '',
            source: item.source || '',
            queryDetails: {
                leadType: item.queryDetails?.leadType || '',
                project: item.queryDetails?.project || '',
                size: item.queryDetails?.size || '',
                budget: item.queryDetails?.budget || '',
                bhk: item.queryDetails?.bhk || '',
                floor: item.queryDetails?.floor || '',
                purpose: item.queryDetails?.purpose || '',
                location: item.queryDetails?.location || '',
                shifting_date: item.queryDetails?.shifting_date || '',
                followup_date: item.queryDetails?.followup_date || '',
                exp_visit_date: item.queryDetails?.exp_visit_date || '',
                type: item.queryDetails?.type || '',
                call_status: item.queryDetails?.call_status || '',
                visit_done: item.queryDetails?.visit_done || '',
                meeting_done: item.queryDetails?.meeting_done || '',
                status: item.queryDetails?.status || '',
                reason: item.queryDetails?.reason || '',
                closing_amount: item.queryDetails?.closing_amount || ''
            },
            call_date: item.call_date || null,
            call_visit_meeting_consider_in_follow_up_date: item.call_visit_meeting_consider_in_follow_up_date || null,
            followup_date: item.followup_date || null,
            meeting_done_date: item.meeting_done_date || null,
            visit_done_date: item.visit_done_date || null,
            deal_done_date: item.deal_done_date || null,
            ringing_switch_off_date: item.ringing_switch_off_date || null,
            not_interested_date: item.not_interested_date || null,
            interested_date: item.interested_date || null,
            unique_followup: item.unique_followup || null,
            leadStatus: item.leadStatus,
            firstFollowupDate: item.firstFollowupDate
        }));

        setModalData(transformedData);
        setPopUpVisible(true);
    }, [reportData?.data, isFollowup, isUniqueFollowup, dateRange, isUniqueFollowupInRange]);

    // Optimized date range calculation
    const calculateDateRange = useCallback((tab: string): void => {
        const today = new Date();
        let startDate: Date, endDate: Date;

        switch (tab) {
            case "Today":
                startDate = new Date(today);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(today);
                endDate.setHours(23, 59, 59, 999);
                break;
            case "Week":
                const startOfWeek = new Date(today);
                const dayOfWeek = today.getDay();
                const diffToTuesday = dayOfWeek === 0 ? -5 : (dayOfWeek === 1 ? -6 : 2);
                startOfWeek.setDate(today.getDate() - dayOfWeek + diffToTuesday);
                startOfWeek.setHours(0, 0, 0, 0);
                startDate = startOfWeek;
                endDate = new Date(today);
                endDate.setHours(23, 59, 59, 999);
                break;
            case "Month":
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(today);
                endDate.setHours(23, 59, 59, 999);
                break;
            default:
                return;
        }

        setLocalDateRange({
            startDate: startDate,
            endDate: endDate
        });

        setDateRange({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        });
    }, []);

    // Effects with better dependency management
    useEffect(() => {
        if (isSuccess && data) {
            setEmployeeData(data.data);
        }
    }, [isSuccess, data]);
    
    const [filteredStaffOptions, setFilteredStaffOptions] = useState<any[]>([]);
    
    // Only fetch employee data when needed
    useEffect(() => {
    if (currentUserId && role_ && [1, 2, 3, 4, 5, 31, 7, 6].includes(role_)) {
        // Get the staff IDs from filtered options for hierarchy-based filtering
        const allowedStaffIds = filteredStaffOptions.map(staff => staff._id);
        
        fetchData({
            dateRange,
            staffId: '', // Keep empty to get all allowed staff
            leadType: '',
            allowedStaffIds: allowedStaffIds // Add this new parameter
        });
    }
}, [dateRange, fetchData, currentUserId, role_, filteredStaffOptions]);

    useEffect(() => {
        if (activeTab !== "Custom") {
            calculateDateRange(activeTab);
        }
    }, [activeTab, calculateDateRange]);

    const [hierarchyLoading, setHierarchyLoading] = useState(true);

    useEffect(() => {
        const loadHierarchy = async () => {
            try {
                const storedHierarchy = localStorage.getItem('userHierarchy');
                if (storedHierarchy) {
                    const parsed = JSON.parse(storedHierarchy);
                    dispatch(setUserHierarchy(parsed));
                }

                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const comUser = JSON.parse(localStorage.getItem('comUserId') || '{}');

                if (user.userId && comUser.compId) {
                    const freshData = await HierarchyService.fetchUserHierarchy(user.userId, comUser.compId);
                    dispatch(setUserHierarchy(freshData));
                }
            } catch (error) {
                console.error("Error loading hierarchy:", error);
            } finally {
                setHierarchyLoading(false);
            }
        };

        loadHierarchy();
    }, [dispatch]);

    useEffect(() => {
        if (!Sdata?.data) return;

        console.log('Reports Staff filtering debug:', {
            role_,
            isRole31Special: isRole31SpecialAccess,
            staffCount: Sdata.data.length,
            staffList: Sdata.data.map((s: { userName: any; }) => s.userName)
        });

        setFilteredStaffOptions(Sdata.data);

        // Set current user as default if available
        if (Sdata.data.some((staff: any) => staff._id === currentUserId)) {
            setStaffId(currentUserId);
        }
    }, [Sdata, currentUserId, role_, isRole31SpecialAccess]);

    // Rest of your date picker functions (keeping existing implementation)
    const handleCustomDateSelect = useCallback((date: Date | null) => {
        if (!date) return;

        const newLocalDateRange = { ...localDateRange };

        if (dateSelectionStep === 'start') {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            newLocalDateRange.startDate = startDate;
            setDateSelectionStep('end');
            setLocalDateRange(newLocalDateRange);
        } else {
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            newLocalDateRange.endDate = endDate;

            if (newLocalDateRange.endDate < newLocalDateRange.startDate) {
                const temp = newLocalDateRange.startDate;
                newLocalDateRange.startDate = newLocalDateRange.endDate;
                newLocalDateRange.endDate = temp;
            }

            setLocalDateRange(newLocalDateRange);

            setDateRange({
                startDate: newLocalDateRange.startDate.toISOString(),
                endDate: newLocalDateRange.endDate.toISOString()
            });

            setDateSelectionStep('start');
            setShowDatePicker(false);
        }
    }, [localDateRange, dateSelectionStep]);

    const openCustomDatePicker = useCallback(() => {
        setDateSelectionStep('start');
        setShowDatePicker(true);
    }, []);

    // Loading state
    if (!currentUserId || hierarchyLoading) {
        return (
            <div className="flex h-screen bg-gray-100">
                <Sidebar />
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 overflow-scroll">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                        <span className="ml-3 text-gray-700">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 overflow-scroll">
                <div className="flex justify-between items-center mb-4 px-4 rounded-md">
                    <Header header="Reports" />
                </div>

                <div className="space-y-4">
                    <div className='flex gap-4'>
                        {(role_ === 1 || role_ === 2 || role_ === 3 || role_ === 4 || role_ === 5 || role_ === 31 || role_ === 7 || role_ === 6) && (
                            <div className="flex items-center gap-2 flex-1">
                                <label className="text-sm font-medium text-gray-700">
                                    Staff:
                                    {isRole31SpecialAccess && (
                                        <span className="text-blue-600 text-sm ml-1">(All Staff Access)</span>
                                    )}
                                </label>
                                {staffLoading || hierarchyLoading ? (
                                    <div className="flex-1 p-2 bg-gray-200 rounded animate-pulse">Loading staff...</div>
                                ) : (
                                    <select
                                        value={staffId}
                                        onChange={(e) => setStaffId(e.target.value)}
                                        className="flex-1 p-2 text-white bg-indigo-600 rounded-lg"
                                    >
                                        {filteredStaffOptions.map((staff: any) => (
                                            <option key={staff._id} value={staff._id} className="bg-white text-black">
                                                {staff.userName.toUpperCase()}
                                                {staff._id === currentUserId ? " (You)" : ""}
                                                {isRole31SpecialAccess && (
                                                    <span className="text-green-600"> ✓</span>
                                                )}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {isRole31SpecialAccess && (
                                    <div className="text-blue-600 text-xs">
                                        Special access: View any staff reports
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-2 flex-1">
                            <label className="w-20">Lead: </label>
                            <select
                                value={leadType}
                                onChange={(e) => setLeadType(e.target.value as typeof leadType)}
                                className="flex-1 p-2 border rounded bg-blue-600 text-white"
                            >
                                <option value="all">All Lead</option>
                                <option value="rent">Rent Lead</option>
                                <option value="residential">Residential Lead</option>
                                <option value="commercial">Commercial Lead</option>
                            </select>
                        </div>
                    </div>

                    {/* Date Filter Tabs */}
                    <div className="flex justify-around gap-2">
                        {["Today", "Week", "Month", "Custom"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => {
                                    setActiveTab(tab as typeof activeTab);
                                    if (tab === "Custom") {
                                        openCustomDatePicker();
                                    }
                                }}
                                className={`px-4 py-2 rounded-full ${activeTab === tab
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 text-gray-600'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Custom Date Range Display */}
                    {activeTab === "Custom" && (
                        <div className="flex items-center justify-center gap-4 p-2 bg-blue-50 rounded">
                            <div className="flex items-center">
                                <span className="text-sm text-gray-600 mr-2">From:</span>
                                <button
                                    onClick={() => {
                                        setDateSelectionStep('start');
                                        setShowDatePicker(true);
                                    }}
                                    className="px-3 py-1 border rounded text-sm bg-white"
                                >
                                    {localDateRange.startDate.toLocaleDateString('en-GB')}
                                </button>
                            </div>
                            <div className="flex items-center">
                                <span className="text-sm text-gray-600 mr-2">To:</span>
                                <button
                                    onClick={() => {
                                        setDateSelectionStep('end');
                                        setShowDatePicker(true);
                                    }}
                                    className="px-3 py-1 border rounded text-sm bg-white"
                                >
                                    {localDateRange.endDate.toLocaleDateString('en-GB')}
                                </button>
                            </div>
                            <button
                                onClick={() => {
                                    setDateRange({
                                        startDate: localDateRange.startDate.toISOString(),
                                        endDate: localDateRange.endDate.toISOString()
                                    });
                                }}
                                className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                            >
                                Apply
                            </button>
                            <button
                                onClick={() => {
                                    const today = new Date();
                                    setLocalDateRange({
                                        startDate: today,
                                        endDate: today
                                    });
                                    setDateRange({
                                        startDate: today.toISOString(),
                                        endDate: today.toISOString()
                                    });
                                }}
                                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm"
                            >
                                Clear
                            </button>
                        </div>
                    )}

                    {/* Excel Download Button */}
                    {(role_ === 1 || role_ === 2 || role_ === 3 || role_ === 4 || role_ === 5 || role_ === 31 || role_ === 7 || role_ === 6) && isLoading && (
                        <div className="flex justify-center items-center py-6">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            <span className="ml-3 text-gray-700">Preparing Excel sheet for download...</span>
                        </div>
                    )}

                    {(role_ === 1 || role_ === 2 || role_ === 3 || role_ === 4 || role_ === 5 || role_ === 31 || role_ === 7 || role_ === 6) && isSuccess && employeeData.length > 0 && (
                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => setShowPreview(true)}
                                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300"
                            >
                                Preview Excel
                            </button>
                            <button
                                onClick={downloadExcel}
                                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300"
                            >
                                Download Excel
                            </button>
                        </div>
                    )}

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-4">
                        {metricCards.map((metric, index) => (
                            <div key={index} className="text-center">
                                {reportIsLoading || reportIsFetching ? (
                                    <div className="w-20 h-20 mx-auto flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                                    </div>
                                ) : (
                                    <>
                                        <div className={`w-20 h-20 mx-auto flex items-center justify-center ${metric.label !== "TOTAL CALLS PLACED" ? `rounded-full border-4 ${metric.color}` : ''}`}>
                                            <span className={`font-bold ${metric.label === "TOTAL CALLS PLACED" ? 'text-4xl' : 'text-lg'}`}>
                                                {metric.value}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-2">{metric.label}</p>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Hourly Chart */}
                    <div className="h-64 w-full">
                        {reportIsLoading || reportIsFetching ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                <span className="ml-3 text-gray-700">Loading hourly data...</span>
                            </div>
                        ) : (
                            <>
                                <ResponsiveContainer>
                                    <BarChart
                                        data={calculatedMetrics.hourlyProgress.labels.map((label, index): ChartDataPoint => ({
                                            name: label,
                                            value: calculatedMetrics.hourlyProgress.data[index]
                                        }))}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="name"
                                            interval={0}
                                            tick={{ fontSize: 10 }}
                                            angle={-45}
                                            textAnchor="end"
                                            height={60}
                                        />
                                        <YAxis />
                                        <Tooltip
                                            formatter={(value: number) => [`${value} calls`, 'Count']}
                                            labelFormatter={(label) => `Time: ${label}`}
                                        />
                                        <Bar
                                            dataKey="value"
                                            fill="#0066cc"
                                            name="Calls"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                                <p className="text-center text-sm mt-2 font-medium text-gray-700">Hourly Activities (2-hour intervals)</p>
                            </>
                        )}
                    </div>

                    {/* Statistics */}
                    {reportIsLoading || reportIsFetching ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <div key={i} className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
                            ))}
                        </div>
                    ) : (
                        calculatedMetrics.statItems.map((stat, index) => (
                            <button
                                key={index}
                                onClick={() => handleStatItemClick(stat.dateField)}
                                className="w-full flex justify-between items-center px-4 py-2 hover:bg-gray-50"
                            >
                                <span
                                    className={`text-gray-600 
                            ${stat.label === "Total Placed Calls" ? 'font-bold' : ''} 
                            ${stat.label !== "Total Placed Calls" ? 'ml-8' : ''}`}
                                >
                                    {stat.label}
                                </span>
                                <span
                                    className={`text-gray-600 
                            ${stat.label === "Total Placed Calls" ? 'font-bold' : ''}`}
                                >
                                    {stat.value}
                                </span>
                            </button>
                        ))
                    )}

                    {/* Date Picker Modal */}
                    {showDatePicker && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white p-6 rounded-lg shadow-xl">
                                <div className="mb-3 flex justify-between items-center">
                                    <h3 className="text-lg font-semibold">
                                        {dateSelectionStep === 'start' ? 'Select Start Date' : 'Select End Date'}
                                    </h3>
                                    <button
                                        onClick={() => setShowDatePicker(false)}
                                        className="text-gray-500 hover:text-gray-800"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <DatePicker
                                    selected={dateSelectionStep === 'start' ? localDateRange.startDate : localDateRange.endDate}
                                    onChange={handleCustomDateSelect}
                                    inline
                                    dateFormat="yyyy-MM-dd"
                                />
                                <div className="mt-3 flex justify-end gap-2">
                                    <button
                                        onClick={() => setShowDatePicker(false)}
                                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Excel Preview Modal */}
                    {showPreview && (
                        <ExcelPreviewModal
                            employeeData={employeeData}
                            localDateRange={localDateRange}
                            onClose={() => setShowPreview(false)}
                        />
                    )}
                    {/* Data Modal */}
                    {popUpVisible && (
                        <PopUpToReport
                            reportData={modalData}
                            setPopUpVisible={setPopUpVisible}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportsScreen;