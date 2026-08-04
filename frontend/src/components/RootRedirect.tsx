import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const RootRedirect = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    // No token -> sign in
    if (!token) {
      navigate("/signin", { replace: true });
      return;
    }

    // Fetch latest user info
    api.get("/me")
      .then((res) => {
        const user = res.data;
        const role = user.role_id;
        const permission = user.panel_permission ? 1 : 0;

        localStorage.setItem("role_id", role.toString());
        localStorage.setItem("panel_permission", permission.toString());
        localStorage.setItem("is_finance_manager", user.is_finance_manager ? "1" : "0");
        localStorage.setItem("user", JSON.stringify(user));

        navigate("/dashboard", { replace: true });
      })
      .catch(() => {
        // Invalid token
        localStorage.clear();
        navigate("/signin", { replace: true });
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) return null;
  return null;
};

export default RootRedirect;
