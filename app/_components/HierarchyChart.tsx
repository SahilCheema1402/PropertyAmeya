"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Tree, TreeNode } from "react-organizational-chart";
import { HiOutlineOfficeBuilding } from "react-icons/hi";
import { FaUser, FaPlus } from "react-icons/fa";
import { useG_HIERARCHY_CHARTQuery } from "@app/_api_query/staff/staffs.api";
import image from "../../assets/images/612198a449d9d65eba44862fcaa393c118c9b20c.png";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type AnyUser = {
  _id: string;
  userName: string;
  designation?: string;
  role?: string;
  status?: string | boolean;
  photoUrl?: string;
  children?: AnyUser[];
};

const StaffModal = dynamic(() => import("../_components/Staff/StaffForm/index"), { ssr: false });

const roles: Record<"1" | "2" | "3" | "31" | "4" | "5" | "6" | "7", string> = {
  "1": "Super Admin",
  "2": "Admin",
  "3": "VP Sales",
  "31": "Sales Coordinator",
  "4": "Area Manager",
  "5": "Sales Executive",
  "6": "Team Lead",
  "7": "Sales Manager",
};

const toTitleCase = (str = "") =>
  str
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const getRoleName = (roleId?: string) =>
  roleId ? roles[roleId as keyof typeof roles] ?? "" : "";

const getStatusText = (u?: AnyUser) => {
  if (!u) return "Active";
  if (typeof u.status === "boolean") return u.status ? "Active" : "Inactive";
  return u.status ?? "Active";
};

