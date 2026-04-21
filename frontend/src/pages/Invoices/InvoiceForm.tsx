import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import RichTextEditor from "../../components/common/RichTextEditor";
import { normalizeRichTextValue } from "../../utils/sanitizeHtml";

interface ServiceOption {
  id: number;
  name: string;
  description?: string | null;
  receipt_description?: string | null;
  price: number;
}

interface CustomerOption {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

interface PersonOption {
  id: number;
  first_name: string;
  last_name: string;
}

interface ContractTemplateOption {
  id: number;
  name: string;
  service_id?: number | null;
  services?: ServiceOption[];
  file_path?: string | null;
}

interface BranchInfo {
  id: number;
  name: string;
}

interface InvoiceItemForm {
  service_id: string;
  name: string;
  description: string;
  receipt_description: string;
  price: string;
}

interface InvoicePayload {
  branch_id?: number | null;
  customer_id?: number | null;
  sales_person_id?: number | null;
  assistant_sales_person_id?: number | null;
  contract_template_id?: number | null;
  payment_method?: string | null;
  discount_type?: string | null;
  discount_value?: number | null;
  show_student_information?: number;
  show_no_refund_contract?: number;
}

interface InvoiceResponse {
  invoice: any;
}

interface InvoiceFormOptionsResponse {
  branch: BranchInfo | null;
  branches?: BranchInfo[];
  customers: CustomerOption[];
  services: ServiceOption[];
  sales_persons: PersonOption[];
  assistant_sales_persons: PersonOption[];
  contract_templates: ContractTemplateOption[];
}

const emptyItem = (): InvoiceItemForm => ({
  service_id: "",
  name: "",
  description: "",
  receipt_description: "",
  price: "",
});

const formatCurrency = (value: number) =>
  `$${Number.isFinite(value) ? value.toFixed(2) : "0.00"}`;

const getTemplateServices = (
  template: ContractTemplateOption | undefined,
  services: ServiceOption[],
): ServiceOption[] => {
  if (!template) return [];
  if (template.services && template.services.length > 0) {
    const serviceIds = template.services.map((s) => s.id);
    return services.filter((s) => serviceIds.includes(s.id));
  }
  if (template.service_id) {
    return services.filter((s) => s.id === template.service_id);
  }
  return [];
};

const mergeBranchOptions = (
  options: BranchInfo[],
  selectedBranch: BranchInfo | null,
): BranchInfo[] => {
  const branchMap = new Map<number, BranchInfo>();
  options.forEach((b) => branchMap.set(b.id, b));
  if (selectedBranch) branchMap.set(selectedBranch.id, selectedBranch);
  return Array.from(branchMap.values()).sort((a, b) => a.name.localeCompare(b.name));
};

function InvoiceOptionToggle({
  label,
  enabled,
  onChange,
}: {
  label: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div>
      <label className="mb-3 block text-sm font-medium dark:text-gray-300">{label}</label>
      <label
        className={`inline-flex max-w-full cursor-pointer items-center gap-3 rounded-[16px] border-2 px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
          enabled
            ? "border-sky-400 bg-sky-50 text-sky-900 dark:border-sky-400 dark:bg-sky-900/20 dark:text-sky-100"
            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:bg-gray-700"
        }`}
      >
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded-md border-2 border-sky-300 text-sky-500 focus:ring-2 focus:ring-sky-200 focus:ring-offset-0 dark:border-sky-500 dark:bg-gray-800 dark:text-sky-400 dark:focus:ring-sky-500/30"
        />
        <span className="truncate leading-none">{enabled ? "Enabled" : "Disabled"}</span>
      </label>
    </div>
  );
}

export default function InvoiceForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [salesPersons, setSalesPersons] = useState<PersonOption[]>([]);
  const [assistantSalesPersons, setAssistantSalesPersons] = useState<PersonOption[]>([]);
  const [contractTemplates, setContractTemplates] = useState<ContractTemplateOption[]>([]);
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");

