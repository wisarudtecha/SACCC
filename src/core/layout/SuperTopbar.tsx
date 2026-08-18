// src/core/layout/SuperTopbar.tsx
import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  Box,
  Building2,
  CalendarPlus,
  ChartNoAxesGantt,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Ellipsis,
  EllipsisVertical,
  FileBarChart2,
  FileEdit,
  FileText,
  FolderOpen,
  GitBranch,
  History,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  LayoutTemplate,
  Map,
  Menu,
  NotebookPen,
  Package,
  PackagePlus,
  PackageSearch,
  Phone,
  PlusCircle,
  Server,
  Settings,
  ShieldCheck,
  ShoppingCart,
  User,
  UserCheck,
  Users,
  Workflow,
  Wrench,
  X,
  ListIcon,
  Presentation,
  BoxesIcon,
  Bell
} from "lucide-react";
import { ThemeToggleButton } from "@/core/components/common/ThemeToggleButton";
import { Dropdown } from "@/core/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/core/components/ui/dropdown/DropdownItem";
import { usePermissions } from "@/core/hooks/usePermissions";
import { useTranslation } from "@/core/hooks/useTranslation";
import LangDropdown from "@/core/components/header/LangDropdown";
import NotificationDropdown from "@/core/components/header/NotificationDropdown";
import UserDropdown from "@/core/components/header/UserDropdown";
import { KbPermission } from "@/kms/common/utils/enumHelper"
export type MoreItem = {
  name: string;
  icon?: React.ReactNode;
  path?: string;
  permission?: boolean;
  disabled?: boolean;
  subItems?: {
    name: string;
    icon?: React.ReactNode;
    path: string;
    permission?: boolean;
    disabled?: boolean;
  }[];
};

export interface Props {
  collapsed: boolean;
  displayed: boolean;
  displaySidebar: () => void;
  toggleSidebar: () => void;
}

export interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
}

// Tooltip classes shared by every icon-row trigger (SidebarItem and the "More" button):
// plain inline label below xl, a floating pill between xl and 2xl (icon-only range),
// back to a normal inline label at 2xl+. `side` controls which way the xl-only pill opens.
const tooltipLabelClasses = (side: "right" | "left" = "right") =>
  `whitespace-nowrap xl:absolute xl:hidden xl:group-hover:flex xl:top-1/2 xl:-translate-y-1/2 xl:bg-gray-900 xl:text-white xl:text-xs xl:rounded xl:px-2 xl:py-1 xl:shadow-lg xl:z-20 2xl:static 2xl:flex 2xl:translate-y-0 2xl:bg-transparent 2xl:text-inherit 2xl:text-sm 2xl:rounded-none 2xl:px-0 2xl:py-0 2xl:shadow-none 2xl:z-auto ${
    side === "right"
      ? "xl:left-full xl:ml-2 2xl:left-auto 2xl:ml-0"
      : "xl:right-full xl:mr-2 2xl:right-auto 2xl:mr-0"
  }`;

const SidebarItem = ({ to, icon, label, end }: SidebarItemProps) => {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `group relative flex gap-2.5 items-center xl:justify-center px-2.5 py-2 rounded-lg transition-colors whitespace-nowrap ${
          isActive
            ? "bg-[#155DFC] text-white w-min"
            : "bg-[#1E293B] dark:bg-gray-900 text-[#9CA3AF] hover:text-gray-300"
        }`
      }
    >
      {icon}
      <span className={tooltipLabelClasses("right")}>{label}</span>
    </NavLink>
  );
};

