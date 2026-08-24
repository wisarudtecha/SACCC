// src/core/layout/SuperSidebar.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  // BookOpen,
  Box,
  ChartColumn,
  ChevronDown,
  ClipboardCheck,
  FileText,
  FolderOpen,
  History,
  Inbox,
  MessageSquare,
  Mail,
  NotebookPen,
  PackagePlus,
  PackageSearch,
  Phone,
  // Settings,
  Users,
  // BoxesIcon,
  Bell,
  ListIcon
} from "lucide-react";
import { useSidebar } from "@/core/context/SidebarContext";
import { Modal } from "@/core/components/ui/modal";
import { usePermissions } from "@/core/hooks/usePermissions";
import { useTranslation } from "@/core/hooks/useTranslation";
import changelog from "@/changelog.json";
import { KbPermission } from "@/kms/common/utils/enumHelper"

declare const __APP_VERSION__: string;

export interface Props {
  collapsed: boolean;
  displayed: boolean;
}

export type MenuProps = "workspace" | "contact" | "case" | "product" | "knowledge"

export type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  permission?: boolean;
  subItems?: {
    name: string;
    icon?: React.ReactNode;
    path: string;
    permission?: boolean;
  }[];
};

const SuperSidebar = (
  { collapsed, displayed }: Props
) => {
  const permissions = usePermissions();
  const { t } = useTranslation();

  const workspaceItems: NavItem[] = useMemo(() => [
    {
      icon: <Phone />,
      name: t("navigation.super_app.sidebar.workspace.menu.softphone"),
      path: "/cc/softphone",
      // permission: permissions.hasAnyPermission([
      //   "workspace.softphone"
      // ])
    },
    {
      icon: <MessageSquare />,
      name: t("navigation.super_app.sidebar.workspace.menu.chat.title"),
      subItems: [
        {
          icon: <Inbox />,
          name: t("navigation.super_app.sidebar.workspace.menu.chat.sub_menu.lobby"),
          path: "/cc/lobby-incoming",
          // permission: permissions.hasPermission("workspace.chat.lobby")
        },
        {
          icon: <History />,
          name: t("navigation.super_app.sidebar.workspace.menu.chat.sub_menu.history"),
          path: "/cc/chat-history",
          // permission: permissions.hasPermission("workspace.chat.history")
        }
      ]
    },
    {
      icon: <Mail />,
      name: t("navigation.super_app.sidebar.workspace.menu.email"),
      path: "/cc/email",
      // permission: permissions.hasAnyPermission([
      //   "workspace.email"
      // ])
    },
    {
      icon: <ChartColumn />,
      name: t("navigation.super_app.sidebar.workspace.menu.dashboard"),
      path: "/cc/dashboard",
      // permission: permissions.hasAnyPermission([
      //   "workspace.dashboard"
      // ]),
      // subItems: [
      //   {
      //     name: "Phone Dashboard",
      //     path: "/cc/phone-dashboard"
      //   },
      //   {
      //     name: "Chat Dashboard",
      //     path: "/cc/chat-dashboard"
      //   },
      //   {
      //     name: "Email Dashboard",
      //     path: "/cc/email-dashboard"
      //   }
      // ]
    },
    // {
    //   icon: <Settings />,
    //   name: "Configuration",
    //   path: "/cc/configuration"
    // }
  ], [t]);

  const contactsItems: NavItem[] = useMemo(() => [
    {
      icon: <Users />,
      name: t("navigation.super_app.sidebar.contact.menu.list"),
      path: "/cc/contacts-list",
      permission: permissions.hasAnyPermission([
        "contact.view"
      ])
    },
    // {
    //   icon: <Settings />,
    //   name: "Contacts Configurations",
    //   path: "/cc/contacts-configurations"
    // },
    // {
    //   icon: <ChartColumn />,
    //   name: "Contacts Dashboard",
    //   path: "/cc/contacts-dashboard"
    // },
    {
      icon: <NotebookPen />,
      name: t("navigation.super_app.sidebar.contact.menu.appointment"),
      path: "/cc/appointment",
      permission: permissions.hasAnyPermission([
        "appointment.view"
      ])
    }
  ], [permissions, t]);

  const casesItems: NavItem[] = useMemo(() => [
    {
      icon: <FolderOpen />,
      name: t("navigation.super_app.sidebar.case.menu.list"),
      path: "/cms/case/history",
      permission: permissions.hasAnyPermission([
        "case.view_history"
      ])
    },
    {
      icon: <ClipboardCheck />,
      name: t("navigation.super_app.sidebar.case.menu.assign"),
      path: "/cms/case/assignment",
      permission: permissions.hasAnyPermission([
        "case.assign"
      ])
    },
    {
      icon: <ChartColumn />,
      name: t("navigation.super_app.sidebar.case.menu.dashboard"),
      path: "/cms/",
      permission: permissions.hasAnyPermission([
        "dashboard.view"
      ])
    },
    // {
    //   icon: <Settings />,
    //   name: "Case Configurations",
    //   path: "/cms/service"
    // }
  ], [permissions, t]);

  const productssItems: NavItem[] = useMemo(() => [
    {
      icon: <Box />,
      name: t("navigation.super_app.sidebar.product.menu.product"),
      path: "/cms/products/",
      permission: permissions.hasAnyPermission([
        "product.view"
      ])
    },
    // {
    //   icon: <Box />,
    //   name: "Services List",
    //   path: "/cms/services"
    // },
    {
      icon: <PackageSearch />,
      name: t("navigation.super_app.sidebar.product.menu.inventory"),
      path: "/cms/inventory/",
      permission: permissions.hasAnyPermission([
        "sparepart.view"
      ])
    },
    // {
    //   icon: <Settings />,
    //   name: "Configurations",
    //   path: "/cms/configurations"
    // },
    {
      icon: <PackagePlus />,
      name: t("navigation.super_app.sidebar.product.menu.inventory_request"),
      path: "/cms/inventory/request",
      permission: permissions.hasAnyPermission([
        "order.view"
      ])
    },
    {
      icon: <ChartColumn />,
      name: t("navigation.super_app.sidebar.product.menu.dashboard"),
      path: "/cms/products/dashboard",
      permission: permissions.hasAnyPermission([
        "crm_dashboard"
      ])
    },
  ], [permissions, t]);

  const knowledgeItems: NavItem[] = useMemo(() => [
    {
      icon: <ChartColumn />,
      name: t("navigation.super_app.sidebar.knowledge.menu.dashboard"),
      path: "/kms/dashboard",
      permission: permissions.hasAnyPermission([
        KbPermission.KB_DASHBOARD_VIEW
      ])
    },
    {
      icon: <Bell />,
      name: t("navigation.super_app.topbar.more.menu.knowledge.sub_menu.boardcastlog"),
      path: "/kms/broadcast-log",
      permission: permissions.hasPermission(KbPermission.KB_BROADCAST_VIEW)
    },
    {
      icon: <ListIcon />,
      name: t("navigation.super_app.sidebar.knowledge.menu.category-articles"),
      path: "/kms/categorys-articles",
      permission: permissions.hasPermission(KbPermission.KB_ARTICLE_VIEW)
    },
    // {
    //   icon: <Presentation />,
    //   name: t("navigation.super_app.sidebar.knowledge.menu.banner"),
    //   path: "/kms/banner-management"
    // },
    // {
    //   icon: <Server />,
    //   name: t("navigation.super_app.sidebar.knowledge.menu.source"),
    //   path: "/kms/source"
    // },
  ], [permissions, t]);

  const versionInfo = Object.entries(changelog).map(([version, info]) => ({ version, ...info }));

  const { isMobile, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  // The sidebar becomes a narrow icon rail either when the user minimises it manually
  // or when the viewport drops below the mobile breakpoint (--breakpoint-md: 768px).
  // Hovering the rail peeks the full-width sidebar back, in both cases.
  const isRail = collapsed || isMobile;
  const isIconOnly = isRail && !isHovered;

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: MenuProps;
    index: number;
    subIndex?: number;
  } | null>(null);
  const [openVersion, setOpenVersion] = useState(false);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});

  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => new RegExp(`^${path}(/|$)`).test(location.pathname),
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["workspace", "contacts", "cases", "products", "knowledge"].forEach((menuType) => {
      const items = menuType === "workspace" ?
        workspaceItems : menuType === "contacts" ?
        contactsItems : menuType === "cases" ?
        casesItems : menuType === "products" ?
        productssItems : knowledgeItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach(subItem => {
            if (
              subItem.path && 
              isActive(subItem.path)
            ) {
              setOpenSubmenu({
                type: menuType as MenuProps,
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    location,
    isActive
  ]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      const subKey = openSubmenu.subIndex !== undefined ? `${key}-${openSubmenu.subIndex}` : null;

      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }

      if (subKey && subMenuRefs.current[subKey]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [subKey]: subMenuRefs.current[subKey]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (
    index: number,
    menuType: MenuProps,
    subIndex?: number
  ) => {
    setOpenSubmenu(prevOpenSubmenu => {
      if (
        prevOpenSubmenu
        && prevOpenSubmenu.type === menuType
        && prevOpenSubmenu.index === index
        && prevOpenSubmenu.subIndex === subIndex
      ) {
        // return null;
        if (subIndex === undefined) {
          return null;
        }
        else {
          return { type: menuType, index };
        }
      }
      return {
        type: menuType,
        index,
        subIndex
      };
    });
  };

  // On the icon rail there is no room for a submenu, so its children are lifted onto
  // the main level and the parent entry is dropped.
  const flattenForRail = (items: NavItem[]): NavItem[] =>
    items.flatMap(nav =>
      nav.subItems
        ? nav.subItems.map(subItem => ({ ...subItem, icon: subItem.icon ?? nav.icon }))
        : [nav]
    );

  const renderMenuItems = (items: NavItem[], menuType: MenuProps) => (
    <>
      <h3 className={`${isIconOnly ? "hidden" : ""} mb-3 text-xs leading-3 text-[#8A99AF]`}>
        <span className="menu-group-title">
          {/* {menuType.charAt(0).toUpperCase() + menuType.slice(1)} */}
          {t(`navigation.super_app.sidebar.${menuType}.title`)}
        </span>
      </h3>
      <ul className="flex flex-col gap-2">
        {(isIconOnly ? flattenForRail(items) : items).map((nav, index) => (
          <li key={nav.name}>
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`menu-item group ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-active text-gray-300 dark:text-gray-300"
                    : "menu-item-inactive text-[#9CA3AF] dark:text-[#9CA3AF]"
                } cursor-pointer ${
                  isIconOnly
                    ? "justify-center"
                    : "justify-start"
                } bg-[#1E293B] hover:bg-[#1E293B] dark:bg-gray-900 hover:text-gray-300`}
              >
                <span>{nav.icon}</span>
                {!isIconOnly && (
                  <span className="menu-item-text whitespace-nowrap">{nav.name}</span>
                )}
                {!isIconOnly && (
                  <ChevronDown
                    className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                      openSubmenu?.type === menuType &&
                      openSubmenu?.index === index
                        ? "rotate-180 text-gray-300"
                        : ""
                    }`}
                  />
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  to={nav.path}
                  className={`menu-item group ${
                    isActive(nav.path) ?
                      "menu-item-active text-gray-300 bg-gray-700 dark:bg-gray-800 hover:bg-gray-700"
                        :
                      "menu-item-inactive text-[#9CA3AF] bg-[#1E293B] hover:bg-[#1E293B] dark:bg-gray-900"
                  } ${
                    isIconOnly ? "justify-center" : "justify-start"
                  } hover:text-gray-300 dark:text-[#9CA3AF] dark:hover:text-gray-300`}
                >
                  <span>{nav.icon}</span>
                  {!isIconOnly && (
                    <span className="menu-item-text whitespace-nowrap">{nav.name}</span>
                  )}
                </Link>
              )
            )}

            {nav.subItems && !isIconOnly && (
              <div
                ref={(el) => {
                  subMenuRefs.current[`${menuType}-${index}`] = el;
                }}
                className="overflow-hidden transition-all duration-300"
                style={{
                  height:
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? `${subMenuHeight[`${menuType}-${index}`]}px`
                      : "0px",
                }}
              >
                <ul className="mt-2 space-y-1 ml-9">
                  {nav.subItems.map((
                    subItem,
                    // subIndex
                  ) => (
                    <li key={subItem.name}>
                      {(
                        subItem.path && (
                          <Link
                            to={subItem.path}
                            className={`menu-dropdown-item ${
                              isActive(subItem.path) ?
                                "menu-dropdown-item-active text-gray-300 bg-gray-700 dark:bg-gray-800 hover:bg-gray-700"
                                  :
                                "menu-dropdown-item-inactive text-[#9CA3AF] bg-[#1E293B] hover:bg-[#1E293B] dark:bg-gray-900"
                            } hover:text-gray-300 dark:text-[#9CA3AF] dark:hover:text-gray-300`}
                          >
                            {subItem.name}
                          </Link>
                        )
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );

  return (
    <>
      <aside
        className={`
          ${isIconOnly ? "w-18" : "w-65"}
          ${displayed ? "flex" : "hidden"}
          shrink-0 bg-[#1E293B] dark:bg-gray-900 duration-300 flex-col text-gray-300 transition-all border-r border-gray-700 dark:border-gray-800
        `}
        onMouseEnter={() => isRail && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`flex items-center h-15 border-gray-700 dark:border-gray-800 ${
            isIconOnly ? "justify-center gap-1 px-2" : "justify-between px-5"
          }`}
        >
          {!isIconOnly ? (
            <>
              <Link to="/">
                <img src="/images/logo/logo.svg" alt="Logo" />
              </Link>

              <div className="font-light flex items-center text-[#8A99AF] text-sm">
                <span className="cursor-default">v{versionInfo[0]?.version || __APP_VERSION__}</span>
                <button
                  onClick={() => setOpenVersion(true)}
                  className="p-1 text-blue-light-500 dark:text-blue-light-400 hover:text-blue-500 dark:hover:text-blue-400"
                  title="View Changelog">
                  <FileText className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className={`w-8 h-8 shrink-0 bg-white rounded-full flex items-center justify-center text-gray-900 font-semibold cursor-default`}>
                <span className={`w-8 text-center capitalize`}>S</span>
              </div>

              <button
                onClick={() => setOpenVersion(true)}
                className="shrink-0 text-blue-light-500 dark:text-blue-light-400 hover:text-blue-500 dark:hover:text-blue-400"
                title="View Changelog">
                <FileText className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        <nav className="flex-1 px-3 py-3 space-y-2 overflow-y-auto scrollbar-modern scrollbar-fade">
          <div className={`mb-6`}>
            {renderMenuItems(workspaceItems, "workspace")}
          </div>

          <div className={`mb-6`}>
            {renderMenuItems(contactsItems, "contact")}
          </div>

          <div className={`mb-6`}>
            {renderMenuItems(casesItems, "case")}
          </div>

          <div className={`mb-6`}>
            {renderMenuItems(productssItems, "product")}
          </div>
          {(permissions.permissionsByCategory?.kms
            && permissions.permissionsByCategory?.kms.length > 0
            && permissions.hasAnyPermission([
            KbPermission.KB_DASHBOARD_VIEW,
            KbPermission.KB_BROADCAST_VIEW,
            // KbPermission.KB_FILE_VIEW,
            KbPermission.KB_ARTICLE_VIEW,
            KbPermission.KB_ARTICLE_MGMT_VIEW])) && (
              <div className="mb-0">
                {renderMenuItems(knowledgeItems, "knowledge")}
              </div>
            )}
        </nav>
      </aside>

      <Modal isOpen={openVersion} onClose={() => setOpenVersion(false)} className="max-w-4xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 cursor-default">
            Changelog
          </h3>
        </div>
        <div className="space-y-4 cursor-default">
          {versionInfo?.map((item, idx) =>
            <div key={item?.version || item?.date || idx}>
              <div className="text-gray-700 dark:text-gray-200 flex gap-1">
                <div className="font-semibold">{item?.version || ""}</div>
                <div className="font-light italic">{item?.segment && `- ${item.segment}` || ""}</div>
              </div>
              <div className="font-light text-sm text-gray-500 dark:text-gray-400">Date: {item?.date || ""}</div>
              <div className="font-light text-sm text-gray-500 dark:text-gray-400">Author: {item?.author || ""}</div>
              <div className="text-gray-600 dark:text-gray-300 whitespace-pre-line">{item?.notes || ""}</div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

export default SuperSidebar;
