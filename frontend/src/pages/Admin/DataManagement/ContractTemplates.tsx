import { useEffect, useState } from "react";
import api from "../../../api/axios";
import { Edit, Plus, Trash2, X } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import InlineFilterSelect from "../../../components/common/InlineFilterSelect";

interface ServiceOption {
  id: number;
  name: string;
}

interface ContractTemplate {
  id: number;
  name: string;
  service_id?: number | null;
  service_ids?: number[];
  service?: ServiceOption | null;
  services?: ServiceOption[];
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
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [form, setForm] = useState({
    id: undefined as number | undefined,
    name: "",
    service_ids: [] as number[],
  });

  useEffect(() => {
    void fetchTemplates();
    void fetchServices();
  }, []);

  const normalizeTemplate = (template: any): ContractTemplate => ({
    ...template,
    service_ids: Array.isArray(template?.services) && template.services.length > 0
      ? template.services.map((service: ServiceOption) => Number(service.id))
      : Array.isArray(template?.service_ids)
        ? template.service_ids.map((id: number) => Number(id))
        : template?.service_id
          ? [Number(template.service_id)]
          : [],
  });

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get("/contract-templates");
      const rows = Array.isArray(res.data) ? res.data : [];
      setTemplates(rows.map((row) => normalizeTemplate(row)));
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
      service_ids: [],
    });
    setModalTitle("Add Contract Template");
    setIsModalOpen(true);
  };

  const openEditModal = (template: ContractTemplate) => {
    setForm({
      id: template.id,
      name: template.name,
      service_ids:
        template.services?.map((service) => service.id) ||
        template.service_ids ||
        (template.service_id ? [template.service_id] : []),
    });
    setModalTitle("Edit Contract Template");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Template name is required");
      return;
    }

    const payload = {
      name: form.name.trim(),
      service_ids: form.service_ids,
    };

    try {
      if (form.id) {
        await api.put(`/contract-templates/${form.id}`, payload);
        toast.success("Updated");
      } else {
        await api.post("/contract-templates", payload);
        toast.success("Created");
      }

      setIsModalOpen(false);
      await fetchTemplates();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Save failed");
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;

    try {
      await api.delete(`/contract-templates/${deleteTargetId}`);
      toast.success("Deleted");
      await fetchTemplates();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Delete failed");
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteTargetId(null);
    }
  };

  const toggleService = (id: number) => {
    setForm((prev) => ({
      ...prev,
      service_ids: prev.service_ids.includes(id)
        ? prev.service_ids.filter((serviceId) => serviceId !== id)
        : [...prev.service_ids, id],
    }));
  };

  const getServiceNames = (template: ContractTemplate) => {
    if (template.services?.length) return template.services.map((service) => service.name);

    if (template.service_ids?.length) {
      return template.service_ids
        .map((id) => services.find((service) => Number(service.id) === Number(id))?.name)
        .filter(Boolean) as string[];
    }

    if (template.service_id) {
      const service = services.find((item) => item.id === template.service_id);
      return service ? [service.name] : [];
    }

    return [];
  };

  const filteredData = templates.filter((template) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;

    const serviceNames = getServiceNames(template).join(" ").toLowerCase();

    return template.name.toLowerCase().includes(term) || serviceNames.includes(term);
  });

  const totalRows = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / perPage));
  const paginatedData = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setSelectAll(filteredData.length > 0 && filteredData.every((template) => selected.includes(template.id)));
  }, [filteredData, selected]);

  const toggleSelectAll = () => {
    const next = !selectAll;
    setSelectAll(next);
    setSelected(next ? filteredData.map((template) => template.id) : []);
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((templateId) => templateId !== id) : [...prev, id],
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
              <InlineFilterSelect
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                containerClassName="h-9 min-w-[4.5rem] rounded-xl border border-slate-200 bg-white px-3 transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus-within:border-blue-500 dark:focus-within:ring-blue-500/20"
                selectClassName="text-sm font-medium text-slate-700 dark:text-slate-100"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </InlineFilterSelect>
              <span className="font-medium">entries</span>
            </div>

            <input
              type="text"
              placeholder="Search by name or service..."
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
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-14 text-center text-slate-500 dark:text-slate-400">
                      Loading...
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-14 text-center text-slate-500 dark:text-slate-400">
                      No templates found
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((template) => {
                    const serviceNames = getServiceNames(template);

                    return (
                      <tr key={template.id} className="transition hover:bg-blue-50/40 dark:hover:bg-slate-900/70">
                        <td className="py-4 text-center">
                          <input
                            type="checkbox"
                            checked={selected.includes(template.id)}
                            onChange={() => toggleSelect(template.id)}
                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-medium text-slate-900 dark:text-slate-100">{template.name}</div>
                        </td>
                        <td className="px-5 py-4">
                          {serviceNames.length ? (
                            <div className="flex flex-wrap gap-1.5">
                              {serviceNames.map((name, index) => (
                                <span
                                  key={`${template.id}-${index}`}
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
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditModal(template)}
                              className="inline-flex items-center justify-center rounded-full border border-amber-200 bg-amber-50 p-2.5 text-amber-700 transition hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/15"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteTargetId(template.id);
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
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`rounded-full border px-4 py-2 transition ${
                    pageNumber === currentPage
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b px-6 py-4 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{modalTitle}</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input
                  placeholder="Enter template name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Services</label>
                <div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-lg border p-3 dark:border-gray-700">
                  {services.map((service) => (
                    <label
                      key={service.id}
                      className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <input
                        type="checkbox"
                        checked={form.service_ids.includes(service.id)}
                        onChange={() => toggleService(service.id)}
                        className="accent-blue-600"
                      />
                      {service.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t pt-2 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isDeleteModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[28px] border border-blue-100 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
                <Trash2 className="text-rose-600" size={28} />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
                Delete Template?
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                This action cannot be undone.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteTargetId(null);
                }}
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
      ) : null}
    </div>
  );
}
