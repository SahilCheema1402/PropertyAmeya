"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { FaBars, FaCaretDown, FaUserCircle, FaTimes } from "react-icons/fa";
import { useRouter, usePathname } from "next/navigation";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import Image from "next/image";
import HomeImage from "./../../assets/images/Home-2--Streamline-Core-Gradient.png";
import LeadBankImage from "./../../assets/images/Performance-User-Graph--Streamline-Ultimate.png";
import AddEmployeeImage from "./../../assets/images/add-employee.png";
import InventoryImage from "./../../assets/images/Inventory.png";
import EMIcalculatorImage from "./../../assets/images/Cog-Double--Streamline-Flex.png";
import Logo from "./../../assets/images/Ameya Innovex Logo.png";
import ReportImage from "./../../assets/images/report.png";
import Logo2 from "./../../assets/images/logo-a.png";
import EmployeeLeads from "./../../assets/images/rent.png";

type SidebarProps = {
  className?: string;
};

interface NavigationItem {
  label: string;
  image: any;
  path: string;
  roles?: number[];
}

// Move static data outside component to prevent recreation
const BASE_NAVIGATION_ITEMS: NavigationItem[] = [
  { label: "Home", image: HomeImage, path: "/home" },
  { label: "Attendance", image: EmployeeLeads, path: "/Attendance" },
  { label: "Leads Bank", image: LeadBankImage, path: "/Leads" },
  { label: "New Leads", image: LeadBankImage, path: "/NewLeads", roles: [1, 2] },
  { label: "Rechurn Leads", image: LeadBankImage, path: "/Rechurn", roles: [1, 2] },
  { label: "Add Employee", image: AddEmployeeImage, path: "/AddEmployee", roles: [1, 2, 31] },
  { label: "Expense", image: EmployeeLeads, path: "/Expense", roles: [1, 2] },
  // { label: "Employee Leads", image: EmployeeLeads, path: "/employeeLeads", roles: [1, 2, 3, 4, 6, 7, 31] },
  { label: "Target Vs Achievement", image: ReportImage, path: "/targetVsAchievement" },
  { label: "Inventory", image: InventoryImage, path: "/inventory" },
  { label: "Customer", image: InventoryImage, path: "/customer", roles: [1, 2, 3, 4, 5, 6, 7, 31] },
  { label: "Staff Location", image: EmployeeLeads, path: "/StaffLocation", roles: [1, 2] },
  { label: "Profile", image: HomeImage, path: "/Profile" },
  { label: "Reports", image: ReportImage, path: "/reports" },
  { label: "EMI Calculator", image: EMIcalculatorImage, path: "https://emicalculator.net/" },
  { label: "Project Details", image: HomeImage, path: "/ProjectDetails" },
  { label: "Terms And Conditions", image: EmployeeLeads, path: "/Terms_and_conditions", roles: [1, 2] },
  { label: "Hierarchy", image: AddEmployeeImage, path: "/Hierarchy" },
  { label: "Privacy Policy", image: InventoryImage, path: "/PrivacyPolicy" },
];

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState<string>("");
  const [designation, setDesignation] = useState<string>("");
  const [role, setRole] = useState<number>(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Initialize user data only once
  useEffect(() => {
    if (typeof window === 'undefined' || isInitialized) return;

    try {
      const user = localStorage.getItem('user');
      const roleFromStorage = localStorage.getItem('role');

      if (user) {
        const parsedUser = JSON.parse(user);
        setUserName(parsedUser.userName || "");
        setDesignation(parsedUser.designation || "");
      }

      if (roleFromStorage) {
        setRole(Number(roleFromStorage));
      }

      setIsInitialized(true);
    } catch (error) {
      console.error("Error parsing user data from localStorage", error);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Memoize filtered navigation items based on role
  const navigationItems = useMemo(() => {
    if (!isInitialized) return [];

    return BASE_NAVIGATION_ITEMS.filter(item => {
      // If no roles specified, show to everyone
      if (!item.roles) return true;
      // If roles specified, check if user's role is included
      return item.roles.includes(role);
    });
  }, [role, isInitialized]);

  // Memoize logout function
  const logout = useCallback(async () => {
    try {
      // Clear localStorage items
      const itemsToRemove = ['accessToken', 'refreshToken', 'comUserId', 'role', 'user', 'userHierarchy'];
      itemsToRemove.forEach(item => localStorage.removeItem(item));

      // Navigate to login
      router.push('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [router]);

  // Memoize active item check
  const isItemActive = useCallback((path: string) => {
    if (path === "https://emicalculator.net/") return false;
    return pathname === path;
  }, [pathname]);

  // Memoize toggle function
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Memoize navigation item component
  const NavigationItem = useMemo(() => {
    return ({ item, isActive }: { item: NavigationItem; isActive: boolean }) => (
      <Link
        href={item.path}
        className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all duration-200 ${isActive
            ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-md"
            : "text-gray-600 hover:bg-gradient-to-r hover:from-blue-100 hover:to-blue-300 hover:text-blue-600"
          }`}
        target={item.path.startsWith('http') ? '_blank' : undefined}
        rel={item.path.startsWith('http') ? 'noopener noreferrer' : undefined}
        prefetch={!item.path.startsWith('http')} // Only prefetch internal links
      >
        <div className="w-6 h-6 flex-shrink-0">
          <Image
            src={item.image}
            alt={`${item.label} icon`}
            width={24}
            height={24}
            className="object-contain"
            priority={isActive} // Only prioritize active item's image
          />
        </div>
        <span className="text-lg font-semibold truncate">
          {item.label}
        </span>
      </Link>
    );
  }, []);

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className={`w-64 bg-white shadow-lg ${className}`}>
        <div className="p-4 animate-pulse">
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${className}`}>
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 bg-blue-500 text-white rounded-lg md:hidden shadow-lg transition-transform hover:scale-105"
        aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isSidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transition-all duration-300 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 z-40 flex flex-col`}
      >
        {/* Logo section */}
        <div className="p-4 mb-4 flex-shrink-0">
          <Image
            src={Logo2}
            alt="Company Logo"
            width={200}
            height={80}
            className="object-contain"
            priority
          />
        </div>

        {/* Navigation section */}
        <nav className="flex-1 overflow-y-auto px-4 pb-20">
          <ul className="space-y-2">
            {navigationItems.map((item, index) => (
              <li key={`${item.path}-${index}`}>
                <NavigationItem
                  item={item}
                  isActive={isItemActive(item.path)}
                />
              </li>
            ))}
          </ul>
        </nav>

        {/* User info section */}
        <div className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-200 flex-shrink-0">
          <Popover className="p-4 flex items-center gap-x-3 relative">
            <PopoverButton className="cursor-pointer hover:text-blue-600 transition-colors">
              <FaUserCircle size={32} />
            </PopoverButton>
            <div className="flex flex-col justify-center text-xs gap-x-2 flex-1 min-w-0">
              <p className="font-semibold uppercase truncate">{userName}</p>
              <p className="text-gray-400 text-[10px] capitalize truncate">
                {designation}
              </p>
            </div>
            <PopoverButton className="cursor-pointer hover:text-blue-600 transition-colors">
              <FaCaretDown size={16} />
            </PopoverButton>

            <PopoverPanel className="flex flex-col justify-center items-center bg-white py-2 z-50 border border-gray-300 rounded-xl text-sm shadow-xl absolute left-1/2 transform -translate-x-1/2 bottom-[calc(100%+10px)] min-w-max">
              <button
                className="hover:bg-gray-100 px-6 py-2 rounded-lg transition-colors w-full text-center"
                onClick={logout}
              >
                Logout
              </button>
            </PopoverPanel>
          </Popover>
        </div>
      </div>

      {/* Backdrop for mobile sidebar */}
      <div className="flex-1 md:ml-64 transition-all duration-300">
        {/* Main content area - this will be handled by the parent component */}
      </div>
    </div>
  );
};

export default Sidebar;