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
        localStorage.setItem("user", JSON.stringify(user));

        // Redirect logic
        if (role === 1) {
          navigate("/dashboard", { replace: true });
          return;
        }

        if (role === 2) {
          navigate("/dashboard", { replace: true });
          return;
        }

        if (role === 3) {
          navigate("/dashboard", { replace: true });
          return;
        }

        navigate("/profile", { replace: true });
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
