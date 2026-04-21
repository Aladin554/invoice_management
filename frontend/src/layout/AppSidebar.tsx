import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BoxCubeIcon,
  ChevronDownIcon,
  DocsIcon,
  GroupIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PieChartIcon,
  UserCircleIcon,
  UserIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { getMeCached } from "../utils/me";

type NavSubItem = {
  name: string;
  path: string;
  icon?: React.ReactNode;
  pro?: boolean;
  new?: boolean;
};

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: NavSubItem[];
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const connectedLogoLight = `${import.meta.env.BASE_URL}images/logo/connected_logo.png`;
  const connectedLogoDark = `${import.meta.env.BASE_URL}images/logo/connected_logo_dark.png`;

  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const me = await getMeCached();
        setUser(me);
      } catch (err) {
        console.error("Failed to load user:", err);
      } finally {
        setLoadingUser(false);
      }
    }

    fetchUser();
  }, []);

  const roleId = user?.role_id ?? null;
  const isRole2 = roleId === 2;
  const isRole1 = roleId === 1;
  const isSubAdmin = roleId === 3;
  const isAdminLike = isRole2 || isSubAdmin;
  const showExpandedContent = isExpanded || isHovered || isMobileOpen;
  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "Admin";
  const roleLabel =
    user?.role?.name ||
    (roleId === 1 ? "Super Admin" : roleId === 2 ? "Admin" : roleId === 3 ? "Sub Admin" : "Staff");

  const dataManagementSubItems: NavItem["subItems"] =
    isRole1
      ? [
          {
            name: "Receipts",
            path: "/dashboard/invoices",
            icon: <DocsIcon className="size-4" />,
          },
          {
            name: "Reports",
            path: "/dashboard/report",
            icon: <PieChartIcon className="size-4" />,
          },
          {
            name: "Customers",
            path: "/dashboard/customers",
            icon: <GroupIcon className="size-4" />,
          },
          {
            name: "Sales Person",
            path: "/dashboard/sales-persons",
            icon: <UserIcon className="size-4" />,
          },
          {
            name: "Assistant Sales Person",
            path: "/dashboard/assistant-sales-persons",
            icon: <UserCircleIcon className="size-4" />,
          },
          {
            name: "Services",
            path: "/dashboard/services",
            icon: <BoxCubeIcon className="size-4" />,
          },
          {
            name: "Branches",
            path: "/dashboard/branches",
            icon: <GridIcon className="size-4" />,
          },
          {
            name: "Service Group",
            path: "/dashboard/contract-templates",
            icon: <PageIcon className="size-4" />,
          },
        ]
      : isRole2
        ? [
            {
              name: "Customers",
              path: "/dashboard/customers",
              icon: <GroupIcon className="size-4" />,
            },
            {
              name: "Receipts",
              path: "/dashboard/invoices",
              icon: <DocsIcon className="size-4" />,
            },
          ]
        : isSubAdmin
          ? [
              {
                name: "Customers",
                path: "/dashboard/customers",
                icon: <GroupIcon className="size-4" />,
              },
              {
                name: "Receipts",
                path: "/dashboard/invoices",
                icon: <DocsIcon className="size-4" />,
              },
            ]
        : [];

  const navItems: NavItem[] = [
    {
      icon: <GridIcon />,
      name: "Dashboard",
      path: "/dashboard",
    },
    ...(isRole1 || isAdminLike
      ? [
          {
            icon: <UserCircleIcon />,
            name: "Admin Users",
            path: "/dashboard/admin-users",
          },
        ]
      : []),
    ...(isRole1 || isAdminLike
      ? []
      : [
          {
            icon: <DocsIcon />,
            name: "Receipts",
            path: "/dashboard/invoices",
          },
        ]),
    ...(dataManagementSubItems.length > 0
      ? [
          {
            name: "Data Management",
            icon: <ListIcon />,
            subItems: dataManagementSubItems,
          },
        ]
      : []),
  ];

  const othersItems: NavItem[] = [];

  const [openSubmenu, setOpenSubmenu] = useState<{ type: "main" | "others"; index: number } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);

  useEffect(() => {
    let submenuMatched = false;

    const checkItems = (items: NavItem[], type: "main" | "others") => {
      items.forEach((nav, index) => {
        if (nav.subItems?.some((sub) => isActive(sub.path))) {
          setOpenSubmenu({ type, index });
          submenuMatched = true;
        }
      });
    };

    checkItems(navItems, "main");
    checkItems(othersItems, "others");

    if (!submenuMatched) setOpenSubmenu(null);
  }, [location.pathname, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      const el = subMenuRefs.current[key];
      if (el) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: el.scrollHeight,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prev) =>
      prev?.type === menuType && prev?.index === index ? null : { type: menuType, index }
    );
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-2">
      {items.map((nav, index) => {
        const isOpen = openSubmenu?.type === menuType && openSubmenu?.index === index;
        const submenuKey = `${menuType}-${index}`;

        return (
          <li key={`${menuType}-${index}-${nav.name}`}>
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`menu-item group flex items-center w-full ${
                  isOpen ? "menu-item-active" : "menu-item-inactive"
                } ${showExpandedContent ? "justify-start" : "lg:justify-center"}`}
              >
                <span
                  className={`menu-item-icon-size shrink-0 ${
                    isOpen ? "menu-item-icon-active" : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {showExpandedContent && (
                  <>
                    <span className="min-w-0 flex-1 truncate text-left">{nav.name}</span>
                    <ChevronDownIcon
                      className={`ml-auto h-5 w-5 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-brand-500" : "text-gray-400"
                      }`}
                    />
                  </>
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  to={nav.path}
                  className={`menu-item group flex w-full items-center ${
                    isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  } ${showExpandedContent ? "justify-start" : "lg:justify-center"}`}
                >
                  <span
                    className={`menu-item-icon-size shrink-0 ${
                      isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"
                    }`}
                  >
                    {nav.icon}
                  </span>
                  {showExpandedContent && <span className="min-w-0 flex-1 truncate text-left">{nav.name}</span>}
                </Link>
              )
            )}

            {nav.subItems && showExpandedContent && (
              <div
                ref={(el) => (subMenuRefs.current[submenuKey] = el)}
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{ height: isOpen ? `${subMenuHeight[submenuKey] || 0}px` : "0px" }}
              >
                <ul className="ml-4 mt-2 space-y-1 rounded-2xl border border-slate-200 bg-slate-50 p-2 pl-3 dark:border-slate-800 dark:bg-slate-900">
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.path}>
                      <Link
                        to={subItem.path}
                        className={`menu-dropdown-item flex items-center justify-between ${
                          isActive(subItem.path)
                            ? "menu-dropdown-item-active"
                            : "menu-dropdown-item-inactive"
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          {subItem.icon ? (
                            <span
                              className={`flex size-8 shrink-0 items-center justify-center rounded-xl border ${
                                isActive(subItem.path)
                                  ? "border-blue-100 bg-white text-brand-600 dark:border-brand-500/30 dark:bg-brand-500/15 dark:text-brand-400"
                                  : "border-slate-200 bg-white text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
                              }`}
                            >
                              {subItem.icon}
                            </span>
                          ) : null}
                          <span className="truncate">{subItem.name}</span>
                        </span>
                        <span className="flex gap-1">
                          {subItem.new && (
                            <span
                              className={`menu-dropdown-badge ${
                                isActive(subItem.path)
                                  ? "menu-dropdown-badge-active"
                                  : "menu-dropdown-badge-inactive"
                              }`}
                            >
                              new
                            </span>
                          )}
                          {subItem.pro && (
                            <span
                              className={`menu-dropdown-badge ${
                                isActive(subItem.path)
                                  ? "menu-dropdown-badge-active"
                                  : "menu-dropdown-badge-inactive"
                              }`}
                            >
                              pro
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-slate-200 bg-[#f8fbff] px-4 pb-4 pt-4 shadow-[0_24px_60px_-28px_rgba(70,95,255,0.18)] transition-all duration-300 ease-in-out dark:border-slate-800 dark:bg-[#08111f] dark:shadow-[0_24px_60px_-28px_rgba(2,6,23,0.52)] ${
        isExpanded || isMobileOpen ? "w-[300px]" : isHovered ? "w-[300px]" : "w-[96px]"
      } ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`mb-3 flex items-center transition-all duration-300 ${
          showExpandedContent ? "min-h-[70px] px-2 py-2" : "justify-center py-1"
        }`}
      >
        <Link
          to="/dashboard"
          className={`group flex w-full min-w-0 items-center ${
            showExpandedContent ? "justify-start" : "justify-center"
          }`}
        >
          {!showExpandedContent ? (
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br from-blue-600 to-sky-400 text-base font-semibold text-white shadow-sm">
              C
            </span>
          ) : null}
          {showExpandedContent ? (
            <div className="min-w-0 flex-1">
              <img
                src={connectedLogoLight}
                alt="Connected"
                className="h-auto w-[126px] max-w-full object-contain dark:hidden"
              />
              <img
                src={connectedLogoDark}
                alt="Connected"
                className="hidden h-auto w-[148px] max-w-full object-contain dark:block"
              />
            </div>
          ) : null}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pr-1">
        <nav className="space-y-5">
          <div>
            
            {renderMenuItems(navItems, "main")}
          </div>

          {othersItems.length > 0 ? (
            <div>
              <h2
              className={`mb-3 flex text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 ${
                !showExpandedContent ? "lg:justify-center" : "justify-start"
              } dark:text-slate-500`}
              >
                {showExpandedContent ? "Others" : <HorizontaLDots className="size-5" />}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          ) : null}
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
