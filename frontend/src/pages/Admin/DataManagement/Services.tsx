import { useEffect, useState } from "react";
import api from "../../../api/axios";
import { Edit, Plus, Trash2, X } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import RichTextEditor from "../../../components/common/RichTextEditor";
import {
  getPlainTextFromHtml,
  getRichTextExcerpt,
  hasMeaningfulHtmlContent,
  normalizeRichTextValue,
} from "../../../utils/sanitizeHtml";

interface ServiceItem {
  id: number;
  name: string;
  description: string;
  receipt_description?: string;
  price: number | string;
  created_at?: string;
  updated_at?: string;
}

interface FormState {
  id?: number;
  name: string;
  description: string;
  receipt_description: string;
  price: string;
}

interface FormErrors {
  name: string;
  description: string;
  receipt_description: string;
  price: string;
}

function normalizeCollection(payload: any): ServiceItem[] {
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
  name: "",
  description: "",
  receipt_description: "",
  price: "",
});

const initialErrors = (): FormErrors => ({
  name: "",
  description: "",
  receipt_description: "",
  price: "",
});

export default function Services() {
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Add Service");
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>(initialErrors);
  const [submitting, setSubmitting] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const filteredData = items.filter((item) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      item.name.toLowerCase().includes(term) ||
      getPlainTextFromHtml(item.description).toLowerCase().includes(term) ||
      getPlainTextFromHtml(item.receipt_description || "").toLowerCase().includes(term) ||
      String(item.price).toLowerCase().includes(term)
    );
  });

  const totalRows = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / perPage));
  const paginatedData = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage);

  useEffect(() => {
    void fetchItems();
  }, []);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get("/services");
      setItems(normalizeCollection(res.data));
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Failed to fetch services"));
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setForm(initialForm());
    setErrors(initialErrors());
    setModalTitle("Add Service");
    setIsModalOpen(true);
  };

  const openEditModal = (item: ServiceItem) => {
    setForm({
      id: item.id,
      name: item.name,
      description: item.description ?? "",
      receipt_description: item.receipt_description ?? "",
      price: Number(item.price).toString(),
    });
    setErrors(initialErrors());
    setModalTitle("Edit Service");
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const nextErrors = initialErrors();
    let valid = true;

    if (!form.name.trim()) {
      nextErrors.name = "Name is required.";
      valid = false;
    }
    if (!hasMeaningfulHtmlContent(form.description)) {
      nextErrors.description = "Description is required.";
      valid = false;
    }

    const parsedPrice = Number(form.price);
    if (!form.price.trim()) {
      nextErrors.price = "Price is required.";
      valid = false;
    } else if (Number.isNaN(parsedPrice)) {
      nextErrors.price = "Price must be a number.";
      valid = false;
    } else if (parsedPrice < 0) {
      nextErrors.price = "Price cannot be negative.";
      valid = false;
    }

    setErrors(nextErrors);
    return valid;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      name: form.name.trim(),
      description: normalizeRichTextValue(form.description),
      receipt_description: normalizeRichTextValue(form.receipt_description) || null,
      price: Number(form.price),
    };

    setSubmitting(true);
    try {
      if (form.id) {
        await api.put(`/services/${form.id}`, payload);
        toast.success("Service updated successfully");
      } else {
        await api.post("/services", payload);
        toast.success("Service created successfully");
      }
      setIsModalOpen(false);
      void fetchItems();
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Error saving service"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      await api.delete(`/services/${deleteTargetId}`);
      toast.success("Service deleted successfully");
      void fetchItems();
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Error deleting service"));
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
    setSelected((prev) => (prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]));
  };

  const formatDate = (value?: string) => (value ? new Date(value).toISOString().split("T")[0] : "-");
  const formatPrice = (value: number | string) => Number(value || 0).toFixed(2);

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="colored" />

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">Services</div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {loading ? "Refreshing services..." : `${totalRows} services match the current view.`}
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} /> Add Service
          </button>
        </div>

        <div className="px-5 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <div className="inline-flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/75 dark:text-slate-300">
              <span className="font-medium">Show</span>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="panel-select-sm h-9 min-w-[4.5rem] rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
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
              placeholder="Search by name, descriptions, price..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900/75 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-900 dark:focus:ring-blue-500/20 sm:w-80"
            />
          </div>

          <div className="mt-5 overflow-x-auto rounded-[24px] border border-slate-200 dark:border-slate-800">
            <table className="min-w-full bg-white text-sm dark:bg-slate-950/80">
              <thead className="bg-slate-50/80 text-left text-sm font-semibold text-slate-600 dark:bg-slate-900/90 dark:text-slate-300">
                <tr>
                  <th className="w-14 px-4 py-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={toggleSelectAll}
                      className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-5 py-3.5">Name</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-5 py-3.5">Receipt Description</th>
                  <th className="px-5 py-3.5">Price</th>
                  <th className="px-5 py-3.5">Created</th>
                  <th className="px-5 py-3.5">Updated</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-14 text-center text-slate-500 dark:text-slate-400">
                      Loading...
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-14 text-center text-slate-500 dark:text-slate-400">
                      No services found
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
                          className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-900 dark:text-slate-100">
                        {item.name}
                      </td>
                      <td className="max-w-[360px] px-5 py-4 text-slate-600 dark:text-slate-300">
                        {getRichTextExcerpt(item.description) ? (
                          <div className="truncate" title={getPlainTextFromHtml(item.description)}>
                            {getRichTextExcerpt(item.description)}
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">-</span>
                        )}
                      </td>
                      <td className="max-w-[360px] px-5 py-4 text-slate-600 dark:text-slate-300">
                        {getRichTextExcerpt(item.receipt_description || "") ? (
                          <div
                            className="truncate"
                            title={getPlainTextFromHtml(item.receipt_description || "")}
                          >
                            {getRichTextExcerpt(item.receipt_description || "")}
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                        ${formatPrice(item.price)}
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
                className="rounded-full border border-slate-200 bg-white px-4 py-2 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
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
                className="rounded-full border border-slate-200 bg-white px-4 py-2 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{modalTitle}</h2>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium dark:text-gray-300">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={`w-full border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 ${
                    errors.name ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"
                  }`}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium dark:text-gray-300">Description</label>
                <RichTextEditor
                  value={form.description}
                  onChange={(value) => setForm({ ...form, description: value })}
                  placeholder="Describe the service"
                  invalid={Boolean(errors.description)}
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium dark:text-gray-300">Receipt Description</label>
                <RichTextEditor
                  value={form.receipt_description}
                  onChange={(value) => setForm({ ...form, receipt_description: value })}
                  placeholder="Optional receipt description"
                  compact
                  invalid={Boolean(errors.receipt_description)}
                />
                {errors.receipt_description && <p className="text-red-500 text-sm mt-1">{errors.receipt_description}</p>}
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium dark:text-gray-300">Price</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className={`w-full border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 ${
                    errors.price ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"
                  }`}
                />
                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 rounded-lg border dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="mx-auto w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="text-red-600 dark:text-red-400" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Delete Service?</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to delete this service?{" "}
                <span className="font-bold">This action cannot be undone.</span>
              </p>
            </div>
            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium shadow-md"
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
