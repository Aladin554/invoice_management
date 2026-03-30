import { useEffect, useState } from "react";
import api from "../../../api/axios";
import { Edit, Plus, Trash2, X } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface PersonItem {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  created_at?: string;
  updated_at?: string;
}

interface PeopleCrudPageProps {
  title: string;
  singularTitle: string;
  endpoint: string;
}

interface FormState {
  id?: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

interface FormErrors {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeCollection(payload: any): PersonItem[] {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function getErrorMessage(error: any, fallback: string): string {
  const fromMessage = error?.response?.data?.message;
  if (typeof fromMessage === "string" && fromMessage.trim()) return fromMessage;

  const firstValidationError = Object.values(error?.response?.data?.errors || {})?.[0];
  if (Array.isArray(firstValidationError) && firstValidationError[0]) {
    return String(firstValidationError[0]);
  }

  return fallback;
}

const initialForm = (): FormState => ({
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
});

const initialErrors = (): FormErrors => ({
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
});

export default function PeopleCrudPage({ title, singularTitle, endpoint }: PeopleCrudPageProps) {
  const [items, setItems] = useState<PersonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState(`Add ${singularTitle}`);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>(initialErrors);
  const [submitting, setSubmitting] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const filteredData = items.filter((item) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;

    const fullName = `${item.first_name} ${item.last_name}`.toLowerCase();
    return (
      fullName.includes(term) ||
      item.email.toLowerCase().includes(term) ||
      item.phone.toLowerCase().includes(term)
    );
  });

