import DB from '@app/_Database/db';
import HandleResponse from '@app/_utils/response';
import Lead from '@app/_model/LeadModel/lead.model';
import mongoose from 'mongoose';
import { DateTime } from 'luxon';
import { NextRequest } from '@node_modules/next/server';

export async function GET(req: Request) {
    try {
        DB();

        const { searchParams } = new URL(req.url);
        const user: any = JSON.parse(req.headers.get('user') as string);

        const search = searchParams.get('search');
        const selectedStatus = searchParams.get('selectedStatus');
        const leadType = searchParams.get('leadType');
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const staffId = searchParams.get('staffId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Phone search (10 digits)
        const isPhoneSearch =
            search && /^\d{10}$/.test(search.replace(/\D/g, ''));

        const companyId: mongoose.Types.ObjectId =
            new mongoose.Types.ObjectId(user?.company?._id);
        const userId = new mongoose.Types.ObjectId(user._id);

        // Get today's date range (start and end of today)
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

        // -------- Date range per-status (matches upper API) ----------
        const getDateRangeCondition = (status: string) => {
            if (!startDate && !endDate) return {};

            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            if (end) {
                end.setHours(23, 59, 59, 999);
            }

            const dateCondition: any = {};
            if (start && end) {
                dateCondition.$gte = start;
                dateCondition.$lte = end;
            } else if (start) {
                dateCondition.$gte = start;
            } else if (end) {
                dateCondition.$lte = end;
            }

            switch (status) {
                case 'fresh':
                    // include both createAt & assignAt in range
                    return {
                        $or: [{ createAt: dateCondition }, { assignAt: dateCondition }],
                    };
                case 'followup':
                     return { firstFollowupDate: dateCondition };
                case 'todaysfollowup':
                    // For today's followup, ignore date range filters and use today's date
                    return {
                        followup_date: {
                            $gte: startOfToday,
                            $lte: endOfToday
                        }
                    };
                case 'visitdone':
                    return { visit_done_date: dateCondition };
                case 'meetingdone':
                    return { meeting_done_date: dateCondition };
                case 'deal-done':
                    return { deal_done_date: dateCondition };
                case 'ringing':
                    return { ringing_date: dateCondition };
                case 'switchoff':
                    return { switch_off_date: dateCondition };
                case 'wrongno':
                    return { wrong_no_date: dateCondition };
                case 'notInterest':
                    return { not_interested_date: dateCondition };
                case 'callback':
                    // latest query with call_status "Call Back" (kept same shape as upper)
                    return {
                        'queryDetails.call_date': dateCondition,
                        'queryDetails.call_status': 'Call Back',
                    };
                case 'hotprospects':
                case 'suspects':
                    // as per upper API: date range uses createAt
                    return { createAt: dateCondition };
                default:
                    return { createAt: dateCondition };
            }
        };

        // -------- Status conditions (matches upper API) -------------
        const getStatusConditions = (status: string) => {
            const baseCondition = {
                $or: [
                    { query: { $exists: false } },
                    { query: { $size: 0 } },
                    {
                        $and: [
                            { query: { $exists: true, $ne: [] } },
                            {
                                $or: [
                                    { leadStatus: { $exists: false } },
                                    { leadStatus: null },
                                    { leadStatus: '' },
                                    { leadStatus: 'fresh' },
                                ],
                            },
                            {
                                $or: [
                                    { call_status: { $exists: false } },
                                    { call_status: null },
                                    { call_status: '' },
                                ],
                            },
                        ],
                    },
                ],
            };

            switch (status) {
                case 'fresh':
                    return baseCondition;
                case 'followup':
                    return {
                        leadStatus: "followup",
                        // Include both Call Picked and other followup statuses
                        $or: [
                            { call_status: "Call Picked" },
                            { call_status: { $exists: false } },
                            { call_status: null },
                            { call_status: "" }
                        ]
                    };
                case 'todaysfollowup':
                    return {
                        followup_date: {
                            $gte: startOfToday,
                            $lte: endOfToday
                        }
                    };
                case 'notInterest':
                    return {
                        leadStatus: 'notInterest',
                        call_status: {
                            $in: [
                                'Visit Done',
                                'Meeting Done',
                                'Call Picked',
                                'Ringing',
                                'Call Back',
                                'Wrong No',
                                'Switch Off',
                            ],
                        },
                    };
                case 'deal-done':
                    return {
                        leadStatus: 'deal-done',
                        call_status: { $in: ['Visit Done', 'Meeting Done'] },
                    };
                case 'ringing':
                    return {
                        call_status: 'Ringing',
                        $or: [
                            { leadStatus: { $exists: false } },
                            { leadStatus: null },
                            { leadStatus: '' },
                            { leadStatus: 'fresh' },
                        ],
                    };
                case 'callback':
                    return {
                        call_status: 'Call Back',
                        $or: [
                            { leadStatus: { $exists: false } },
                            { leadStatus: null },
                            { leadStatus: '' },
                            { leadStatus: 'fresh' },
                        ],
                    };
                case 'wrongno':
                    return {
                        call_status: 'Wrong No',
                        $or: [
                            { leadStatus: { $exists: false } },
                            { leadStatus: null },
                            { leadStatus: '' },
                            { leadStatus: 'fresh' },
                        ],
                    };
                case 'switchoff':
                    return {
                        call_status: 'Switch Off',
                        $or: [
                            { leadStatus: { $exists: false } },
                            { leadStatus: null },
                            { leadStatus: '' },
                            { leadStatus: 'fresh' },
                        ],
                    };
                case 'visitdone':
                    return { leadStatus: 'followup', call_status: 'Visit Done' };
                case 'meetingdone':
                    return { leadStatus: 'followup', call_status: 'Meeting Done' };
                case 'hotprospects':
                    return { isHotProspect: true };
                case 'suspects':
                    return { isSuspect: true };
                default:
                    return {};
            }
        };

        // -------- Staff filter baseline (matches upper API) ---------
        const baseMatchCondition: any = {
            company: companyId,
            ...(staffId &&
                staffId !== '678642d40797483103969bc5' && {
                assign: { $in: [new mongoose.Types.ObjectId(staffId)] },
            }),
        };


        // -------- Helper for categorization (phone search) ----------
        const categorizeLead = (lead: any) => {
            const { leadStatus, call_status, isHotProspect, isSuspect, followup_date } = lead;

            // Check if it's today's followup first
            if (followup_date) {
                const followupDate = new Date(followup_date);
                if (followupDate >= startOfToday && followupDate <= endOfToday) {
                    return 'todaysfollowup';
                }
            }

            if (isHotProspect === true) return 'hotprospects';
            if (isSuspect === true) return 'suspects';
            if (
                leadStatus === 'deal-done' &&
                ['Visit Done', 'Meeting Done'].includes(call_status)
            )
                return 'deal-done';
            if (
                leadStatus === 'notInterest' &&
                [
                    'Visit Done',
                    'Meeting Done',
                    'Call Picked',
                    'Ringing',
                    'Call Back',
                    'Wrong No',
                    'Switch Off',
                ].includes(call_status)
            )
                return 'notInterest';

            if (leadStatus === 'followup') {
                if (call_status === 'Visit Done') return 'visitdone';
                if (call_status === 'Meeting Done') return 'meetingdone';
                if (call_status === 'Call Picked') return 'followup';
            }

            if (call_status === 'Ringing' && (!leadStatus || leadStatus === 'fresh'))
                return 'ringing';
            if (call_status === 'Call Back' && (!leadStatus || leadStatus === 'fresh'))
                return 'callback';
            if (call_status === 'Wrong No' && (!leadStatus || leadStatus === 'fresh'))
                return 'wrongno';
            if (call_status === 'Switch Off' && (!leadStatus || leadStatus === 'fresh'))
                return 'switchoff';

            return 'fresh';
        };

        // -------- Shared pipelines (matches upper API) --------------
        const buildDataPipeline = (
            matchConditions: any,
            searchTerm: string | null,
            leadTypeFilter: string,
            pageNum: number,
            limitNum: number
        ) => {
            const pipeline: any[] = [
                { $match: matchConditions },
                {
                    $lookup: {
                        from: 'querys',
                        localField: 'query',
                        foreignField: '_id',
                        as: 'queryDetails',
                        pipeline: [
                            {
                                $lookup: {
                                    from: 'remarks',
                                    localField: 'remarks',
                                    foreignField: '_id',
                                    as: 'remarksDetails',
                                },
                            },
                        ],
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'assign',
                        foreignField: '_id',
                        as: 'assignedUsers',
                        pipeline: [{ $project: { userName: 1, _id: 1 } }],
                    },
                },
            ];

            if (searchTerm && !isPhoneSearch) {
                pipeline.push({
                    $match: {
                        $or: [
                            { name: { $regex: searchTerm, $options: 'i' } },
                            { phone: { $regex: searchTerm, $options: 'i' } },
                            { email: { $regex: searchTerm, $options: 'i' } },
                            { address: { $regex: searchTerm, $options: 'i' } },
                            { source: { $regex: searchTerm, $options: 'i' } },
                            { 'queryDetails.name': { $regex: searchTerm, $options: 'i' } },
                            { 'queryDetails.phone': { $regex: searchTerm, $options: 'i' } },
                            { 'queryDetails.email': { $regex: searchTerm, $options: 'i' } },
                            { 'queryDetails.project': { $regex: searchTerm, $options: 'i' } },
                            { 'queryDetails.leadType': { $regex: searchTerm, $options: 'i' } },
                            { 'queryDetails.call_status': { $regex: searchTerm, $options: 'i' } },
                        ],
                    },
                });
            }

            if (leadTypeFilter && leadTypeFilter !== 'all') {
                pipeline.push({
                    $match: {
                        'queryDetails.leadType': { $regex: leadTypeFilter, $options: 'i' },
                    },
                });
            }

            pipeline.push(
                { $sort: { createAt: -1 } },
                { $skip: (pageNum - 1) * limitNum },
                { $limit: limitNum }
            );

            return pipeline;
        };

        const buildCountPipeline = (
            matchConditions: any,
            searchTerm: string | null,
            leadTypeFilter: string
        ) => {
            const pipeline: any[] = [{ $match: matchConditions }];

            if (searchTerm && !isPhoneSearch) {
                pipeline.push({
                    $lookup: {
                        from: 'querys',
                        localField: 'query',
                        foreignField: '_id',
                        as: 'queryDetails',
                    },
                });
                pipeline.push({
                    $match: {
                        $or: [
                            { name: { $regex: searchTerm, $options: 'i' } },
                            { phone: { $regex: searchTerm, $options: 'i' } },
                            { email: { $regex: searchTerm, $options: 'i' } },
                            { address: { $regex: searchTerm, $options: 'i' } },
                            { source: { $regex: searchTerm, $options: 'i' } },
                            { 'queryDetails.name': { $regex: searchTerm, $options: 'i' } },
                            { 'queryDetails.phone': { $regex: searchTerm, $options: 'i' } },
                            { 'queryDetails.email': { $regex: searchTerm, $options: 'i' } },
                            { 'queryDetails.project': { $regex: searchTerm, $options: 'i' } },
                            { 'queryDetails.leadType': { $regex: searchTerm, $options: 'i' } },
                            { 'queryDetails.call_status': { $regex: searchTerm, $options: 'i' } },
                        ],
                    },
                });
            }

            if (leadTypeFilter && leadTypeFilter !== 'all') {
                if (!searchTerm || isPhoneSearch) {
                    pipeline.push({
                        $lookup: {
                            from: 'querys',
                            localField: 'query',
                            foreignField: '_id',
                            as: 'queryDetails',
                        },
                    });
                }
                pipeline.push({
                    $match: {
                        'queryDetails.leadType': { $regex: leadTypeFilter, $options: 'i' },
                    },
                });
            }

            pipeline.push({ $count: 'total' });
            return pipeline;
        };

        // ---------------- ADMIN USERS ----------------
        if (user.role == 1 || user.role == 2) {
            // If phone search, do direct lookup first (matches upper API)
            if (isPhoneSearch) {
                const phoneResults = await Lead.find({
                    company: companyId,
                    phone: { $regex: search, $options: 'i' },
                })
                    .select('leadStatus call_status query isHotProspect isSuspect followup_date')
                    .lean();

                if (phoneResults.length > 0) {
                    const statusCounts = phoneResults.reduce(
                        (acc: { [key: string]: number }, lead) => {
                            const category = categorizeLead(lead);
                            acc[category] = (acc[category] || 0) + 1;
                            return acc;
                        },
                        {}
                    );

                    const statusCondition = getStatusConditions(selectedStatus ?? '');
                    const dateRangeCondition = getDateRangeCondition(selectedStatus ?? '');
                    const dataMatchCondition = {
                        company: companyId,
                        phone: { $regex: search, $options: 'i' },
                        ...statusCondition,
                        ...dateRangeCondition,
                    };

                    const leadDataPipeline = buildDataPipeline(
                        dataMatchCondition,
                        null,
                        leadType || 'all',
                        page,
                        limit
                    );
                    const leadData = await Lead.aggregate(leadDataPipeline);

                    return HandleResponse({
                        type: 'SUCCESS',
                        message: 'phone_search_results',
                        data: {
                            fields_: leadData,
                            phoneSearchResults: statusCounts,
                            availableStatuses: Object.keys(statusCounts),
                            TotalFresh: statusCounts['fresh'] || 0,
                            TotalFollowup: statusCounts['followup'] || 0,
                            TotalTodaysfollowup: statusCounts['todaysfollowup'] || 0,
                            TotalNotInterest: statusCounts['notInterest'] || 0,
                            TotalDealdone: statusCounts['deal-done'] || 0,
                            TotalRinging: statusCounts['ringing'] || 0,
                            TotalCallback: statusCounts['callback'] || 0,
                            TotalWrongno: statusCounts['wrongno'] || 0,
                            TotalSwitchoff: statusCounts['switchoff'] || 0,
                            TotalVisitdone: statusCounts['visitdone'] || 0,
                            TotalMeetingdone: statusCounts['meetingdone'] || 0,
                            TotalHotprospects: statusCounts['hotprospects'] || 0,
                            TotalSuspects: statusCounts['suspects'] || 0,
                        },
                    });
                }
            }

            // Admin: counts per status (with date-range per status) - ADDED todaysfollowup
            const statusTypes = [
                'fresh',
                'followup',
                'todaysfollowup',
                'notInterest',
                'deal-done',
                'ringing',
                'callback',
                'wrongno',
                'switchoff',
                'visitdone',
                'meetingdone',
                'hotprospects',
                'suspects',
            ];

            const countPromises = statusTypes.map(async (status) => {
                const statusCondition = getStatusConditions(status);
                const dateRangeCondition = getDateRangeCondition(status);
                const matchCondition = {
                    ...baseMatchCondition,
                    ...statusCondition,
                    ...dateRangeCondition,
                };
                const countPipeline = buildCountPipeline(
                    matchCondition,
                    search,
                    leadType || 'all'
                );
                const result = await Lead.aggregate(countPipeline);
                return { status, count: result[0]?.total || 0 };
            });

            const countResults = await Promise.all(countPromises);
            const counts = countResults.reduce((acc, { status, count }) => {
                const capitalizedStatus =
                    status.charAt(0).toUpperCase() + status.slice(1).replace('-', '');
                acc[`Total${capitalizedStatus}`] = count;
                return acc;
            }, {} as { [key: string]: number });

            // Admin: data for selected status
            const selectedStatusCondition = selectedStatus
                ? getStatusConditions(selectedStatus)
                : {};
            const selectedDateRangeCondition = selectedStatus
                ? getDateRangeCondition(selectedStatus)
                : {};
            const dataMatchCondition: any = {
                ...baseMatchCondition,
                ...selectedStatusCondition,
                ...selectedDateRangeCondition,
            };

            const dataPipeline = buildDataPipeline(
                dataMatchCondition,
                search,
                leadType || 'all',
                page,
                limit
            );
            const dataResults = await Lead.aggregate(dataPipeline);

            return HandleResponse({
                type: 'SUCCESS',
                message: search ? 'search_results' : '',
                data: {
                    fields: dataResults, // optional alias
                    fields_: dataResults,
                    ...counts,
                    total: Object.values(counts).reduce((a, b) => a + b, 0),
                },
            });
        }

        // ---------------- NON-ADMIN USERS ----------------
        const matchConditions = {
            company: companyId,
            ...(user._id != '678642d40797483103969bc5' && {
                assign: { $in: [userId] },
            }),
        };


        if (isPhoneSearch) {
            const phoneResults = await Lead.find({
                ...matchConditions,
                phone: { $regex: search, $options: 'i' },
            })
                .select('leadStatus call_status query isHotProspect isSuspect followup_date')
                .lean();

            if (phoneResults.length > 0) {
                const statusCounts = phoneResults.reduce(
                    (acc: { [key: string]: number }, lead) => {
                        const category = categorizeLead(lead);
                        acc[category] = (acc[category] || 0) + 1;
                        return acc;
                    },
                    {}
                );

                const statusCondition = getStatusConditions(selectedStatus ?? '');
                const dataMatchCondition = {
                    ...matchConditions,
                    phone: { $regex: search, $options: 'i' },
                    ...statusCondition,
                };

                const leadDataPipeline = buildDataPipeline(
                    dataMatchCondition,
                    null,
                    leadType || 'all',
                    page,
                    limit
                );
                const leadData = await Lead.aggregate(leadDataPipeline);

                return HandleResponse({
                    type: 'SUCCESS',
                    message: 'phone_search_results',
                    data: {
                        fields_: leadData,
                        phoneSearchResults: statusCounts,
                        availableStatuses: Object.keys(statusCounts),
                        TotalFresh: statusCounts['fresh'] || 0,
                        TotalFollowup: statusCounts['followup'] || 0,
                        TotalTodaysfollowup: statusCounts['todaysfollowup'] || 0,
                        TotalNotInterest: statusCounts['notInterest'] || 0,
                        TotalDealdone: statusCounts['deal-done'] || 0,
                        TotalRinging: statusCounts['ringing'] || 0,
                        TotalCallback: statusCounts['callback'] || 0,
                        TotalWrongno: statusCounts['wrongno'] || 0,
                        TotalSwitchoff: statusCounts['switchoff'] || 0,
                        TotalVisitdone: statusCounts['visitdone'] || 0,
                        TotalMeetingdone: statusCounts['meetingdone'] || 0,
                        TotalHotprospects: statusCounts['hotprospects'] || 0,
                        TotalSuspects: statusCounts['suspects'] || 0,
                    },
                });
            } else {
                return HandleResponse({
                    type: 'SUCCESS',
                    message: 'phone_not_found',
                    data: {
                        fields_: [],
                        phoneSearchResults: {},
                        availableStatuses: [],
                        TotalFresh: 0,
                        TotalFollowup: 0,
                        TotalTodaysfollowup: 0,
                        TotalNotInterest: 0,
                        TotalDealdone: 0,
                        TotalRinging: 0,
                        TotalCallback: 0,
                        TotalWrongno: 0,
                        TotalSwitchoff: 0,
                        TotalVisitdone: 0,
                        TotalMeetingdone: 0,
                        TotalHotprospects: 0,
                        TotalSuspects: 0,
                    },
                });
            }
        }

        // ADDED todaysfollowup to statusTypes for non-admin users
        const statusTypes = [
            'fresh',
            'followup',
            'todaysfollowup',
            'notInterest',
            'deal-done',
            'ringing',
            'callback',
            'wrongno',
            'switchoff',
            'visitdone',
            'meetingdone',
            'hotprospects',
            'suspects',
        ];

        const countPromises = statusTypes.map(async (status) => {
            const statusCondition = getStatusConditions(status);
            const dateRangeCondition = getDateRangeCondition(status);
            const matchCondition = {
                ...matchConditions,
                ...statusCondition,
                ...dateRangeCondition,
            };
            const countPipeline = buildCountPipeline(
                matchCondition,
                search,
                leadType || 'all'
            );
            const result = await Lead.aggregate(countPipeline);
            return { status, count: result[0]?.total || 0 };
        });

        const countResults = await Promise.all(countPromises);
        const counts = countResults.reduce((acc, { status, count }) => {
            const capitalizedStatus =
                status.charAt(0).toUpperCase() + status.slice(1).replace('-', '');
            acc[`Total${capitalizedStatus}`] = count;
            return acc;
        }, {} as { [key: string]: number });

        const selectedStatusCondition = selectedStatus
            ? getStatusConditions(selectedStatus)
            : {};
        const selectedDateRangeCondition = selectedStatus
            ? getDateRangeCondition(selectedStatus)
            : {};
        const dataConditions: any = {
            ...matchConditions,
            ...selectedStatusCondition,
            ...selectedDateRangeCondition,
        };

        const dataPipeline = buildDataPipeline(
            dataConditions,
            search,
            leadType || 'all',
            page,
            limit
        );
        const fields_ = await Lead.aggregate(dataPipeline);

        return HandleResponse({
            type: 'SUCCESS',
            message: search ? 'search_results' : '',
            data: {
                fields_,
                ...counts,
                total: Object.values(counts).reduce((a, b) => a + b, 0),
            },
        });
    } catch (error: any) {
        console.error('Error handling GET request:', error);
        return HandleResponse({
            type: 'BAD_REQUEST',
            message: error?.message || 'An unexpected error occurred.',
        });
    }
}