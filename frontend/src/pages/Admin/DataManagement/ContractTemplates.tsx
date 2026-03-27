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

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-700 lg:p-6 dark:bg-gray-900 bg-white max-w-[1100px] mx-auto">
      <ToastContainer position="top-right" theme="colored" />

      {/* HEADER */}
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Contract Templates
        </h1>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus size={18} /> Add Template
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="min-w-full text-base bg-white dark:bg-gray-900">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-5 py-3 text-left font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">
                Name
              </th>
              <th className="px-5 py-3 text-left font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">
                Service
              </th>
              <th className="px-5 py-3 text-left font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">
                Active
              </th>
              <th className="px-5 py-3 text-left font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">
                File
              </th>
              <th className="px-5 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-10">
                  Loading...
                </td>
              </tr>
            ) : templates.map((t) => {
              const serviceNames = getServiceNames(t);

              return (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  <td className="px-5 py-3 border-r border-gray-200 dark:border-gray-700">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-gray-500">
                      {t.description}
                    </div>
                  </td>

                  <td className="px-5 py-3 border-r border-gray-200 dark:border-gray-700">
                    {serviceNames.length ? (
                      <div className="flex flex-wrap gap-1">
                        {serviceNames.map((name, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td className="px-5 py-3 border-r border-gray-200 dark:border-gray-700">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        t.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {t.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td className="px-5 py-3 border-r border-gray-200 dark:border-gray-700">
                    {t.file_path ? "Uploaded" : "No file"}
                  </td>

                  <td className="px-5 py-3 flex gap-2">
                    <button onClick={() => openEditModal(t)}>
                      <Edit size={16} />
                    </button>

                    <button
                      onClick={() => {
                        setDeleteTargetId(t.id);
                        setIsDeleteModalOpen(true);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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