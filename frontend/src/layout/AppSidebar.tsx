import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronDownIcon,
  DocsIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  UserCircleIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { getMeCached } from "../utils/me";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

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
  const showExpandedContent = isExpanded || isHovered || isMobileOpen;
  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "Admin";
  const roleLabel =
    user?.role?.name ||
    (roleId === 1 ? "Super Admin" : roleId === 2 ? "Admin" : roleId === 3 ? "Manager" : "Staff");

  const dataManagementSubItems: NavItem["subItems"] =
    isRole1
      ? [
          { name: "Invoices", path: "/dashboard/invoices" },
          { name: "Customers", path: "/dashboard/customers" },
          { name: "Sales Person", path: "/dashboard/sales-persons" },
          { name: "Assistant Sales Person", path: "/dashboard/assistant-sales-persons" },
          { name: "Services", path: "/dashboard/services" },
          { name: "Branches", path: "/dashboard/branches" },
          { name: "Contract Templates", path: "/dashboard/contract-templates" },
        ]
      : isRole2
        ? [
            { name: "Customers", path: "/dashboard/customers" },
            { name: "Invoices", path: "/dashboard/invoices" },
          ]
        : [];

  const navItems: NavItem[] = [
    {
      icon: <GridIcon />,
      name: "Dashboard",
      path: "/dashboard",
    },
    ...(isRole1 || isRole2
      ? [
          {
            icon: <UserCircleIcon />,
            name: "Admin Users",
            path: "/dashboard/admin-users",
          },
          {
            icon: <DocsIcon />,
            name: "Report",
            path: "/dashboard/report",
          },
        ]
      : []),
    ...(isRole1 || isRole2
      ? []
      : [
          {
            icon: <DocsIcon />,
            name: "Invoices",
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
                } ${!showExpandedContent ? "lg:justify-center" : "lg:justify-start"}`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isOpen ? "menu-item-icon-active" : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {showExpandedContent && (
                  <>
                    <span className="truncate">{nav.name}</span>
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
                  className={`menu-item group flex items-center ${
                    isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  } ${!showExpandedContent ? "lg:justify-center" : ""}`}
                >
                  <span
                    className={`menu-item-icon-size ${
                      isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"
                    }`}
                  >
                    {nav.icon}
                  </span>
                  {showExpandedContent && <span className="truncate">{nav.name}</span>}
                </Link>
              )
            )}

            {nav.subItems && showExpandedContent && (
              <div
                ref={(el) => (subMenuRefs.current[submenuKey] = el)}
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{ height: isOpen ? `${subMenuHeight[submenuKey] || 0}px` : "0px" }}
              >
                <ul className="ml-5 mt-2 space-y-1 border-l border-blue-100 pl-3">
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
                        <span className="truncate">{subItem.name}</span>
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
      className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-slate-200/80 bg-[#f8fbff]/94 px-4 pb-4 pt-4 shadow-[0_24px_60px_-28px_rgba(70,95,255,0.28)] backdrop-blur-xl transition-all duration-300 ease-in-out dark:border-slate-800 dark:bg-[#08111f]/96 dark:shadow-[0_24px_60px_-28px_rgba(2,6,23,0.72)] ${
        isExpanded || isMobileOpen ? "w-[300px]" : isHovered ? "w-[300px]" : "w-[96px]"
      } ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`mb-3 flex rounded-[24px] border border-slate-200 bg-white/95 p-3 shadow-sm transition-all duration-300 dark:border-slate-800 dark:bg-slate-950/80 ${
          !showExpandedContent ? "lg:justify-center" : "justify-between"
        }`}
      >
        <Link to="/dashboard" className="group flex items-center gap-3">
          {showExpandedContent ? (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-sky-400 text-white shadow-sm">
                <span className="text-lg font-bold">C</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">connected.</div>
                <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Admin panel</div>
              </div>
            </>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-sky-400 text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
              <span className="text-lg font-bold">C</span>
            </div>
          )}
        </Link>
      </div>

      {showExpandedContent ? (
        <div className="mb-4 rounded-[22px] border border-slate-200 bg-slate-50/90 px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Workspace owner
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {loadingUser ? "Loading..." : displayName}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{roleLabel}</div>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto no-scrollbar pr-1">
        <nav className="space-y-5">
          <div>
            <h2
              className={`mb-3 flex text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 ${
                !showExpandedContent ? "lg:justify-center" : "justify-start"
              } dark:text-slate-500`}
            >
              {showExpandedContent ? "Menu" : <HorizontaLDots className="size-5" />}
            </h2>
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

      {showExpandedContent ? (
        <div className="mt-4 rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Keep operations moving</div>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Use invoices, reports, and customer records from one cleaner admin workspace.
          </p>
        </div>
      ) : null}
    </aside>
  );
};

export default AppSidebar;