  const [form, setForm] = useState({
    customerId: "",
    salesPersonId: "",
    assistantSalesPersonId: "",
    contractTemplateId: "",
    paymentMethod: "",
    discountType: "",
    discountValue: "",
    showStudentInformation: true,
    showNoRefundContract: false,
  });

  const [items, setItems] = useState<InvoiceItemForm[]>([emptyItem()]);
  const [paymentEvidence, setPaymentEvidence] = useState<File | null>(null);
  const [showDiscountEditor, setShowDiscountEditor] = useState(false);

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    void loadInitialData();
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      void fetchInvoice(id);
    } else {
      setLoading(false);
    }
  }, [id, isEdit]);

  const selectedContractTemplate = useMemo(
    () => contractTemplates.find((t) => String(t.id) === form.contractTemplateId),
    [contractTemplates, form.contractTemplateId],
  );

  const isCashPayment = form.paymentMethod === "cash";

  const availableServices = useMemo(
    () => getTemplateServices(selectedContractTemplate, services),
    [services, selectedContractTemplate],
  );

  const selectedServiceIds = useMemo(
    () => items.map((item) => Number(item.service_id)).filter((sid) => sid > 0),
    [items],
  );

  const hasIncompleteItem = items.some((item) => !item.service_id);
  const canAddMoreItems =
    Boolean(selectedContractTemplate) &&
    !hasIncompleteItem &&
    selectedServiceIds.length < availableServices.length;

  useEffect(() => {
    if (!form.contractTemplateId && contractTemplates.length > 0) {
      const serviceIds = items.map((item) => Number(item.service_id)).filter(Boolean);
      const matched = contractTemplates.find(
        (t) =>
          (t.service_id && serviceIds.includes(t.service_id)) ||
          (t.services && t.services.some((s) => serviceIds.includes(s.id))),
      );
      if (matched) {
        setForm((prev) => ({ ...prev, contractTemplateId: String(matched.id) }));
      }
    }
  }, [items, contractTemplates, form.contractTemplateId]);

  useEffect(() => {
    if (isCashPayment) setPaymentEvidence(null);
  }, [isCashPayment]);

  const loadInitialData = async () => {
    try {
      const res = await api.get("/invoices/form-options");
      const payload: InvoiceFormOptionsResponse = res.data;
      const branchOptions = mergeBranchOptions(
        Array.isArray(payload?.branches) ? payload.branches : [],
        payload?.branch || null,
      );
      setBranches(branchOptions);
      setSelectedBranchId(payload?.branch?.id ? String(payload.branch.id) : "");
      setCustomers(Array.isArray(payload?.customers) ? payload.customers : []);
      setServices(Array.isArray(payload?.services) ? payload.services : []);
      setSalesPersons(Array.isArray(payload?.sales_persons) ? payload.sales_persons : []);
      setAssistantSalesPersons(
        Array.isArray(payload?.assistant_sales_persons) ? payload.assistant_sales_persons : [],
      );
      setContractTemplates(
        Array.isArray(payload?.contract_templates) ? payload.contract_templates : [],
      );
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load invoice data");
    }
  };

  const fetchInvoice = async (invoiceId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/invoices/${invoiceId}`);
      const payload: InvoiceResponse = res.data;
      const invoice = payload.invoice;

      setForm({
        customerId: invoice.customer_id ? String(invoice.customer_id) : "",
        salesPersonId: invoice.sales_person_id ? String(invoice.sales_person_id) : "",
        assistantSalesPersonId: invoice.assistant_sales_person_id
          ? String(invoice.assistant_sales_person_id)
          : "",
        contractTemplateId: invoice.contract_template_id
          ? String(invoice.contract_template_id)
          : "",
        paymentMethod: invoice.payment_method || "",
        discountType: invoice.discount_type || "",
        discountValue: invoice.discount_value ? String(invoice.discount_value) : "",
        showStudentInformation: invoice.show_student_information ?? true,
        showNoRefundContract: invoice.show_no_refund_contract ?? false,
      });
      setShowDiscountEditor(
        Boolean(invoice.discount_type || Number(invoice.discount_value || 0) > 0),
      );

      if (Array.isArray(invoice.items) && invoice.items.length > 0) {
        setItems(
          invoice.items.map((item: any) => ({
            service_id: item.service_id ? String(item.service_id) : "",
            name: item.name || "",
            description: item.description || "",
            receipt_description: item.receipt_description || "",
            price:
              item.line_total !== null && item.line_total !== undefined
                ? String(item.line_total)
                : item.price !== null && item.price !== undefined
                  ? String(item.price)
                  : "",
          })),
        );
      }

      if (invoice.branch) {
        const invoiceBranch = { id: invoice.branch.id, name: invoice.branch.name };
        setBranches((prev) => mergeBranchOptions(prev, invoiceBranch));
        setSelectedBranchId(String(invoiceBranch.id));
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load invoice");
      navigate("/dashboard/invoices");
    } finally {
      setLoading(false);
    }
  };

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price || 0), 0),
    [items],
  );

  const discountAmount = useMemo(() => {
    const value = Number(form.discountValue || 0);
    if (form.discountType === "percent")
      return (Math.min(100, Math.max(0, value)) * subtotal) / 100;
    if (form.discountType === "amount") return Math.min(subtotal, Math.max(0, value));
    return 0;
  }, [form.discountType, form.discountValue, subtotal]);

  const total = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount]);

  const handleItemChange = (index: number, key: keyof InvoiceItemForm, value: string) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      if (key === "service_id") {
        const service = services.find((s) => String(s.id) === value);
        if (service) {
          next[index].name = service.name;
          next[index].description = service.description || "";
          next[index].receipt_description = service.receipt_description || "";
          next[index].price = String(service.price ?? "");
        }
      }
      return next;
    });
  };

  const getServiceOptionsForRow = (index: number) => {
    const currentServiceId = Number(items[index]?.service_id || 0);
    return availableServices.filter((s) => {
      if (s.id === currentServiceId) return true;
      return !selectedServiceIds.includes(s.id);
    });
  };

  const handleContractTemplateChange = (templateId: string) => {
    const template = contractTemplates.find((t) => String(t.id) === templateId);
    const templateServices = getTemplateServices(template, services);
    const allowedServiceIds = new Set(templateServices.map((s) => s.id));

    setForm((prev) => ({ ...prev, contractTemplateId: templateId }));
    setItems((prev) => {
      if (!templateId) return [emptyItem()];
      const filtered = prev
        .filter((item) => !item.service_id || allowedServiceIds.has(Number(item.service_id)))
        .map((item) => {
          if (!item.service_id) return item;
          const service = templateServices.find((s) => s.id === Number(item.service_id));
          if (!service) return emptyItem();
          return {
            service_id: String(service.id),
            name: service.name,
            description: service.description || "",
            receipt_description: service.receipt_description || "",
            price: String(service.price ?? ""),
          };
        });
      return filtered.length > 0 ? filtered : [emptyItem()];
    });
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const openDiscountEditor = () => {
    setShowDiscountEditor(true);
    setForm((prev) => ({ ...prev, discountType: prev.discountType || "amount" }));
  };

  const clearDiscount = () => {
    setShowDiscountEditor(false);
    setForm((prev) => ({ ...prev, discountType: "", discountValue: "" }));
  };

  const validateForm = (): boolean => {
    if (!selectedBranchId) {
      toast.error("Branch is required for invoice creation");
      return false;
    }
    if (!form.contractTemplateId) {
      toast.error("Service group is required");
      return false;
    }
    if (!form.customerId) {
      toast.error("Customer is required");
      return false;
    }
    if (items.length === 0) {
      toast.error("At least one item is required");
      return false;
    }
    if (new Set(selectedServiceIds).size !== selectedServiceIds.length) {
      toast.error("The same service cannot be added more than once");
      return false;
    }
    const invalidItem = items.find(
      (item) => !item.service_id || !item.name.trim() || Number(item.price) < 0 || !item.price,
    );
    if (invalidItem) {
      toast.error("Each item must be selected from the service group services");
      return false;
    }
    return true;
  };

  const buildPayload = (): InvoicePayload => ({
    branch_id: selectedBranchId ? Number(selectedBranchId) : null,
    customer_id: form.customerId ? Number(form.customerId) : null,
    sales_person_id: form.salesPersonId ? Number(form.salesPersonId) : null,
    assistant_sales_person_id: form.assistantSalesPersonId
      ? Number(form.assistantSalesPersonId)
      : null,
    contract_template_id: form.contractTemplateId ? Number(form.contractTemplateId) : null,
    payment_method: form.paymentMethod || null,
    discount_type: form.discountType || null,
    discount_value: form.discountValue ? Number(form.discountValue) : 0,
    show_student_information: form.showStudentInformation ? 1 : 0,
    show_no_refund_contract: form.showNoRefundContract ? 1 : 0,
  });

  const handleSave = async () => {
    if (!validateForm()) return;

    const payload = buildPayload();
    const normalizedItems = items.map((item) => ({
      ...item,
      description: normalizeRichTextValue(item.description),
      receipt_description: normalizeRichTextValue(item.receipt_description),
    }));
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== null && value !== undefined) formData.append(key, String(value));
    });
    formData.append("items", JSON.stringify(normalizedItems));
    if (!isCashPayment && paymentEvidence) {
      formData.append("payment_evidence", paymentEvidence);
    }

    try {
      setSaving(true);
      let invoiceId = id;
      if (isEdit && id) {
        await api.post(`/invoices/${id}?_method=PUT`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        const res = await api.post("/invoices", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        invoiceId = res.data?.invoice?.id;
      }
      if (invoiceId) {
        await api.post(`/invoices/${invoiceId}/preview`);
        navigate(`/dashboard/invoices/${invoiceId}/preview`);
        return;
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save invoice");
    } finally {
      setSaving(false);
    }
  };

  const handleAddCustomer = async () => {
    if (!customerForm.first_name.trim() || !customerForm.last_name.trim()) {
      toast.error("Customer first and last name are required");
      return;
    }
    if (!customerForm.email.trim()) {
      toast.error("Customer email is required");
      return;
    }
    if (!customerForm.phone.trim()) {
      toast.error("Customer phone is required");
      return;
    }

    try {
      const res = await api.post("/customers", customerForm);
      const newCustomer = res.data;
      setCustomers((prev) => [newCustomer, ...prev]);
      setForm((prev) => ({ ...prev, customerId: String(newCustomer.id) }));
      setCustomerForm({ first_name: "", last_name: "", email: "", phone: "" });
      setShowCustomerModal(false);
      toast.success("Customer added");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to add customer");
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  return (
    <div className="p-6 border border-gray-200 rounded-2xl dark:border-gray-700 dark:bg-gray-900 bg-white relative w-full max-w-[1200px] mx-auto">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="colored" />

      <button
        type="button"
        onClick={() => navigate("/dashboard/invoices")}
        className="inline-flex items-center gap-2 px-3 py-2 mb-6 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Invoices
      </button>

      <h1 className="text-2xl font-semibold mb-6 dark:text-gray-200">
        {isEdit ? "Edit Receipt" : "Create Receipt"}
      </h1>

      {/* Branch */}
      <div className="mb-8">
        <label className="mb-3 block text-sm font-medium dark:text-gray-300">Branch</label>
        {branches.length > 0 ? (
          <div className="flex flex-wrap gap-2.5">
            {branches.map((branchOption) => {
              const checked = selectedBranchId === String(branchOption.id);
              return (
                <label
                  key={branchOption.id}
                  className={`inline-flex max-w-full cursor-pointer items-center gap-3 rounded-[16px] border-2 px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    checked
                      ? "border-sky-400 bg-sky-50 text-sky-900 dark:border-sky-400 dark:bg-sky-900/20 dark:text-sky-100"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:bg-gray-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setSelectedBranchId(checked ? "" : String(branchOption.id))
                    }
                    className="h-4 w-4 rounded-md border-2 border-sky-300 text-sky-500 focus:ring-2 focus:ring-sky-200 focus:ring-offset-0 dark:border-sky-500 dark:bg-gray-800 dark:text-sky-400 dark:focus:ring-sky-500/30"
                  />
                  <span className="truncate leading-none">{branchOption.name}</span>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
            No branch is available for this account yet.
          </div>
        )}
      </div>

      {/* Customer + core fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block mb-1 text-sm font-medium dark:text-gray-300">Customer</label>
          <div className="flex gap-2">
            <select
              value={form.customerId}
              onChange={(e) => setForm((prev) => ({ ...prev, customerId: e.target.value }))}
              className="w-full border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name} ({c.email})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowCustomerModal(true)}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Add
            </button>
          </div>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium dark:text-gray-300">
            Payment Method
          </label>
          <select
            value={form.paymentMethod}
            onChange={(e) => setForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
            className="w-full border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select method</option>
            <option value="bkash">bkash</option>
            <option value="nagad">nagad</option>
            <option value="pos">POS</option>
            <option value="cash">cash</option>
            <option value="bank_transfer">bank transfer</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium dark:text-gray-300">Sales Person</label>
          <select
            value={form.salesPersonId}
            onChange={(e) => setForm((prev) => ({ ...prev, salesPersonId: e.target.value }))}
            className="w-full border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select sales person</option>
            {salesPersons.map((p) => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium dark:text-gray-300">
            Assistant Sales Person (Optional)
          </label>
          <select
            value={form.assistantSalesPersonId}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, assistantSalesPersonId: e.target.value }))
            }
            className="w-full border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select assistant</option>
            {assistantSalesPersons.map((p) => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block mb-1 text-sm font-medium dark:text-gray-300">
            Service Group
          </label>
          <select
            value={form.contractTemplateId}
            onChange={(e) => handleContractTemplateChange(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Service Group</option>
            {contractTemplates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {form.contractTemplateId && availableServices.length === 0 && (
            <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
              No services are linked to the selected service group.
            </p>
          )}
        </div>

        {!isCashPayment ? (
          <div>
            <label className="block mb-1 text-sm font-medium dark:text-gray-300">
              Payment Evidence
            </label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setPaymentEvidence(e.target.files?.[0] || null)}
              className="w-full border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200"
            />
          </div>
        ) : null}

        <div>
          <InvoiceOptionToggle
            label="Student Information"
            enabled={form.showStudentInformation}
            onChange={(value) => setForm((prev) => ({ ...prev, showStudentInformation: value }))}
          />
        </div>
        <div>
          <InvoiceOptionToggle
            label="No Refund Contract"
            enabled={form.showNoRefundContract}
            onChange={(value) => setForm((prev) => ({ ...prev, showNoRefundContract: value }))}
          />
        </div>
      </div>

      {/* Items */}
      <div className="mb-8">
        <h2 className="mb-3 text-lg font-semibold dark:text-gray-200">Service Type</h2>

        <div className="overflow-hidden rounded-[24px] border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">

          {/* Info banners */}
          {(!selectedContractTemplate ||
            (selectedContractTemplate &&
              availableServices.length > 0 &&
              hasIncompleteItem)) && (
            <div className="space-y-2 border-b border-gray-200 px-5 py-4 dark:border-gray-700">
              {!selectedContractTemplate && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Select a service group first. Service Type will come from that template
                  only.
                </p>
              )}
              {selectedContractTemplate &&
                availableServices.length > 0 &&
                hasIncompleteItem && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Select a service first, then you can add another item.
                  </p>
                )}
            </div>
          )}

          {/* Item rows */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {items.map((item, index) => (
              <div key={index} className="px-5 py-5">

                {/* ── Row 1: Service select | Price input | Delete button ── */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">

                  {/* Service select */}
                  <div className="flex-1 min-w-0">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
                      Service
                    </label>
                    <select
                      value={item.service_id}
                      onChange={(e) => handleItemChange(index, "service_id", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-200"
                      disabled={!selectedContractTemplate}
                    >
                      <option value="">Select Service Type</option>
                      {getServiceOptionsForRow(index).map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price input */}
                  <div className="sm:w-44">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
                      Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, "price", e.target.value)}
                      placeholder="Enter price"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-200"
                    />
                  </div>

                  {/* Delete button */}
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="inline-flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-red-50 text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/15 mt-[22px]"
                      disabled={items.length === 1}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* ── Row 2: Descriptions — same left alignment as SERVICE label ── */}
                <div className="mt-4 space-y-4">
                  <div className="w-full">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
                      Description
                    </label>
                    <RichTextEditor
                      value={item.description}
                      onChange={(value) => handleItemChange(index, "description", value)}
                      placeholder="Service type description"
                      compact
                    />
                  </div>
                  <div className="w-full">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
                      Receipt Description
                    </label>
                    <RichTextEditor
                      value={item.receipt_description}
                      onChange={(value) => handleItemChange(index, "receipt_description", value)}
                      placeholder="Receipt description"
                      compact
                    />
                  </div>
                </div>

              </div>
            ))}
          </div>

          {/* Add item */}
          <div className="border-t border-gray-200 px-5 py-4 dark:border-gray-700">
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-2 text-base font-semibold text-blue-600 transition hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-400 dark:hover:text-blue-300"
              disabled={!canAddMoreItems}
            >
              <Plus size={18} />
              Add an item
            </button>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 px-5 py-6 dark:border-gray-700">
            <div className="ml-auto w-full max-w-[390px] space-y-3">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                <span>Subtotal:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              {!showDiscountEditor ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={openDiscountEditor}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <Plus size={16} />
                    Add a discount
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Discount
                    </div>
                    <button
                      type="button"
                      onClick={clearDiscount}
                      className="text-sm font-medium text-red-600 transition hover:text-red-700 dark:text-red-300 dark:hover:text-red-200"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-3">
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Discount Value
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.discountValue}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          discountType: prev.discountType || "amount",
                          discountValue: e.target.value,
                        }))
                      }
                      placeholder="Enter discount amount"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                <span>Discount:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  -{formatCurrency(discountAmount)}
                </span>
              </div>

              <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                <div className="flex items-center justify-between text-base font-semibold text-gray-900 dark:text-gray-100">
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => handleSave()}
          className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save & Preview"}
        </button>
      </div>

      {/* Add Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Add Customer</h2>
              <button onClick={() => setShowCustomerModal(false)}>
                <Trash2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="First name"
                value={customerForm.first_name}
                onChange={(e) =>
                  setCustomerForm((prev) => ({ ...prev, first_name: e.target.value }))
                }
                className="w-full border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200"
              />
              <input
                type="text"
                placeholder="Last name"
                value={customerForm.last_name}
                onChange={(e) =>
                  setCustomerForm((prev) => ({ ...prev, last_name: e.target.value }))
                }
                className="w-full border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200"
              />
              <input
                type="email"
                placeholder="Email"
                value={customerForm.email}
                onChange={(e) =>
                  setCustomerForm((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200"
              />
              <input
                type="text"
                placeholder="Phone"
                value={customerForm.phone}
                onChange={(e) =>
                  setCustomerForm((prev) => ({ ...prev, phone: e.target.value }))
                }
                className="w-full border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowCustomerModal(false)}
                className="px-5 py-2 rounded-lg border dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustomer}
                className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}