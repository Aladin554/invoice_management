import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getMeCached } from "../utils/me";

type ProtectedRouteProps = {
  children: ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [token, setToken] = useState<string | null>(null);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const location = useLocation();

  useEffect(() => {
    const init = async () => {
      const storedToken = sessionStorage.getItem("token");
      setToken(storedToken);

      if (!storedToken) {
        setLoading(false);
        return;
      }

      const storedRole = sessionStorage.getItem("role_id");

      // If we already have the role cached locally, use it.
      if (storedRole) {
        setRoleId(parseInt(storedRole, 10));
        setLoading(false);
        return;
      }

      // Otherwise, fetch a fresh /me to avoid token-without-role issues on refresh.
      try {
        const me = await getMeCached({ force: true });
        const role = me.role_id;
        const permission = me.panel_permission ? 1 : 0;

        sessionStorage.setItem("role_id", role.toString());
        sessionStorage.setItem("panel_permission", permission.toString());

        setRoleId(role);
      } catch {
        sessionStorage.clear();
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
  const isAdminUserRoute = path === "/dashboard/admin-users" || path.startsWith("/dashboard/admin-users/");
  const isDashboardRoute = path === "/dashboard";

  // Role 1 -> full access
  if (roleId === 1) {
    return <>{children}</>;
  }

  // Role 2 (Admin) -> dashboard, invoices, customers, admin users
  if (roleId === 2) {
    if (isProfileRoute) {
      return <>{children}</>;
    }

    if (isDashboardRoute || isInvoiceRoute || isCustomerRoute || isAdminUserRoute) {
      return <>{children}</>;
    }

    return <Navigate to="/dashboard" replace />;
  }

  // Role 3 (Sub Admin) -> same dashboard access as admin, without reports
  if (roleId === 3) {
    if (isProfileRoute || isDashboardRoute || isInvoiceRoute || isCustomerRoute || isAdminUserRoute) {
      return <>{children}</>;
    }

    return <Navigate to="/dashboard" replace />;
  }

  // Role 4 -> profile only
  if (roleId === 4) {
    if (isProfileRoute) {
      return <>{children}</>;
    }

    return <Navigate to="/profile" replace />;
  }

  // Fallback safety
  return <Navigate to="/signin" replace />;
};

export default ProtectedRoute;
