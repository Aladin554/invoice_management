import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getMeCached } from "../utils/me";

type ProtectedRouteProps = {
  children: ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [token, setToken] = useState<string | null>(null);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [isFinanceManager, setIsFinanceManager] = useState(false);
  const [loading, setLoading] = useState(true);

  const location = useLocation();

  useEffect(() => {
    const init = async () => {
      const storedToken = localStorage.getItem("token");
      setToken(storedToken);

      if (!storedToken) {
        setLoading(false);
        return;
      }

      const storedRole = localStorage.getItem("role_id");

      // If we already have the role cached locally, use it.
      if (storedRole) {
        setRoleId(parseInt(storedRole, 10));
        setIsFinanceManager(localStorage.getItem("is_finance_manager") === "1");
        setLoading(false);
        return;
      }

      // Otherwise, fetch a fresh /me to avoid token-without-role issues on refresh.
      try {
        const me = await getMeCached({ force: true });
        const role = me.role_id;
        const permission = me.panel_permission ? 1 : 0;

        localStorage.setItem("role_id", role.toString());
        localStorage.setItem("panel_permission", permission.toString());
        localStorage.setItem("is_finance_manager", me.is_finance_manager ? "1" : "0");

        setRoleId(role);
        setIsFinanceManager(Boolean(me.is_finance_manager));
      } catch {
        localStorage.clear();
        setToken(null);
        setRoleId(null);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  if (loading) return null;

  // Not logged in
  if (!token) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  const path = location.pathname;
  const isProfileRoute = path.startsWith("/profile");
  const isInvoiceRoute = path === "/dashboard/invoices" || path.startsWith("/dashboard/invoices/");
  const isCustomerRoute = path === "/dashboard/customers" || path.startsWith("/dashboard/customers/");
  const isSalesPersonRoute =
    path === "/dashboard/sales-persons" || path.startsWith("/dashboard/sales-persons/");
  const isAssistantSalesPersonRoute =
    path === "/dashboard/assistant-sales-persons" ||
    path.startsWith("/dashboard/assistant-sales-persons/");
  const isAdminUserRoute = path === "/dashboard/admin-users" || path.startsWith("/dashboard/admin-users/");
  const isDashboardRoute = path === "/dashboard";
  const isExpenseRoute = path === "/dashboard/expense" || path.startsWith("/dashboard/expense/");
  // Employees only ever submit and track their own requests — the
  // all-requests review page is for the Owner/Finance Manager.
  const isEmployeeExpenseRoute =
    path === "/dashboard/expense/new" || path === "/dashboard/expense/my-requests";

  // Role 1 -> full access
  if (roleId === 1) {
    return <>{children}</>;
  }

  // Role 2 (Admin) -> dashboard, invoices, customers, admin users, sales teams
  if (roleId === 2) {
    if (isProfileRoute) {
      return <>{children}</>;
    }

    if (
      isDashboardRoute ||
      isInvoiceRoute ||
      isCustomerRoute ||
      isSalesPersonRoute ||
      isAssistantSalesPersonRoute ||
      isAdminUserRoute ||
      isExpenseRoute
    ) {
      return <>{children}</>;
    }

    return <Navigate to="/dashboard" replace />;
  }

  // Role 3 (Sub Admin) -> same dashboard access as admin, without reports
  if (roleId === 3) {
    if (
      isProfileRoute ||
      isDashboardRoute ||
      isInvoiceRoute ||
      isCustomerRoute ||
      isAdminUserRoute ||
      isExpenseRoute
    ) {
      return <>{children}</>;
    }

    return <Navigate to="/dashboard" replace />;
  }

  // Role 4 (Employee) -> dashboard, own expense requests, profile only.
  // A role-4 user flagged as Finance Manager also reviews/settles other
  // people's requests, so they need the full expense route surface.
  if (roleId === 4) {
    if (
      isProfileRoute ||
      isDashboardRoute ||
      (isFinanceManager ? isExpenseRoute : isEmployeeExpenseRoute)
    ) {
      return <>{children}</>;
    }

    return <Navigate to="/dashboard" replace />;
  }

  // Fallback safety
  return <Navigate to="/signin" replace />;
};

export default ProtectedRoute;
