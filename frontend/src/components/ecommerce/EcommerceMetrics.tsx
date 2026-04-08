import { useEffect, useState } from "react";
import { ArrowRight, FileText, UserPlus, Users, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { getMeCached } from "../../utils/me";

interface CurrentUser {
  role_id: number;
  can_create_users: number;
}

interface ActionItem {
  title: string;
  description: string;
  to: string;
  icon: React.ReactNode;
  accent: string;
  buttonLabel?: string;
}

export default function Metrics() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const me = await getMeCached({ force: true });
        setCurrentUser(me as CurrentUser);
      } catch (err) {
        console.error("Dashboard user fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchUser();
  }, []);

  const actions: ActionItem[] = [
    {
      title: "Create Receipts",
      description: "Create and issue new receipt for customers.",
      to: "/dashboard/invoices/create",
      icon: <FileText className="size-6" />,
      accent: "from-blue-600 to-sky-500",
    },
    {
      title: "Manage Receipts",
      description: "Review pending, approved, and completed receipts.",
      to: "/dashboard/invoices",
      icon: <FileText className="size-6" />,
      accent: "from-blue-600 to-sky-500",
    },
    {
      title: "Reports & Analytics",
      description: "Monitor invoice performance, branch activity, and sales insights.",
      to: "/dashboard/report",
      icon: <BarChart3 className="size-6" />, // ✅ updated icon
      accent: "from-cyan-500 to-blue-500",
      buttonLabel: "View Reports",
    },
  ];

  const canCreateUsers =
    currentUser?.role_id === 1 ||
    (currentUser?.role_id === 2 && Number(currentUser?.can_create_users) === 1);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {actions.map((action) => (
        <Link
          key={action.to}
          to={action.to}
          className="group rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950/80"
        >
          <div className={`inline-flex rounded-2xl bg-gradient-to-br p-3 text-white shadow-sm ${action.accent}`}>
            {action.icon}
          </div>

          <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {action.title}
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {action.description}
          </p>

          <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition group-hover:gap-3 dark:text-blue-400">
            {action.buttonLabel || action.title}
            <ArrowRight className="size-4" />
          </div>
        </Link>
      ))}

      {canCreateUsers ? (
        <Link
          to="/dashboard/admin-users/add"
          className="group rounded-[26px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-sky-50 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950/80 dark:bg-none"
        >
          <div className="inline-flex rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-3 text-white shadow-sm">
            <UserPlus className="size-6" />
          </div>

          <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-slate-100">
            Add new user
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Create staff accounts and assign system roles.
          </p>

          <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition group-hover:gap-3 dark:text-blue-400">
            Add new user
            <ArrowRight className="size-4" />
          </div>
        </Link>
      ) : loading ? (
        <div className="rounded-[26px] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-400">
          Loading dashboard actions...
        </div>
      ) : null}
    </div>
  );
}