const SuperTopbar = (
  { collapsed, displayed, displaySidebar, toggleSidebar }: Props
) => {
  const permissions = usePermissions();
  const { t } = useTranslation();

  const moreItems: MoreItem[] = useMemo(() => [
    {
      icon: <FolderOpen />,
      name: t("navigation.super_app.topbar.more.menu.case.title"),
      permission: permissions.hasAnyPermission([
        "case.create", "case.assign", "case.view_history"
      ]),
      subItems: [
        {
          icon: <PlusCircle />,
          name: t("navigation.super_app.topbar.more.menu.case.sub_menu.create"),
          path: "/cms/case/creation",
          permission: permissions.hasPermission("case.create")
        },
        {
          icon: <CalendarPlus />,
          name: t("navigation.super_app.topbar.more.menu.case.sub_menu.schedule"),
          path: "/cms/case/creation_schedule_date",
          permission: permissions.hasPermission("case.create")
        },
        {
          icon: <UserCheck />,
          name: t("navigation.super_app.topbar.more.menu.case.sub_menu.assign"),
          path: "/cms/case/assignment",
          permission: permissions.hasPermission("case.assign")
        },
        {
          icon: <History />,
          name: t("navigation.super_app.topbar.more.menu.case.sub_menu.history"),
          path: "/cms/case/history",
          permission: permissions.hasPermission("case.view_history")
        }
      ]
    },
    {
      icon: <Package />,
      name: t("navigation.super_app.topbar.more.menu.product.title"),
      permission: permissions.hasAnyPermission([
        "product.view", "product_stock.view", "sparepart.view", "sparepart_stock.view", "order.view", 
      ]),
      subItems: [
        {
          icon: <Package />,
          name: t("navigation.super_app.topbar.more.menu.product.sub_menu.product"),
          path: "/cms/products/",
          permission: permissions.hasPermission("product.view")
        },
        {
          icon: <Box />,
          name: t("navigation.super_app.topbar.more.menu.product.sub_menu.product_stock"),
          path: "/cms/products/stock",
          permission: permissions.hasPermission("product_stock.view")
        },
        {
          icon: <PackageSearch />,
          name: t("navigation.super_app.topbar.more.menu.product.sub_menu.inventory"),
          path: "/cms/inventory/",
          permission: permissions.hasPermission("sparepart.view")
        },
        {
          icon: <Box />,
          name: t("navigation.super_app.topbar.more.menu.product.sub_menu.inventory_stock"),
          path: "/cms/inventory/stock",
          permission: permissions.hasPermission("sparepart_stock.view")
        },
        {
          icon: <PackagePlus />,
          name: t("navigation.super_app.topbar.more.menu.product.sub_menu.inventory_request"),
          path: "/cms/inventory/request",
          permission: permissions.hasPermission("order.view")
        },
        // {
        //   icon: <Wrench />,
        //   name: "Package & Service",
        //   path: "/cms/services"
        // }
      ]
    },
    {
      icon: <Users />,
      name: t("navigation.super_app.topbar.more.menu.user_mgmt.title"),
      permission: permissions.hasAnyPermission([
        "user.view", "role.view", "usergroup.view", "organization.view", "auditlog.view"
      ]),
      subItems: [
        {
          icon: <User />,
          name: t("navigation.super_app.topbar.more.menu.user_mgmt.sub_menu.user"),
          path: "/user",
          permission: permissions.hasPermission("user.view")
        },
        {
          icon: <ShieldCheck />,
          name: t("navigation.super_app.topbar.more.menu.user_mgmt.sub_menu.role_privilege"),
          path: "/role-privilege",
          permission: permissions.hasPermission("role.view")
        },
        {
          icon: <Users />,
          name: t("navigation.super_app.topbar.more.menu.user_mgmt.sub_menu.user_group"),
          path: "/user-group",
          permission: permissions.hasPermission("usergroup.view")
        },
        {
          icon: <Building2 />,
          name: t("navigation.super_app.topbar.more.menu.user_mgmt.sub_menu.org"),
          path: "/organization",
          permission: permissions.hasPermission("organization.view")
        },
        {
          icon: <ClipboardList />,
          name: t("navigation.super_app.topbar.more.menu.user_mgmt.sub_menu.audit"),
          path: "/auditlog",
          permission: permissions.hasPermission("auditlog.view")
        }
      ]
    },
    {
      icon: <LayoutTemplate />,
      name: t("navigation.super_app.topbar.more.menu.form.title"),
      permission: permissions.hasAnyPermission([
        "form.view", "form.create", "form.update"
      ]),
      subItems: [
        {
          icon: <FileText />,
          name: t("navigation.super_app.topbar.more.menu.form.sub_menu.mgmt"),
          path: "/cms/form-management",
          permission: permissions.hasPermission("form.view")
        },
        {
          icon: <FileEdit />,
          name: t("navigation.super_app.topbar.more.menu.form.sub_menu.builder"),
          path: "/cms/dynamic-form",
          permission: permissions.hasPermission("form.create")
        }
      ]
    },
    {
      icon: <Workflow />,
      name: t("navigation.super_app.topbar.more.menu.workflow.title"),
      permission: permissions.hasAnyPermission([
        "workflow.view", "workflow.create", "workflow.update"
      ]),
      subItems: [
        {
          icon: <GitBranch />,
          name: t("navigation.super_app.topbar.more.menu.workflow.sub_menu.mgmt"),
          path: "/cms/workflow/list",
          permission: permissions.hasPermission("workflow.view")
        },
        {
          icon: <Workflow />,
          name: t("navigation.super_app.topbar.more.menu.workflow.sub_menu.builder"),
          path: "/cms/workflow/editor/v3",
          permission: permissions.hasPermission("workflow.create")
        }
      ]
    },
    {
      icon: <BarChart3 />,
      name: t("navigation.super_app.topbar.more.menu.dashboard_analytic.title"),
      permission: permissions.hasAnyPermission([
        "dashboard.view", "crm_dashboard.view"
      ]),
      subItems: [
        {
          icon: <BarChart3 />,
          name: t("navigation.super_app.topbar.more.menu.dashboard_analytic.sub_menu.case"),
          path: "/cms/",
          permission: permissions.hasPermission("dashboard.view")
        },
        {
          icon: <ChartNoAxesGantt />,
          name: t("navigation.super_app.topbar.more.menu.dashboard_analytic.sub_menu.product"),
          path: "/cms/products/dashboard",
          permission: permissions.hasPermission("crm_dashboard.view")
        },
        {
          icon: <LayoutDashboard />,
          name: t("navigation.super_app.topbar.more.menu.dashboard_analytic.sub_menu.custom"),
          path: "/dashboard/custom",
          permission: permissions.hasPermission("dashboard.view")
        }
      ]
    },
    {
      icon: <FileBarChart2 />,
      name: t("navigation.super_app.topbar.more.menu.report.title"),
      permission: permissions.hasAnyPermission([
        "report.view"
      ]),
      subItems: [
        {
          icon: <FileBarChart2 />,
          name: t("navigation.super_app.topbar.more.menu.report.sub_menu.case"),
          path: "/cms/report#report-group-case",
          permission: permissions.hasPermission("report.view")
        },
        {
          icon: <ShoppingCart />,
          name: t("navigation.super_app.topbar.more.menu.report.sub_menu.order"),
          path: "/cms/report#report-group-order",
          permission: permissions.hasPermission("report.view")
        }
      ]
    },
    {
      icon: <Settings />,
      name: t("navigation.super_app.topbar.more.menu.system_config.title"),
      permission: permissions.hasAnyPermission([
        "service.view", "unit.view", "settings.view"
      ]),
      subItems: [
        {
          icon: <Server />,
          name: t("navigation.super_app.topbar.more.menu.system_config.sub_menu.service_type"),
          path: "/cms/service",
          permission: permissions.hasPermission("service.view")
        },
        {
          icon: <Layers />,
          name: t("navigation.super_app.topbar.more.menu.system_config.sub_menu.unit"),
          path: "/cms/unit",
          permission: permissions.hasPermission("unit.view")
        },
        {
          icon: <Wrench />,
          name: t("navigation.super_app.topbar.more.menu.system_config.sub_menu.skill"),
          path: "/cms/skill",
          permission: permissions.hasAnyPermission(["unit.view"])
        },
        {
          icon: <Map />,
          name: t("navigation.super_app.topbar.more.menu.system_config.sub_menu.area"),
          path: "/cms/area",
          permission: permissions.hasPermission("settings.view")
        }
      ]
    },
    {
      icon: <Users />,
      name: t("navigation.super_app.topbar.more.menu.contact.title"),
      permission: permissions.hasAnyPermission([
        "contact.view", "contact_config.view", "appointment.view"
      ]),
      subItems: [
        {
          icon: <Users />,
          name: t("navigation.super_app.topbar.more.menu.contact.sub_menu.list"),
          path: "/cc/contacts-list",
          permission: permissions.hasPermission("contact.view")
        },
        {
          icon: <Settings />,
          name: t("navigation.super_app.topbar.more.menu.contact.sub_menu.config"),
          path: "/cc/contacts-configurations",
          permission: permissions.hasPermission("contact_config.view")
        },
        {
          icon: <NotebookPen />,
          name: t("navigation.super_app.topbar.more.menu.contact.sub_menu.appointment"),
          path: "/cc/appointment",
          permission: permissions.hasPermission("appointment.view")
        }
      ]
    },
    {
      icon: <Wrench />,
      name: t("navigation.super_app.topbar.more.menu.package_service.title"),
      permission: permissions.hasAnyPermission([
        "package.view", "crm_service.view"
      ]),
      subItems: [
        {
          icon: <Package />,
          name: t("navigation.super_app.topbar.more.menu.package_service.sub_menu.package"),
          path: "/cms/packages",
          permission: permissions.hasPermission("package.view"),
          disabled: true
        },
        {
          icon: <Wrench />,
          name: t("navigation.super_app.topbar.more.menu.package_service.sub_menu.service"),
          path: "/cms/services",
          permission: permissions.hasPermission("crm_service.view")
        }
      ]
    },
    //  KB
    ...(permissions.hasAnyPermission([
      KbPermission.KB_CATEGORY_VIEW,
      KbPermission.KB_BANNER_VIEW,
      KbPermission.KB_SOURCE_VIEW,
      KbPermission.KB_FILE_VIEW,
      KbPermission.KB_BROADCAST_VIEW
    ])
      ? [{
        icon: <Package />,
        name: t("navigation.super_app.topbar.more.menu.knowledge.title"),
        permission: true,
        subItems: [
          {
            icon: <ListIcon />,
            name: t("navigation.super_app.topbar.more.menu.knowledge.sub_menu.category"),
            path: "/kms/category-manager",
            permission: permissions.hasPermission(KbPermission.KB_CATEGORY_VIEW)
          },
          {
            icon: <BoxesIcon />,
            name: t("navigation.super_app.sidebar.knowledge.menu.files"),
            path: "/kms/files",
            permission: permissions.hasPermission(KbPermission.KB_FILE_VIEW)
          },
          {
            icon: <Bell />,
            name: t("navigation.super_app.sidebar.knowledge.menu.broadcast"),
            path: "/kms/broadcast",
            permission: permissions.hasPermission(KbPermission.KB_BROADCAST_VIEW)
          },
          {
            icon: <Presentation />,
            name: t("navigation.super_app.topbar.more.menu.knowledge.sub_menu.banner"),
            path: "/kms/banner-management",
            permission: permissions.hasPermission(KbPermission.KB_BANNER_VIEW)
          },
          {
            icon: <Server />,
            name: t("navigation.super_app.topbar.more.menu.knowledge.sub_menu.source"),
            path: "/kms/source",
            permission: permissions.hasPermission(KbPermission.KB_SOURCE_VIEW)
          } 
        ]
      }]
      : [])
  ], [permissions, t]);

  const sortedItems = useMemo(() => {
    // return moreItems;
    return [...moreItems].sort((a, b) => {
      const aCount = a.subItems?.length ?? 0;
      const bCount = b.subItems?.length ?? 0;
      if (bCount !== aCount) {
        return bCount - aCount;
      }
      return a.name.localeCompare(b.name);
    });
  }, [moreItems]);

  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const closeDropdown = () => {
    setIsOpen(false);
  }

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    }
  };

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  }

  return (
    <header className="bg-[#1E293B] dark:bg-gray-900 border-gray-200 dark:border-gray-800 border-b flex sticky top-0 w-full z-9999">
      <div className="xl:flex flex-col xl:flex-row grow items-start xl:items-center justify-between px-4 xl:px-5 gap-3 relative w-full min-w-0 border-l border-gray-700 dark:border-gray-800">
        <button
          aria-label="Toggle Sidebar"
          className={`bg-[#1E293B] dark:bg-gray-900 xl:flex items-center justify-center my-3 xl:my-0 px-2 xl:px-1 py-2 relative text-[#9CA3AF] hover:text-gray-300 hidden`}
          onClick={!displayed ? displaySidebar : handleToggle}
        >
          {!displayed ? <Menu size={20} /> : (collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />)}
        </button>

        <div className="flex ml-auto w-full xl:hidden">
          <button
            className={`bg-[#1E293B] dark:bg-gray-900 flex items-center justify-center ml-0 my-3 xl:my-0 px-2 xl:px-1 py-2 relative text-[#9CA3AF] hover:text-gray-300 xl:hidden`}
            onClick={displaySidebar}
          >
            <Menu size={20} />
          </button>

          <button
            className={`bg-[#1E293B] dark:bg-gray-900 flex items-center justify-center ml-auto my-3 xl:my-0 px-2 xl:px-1 py-2 relative text-[#9CA3AF] hover:text-gray-300 xl:hidden`}
            onClick={toggleApplicationMenu}
          >
            {isApplicationMenuOpen ? <X size={20} /> : <EllipsisVertical size={20} />}
          </button>
        </div>

        {/* Left */}
        <div
          // className="border-gray-200 dark:border-gray-800 xl:flex gap-3 sm:gap-4 items-center justify-between xl:justify-normal px-0 py-3 text-sm w-full"
          className={`${
            isApplicationMenuOpen ? "block" : "hidden"
          } border-gray-200 dark:border-gray-800 xl:flex gap-3 sm:gap-4 items-center justify-between xl:justify-normal px-0 py-3 text-sm w-full min-w-0`}
        >
          {/*
          <button
            className={`bg-[#1E293B] dark:bg-gray-900 flex items-center justify-center px-2 xl:px-0 py-2 relative text-[#9CA3AF] hover:text-gray-300`}
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          */}

          {/*
            Below xl this is the mobile hamburger list (icon + label). From xl to 2xl there
            isn't room for labels, so items collapse to icon-only and reveal their label as a
            hover tooltip (see tooltipLabelClasses); at 2xl+ labels are shown inline again.
            "More" stays last so its tooltip can open to the left instead of the right,
            keeping it clear of the language/theme/notification/user cluster.
          */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* {permissions.hasPermission("workspace.???") && ( */}
              <SidebarItem to="/cms/" icon={<LayoutGrid size={18} />} label={t("navigation.super_app.topbar.workspace")} end />
            {/* )} */}

            {permissions.hasPermission("contact.view") && (
              <SidebarItem to="/cc/contacts-list" icon={<Users size={18} />} label={t("navigation.super_app.topbar.contact")} end />
            )}

            {permissions.hasPermission("case.assign") && (
              <SidebarItem to="/cms/case/assignment" icon={<FolderOpen size={18} />} label={t("navigation.super_app.topbar.case")} end />
            )}

            {permissions.hasPermission("product.view") && (
              <SidebarItem to="/cms/products/" icon={<Users size={18} />} label={t("navigation.super_app.topbar.product")} end />
            )}
            {permissions.hasPermission("product.view") && (
              <SidebarItem to="/kms" icon={<BookOpen size={18} />} label={t("navigation.super_app.topbar.knowlage")} end />
            )}

            <button
              onClick={toggleDropdown}
              className="group relative flex gap-2.5 items-center xl:justify-center px-2.5 py-2 rounded-lg transition-colors whitespace-nowrap bg-[#1E293B] dark:bg-gray-900 text-[#9CA3AF] hover:text-gray-300"
            >
              <Ellipsis size={18} />
              <span className={tooltipLabelClasses("left")}>{t("navigation.super_app.topbar.more.title")}</span>
            </button>
          </div>

          <div className="xl:shrink-0">
            <Dropdown
              isOpen={isOpen}
              onClose={closeDropdown}
              className="
                absolute left-3 xl:left-6 top-65 xl:top-19 z-50
                w-[95vw] sm:w-105 lg:w-180 xl:w-225
                max-h-[65vh] xl:max-h-[75vh] overflow-y-auto
                bg-white dark:bg-gray-900
                border border-gray-200 dark:border-gray-800
                rounded-xl shadow-xl p-4
              "
            >
              <div
                className="
                  grid 
                  grid-cols-1 
                  sm:grid-cols-2 
                  lg:grid-cols-3 
                  xl:grid-cols-4 
                  gap-4
                "
              >
                {sortedItems.map(group => (
                  <ul
                    key={group.name}
                    className="
                      flex flex-col gap-1
                      py-3
                      text-gray-800 dark:text-gray-300
                      border-b border-gray-100 dark:border-gray-800
                      xl:border-none
                    "
                  >
                    <strong className="cursor-default px-3 text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      {group.name}
                    </strong>
                    {group.subItems?.length ? (
                      group.subItems.map(item => (
                        <li key={`${group.name}-${item.name}`}>
                          <DropdownItem
                            onItemClick={closeDropdown}
                            tag="a"
                            // to={item.path}
                            to={!item.disabled && item.path || ""}
                            // className="hover:bg-gray-100 dark:hover:bg-white/5 flex font-medium gap-3 group items-center px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-theme-sm"
                            className={`${item.disabled && "opacity-50 cursor-not-allowed"} hover:bg-gray-100 dark:hover:bg-white/5 flex font-medium gap-3 group items-center px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-theme-sm`}
                          >
                            {item.icon}
                            {item.name}
                          </DropdownItem>
                        </li>
                      ))
                    ) : (
                      <li key={group.name}>
                        <DropdownItem
                          onItemClick={closeDropdown}
                          tag="a"
                          // to={group.path}
                          to={!group.disabled && group.path || ""}
                          // className="hover:bg-gray-100 dark:hover:bg-white/5 flex font-medium gap-3 group items-center px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-theme-sm"
                          className={`${group.disabled && "opacity-50 cursor-not-allowed"} hover:bg-gray-100 dark:hover:bg-white/5 flex font-medium gap-3 group items-center px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-theme-sm`}
                        >
                          {group.icon}
                          {group.name}
                        </DropdownItem>
                      </li>
                    )}
                  </ul>
                ))}
              </div>
            </Dropdown>
          </div>

          {/*
          <button
            onClick={toggleApplicationMenu}
            className={`bg-[#1E293B] dark:bg-gray-900 flex items-center justify-center px-2 xl:px-0 py-2 relative text-[#9CA3AF] hover:text-gray-300 xl:hidden`}
          >
            {isApplicationMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          */}
        </div>

        {/* Right */}
        <div
          className={`${
            isApplicationMenuOpen ? "flex" : "hidden"
          } items-center justify-start w-full gap-5 py-3.5 xl:py-2 xl:flex xl:w-auto xl:shrink-0 shadow-theme-md xl:justify-end xl:px-0 xl:shadow-none`}
        >
          <div className="flex items-center gap-5 2xsm:gap-5">
            <LangDropdown />

            {/* Under development. */}
            <span className="flex items-center gap-2 text-[#9CA3AF] hover:text-gray-300 cursor-default">
              <span className="text-green-400">●</span> {t("navigation.super_app.topbar.status.available")}
            </span>

            <ThemeToggleButton />

            {/* Under development. */}
            <Phone className="text-[#9CA3AF] hover:text-gray-300" size={18} />

            <NotificationDropdown />
            <UserDropdown />
          </div>
        </div>
      </div>
    </header>
  );
}

export default SuperTopbar;
