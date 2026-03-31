import { useEffect, useState } from "react";
import api from "../../../api/axios";
import { Edit, Plus, Trash2, X } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface ServiceOption {
  id: number;
  name: string;
}

interface ContractTemplate {
  id: number;
  name: string;
  description?: string | null;
  service_id?: number | null;
  service_ids?: number[];
  service?: ServiceOption | null;
  services?: ServiceOption[];
  is_active: boolean;
  file_path?: string | null;
}

export default function ContractTemplates() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Add Contract Template");

  const [form, setForm] = useState({
    id: undefined as number | undefined,
    name: "",
    description: "",
    service_ids: [] as number[],
    is_active: true,
    file: null as File | null,
  });

  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    fetchTemplates();
    fetchServices();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get("/contract-templates");
      const rows = Array.isArray(res.data) ? res.data : [];

      setTemplates(
        rows.map((t) => ({
          ...t,
          is_active: Boolean(t.is_active),
          service_ids: Array.isArray(t.service_ids)
            ? t.service_ids.map((id: any) => Number(id))
            : [],
        }))
      );
    } catch {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await api.get("/services");
      setServices(Array.isArray(res.data) ? res.data : []);
    } catch {
      setServices([]);
    }
  };

  const openAddModal = () => {
    setForm({
      id: undefined,
      name: "",
      description: "",
      service_ids: [],
      is_active: true,
      file: null,
    });
    setModalTitle("Add Contract Template");
    setIsModalOpen(true);
  };

  const openEditModal = (t: ContractTemplate) => {
    setForm({
      id: t.id,
      name: t.name,
      description: t.description || "",
      service_ids:
        t.services?.map((s) => s.id) ||
        t.service_ids ||
        (t.service_id ? [t.service_id] : []),
      is_active: t.is_active,
      file: null,
    });
    setModalTitle("Edit Contract Template");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("description", form.description);

    form.service_ids.forEach((id) => {
      formData.append("service_ids[]", String(id));
    });

    formData.append("is_active", form.is_active ? "1" : "0");

    if (form.file) formData.append("file", form.file);

    try {
      if (form.id) {
        await api.post(`/contract-templates/${form.id}?_method=PUT`, formData);
        toast.success("Updated");
      } else {
        await api.post("/contract-templates", formData);
        toast.success("Created");
      }

      setIsModalOpen(false);
      fetchTemplates();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Save failed");
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;

    try {
      await api.delete(`/contract-templates/${deleteTargetId}`);
      toast.success("Deleted");
      fetchTemplates();
    } catch {
      toast.error("Delete failed");
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteTargetId(null);
    }
  };

  const toggleService = (id: number) => {
    setForm((prev) => ({
      ...prev,
      service_ids: prev.service_ids.includes(id)
        ? prev.service_ids.filter((s) => s !== id)
        : [...prev.service_ids, id],
    }));
  };

  // ✅ UNIVERSAL SERVICE RENDER
  const getServiceNames = (t: ContractTemplate) => {
    if (t.services?.length) return t.services.map((s) => s.name);

    if (t.service_ids?.length) {
      return t.service_ids
        .map((id) => {
          const s = services.find((x) => Number(x.id) === Number(id));
          return s?.name;
        })
        .filter(Boolean);
    }

    if (t.service_id) {
      const s = services.find((x) => x.id === t.service_id);
      return s ? [s.name] : [];
    }

    return [];
  };

  const filteredData = templates.filter((template) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;

    const serviceNames = getServiceNames(template).join(" ").toLowerCase();
    const fileLabel = template.file_path ? "uploaded" : "no file";
    const statusLabel = template.is_active ? "active" : "inactive";

    return (
      template.name.toLowerCase().includes(term) ||
      (template.description || "").toLowerCase().includes(term) ||
      serviceNames.includes(term) ||
      fileLabel.includes(term) ||
      statusLabel.includes(term)
    );
  });

  const totalRows = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / perPage));
  const paginatedData = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const toggleSelectAll = () => {
    const next = !selectAll;
    setSelectAll(next);
    setSelected(next ? filteredData.map((template) => template.id) : []);
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((templateId) => templateId !== id) : [...prev, id]
    );
  };

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6">
      <ToastContainer position="top-right" theme="colored" />

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Contract Templates
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {loading ? "Refreshing templates..." : `${totalRows} templates match the current view.`}
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} /> Add Template
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
              placeholder="Search by name, description, service..."
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
                  <th className="px-5 py-3.5">Service</th>
                  <th className="px-5 py-3.5">Active</th>
                  <th className="px-5 py-3.5">File</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center text-slate-500 dark:text-slate-400">
                      Loading...
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center text-slate-500 dark:text-slate-400">
                      No templates found
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((t) => {
                    const serviceNames = getServiceNames(t);

                    return (
                      <tr key={t.id} className="transition hover:bg-blue-50/40 dark:hover:bg-slate-900/70">
                        <td className="py-4 text-center">
                          <input
                            type="checkbox"
                            checked={selected.includes(t.id)}
                            onChange={() => toggleSelect(t.id)}
                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-medium text-slate-900 dark:text-slate-100">{t.name}</div>
                          <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {t.description || "No description"}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {serviceNames.length ? (
                            <div className="flex flex-wrap gap-1.5">
                              {serviceNames.map((name, i) => (
                                <span
                                  key={`${t.id}-${i}`}
                                  className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 dark:text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              t.is_active
                                ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/12 dark:text-emerald-300"
                                : "border border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                            }`}
                          >
                            {t.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                          {t.file_path ? "Uploaded" : "No file"}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditModal(t)}
                              className="inline-flex items-center justify-center rounded-full border border-amber-200 bg-amber-50 p-2.5 text-amber-700 transition hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/15"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteTargetId(t.id);
                                setIsDeleteModalOpen(true);
                              }}
                              className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 p-2.5 text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/15"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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

      {/* MODAL same as yours */}
      {isModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
    <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">

      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {modalTitle}
        </h2>
        <button
          onClick={() => setIsModalOpen(false)}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X size={18} />
        </button>
      </div>

      {/* BODY */}
      <form
        onSubmit={handleSave}
        className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto"
      >
        {/* NAME */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Name
          </label>
          <input
            placeholder="Enter template name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:border-gray-700"
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            placeholder="Optional description"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:border-gray-700"
          />
        </div>

        {/* SERVICES */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Services
          </label>

          <div className="mt-2 border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2 dark:border-gray-700">
            {services.map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
              >
                <input
                  type="checkbox"
                  checked={form.service_ids.includes(s.id)}
                  onChange={() => toggleService(s.id)}
                  className="accent-blue-600"
                />
                {s.name}
              </label>
            ))}
          </div>
        </div>

        {/* FILE */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Upload File
          </label>
          <input
            type="file"
            onChange={(e) =>
              setForm({
                ...form,
                file: e.target.files?.[0] || null,
              })
            }
            className="w-full mt-1 text-sm"
          />
        </div>

        {/* ACTIVE */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) =>
              setForm({ ...form, is_active: e.target.checked })
            }
            className="accent-green-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Active
          </span>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 pt-2 border-t dark:border-gray-700">
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="px-4 py-2 rounded-lg border text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  </div>
)}
    </div>
  );
}
