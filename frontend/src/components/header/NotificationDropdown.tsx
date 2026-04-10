import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { getMeCached } from "../../utils/me";
import { getDisplayReceiptNumber } from "../../utils/invoiceNumber";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

interface InvoiceApprovalNotification {
  invoice_id: number;
  invoice_number: string;
  display_invoice_number?: string;
  customer_name: string;
  cash_manager_name: string;
  approved_at: string | null;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<InvoiceApprovalNotification[]>([]);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const me = await getMeCached();

      if (Number(me.role_id) !== 1) {
        setNotifications([]);
        return;
      }

      const res = await api.get("/invoices/approval-notifications");
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch invoice approval notifications:", error);
      setNotifications([]);
    }
  };

  useEffect(() => {
    void fetchNotifications();
  }, []);

  const toggleDropdown = async () => {
    if (!isOpen) {
      await fetchNotifications();
    }

    setIsOpen(!isOpen);
  };

  const closeDropdown = () => setIsOpen(false);

  const handleNotificationClick = (invoiceId: number) => {
    setIsOpen(false);
    navigate(`/dashboard/invoices/${invoiceId}/preview`);
  };

  return (
    <div className="relative">
      <button
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition dropdown-toggle hover:border-blue-200 hover:bg-blue-50 hover:text-slate-800 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
      >
        {notifications.length > 0 && (
          <span className="absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400">
            <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
          </span>
        )}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[220px] mt-3 flex h-[480px] w-[340px] flex-col rounded-[22px] border border-slate-200 bg-white p-3 shadow-theme-lg dark:border-slate-800 dark:bg-slate-950 sm:w-[361px] lg:right-0"
      >
        <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h5 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Notifications
            </h5>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              Approval queue
            </p>
          </div>
          <button
            onClick={toggleDropdown}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-slate-800"
          >
            x
          </button>
        </div>

        <ul className="flex h-auto flex-col overflow-y-auto custom-scrollbar">
          {notifications.length === 0 && (
            <li className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
              No new notifications
            </li>
          )}

          {notifications.map((notification) => (
            <li key={notification.invoice_id}>
              <DropdownItem
                onItemClick={() => handleNotificationClick(notification.invoice_id)}
                className="flex gap-3 rounded-2xl border border-transparent p-3 px-4 py-3 transition hover:border-blue-100 hover:bg-blue-50 dark:hover:border-slate-800 dark:hover:bg-slate-900/75"
              >
                <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
                <span className="block flex-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {getDisplayReceiptNumber(
                      notification.invoice_number,
                      notification.display_invoice_number,
                      notification.invoice_id,
                    )}
                  </span>{" "}
                  for <span className="font-medium text-slate-800 dark:text-slate-200">{notification.customer_name}</span>{" "}
                  was cash-approved by admin {notification.cash_manager_name} and is waiting for
                  your final approval.
                </span>
              </DropdownItem>
            </li>
          ))}
        </ul>

        <Link
          to="/dashboard/invoices"
          className="mt-3 block rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          View Invoices
        </Link>
      </Dropdown>
    </div>
  );
}
