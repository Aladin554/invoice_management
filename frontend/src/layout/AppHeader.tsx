import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Search } from "lucide-react";
import { useSidebar } from "../context/SidebarContext";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import NotificationDropdown from "../components/header/NotificationDropdown";
import UserDropdown from "../components/header/UserDropdown";

const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  const handleToggle = () => {
    if (window.innerWidth >= 991) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 px-4 pt-3 md:px-6 md:pt-4">
      <div className="relative rounded-[24px] border border-slate-200/80 bg-white/92 px-4 py-2.5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.28)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/82 dark:shadow-[0_18px_40px_-28px_rgba(2,6,23,0.78)]">
        <div className="flex flex-col gap-2.5 lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800"
              onClick={handleToggle}
              aria-label="Toggle Sidebar"
            >
              {isMobileOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                    fill="currentColor"
                  />
                </svg>
              ) : (
                <svg width="18" height="14" viewBox="0 0 16 12" fill="none">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </button>

            <Link to="/dashboard" className="flex min-w-0 items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-sky-400 text-white shadow-sm">
                <span className="text-lg font-bold">C</span>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold leading-none text-slate-900 dark:text-slate-100">connected.</div>
                <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Admin panel</div>
              </div>
            </Link>
          </div>

          <div className="hidden min-w-0 lg:block">
            <div className="relative mx-auto w-full max-w-[720px]">
            
            </div>
          </div>

          <button
            onClick={toggleApplicationMenu}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800 lg:hidden"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.99902 10.4951C6.82745 10.4951 7.49902 11.1667 7.49902 11.9951V12.0051C7.49902 12.8335 6.82745 13.5051 5.99902 13.5051C5.1706 13.5051 4.49902 12.8335 4.49902 12.0051V11.9951C4.49902 11.1667 5.1706 10.4951 5.99902 10.4951ZM17.999 10.4951C18.8275 10.4951 19.499 11.1667 19.499 11.9951V12.0051C19.499 12.8335 18.8275 13.5051 17.999 13.5051C17.1706 13.5051 16.499 12.8335 16.499 12.0051V11.9951C16.499 11.1667 17.1706 10.4951 17.999 10.4951ZM13.499 11.9951C13.499 11.1667 12.8275 10.4951 11.999 10.4951C11.1706 10.4951 10.499 11.1667 10.499 11.9951V12.0051C10.499 12.8335 11.1706 13.5051 11.999 13.5051C12.8275 13.5051 13.499 12.8335 13.499 12.0051V11.9951Z"
                fill="currentColor"
              />
            </svg>
          </button>

          <div
            className={`${
              isApplicationMenuOpen ? "flex" : "hidden"
            } w-full flex-col gap-2.5 border-t border-slate-200 pt-2.5 dark:border-slate-800 lg:flex lg:w-auto lg:flex-row lg:items-center lg:justify-end lg:border-t-0 lg:pt-0`}
          >
            <div className="flex items-center gap-2">
              <ThemeToggleButton />
              <NotificationDropdown />
            </div>
            <UserDropdown />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