  const totalRows = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / perPage));
  const paginatedData = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage);

  useEffect(() => {
    void fetchItems();
  }, [endpoint]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get(endpoint);
      setItems(normalizeCollection(res.data));
    } catch (error: any) {
      toast.error(getErrorMessage(error, `Failed to fetch ${title.toLowerCase()}`));
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setForm(initialForm());
    setErrors(initialErrors());
    setModalTitle(`Add ${singularTitle}`);
    setIsModalOpen(true);
  };

  const openEditModal = (item: PersonItem) => {
    setForm({
      id: item.id,
      first_name: item.first_name,
      last_name: item.last_name,
      email: item.email,
      phone: item.phone,
    });
    setErrors(initialErrors());
    setModalTitle(`Edit ${singularTitle}`);
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const nextErrors = initialErrors();
    let valid = true;

    if (!form.first_name.trim()) {
      nextErrors.first_name = "First name is required.";
      valid = false;
    }
    if (!form.last_name.trim()) {
      nextErrors.last_name = "Last name is required.";
      valid = false;
    }
    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
      valid = false;
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      nextErrors.email = "Invalid email format.";
      valid = false;
    }
    if (!form.phone.trim()) {
      nextErrors.phone = "Phone is required.";
      valid = false;
    }

    setErrors(nextErrors);
    return valid;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    };

    setSubmitting(true);
    try {
      if (form.id) {
        await api.put(`${endpoint}/${form.id}`, payload);
        toast.success(`${singularTitle} updated successfully`);
      } else {
        await api.post(endpoint, payload);
        toast.success(`${singularTitle} created successfully`);
      }
      setIsModalOpen(false);
      void fetchItems();
    } catch (error: any) {
      toast.error(getErrorMessage(error, `Error saving ${singularTitle.toLowerCase()}`));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;

    try {
      await api.delete(`${endpoint}/${deleteTargetId}`);
      toast.success(`${singularTitle} deleted successfully`);
      void fetchItems();
    } catch (error: any) {
      toast.error(getErrorMessage(error, `Error deleting ${singularTitle.toLowerCase()}`));
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteTargetId(null);
    }
  };

  const toggleSelectAll = () => {
    const next = !selectAll;
    setSelectAll(next);
    setSelected(next ? filteredData.map((item) => item.id) : []);
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const formatDate = (value?: string) => (value ? new Date(value).toISOString().split("T")[0] : "-");

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="colored" />

      <section className="rounded-[28px] border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-sky-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/78 dark:bg-none">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-0">
              Admin management
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {title}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Review, search, and manage {title.toLowerCase()} from the same light blue admin
              workspace used across the redesigned panel.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} /> Add {singularTitle}
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white bg-white/85 p-4 shadow-sm ring-1 ring-blue-100/70 dark:border-slate-800 dark:bg-slate-900/80 dark:ring-0">
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Total records</div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {totalRows}
            </div>
          </div>
          <div className="rounded-2xl border border-white bg-white/85 p-4 shadow-sm ring-1 ring-blue-100/70 dark:border-slate-800 dark:bg-slate-900/80 dark:ring-0">
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Selected</div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {selected.length}
            </div>
          </div>
          <div className="rounded-2xl border border-white bg-white/85 p-4 shadow-sm ring-1 ring-blue-100/70 dark:border-slate-800 dark:bg-slate-900/80 dark:ring-0">
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Per page</div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {perPage}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">Quick filters</div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Search by name, email, or phone and control how many rows are visible.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
              <span>Showing</span>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-full border border-blue-100 bg-white px-3 py-1 text-sm text-slate-700 outline-none focus:border-blue-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>

            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900/75 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-900 dark:focus:ring-blue-500/20 sm:w-80"
            />
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-[24px] border border-slate-200 dark:border-slate-800">
          <table className="min-w-full text-sm bg-white dark:bg-slate-950/80">
            <thead className="bg-slate-50/80 text-left text-sm font-semibold text-slate-600 dark:bg-slate-900/90 dark:text-slate-300">
            <tr>
              <th className="w-14 px-4 py-3.5 text-center">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-5 py-3.5">
                First Name
              </th>
              <th className="px-5 py-3.5">
                Last Name
              </th>
              <th className="px-5 py-3.5">
                Email
              </th>
              <th className="px-5 py-3.5">
                Phone
              </th>
              <th className="px-5 py-3.5">
                Created
              </th>
              <th className="px-5 py-3.5">
                Updated
              </th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-14 text-center text-slate-500 dark:text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-14 text-center text-slate-500 dark:text-slate-400">
                  No {title.toLowerCase()} found
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr key={item.id} className="transition hover:bg-blue-50/40 dark:hover:bg-slate-900/70">
                  <td className="py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selected.includes(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-900 dark:text-slate-100">
                    {item.first_name}
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-900 dark:text-slate-100">
                    {item.last_name}
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                    {item.email}
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                    {item.phone}
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                    {formatDate(item.created_at)}
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                    {formatDate(item.updated_at)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEditModal(item)}
                      className="inline-flex items-center justify-center rounded-full border border-amber-200 bg-amber-50 p-2.5 text-amber-700 transition hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/15"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteTargetId(item.id);
                        setIsDeleteModalOpen(true);
                      }}
                      className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 p-2.5 text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/15"
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
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => setCurrentPage(num)}
              className={`rounded-full border px-4 py-2 transition ${
                num === currentPage
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
              }`}
            >
              {num}
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-full max-w-lg rounded-[28px] border border-blue-100 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{modalTitle}</h2>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-6 h-6 text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">First Name</label>
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    className={`h-11 w-full rounded-2xl border bg-slate-50/80 px-3 text-base text-slate-800 outline-none focus:ring-4 dark:bg-slate-900 dark:text-slate-100 ${
                      errors.first_name ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"
                    }`}
                  />
                  {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>}
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Last Name</label>
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    className={`h-11 w-full rounded-2xl border bg-slate-50/80 px-3 text-base text-slate-800 outline-none focus:ring-4 dark:bg-slate-900 dark:text-slate-100 ${
                      errors.last_name ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"
                    }`}
                  />
                  {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>}
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={`h-11 w-full rounded-2xl border bg-slate-50/80 px-3 text-base text-slate-800 outline-none focus:ring-4 dark:bg-slate-900 dark:text-slate-100 ${
                      errors.email ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"
                    }`}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={`h-11 w-full rounded-2xl border bg-slate-50/80 px-3 text-base text-slate-800 outline-none focus:ring-4 dark:bg-slate-900 dark:text-slate-100 ${
                      errors.phone ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"
                    }`}
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full border border-slate-200 px-5 py-2.5 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-full max-w-md rounded-[28px] border border-blue-100 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
                <Trash2 className="text-rose-600" size={32} />
              </div>
              <h2 className="mb-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Delete {singularTitle}?
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Are you sure you want to delete this {singularTitle.toLowerCase()}?{" "}
                <span className="font-bold">This action cannot be undone.</span>
              </p>
            </div>
            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-full border border-slate-200 px-6 py-2.5 font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="rounded-full bg-rose-600 px-6 py-2.5 font-medium text-white shadow-sm transition hover:bg-rose-700"
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
