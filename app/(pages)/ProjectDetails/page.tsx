"use client"
import React, { useEffect, useState } from "react";
import Header from "@app/_components/header";
import { useG_ProjectQuery } from "@app/_api_query/Project/project.api";
import ProjectForm from '../../_components/ProjectFrom';
import { loader } from "./../../_api_query/store";
import { useDispatch_ } from "@/store";
import { toast } from "react-toastify";
import { FaPlus, FaSearch } from 'react-icons/fa'
import { BsThreeDots } from "react-icons/bs";
import Sidebar from "@app/_components/Sidebar";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import logoImg from '../../../assets/images/property 360.png';
import autoTable from 'jspdf-autotable';

export default function Lead() {
    const [pop, setPop] = useState(false);
    const dispatch = useDispatch_();
    const [search, setSearch] = useState("")
    const [role_, setRole] = useState<any>(1)
    const [type_, setType_] = useState<any>("");
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [projectFormData, setProjectFormData] = useState(null);
    const { data, isError, isSuccess, isLoading, error, isFetching, refetch } = useG_ProjectQuery({ search, page, limit }, { refetchOnMountOrArgChange: true });
    useEffect(() => {
        async function roleFetch() {
            const role = localStorage.getItem('role');
            setRole(role);
        }
        roleFetch();
    }, []);
    useEffect(() => {
        if (isLoading || isFetching) {
            dispatch(loader(true))
        } else {
            dispatch(loader(false))
        }
        if (isError) {
            toast.error((error as any)?.data?.message || "An error occurred");
        }

    }, [isLoading, isSuccess, , isError, error, isFetching]);

    const calculateTotalPrice = (lead: any) => {
        return ((lead?.BSP - (lead?.discount || 0)) * (lead?.size || 0)) || 0;
    };


const handleDownloadPDF = async (lead: any) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    let y = margin;

    const toDataURL = (src: string) => {
        return new Promise<string>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = src;
            img.onload = function () {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = reject;
        });
    };

    try {
        const logoDataURL = await toDataURL(logoImg.src);

        const primaryColor: [number, number, number] = [91, 24, 78]; // Purple
        const textWhite: [number, number, number] = [255, 255, 255];

        // Logo
        pdf.addImage(logoDataURL, 'PNG', margin, y, pageWidth - 2 * margin, 20);
        y += 30;

        // Common table style for perfect alignment
        const commonTableStyles = {
            font: "helvetica",
            fontSize: 11,
            cellPadding: 3,
            textColor: [0, 0, 0] as [number, number, number],
            halign: "left" as const
        };
        const commonColumnStyles = {
            0: { fontStyle: 'bold' as const, cellWidth: 50 },
            1: { cellWidth: pageWidth - margin * 2 - 50 }
        };

        // Project Info Table
        const projectInfoTable = [
            [
                { content: "Project Name", styles: { fillColor: primaryColor, textColor: textWhite, fontStyle: 'bold' } },
                { content: lead?.project_name || "N/A", styles: { fillColor: primaryColor, textColor: textWhite, fontStyle: 'bold' } }
            ],
            ["Product", lead?.product || "N/A"],
            ["Size", lead?.size ? `${lead.size} sq.ft.` : "0 sq.ft."],
            ["Floor", lead?.floor || "N/A"],
            ["Payment Plan", lead?.payment_plan || "N/A"]
        ];

        // @ts-ignore
        autoTable(pdf, {
            startY: y,
            body: projectInfoTable,
            theme: "grid",
            styles: commonTableStyles,
            columnStyles: commonColumnStyles,
            tableWidth: pageWidth - margin * 2
        });
        y = (pdf as any).lastAutoTable.finalY + 10;

        // Section helper
        const addSection = (title: string, rows: any[][]) => {
            pdf.setFontSize(14).setFont('helvetica', 'bold').setTextColor(...primaryColor);
            pdf.text(title, margin, y);
            y += 6;
            // @ts-ignore
            autoTable(pdf, {
                startY: y,
                body: rows,
                theme: "grid",
                styles: commonTableStyles,
                columnStyles: commonColumnStyles,
                tableWidth: pageWidth - margin * 2
            });
            y = (pdf as any).lastAutoTable.finalY + 10;
        };

        // Basic Price
        addSection("BASIC PRICE", [
            ["Price", lead?.BSP ? `${lead.BSP.toLocaleString('en-IN')}` : "0"],
            ["Size", lead?.size ? `${lead.size} sq.ft.` : "0 sq.ft."],
            ["Amount", `${calculateTotalPrice(lead).toLocaleString('en-IN')}`]
        ]);

        // Additional Charges
        const totalAdditional = 0;
        addSection("ADDITIONAL CHARGES", [
            ["Total Additional Charges", totalAdditional.toLocaleString('en-IN')]
        ]);

        // Possession Charges
        const totalPossession = (lead?.other_possession_charges * lead?.size) || 0;
        addSection("POSSESSION CHARGES", [
            ["Other Possession Charges", lead?.other_possession_charges ? `${(lead.other_possession_charges * lead.size).toLocaleString('en-IN')}` : "0"],
            ["Total Possession Charges", totalPossession.toLocaleString('en-IN')]
        ]);

        // Total Price
        const baseAmount = calculateTotalPrice(lead);
        const totalPrice = baseAmount + totalAdditional + totalPossession;
        const gstAmount = totalPrice * ((lead?.gst || 0) / 100);
        const totalWithGST = totalPrice + gstAmount;
        addSection("TOTAL PRICE", [
            ["Total Price", totalPrice.toLocaleString('en-IN')],
            [`GST ${lead?.gst || 0}%`, gstAmount.toLocaleString('en-IN')],
            ["Total Amount Including GST", totalWithGST.toLocaleString('en-IN')]
        ]);

        // Booking
        if (y > 250) { pdf.addPage(); y = margin; }
        addSection("BOOKING", [
            [`On Booking (${lead?.on_booking || 0}%)`, (totalWithGST * (lead?.on_booking || 0) / 100).toLocaleString('en-IN')],
            [`Within Thirty Days (${lead?.within_thirty__Days || 0}%)`, (totalWithGST * (lead?.within_thirty__Days || 0) / 100).toLocaleString('en-IN')],
            [`On Possession (${lead?.on_possession || 0}%)`, (totalWithGST * (lead?.on_possession || 0) / 100).toLocaleString('en-IN')]
        ]);

        // Notes
        if (y > 250) { pdf.addPage(); y = margin; }
        pdf.setFontSize(14).setFont('helvetica', 'bold').setTextColor(...primaryColor);
        pdf.text("NOTES", margin, y);
        y += 8;
        pdf.setFontSize(11).setFont('helvetica', 'normal').setTextColor(0, 0, 0);
        const notes = [lead?.note1, lead?.note2, lead?.note3, lead?.note4].filter(Boolean);
        const bullet = "• ", indent = 6, maxWidth = pageWidth - 2 * margin - indent;
        notes.forEach(note => {
            const lines = pdf.splitTextToSize(note!, maxWidth);
            pdf.text(bullet + lines[0], margin, y);
            y += 6;
            for (let i = 1; i < lines.length; i++) {
                pdf.text(lines[i], margin + indent, y);
                y += 6;
            }
            y += 3;
        });

        // Quote before footer
        const quoteY = y + 15;
        pdf.setFontSize(12).setFont("helvetica", "italic").setTextColor(60, 60, 60);
        pdf.text(
            `“Don’t wait to buy real estate, buy real estate and wait.”`,
            pdf.internal.pageSize.getWidth() / 2,
            quoteY,
            { align: "center" }
        );
        y = quoteY + 15;

        // Footer
        const footerY = pdf.internal.pageSize.getHeight() - 40;
        pdf.setFontSize(11).setFont("helvetica", "bold").setTextColor(0, 0, 0);
        pdf.text("For More Information, Contact:", 15, footerY);
        pdf.setFont("helvetica", "normal").setTextColor(...primaryColor);
        pdf.text("+91 9205500984", 15, footerY + 6);
        pdf.text("info@property360degree.in", 15, footerY + 12);
        pdf.setFont("helvetica", "bold");
        pdf.text("Property 360 Degree Pvt Ltd", 15, footerY + 20);
        pdf.setFont("helvetica", "normal").setTextColor(0, 0, 0);
        pdf.text("543, T3 Tower, Golden I, Techzone 4, Greater Noida West", 15, footerY + 26);

        // Save PDF
        const projName = lead?.project_name || "Project";
        const fileName = `${projName.charAt(0).toUpperCase()}${projName.slice(1)}_details.pdf`;
        pdf.save(fileName);

    } catch (error) {
        console.error("Error generating PDF:", error);
        toast.error("Failed to generate PDF");
    }
};


    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar /> {/* Add your Sidebar component here */}
            <div className="flex-1 flex flex-col overflow-hidden">

                <div className="flex flex-col md:flex-row justify-between items-center mb-4 px-4 py-4 bg-white shadow-sm">
                    {(role_ == 1 || role_ == 2) ? <button
                        className="bg-[#004aad] flex items-center gap-x-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg text-white mb-4 md:mb-0"
                        onClick={() => { setType_("add"); setPop(true); }}
                    >
                        <FaPlus color="#fff" size={22} />
                        <span className="text-white font-semibold text-base">Project</span>
                    </button> : ""}
                    <Header header="Project" />
                </div>

                <div className="h-screen overflow-y-auto">
                    <div
                        className="w-full h-48 flex flex-col justify-center items-center"
                    >
                        <p className="w-full font-semibold p-start p-xl px-7">Total Project:{isSuccess && data && data?.data?.count || 0}</p>

                        <div className="flex flex-col w-5/6 mx-auto">
                            <div className="flex flex-row items-center bg-slate-600 rounded-full px-4 py-2 gap-x-2 overflow-y-hidden my-3">
                                <FaSearch color="#ffffffc8" size={24} />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search (type more specific terms)"
                                    className="w-full bg-transparent text-sm md:text-xl font-semibold text-white placeholder:text-white/80 pr-2 focus:outline-none"
                                />
                            </div>

                        </div>
                        <div className="flex flex-row gap-2 w-[85%]   justify-between items-center py-1 ">
                            <div className="border border-gray-300 rounded-lg bg-white ">
                                <select
                                    value={limit}
                                    onChange={(e) => setLimit(Number(e.target.value))}
                                    className="border border-gray-300 rounded-lg bg-white p-2"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                    <option value={250}>250</option>
                                </select>
                            </div>
                            <div className="flex-1 w-full justify-end items-center ">
                                {/* Pagination */}


                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => page > 1 && setPage(page - 1)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-600 text-white"
                                    >
                                        {"<"}
                                    </button>
                                    <span className="font-semibold text-xl">{page}</span>
                                    <button
                                        onClick={() => setPage(page + 1)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-600 text-white"
                                    >
                                        {">"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {!pop && (<div className="mx-1  bg-white rounded-lg shadow-md ">
                        <div className="mb-24">
                            {/* Synchronized Horizontal Scrolling */}
                            <div className=" w-full">
                                <div className="w-full">
                                    {/* Check if data exists */}
                                    {isSuccess && data && data?.data?.project?.length > 0 ? (
                                        <div >
                                            {[...data?.data?.project || []]
                                                .sort((a, b) => {
                                                    if (a.project_name && b.project_name) {
                                                        return a.project_name.localeCompare(b.project_name);
                                                    }
                                                    return 0;
                                                })
                                                .map((lead, index) => (
                                                    <div key={lead?._id || index}  className="p-1 my-2">
                                                        <div className="p-2 w-full bg-gray-100 rounded-lg">
                                                            {/* Header Section */}
                                                            {(role_ == 1 || role_ == 2) ? <div onClick={() => { setType_("update"); setPop(true); setProjectFormData(lead) }} className="basis-2/12 flex flex-row justify-end items-center">

                                                                <BsThreeDots size={22} />
                                                            </div> : ""}
                                                            <div>
                                                                <p className="text-3xl font-bold text-center mb-4">{lead?.project_name || "Name of the Project not found"}</p>
                                                            </div>

                                                            {/* Product Info Section */}
                                                            <div className="mb-6 bg-white flex flex-col p-4 rounded-lg shadow">
                                                                {lead?.client_name && <div className="flex flex-row mb-2">
                                                                    <p className="font-bold flex-1">Client:</p>
                                                                    <p className="flex-1">{lead?.client_name || "Client name missing"}</p>
                                                                </div>}
                                                                <div className="flex flex-row justify-between">
                                                                    {lead?.product && <div className="flex flex-row mb-2">
                                                                        <p className="font-bold flex-1">Product:</p>
                                                                        <p className="">{lead?.product || "Product name missing"}</p>
                                                                    </div>}
                                                                    {lead?.size && <div className="flex flex-row mb-2">
                                                                        <p className="font-bold flex-1">Size:</p>
                                                                        <p className="flex-1">{lead?.size || 0}</p>
                                                                    </div>}
                                                                </div>
                                                                <div className="flex flex-row justify-between">
                                                                    {lead?.floor && <div className="flex flex-row mb-2">
                                                                        <p className="font-bold flex-1">Floor:</p>
                                                                        <p className="flex-1">{lead?.floor || "floor missing"}</p>
                                                                    </div>}
                                                                    {lead?.payment_plan && <div className=" flex flex-row">
                                                                        <p className="font-bold flex-1">Payment Plan:</p>
                                                                        <p className="">{lead?.payment_plan || "Payment Plan not set"}</p>
                                                                    </div>}
                                                                </div>
                                                            </div>

                                                            {/* Basic Price */}
                                                            <div className="mb-6 bg-white p-4 rounded-lg shadow">
                                                                <p className="p-xl font-bold p-orange-600 mb-4">Basic Price</p>
                                                                <div className="flex flex-row justify-between">
                                                                    {lead?.BSP && <div className="flex flex-row mb-2">
                                                                        <p className="flex-1">Price:</p>
                                                                        <p className="flex-1 text-right">{lead?.BSP || 0}</p>
                                                                    </div>}
                                                                    {lead?.size && <div className="flex flex-row mb-2">
                                                                        <p className="flex-1">Size:</p>
                                                                        <p className="flex-1 text-right">{lead?.size || 0}</p>
                                                                    </div>}
                                                                </div>
                                                                <div className="flex flex-row justify-between">
                                                                    {lead?.discount && <div className="flex-row mb-2">
                                                                        <p className="flex-1">Discount:</p>
                                                                        <p className="flex-1 text-right">{lead?.discount || 0}</p>
                                                                    </div>}
                                                                    <div className=" flex flex-row mb-2">
                                                                        <p className="flex-1 text-lg font-medium">Amount:</p>
                                                                        <p className="flex-1 text-lg font-medium text-right">{((lead?.BSP - (lead?.discount || 0)) * (lead?.size || 0)) || 0}</p>
                                                                    </div>
                                                                </div>

                                                            </div>

                                                            {/* Additional Charges */}
                                                            <div className="mb-6 bg-white p-4 rounded-lg shadow">
                                                                <p className="text-xl font-bold text-blue-600 mb-4">Additional Charges</p>
                                                                <div className="flex flex-row justify-between">
                                                                    {lead?.edc && <div className=" flex flex-row mb-2">
                                                                        <p className="flex-1">EDC:</p>
                                                                        <p className="flex-1 text-right">{lead?.edc || "EDC not set"}</p>
                                                                    </div>}
                                                                    {lead?.idc && <div className="flex flex-row mb-2">
                                                                        <p className="flex-1">IDC:</p>
                                                                        <p className="flex-1 text-right">{lead?.idc || "IDC not set"}</p>
                                                                    </div>}
                                                                </div>

                                                                <div className="flex flex-row justify-between">
                                                                    {lead?.ffc && <div className="flex flex-row mb-2">
                                                                        <p className="flex-1">FFC:</p>
                                                                        <p className="flex-1 text-right">{lead?.ffc || "FFC not set"}</p>
                                                                    </div>}
                                                                    {lead?.view_plc && <div className="flex flex-row mb-2">
                                                                        <p className="flex-1">View PLC (5% of BSP):</p>
                                                                        <p className="flex-1 text-right">{lead?.view_plc || 0}</p>
                                                                    </div>}
                                                                </div>
                                                                <div className="flex flex-row justify-between">
                                                                    {lead?.conner_plc && <div className="flex flex-row mb-2">
                                                                        <p className="">Corner PLC (5% of BSP):</p>
                                                                        <p className="flex-1 text-right">{lead?.conner_plc || 0}</p>
                                                                    </div>}
                                                                    {lead?.floor_plc && <div className="flex flex-row mb-2">
                                                                        <p className="">Floor PLC:</p>
                                                                        <p className="flex-1 text-right">{lead?.floor_plc || 0}</p>
                                                                    </div>}
                                                                </div>
                                                                {lead?.other_additional_charges && <div className="flex flex-row mb-2">
                                                                    <p className="">Other Additional Charges::</p>
                                                                    <p className="flex-1 text-right">{lead?.other_additional_charges * lead?.size || 0}</p>
                                                                </div>}
                                                                <div className="flex flex-row">
                                                                    <p className=" text-lg font-medium">Total Additional Charges:</p>
                                                                    <p className=" text-lg font-medium text-right">{(lead?.edc * lead?.size || 0) + (lead?.idc * lead?.size || 0) + (lead?.ffc * lead?.size || 0) + (lead?.view_plc * lead?.size || 0) + (lead?.conner_plc * lead?.size || 0) + (lead?.floor_plc * lead?.size || 0) + (lead?.other_additional_charges * lead?.size || 0)}</p>
                                                                </div>
                                                            </div>

                                                            {/* Possession Charges */}
                                                            <div className="bg-white mb-6 p-4 rounded-lg shadow">
                                                                <p className="text-xl font-bold mb-4 text-green-700">Possession Charges</p>
                                                                <div className="flex flex-row justify-between">
                                                                    {lead?.power_backup_qty && <div className="flex flex-row mb-2">
                                                                        <p className="">Power Backup Quantity(KVA):</p>
                                                                        <p className="flex-1 text-right">{lead?.power_backup_qty || 0}</p>
                                                                    </div>}
                                                                    {lead?.power_backup_price && <div className=" flex flex-row mb-2">
                                                                        <p className="">Power Backup Price:</p>
                                                                        <p className="flex-1 text-right">{lead?.power_backup_price || 0}</p>
                                                                    </div>}
                                                                </div>
                                                                {lead?.leastRent && <div className=" flex flex-row mb-2">
                                                                    <p className="">Lease Rent:</p>
                                                                    <p className="flex-1 text-right">{lead?.leastRent || 0}</p>
                                                                </div>}
                                                                {lead?.other_possession_charges && <div className=" flex flex-row mb-2">
                                                                    <p className="">Other Possession_charges:</p>
                                                                    <p className="flex-1 text-right">{lead?.other_possession_charges * lead?.size || 0}</p>
                                                                </div>}
                                                                <div className="flex flex-row mb-2">
                                                                    <p className=" text-lg font-medium">Total Possession Charges:</p>
                                                                    <p className="flex-1 text-lg font-medium text-right">{(lead?.leastRent * lead?.size || 0) + ((Number(lead?.power_backup_price) * Number(lead?.power_backup_qty)) || 0) + (Number(lead?.other_possession_charges) * lead?.size || 0)}</p>
                                                                </div>
                                                            </div>

                                                            {/* Total Price */}
                                                            <div className="mb-6 bg-white p-4 rounded-lg shadow">
                                                                <div className=" flex  flex-row justify-between">
                                                                    <div className=" flex flex-row mb-2">
                                                                        <p className="font-bold   text-lg ">Total Price:</p>
                                                                        <p className="flex-1 text-lg font-medium text-right">{((lead?.BSP - (lead?.discount || 0)) * (lead?.size || 0)) + (lead?.edc * lead?.size || 0) + (lead?.idc * lead?.size || 0) + (lead?.ffc * lead?.size || 0) + (lead?.view_plc * lead?.size || 0) + (lead?.conner_plc * lead?.size || 0) + (lead?.floor_plc * lead?.size || 0) + ((lead?.leastRent * lead?.size || 0) + (lead?.power_backup_price * lead?.power_backup_qty || 0)) + (Number(lead?.other_possession_charges) * lead?.size || 0) + (Number(lead?.other_additional_charges) * lead?.size || 0)}</p>
                                                                    </div>
                                                                    <div className="flex flex-row mb-2">
                                                                        <p className=" text-base font-medium">GST {lead?.gst || 0}%:</p>
                                                                        <p className="flex-1 text-base font-medium text-right">{(((lead?.BSP - (lead?.discount || 0)) * (lead?.size || 0)) + (lead?.edc * lead?.size || 0) + (lead?.idc * lead?.size || 0) + (lead?.ffc * lead?.size || 0) + (lead?.view_plc * lead?.size || 0) + (lead?.conner_plc * lead?.size || 0) + (lead?.floor_plc * lead?.size || 0) + (Number(lead?.other_possession_charges) * lead?.size || 0) + (Number(lead?.other_additional_charges) * lead?.size || 0) + ((lead?.leastRent * lead?.size || 0) + (lead?.power_backup_price * lead?.power_backup_qty || 0))) * ((lead?.gst || 0) / 100)}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-row">
                                                                    <p className="font-bold   text-lg">Total Amount Including GST:</p>
                                                                    <p className="flex-1 font-bold   text-lg text-right">{(((lead?.BSP - (lead?.discount || 0)) * (lead?.size || 0)) + (lead?.edc * lead?.size || 0) + (lead?.idc * lead?.size || 0) + (lead?.ffc * lead?.size || 0) + (lead?.view_plc * lead?.size || 0) + (lead?.conner_plc * lead?.size || 0) + (lead?.floor_plc * lead?.size || 0) + ((lead?.leastRent * lead?.size || 0) + (lead?.power_backup_price * lead?.power_backup_qty || 0))) + ((((lead?.BSP - (lead?.discount || 0)) * (lead?.size || 0)) + (lead?.edc * lead?.size || 0) + (lead?.idc * lead?.size || 0) + (lead?.ffc * lead?.size || 0) + (lead?.view_plc * lead?.size || 0) + (lead?.conner_plc * lead?.size || 0) + (lead?.floor_plc * lead?.size || 0) + ((lead?.leastRent * lead?.size || 0) + (lead?.power_backup_price * lead?.power_backup_qty || 0)) + (Number(lead?.other_possession_charges) * lead?.size || 0) + (Number(lead?.other_additional_charges) * lead?.size || 0)) * ((lead?.gst || 0) / 100))}</p>
                                                                </div>
                                                            </div>

                                                            {/* On Booking */}
                                                            <div className="mb-6 bg-white p-4 rounded-lg shadow">
                                                                <p className="p-xl font-bold mb-4">Booking</p>
                                                                <div className="flex flex-row mb-2">
                                                                    <p className="flex-1">On Booking({lead?.on_booking || 0}%):</p>
                                                                    <p className="flex-1 text-right">{((((lead?.BSP - (lead?.discount || 0)) * (lead?.size || 0)) + (Number(lead?.other_possession_charges) * lead?.size || 0) + (Number(lead?.other_additional_charges) * lead?.size || 0) + (lead?.edc * lead?.size || 0) + (lead?.idc * lead?.size || 0) + (lead?.ffc * lead?.size || 0) + (lead?.view_plc * lead?.size || 0) + (lead?.conner_plc * lead?.size || 0) + (lead?.floor_plc * lead?.size || 0) + ((lead?.leastRent * lead?.size || 0) + (lead?.power_backup_price * lead?.power_backup_qty || 0))) + ((((lead?.BSP - (lead?.discount || 0)) * (lead?.size || 0)) + (lead?.edc * lead?.size || 0) + (lead?.idc * lead?.size || 0) + (lead?.ffc * lead?.size || 0) + (lead?.view_plc * lead?.size || 0) + (lead?.conner_plc * lead?.size || 0) + (lead?.floor_plc * lead?.size || 0) + ((lead?.leastRent * lead?.size || 0) + (lead?.power_backup_price * lead?.power_backup_qty || 0))) * ((lead?.gst || 0) / 100))) * (lead?.on_booking || 0) / 100}</p>
                                                                </div>
                                                                <div className="flex flex-row mb-2">
                                                                    <p className="flex-1">Within Thirty Days ({lead?.within_thirty__Days || 0}%):</p>
                                                                    <p className="flex-1 text-right">{((((lead?.BSP - (lead?.discount || 0)) * (lead?.size || 0)) + (lead?.edc * lead?.size || 0) + (Number(lead?.other_possession_charges) * lead?.size || 0) + (Number(lead?.other_additional_charges) * lead?.size || 0) + (lead?.idc * lead?.size || 0) + (lead?.ffc * lead?.size || 0) + (lead?.view_plc * lead?.size || 0) + (lead?.conner_plc * lead?.size || 0) + (lead?.floor_plc * lead?.size || 0) + ((lead?.leastRent * lead?.size || 0) + (lead?.power_backup_price * lead?.power_backup_qty || 0))) + ((((lead?.BSP - (lead?.discount || 0)) * (lead?.size || 0)) + (lead?.edc * lead?.size || 0) + (lead?.idc * lead?.size || 0) + (lead?.ffc * lead?.size || 0) + (lead?.view_plc * lead?.size || 0) + (lead?.conner_plc * lead?.size || 0) + (lead?.floor_plc * lead?.size || 0) + ((lead?.leastRent * lead?.size || 0) + (lead?.power_backup_price * lead?.power_backup_qty || 0))) * ((lead?.gst || 0) / 100))) * (lead?.within_thirty__Days || 0) / 100}</p>
                                                                </div>
                                                                <div className="flex flex-row mb-2">
                                                                    <p className="flex-1">On Possession ({lead?.on_possession || 0}%):</p>
                                                                    <p className="flex-1 text-right">{((((lead?.BSP - (lead?.discount || 0)) * (lead?.size || 0)) + (lead?.edc * lead?.size || 0) + (lead?.idc * lead?.size || 0) + (lead?.ffc * lead?.size || 0) + (lead?.view_plc * lead?.size || 0) + (lead?.conner_plc * lead?.size || 0) + (lead?.floor_plc * lead?.size || 0) + ((lead?.leastRent * lead?.size || 0) + (Number(lead?.other_possession_charges) * lead?.size || 0) + (Number(lead?.other_additional_charges) * lead?.size || 0) + (lead?.power_backup_price * lead?.power_backup_qty || 0))) + ((((lead?.BSP - (lead?.discount || 0)) * (lead?.size || 0)) + (lead?.edc * lead?.size || 0) + (lead?.idc * lead?.size || 0) + (lead?.ffc * lead?.size || 0) + (lead?.view_plc * lead?.size || 0) + (lead?.conner_plc * lead?.size || 0) + (lead?.floor_plc * lead?.size || 0) + ((lead?.leastRent * lead?.size || 0) + (lead?.power_backup_price * lead?.power_backup_qty || 0))) * ((lead?.gst || 0) / 100))) * (lead?.on_possession || 0) / 100}</p>
                                                                </div>
                                                            </div>

                                                            <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
                                                                <p className="text-xl font-bold mb-4">Notes</p>
                                                                <div className="flex-col space-y-1">
                                                                    {lead?.note1 && (
                                                                        <p className="text-lg text-gray-800">• {lead.note1}
                                                                        </p>
                                                                    )}
                                                                    {lead?.note2 && (
                                                                        <p className="text-lg text-gray-800">• {lead.note2}</p>
                                                                    )}
                                                                    {lead?.note3 && (
                                                                        <p className="text-lg text-gray-800">• {lead.note3}</p>
                                                                    )}
                                                                    {lead?.note4 && (
                                                                        <p className="text-lg text-gray-800">• {lead.note4}</p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <button
                                                                onClick={() => handleDownloadPDF(lead)}
                                                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md my-2"
                                                            >
                                                                Download PDF
                                                            </button>

                                                        </div>
                                                    </div>

                                                ))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center py-10">
                                            <p className="p-gray-400 p-lg font-semibold">
                                                No Data Found!
                                            </p>
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>
                    </div>)}
                </div>
            </div>
            {pop && <ProjectForm projectFormData={projectFormData} setProjectFormData={setProjectFormData} type_={type_} setPop={setPop} refetch={refetch} />}


        </div>
    )
}