const StatusPill: React.FC<{ status?: string }> = ({ status = "Active" }) => {
  const active = status.toLowerCase() === "active";
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${active
        ? "bg-green-100 text-green-700"
        : "bg-red-100 text-red-700"
        }`}
    >
      <span
        className={`w-1 h-1 rounded-full ${active ? "bg-green-500" : "bg-red-500"
          }`}
      />
      {status}
    </span>
  );
};

const NodeCard: React.FC<{ user: AnyUser; onAdd?: (manager?: AnyUser) => void }> = ({
  user,
  onAdd,
}) => {
  const status = getStatusText(user);
  const roleName = getRoleName(user.role || "");

  return (
    <div className="relative">
      {/* Main Card */}
      <div className="bg-white border border-gray-200 rounded-xl px-3 py-4 w-[200px] shadow-sm text-center flex flex-col items-center mb-6">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center overflow-hidden mb-2">
          {user.photoUrl ? (
            <img
              src={user.photoUrl}
              alt={user.userName}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <img
              src={typeof image === "string" ? image : (image as any).src}
              alt="Default"
              className="w-full h-full object-cover rounded-full"
            />
          )}
        </div>

        <h4 className="font-semibold text-gray-900 text-xs leading-tight mb-1 break-words text-center w-full">
          {toTitleCase(user.userName)}
        </h4>
        <p className="text-[10px] text-gray-500 mb-2 break-words text-center w-full">
          {user.designation || roleName}
        </p>


        {/* Status */}
        <StatusPill status={status} />
      </div>

      {/* Add Button - positioned below the card */}
      {onAdd && (
        <div className="flex justify-center mt-2">
          <button
            onClick={() =>  {}}
            className="w-6 h-6 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-sm transition-colors"
            title="Add Employee"
          >
            <FaPlus size={10} />
          </button>
        </div>
      )}
    </div>
  );
};

const CompanyHeader: React.FC<{ companyName: string }> = ({ companyName }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-4 shadow-sm text-center w-[250px] flex flex-col items-center">
      {/* Company Icon */}
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex items-center justify-center mb-3">
        <HiOutlineOfficeBuilding className="text-gray-600 text-xl" />
      </div>

      <p className="text-xs text-gray-500 mt-1">Property 360 Organization  Chart</p>
    </div>
  );
};

const OrgChartComponent: React.FC = () => {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [showStaff, setShowStaff] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  const handleExport = async () => {
    if (!contentRef.current) return;

    const node = contentRef.current;
    const container = containerRef.current;

    // 1) temporarily remove scaling/clipping so we capture the full chart
    const prevTransform = node.style.transform;
    const prevTransformOrigin = node.style.transformOrigin;
    const prevOverflow = container?.style.overflow;

    node.style.transform = "none";
    node.style.transformOrigin = "top left";
    if (container) container.style.overflow = "visible";

    await new Promise((r) => setTimeout(r, 0)); // let layout settle

    // 2) capture full node
    const canvas = await html2canvas(node, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      width: node.scrollWidth,
      height: node.scrollHeight,
      windowWidth: node.scrollWidth,
      windowHeight: node.scrollHeight,
    });

    // 3) restore styles
    node.style.transform = prevTransform;
    node.style.transformOrigin = prevTransformOrigin;
    if (container && prevOverflow !== undefined) container.style.overflow = prevOverflow;

    // 4) build PDF with margins + centering
    const img = canvas.toDataURL("image/png");
    const orientation = canvas.width >= canvas.height ? "l" : "p";
    const pdf = new jsPDF({ orientation, unit: "mm", format: "a3" });

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 20; // mm — increase to 30/40 if you want more white space

    const maxW = pageW - margin * 2;
    const maxH = pageH - margin * 2;

    // keep aspect ratio inside margins
    let w = maxW;
    let h = (canvas.height * w) / canvas.width;
    if (h > maxH) {
      h = maxH;
      w = (canvas.width * h) / canvas.height;
    }

    const x = (pageW - w) / 2;
    const y = (pageH - h) / 2;

    pdf.addImage(img, "PNG", x, y, w, h);
    pdf.save("org-chart.pdf");
  };

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("comUserId") || "{}");
      setCompanyId(u?.compId ?? null);
    } catch { }
  }, []);

  const {
    data: hierarchyData,
    isLoading,
    isError,
    refetch,
  } = useG_HIERARCHY_CHARTQuery(companyId!, {
    skip: !companyId,
  });

  const companyName = useMemo(() => {
    return (
      hierarchyData?.company?.name ||
      hierarchyData?.data?.companyName ||
      "Property 360"
    );
  }, [hierarchyData]);

  const root: AnyUser | undefined = hierarchyData?.data;

  useEffect(() => {
    const handle = () => {
      if (!containerRef.current || !contentRef.current) return;
      const cw = containerRef.current.clientWidth;
      const iw = contentRef.current.scrollWidth;
      if (iw === 0) return;
      const s = Math.min(1, (cw - 48) / iw);
      setScale(s < 0.7 ? 0.7 : s);
    };
    handle();
    const timeoutId = setTimeout(handle, 100); // Delay for initial render
    window.addEventListener("resize", handle);
    return () => {
      window.removeEventListener("resize", handle);
      clearTimeout(timeoutId);
    };
  }, [hierarchyData]);

  const openAddEmployeeForm = () => setShowStaff(true);

  const renderTree = (u: AnyUser) => (
    <TreeNode
      key={u._id}
      label={
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <NodeCard user={u} onAdd={() => openAddEmployeeForm()} />
        </div>
      }
    >
      {u.children?.map((c) => renderTree(c))}
    </TreeNode>
  );

  if (isLoading)
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading organizational chart...</div>
      </div>
    );

  if (isError || !root)
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-red-600">Error loading organizational chart</div>
      </div>
    );

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-4">
          {/* <span className="font-medium text-gray-900">All Employees</span> */}
          <button className="text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors underline">
            ORG Chart
          </button>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
        >
          Export
        </button>

      </div>

      {/* Chart Container */}
      <div
        ref={containerRef}
        className="overflow-x-auto overflow-y-auto p-6 hierarchy-grid"
        style={{ minHeight: "500px" }}
      >
        <div
          ref={contentRef}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center"
          }}
          className="mx-auto inline-block"
        >
          <Tree
            label={
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <CompanyHeader companyName={companyName} />
              </div>
            }
            lineWidth="2px"
            lineColor="#9CA3AF"
            lineBorderRadius="4px"
            nodePadding="30px"
          >
            <TreeNode
              label={
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <NodeCard user={root} onAdd={() => openAddEmployeeForm()} />
                </div>
              }
            >
              {root.children?.map((child) => renderTree(child))}
            </TreeNode>
          </Tree>
        </div>
      </div>

      {showStaff && <StaffModal setStaffAdd={setShowStaff} refetch={refetch} />}
    </div>
  );
};

export default OrgChartComponent;