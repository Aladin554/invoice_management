// AdminUsers.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../../api/axios.ts";
import { Trash2, Edit, Plus } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getMeCached } from "../../utils/me";

interface Role {
  id: number;
  name: string;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role_id: number;
  role?: Role;
  can_create_users: number | string;     // 0 or 1
  panel_permission: number | string;     // ← NEW: 0 or 1             // already existed in your code
  created_at?: string;
  updated_at?: string;
}

const normalizeUser = (user: any): User => ({
  ...user,
  role_id: Number(user?.role_id ?? 0),
  can_create_users: Number(user?.can_create_users ?? 0),
  panel_permission: Number(user?.panel_permission ?? user?.permission ?? 0),
});

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<"all" | "2" | "3" | "4">("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const navigate = useNavigate();
  const location = useLocation();
  const canShowAddUserButton =
    currentUser?.role_id === 1 ||
    (currentUser?.role_id === 2 && Number(currentUser?.can_create_users) === 1);

  // Toast from navigation state
  useEffect(() => {
    if (location.state?.message) {
      const type = location.state.type || "success";
      // @ts-ignore
      toast[type](location.state.message);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Fetch logged-in user
  useEffect(() => {
    getMeCached({ force: true })
      .then((me) => setCurrentUser(me as any))
      .catch(() => setCurrentUser(null));
  }, []);

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users");
      const rows = Array.isArray(res.data) ? res.data : [];
      setUsers(rows.map((row) => normalizeUser(row)));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const applyServerUpdate = (userId: number, updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? normalizeUser({ ...u, ...updates }) : u
      )
    );
  };

  // Toggle can_create_users
  const togglePermission = async (user: User) => {
    if (currentUser?.id === user.id) {
      toast.error("You cannot change your own permissions!");
      return;
    }

    const oldVal = Number(user.can_create_users ?? 0);
    const optimistic = oldVal === 1 ? 0 : 1;

    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, can_create_users: optimistic } : u))
    );

    try {
      const res = await api.patch(`/users/${user.id}/toggle-permission`);
      const body = res.data ?? {};

      if (body.user || body.id) {
        applyServerUpdate(user.id, normalizeUser(body.user ?? body));
      } else if (body.hasOwnProperty("can_create_users")) {
        applyServerUpdate(user.id, { can_create_users: Number(body.can_create_users) });
      } else {
        fetchUsers();
      }

      const finalValue = Number(body.can_create_users ?? body.user?.can_create_users ?? optimistic);
      toast.success(`Permission: ${finalValue === 1 ? "Active" : "Inactive"}`);
    } catch (err: any) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, can_create_users: oldVal } : u))
      );
      toast.error(err?.response?.data?.message || "Failed to update permission");
      if (err?.response?.status === 403) {
        toast.warn("You don't have permission to do this.");
      }
    }
  };

  // NEW: Toggle panel_permission
  const togglePanelPermission = async (user: User) => {
    if (currentUser?.id === user.id) {
      toast.error("You cannot change your own panel permission!");
      return;
    }

    // Optional: restrict to super-admins (role_id === 1)
    if (currentUser?.role_id !== 1) {
      toast.warn("Only super administrators can modify panel permission.");
      return;
    }

    const oldVal = Number(user.panel_permission ?? 0);
    const optimistic = oldVal === 1 ? 0 : 1;

    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id ? { ...u, panel_permission: optimistic } : u
      )
    );

    try {
      // You can either:
      // A) Use a dedicated endpoint
      // const res = await api.patch(`/users/${user.id}/toggle-panel-permission`);

      // B) Reuse generic toggle (recommended if backend supports it)
      const res = await api.patch(`/users/${user.id}/toggle-permission`, {
        field: "panel_permission",
      });

      const body = res.data ?? {};

      let finalValue: number;

      if (body.panel_permission !== undefined) {
        finalValue = Number(body.panel_permission);
      } else if (body.user?.panel_permission !== undefined) {
        finalValue = Number(body.user.panel_permission);
        applyServerUpdate(user.id, normalizeUser(body.user));
      } else {
        finalValue = optimistic;
      }

      toast.success(`Panel Permission: ${finalValue === 1 ? "Allowed" : "Blocked"}`);
    } catch (err: any) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, panel_permission: oldVal } : u
        )
      );
      toast.error(
        err?.response?.data?.message || "Failed to update panel permission"
      );
      if (err?.response?.status === 403) {
        toast.warn("You don't have permission to change this setting.");
      }
    }
  };

  const togglePanelStatus = async (user: User) => {
    if (currentUser?.id === user.id) {
      toast.error("You cannot change your own panel status!");
      return;
    }

    const oldVal = Number(user.panel_permission ?? 0);
    const optimistic = oldVal === 1 ? 0 : 1;

    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, panel_permission: optimistic } : u))
    );

    try {
      const res = await api.patch(`/users/${user.id}/toggle-panel-status`);
      const body = res.data ?? {};

      if (body.user || body.id) {
        applyServerUpdate(user.id, normalizeUser(body.user ?? body));
      } else if (body.hasOwnProperty("panel_permission")) {
        applyServerUpdate(user.id, { panel_permission: Number(body.panel_permission) });
      } else {
        fetchUsers();
      }

      const finalValue = Number(body.panel_permission ?? body.user?.panel_permission ?? optimistic);
      toast.success(`Panel Status: ${finalValue === 1 ? "Active" : "Inactive"}`);
    } catch (err: any) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, panel_permission: oldVal } : u))
      );
      toast.error(err?.response?.data?.message || "Failed to update panel status");
    }
  };

  const confirmDelete = (id: number) => {
    if (currentUser?.id === id) {
      toast.error("You cannot delete yourself!");
      return;
    }
    setDeleteUserId(id);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteUserId) return;
    try {
      await api.delete(`/users/${deleteUserId}`);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Error deleting user");
    } finally {
      setIsModalOpen(false);
      setDeleteUserId(null);
    }
  };

  const openEditForm = (user: User) => {
    navigate(`/dashboard/admin-users/${user.id}/edit`);
  };

  const toggleSelectAll = () => {
    setSelectAll(!selectAll);
    setSelected(!selectAll ? users.map((u) => u.id) : []);
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const formatDate = (dateString?: string) =>
    !dateString ? "-" : new Date(dateString).toISOString().split("T")[0];

  const filteredData = users
    .filter((u) => {
      const term = search.trim().toLowerCase();
      if (!term) return true;
      const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
      const email = u.email.toLowerCase();
      const role = u.role?.name.toLowerCase() || "";
      return fullName.includes(term) || email.includes(term) || role.includes(term);
    })
    .filter((u) => {
      if (roleFilter === "all") return true;
      return Number(u.role_id) === Number(roleFilter);
    })
    .sort((a, b) => {
      if (!a.created_at || !b.created_at) return 0;
      return sortOrder === "asc"
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const totalRows = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / perPage));
  const paginatedData = filteredData.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="colored" />

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="-mx-5 -mt-5 mb-5 flex flex-col gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">Admin User List</div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {loading ? "Refreshing users..." : `${totalRows} users match the current view.`}
            </p>
          </div>

          {canShowAddUserButton ? (
            <Link
              to="/dashboard/admin-users/add"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus size={18} /> Add User
            </Link>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <div className="inline-flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/75 dark:text-slate-300">
            <span className="font-medium">Show</span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-9 min-w-[4.5rem] rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="font-medium">entries</span>
          </div>

          <input
            type="text"
            placeholder="Search by name, email, role..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900/75 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-900 dark:focus:ring-blue-500/20 sm:w-72"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as "all" | "2" | "3" | "4")}
            className="h-12 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900/75 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:bg-slate-900 dark:focus:ring-blue-500/20"
          >
            <option value="all">All Roles</option>
            <option value="2">Role 2</option>
            <option value="3">Role 3</option>
            <option value="4">Role 4</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="h-12 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900/75 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:bg-slate-900 dark:focus:ring-blue-500/20"
          >
            <option value="asc">Oldest First</option>
            <option value="desc">Newest First</option>
          </select>
        </div>

        <div className="mt-5 hidden overflow-x-auto rounded-[24px] border border-slate-200 dark:border-slate-800 md:block">
        <table className="min-w-full table-auto text-sm bg-white dark:bg-slate-950/80">
          <thead className="bg-slate-50/80 text-left text-sm font-semibold text-slate-600 dark:bg-slate-900/90 dark:text-slate-300">
            <tr>
              <th className="px-4 py-3.5 text-center">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-5 py-3.5">
                User
              </th>
              <th className="px-5 py-3.5">
                Role
              </th>
              {currentUser?.role_id === 1 && (
                <>
                  <th className="px-5 py-3.5">
                    Create users
                  </th>
                  <th className="px-5 py-3.5">
                    Panel access
                  </th>
                </>
              )}
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td
                  colSpan={currentUser?.role_id === 1 ? 6 : 4}
                  className="py-14 text-center text-slate-500 dark:text-slate-400"
                >
                  Loading...
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={currentUser?.role_id === 1 ? 6 : 4}
                  className="py-14 text-center text-slate-500 dark:text-slate-400"
                >
                  No users found
                </td>
              </tr>
            ) : (
              paginatedData.map((user) => (
                <tr key={user.id} className="transition hover:bg-blue-50/40 dark:hover:bg-slate-900/70">
                  <td className="py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selected.includes(user.id)}
                      onChange={() => toggleSelect(user.id)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {user.first_name} {user.last_name}
                    </div>
                    <div className="max-w-xs truncate text-sm text-slate-500 dark:text-slate-400">
                      {user.email}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                    {user.role?.name || "-"}
                  </td>

                  {currentUser?.role_id === 1 && (
                    <>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => togglePermission(user)}
                          className={`rounded-full px-3 py-1.5 text-sm font-medium text-white transition ${
                            Number(user.can_create_users) === 1
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-red-600 hover:bg-red-700"
                          }`}
                        >
                          {Number(user.can_create_users) === 1 ? "Active" : "Inactive"}
                        </button>
                      </td>

                      <td className="px-4 py-4">
                        <button
                          onClick={() => togglePanelPermission(user)}
                          className={`rounded-full px-3 py-1.5 text-sm font-medium text-white transition ${
                            Number(user.panel_permission) === 1
                              ? "bg-emerald-600 hover:bg-emerald-700"
                              : "bg-rose-600 hover:bg-rose-700"
                          }`}
                        >
                          {Number(user.panel_permission) === 1 ? "Allowed" : "Blocked"}
                        </button>
                      </td>
                    </>
                  )}

                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEditForm(user)}
                      className="inline-flex items-center justify-center rounded-full border border-amber-200 bg-amber-50 p-2.5 text-amber-700 transition hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/15"
                      aria-label="Edit user"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => confirmDelete(user.id)}
                      className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 p-2.5 text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/15"
                      aria-label="Delete user"
                    >
                      <Trash2 size={16} />
                    </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARDS */}
      <div className="mt-5 space-y-4 md:hidden">
        {paginatedData.map((user) => (
          <div
            key={user.id}
            className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/80"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected.includes(user.id)}
                  onChange={() => toggleSelect(user.id)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    {user.first_name} {user.last_name}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{user.email}</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Role: {user.role?.name || "-"}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              {currentUser?.role_id === 1 && (
                <>
                  <div>
                    <span className="text-slate-600 dark:text-slate-300">Permission:</span>
                    <button
                      onClick={() => togglePermission(user)}
                      className={`ml-2 rounded-full px-2 py-1 text-xs font-medium text-white ${
                        Number(user.can_create_users) === 1 ? "bg-green-600" : "bg-red-600"
                      }`}
                    >
                      {Number(user.can_create_users) === 1 ? "Active" : "Inactive"}
                    </button>
                  </div>

                  <div>
                    <span className="text-slate-600 dark:text-slate-300">Panel Perm:</span>
                    <button
                      onClick={() => togglePanelPermission(user)}
                      className={`ml-2 rounded-full px-2 py-1 text-xs font-medium text-white ${
                        Number(user.panel_permission) === 1 ? "bg-emerald-600" : "bg-rose-600"
                      }`}
                    >
                      {Number(user.panel_permission) === 1 ? "Allowed" : "Blocked"}
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => openEditForm(user)}
                className="inline-flex items-center justify-center rounded-full border border-amber-200 bg-amber-50 p-2.5 text-amber-700 transition hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/15"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => confirmDelete(user.id)}
                className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 p-2.5 text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/15"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col items-center justify-between gap-4 text-sm text-slate-600 dark:text-slate-400 md:flex-row">
        <div className="rounded-full bg-slate-50 px-4 py-2 dark:bg-slate-900">
          Showing {totalRows === 0 ? 0 : (currentPage - 1) * perPage + 1} to{" "}
          {Math.min(currentPage * perPage, totalRows)} of {totalRows} entries
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            Previous
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`rounded-full border px-4 py-2 transition ${
                currentPage === i + 1
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            Next
          </button>
        </div>
      </div>
      </section>

      {/* DELETE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-full max-w-sm rounded-[28px] border border-blue-100 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
                <Trash2 className="text-rose-600" size={28} />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">Delete User?</h3>
              <p className="text-slate-600 dark:text-slate-400">
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 rounded-full border border-slate-200 py-2.5 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 rounded-full bg-rose-600 py-2.5 text-white transition hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
