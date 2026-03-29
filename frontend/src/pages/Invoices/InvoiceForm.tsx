import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface ServiceOption {
  id: number;
  name: string;
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
  price: string;
}

interface InvoicePayload {
  customer_id?: number | null;
  sales_person_id?: number | null;
  assistant_sales_person_id?: number | null;
  contract_template_id?: number | null;
  payment_method?: string | null;
  discount_type?: string | null;
  discount_value?: number | null;
}

interface InvoiceResponse {
  invoice: any;
}

interface InvoiceFormOptionsResponse {
  branch: BranchInfo | null;
  customers: CustomerOption[];
  services: ServiceOption[];
  sales_persons: PersonOption[];
  assistant_sales_persons: PersonOption[];
  contract_templates: ContractTemplateOption[];
}

const emptyItem = (): InvoiceItemForm => ({
  service_id: "",
  name: "",
  price: "",
});

const getTemplateServices = (
  template: ContractTemplateOption | undefined,
  services: ServiceOption[],
): ServiceOption[] => {
  if (!template) return [];

  if (template.services && template.services.length > 0) {
    const serviceIds = template.services.map((service) => service.id);
    return services.filter((service) => serviceIds.includes(service.id));
  }

  if (template.service_id) {
    return services.filter((service) => service.id === template.service_id);
  }

  return [];
};

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

  const [branch, setBranch] = useState<BranchInfo | null>(null);

  const [form, setForm] = useState({
    customerId: "",
    salesPersonId: "",
    assistantSalesPersonId: "",
    contractTemplateId: "",
    paymentMethod: "",
    discountType: "",
    discountValue: "",
  });

  const [items, setItems] = useState<InvoiceItemForm[]>([emptyItem()]);
  const [paymentEvidence, setPaymentEvidence] = useState<File | null>(null);

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

  const selectedContractTemplate = useMemo(() => {
    return contractTemplates.find((template) => String(template.id) === form.contractTemplateId);
  }, [contractTemplates, form.contractTemplateId]);

  const availableServices = useMemo(() => {
    return getTemplateServices(selectedContractTemplate, services);
  }, [services, selectedContractTemplate]);

  const selectedServiceIds = useMemo(() => {
    return items
      .map((item) => Number(item.service_id))
      .filter((serviceId) => serviceId > 0);
  }, [items]);

  const hasIncompleteItem = items.some((item) => !item.service_id);
  const canAddMoreItems =
    Boolean(selectedContractTemplate) &&
    !hasIncompleteItem &&
    selectedServiceIds.length < availableServices.length;

  useEffect(() => {
    if (!form.contractTemplateId && contractTemplates.length > 0) {
      const serviceIds = items.map((item) => Number(item.service_id)).filter(Boolean);
      const matched = contractTemplates.find((template) =>
        (template.service_id && serviceIds.includes(template.service_id)) ||
        (template.services && template.services.some((s) => serviceIds.includes(s.id)))
      );
      if (matched) {
        setForm((prev) => ({ ...prev, contractTemplateId: String(matched.id) }));
      }
    }
  }, [items, contractTemplates, form.contractTemplateId]);

  const loadInitialData = async () => {
    try {
      const res = await api.get("/invoices/form-options");
      const payload: InvoiceFormOptionsResponse = res.data;

      setBranch(payload?.branch || null);
      setCustomers(Array.isArray(payload?.customers) ? payload.customers : []);
      setServices(Array.isArray(payload?.services) ? payload.services : []);
      setSalesPersons(Array.isArray(payload?.sales_persons) ? payload.sales_persons : []);
      setAssistantSalesPersons(Array.isArray(payload?.assistant_sales_persons) ? payload.assistant_sales_persons : []);
      setContractTemplates(Array.isArray(payload?.contract_templates) ? payload.contract_templates : []);
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
        assistantSalesPersonId: invoice.assistant_sales_person_id ? String(invoice.assistant_sales_person_id) : "",
        contractTemplateId: invoice.contract_template_id ? String(invoice.contract_template_id) : "",
        paymentMethod: invoice.payment_method || "",
        discountType: invoice.discount_type || "",
        discountValue: invoice.discount_value ? String(invoice.discount_value) : "",
      });

      if (Array.isArray(invoice.items) && invoice.items.length > 0) {
        setItems(
          invoice.items.map((item: any) => ({
            service_id: item.service_id ? String(item.service_id) : "",
            name: item.name || "",
            price: item.line_total !== null && item.line_total !== undefined
              ? String(item.line_total)
              : item.price !== null && item.price !== undefined
              ? String(item.price)
              : "",
          }))
        );
      }

      if (invoice.branch) {
        setBranch({
          id: invoice.branch.id,
          name: invoice.branch.name,
        });
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load invoice");
      navigate("/dashboard/invoices");
    } finally {
      setLoading(false);
    }
  };

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = Number(item.price || 0);
      return sum + price;
    }, 0);
  }, [items]);

  const discountAmount = useMemo(() => {
    const value = Number(form.discountValue || 0);
    if (form.discountType === "percent") {
      return Math.min(100, Math.max(0, value)) * subtotal / 100;
    }
    if (form.discountType === "amount") {
      return Math.min(subtotal, Math.max(0, value));
    }
    return 0;
  }, [form.discountType, form.discountValue, subtotal]);

  const total = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount]);

  const handleItemChange = (index: number, key: keyof InvoiceItemForm, value: string) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };

      if (key === "service_id") {
        const service = services.find((item) => String(item.id) === value);
        if (service) {
          next[index].name = service.name;
          next[index].price = String(service.price ?? "");
        }
      }

      return next;
    });
  };

  const getServiceOptionsForRow = (index: number) => {
    const currentServiceId = Number(items[index]?.service_id || 0);

    return availableServices.filter((service) => {
      if (service.id === currentServiceId) return true;
      return !selectedServiceIds.includes(service.id);
    });
  };

  const handleContractTemplateChange = (templateId: string) => {
    const template = contractTemplates.find((item) => String(item.id) === templateId);
    const templateServices = getTemplateServices(template, services);
    const allowedServiceIds = new Set(templateServices.map((service) => service.id));

    setForm((prev) => ({ ...prev, contractTemplateId: templateId }));
    setItems((prev) => {
      if (!templateId) {
        return [emptyItem()];
      }

      const filtered = prev
        .filter((item) => !item.service_id || allowedServiceIds.has(Number(item.service_id)))
        .map((item) => {
          if (!item.service_id) return item;

          const service = templateServices.find((option) => option.id === Number(item.service_id));
          if (!service) return emptyItem();

          return {
            service_id: String(service.id),
            name: service.name,
            price: String(service.price ?? ""),
          };
        });

      return filtered.length > 0 ? filtered : [emptyItem()];
    });
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const validateForm = (): boolean => {
    if (!branch?.id) {
      toast.error("Branch is required for invoice creation");
      return false;
    }
    if (!form.contractTemplateId) {
      toast.error("Contract template is required");
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
    const duplicateServiceExists = new Set(selectedServiceIds).size !== selectedServiceIds.length;
    if (duplicateServiceExists) {
      toast.error("The same service cannot be added more than once");
      return false;
    }
    const invalidItem = items.find(
      (item) =>
        !item.service_id ||
        !item.name.trim() ||
        Number(item.price) < 0 ||
        !item.price
    );
    if (invalidItem) {
      toast.error("Each item must be selected from the contract template services");
      return false;
    }
    return true;
  };

  const buildPayload = (): InvoicePayload => ({
    customer_id: form.customerId ? Number(form.customerId) : null,
    sales_person_id: form.salesPersonId ? Number(form.salesPersonId) : null,
    assistant_sales_person_id: form.assistantSalesPersonId ? Number(form.assistantSalesPersonId) : null,
    contract_template_id: form.contractTemplateId ? Number(form.contractTemplateId) : null,
    payment_method: form.paymentMethod || null,
    discount_type: form.discountType || null,
    discount_value: form.discountValue ? Number(form.discountValue) : 0,
  });

  const handleSave = async (moveToPreview: boolean) => {
    if (!validateForm()) return;

    const payload = buildPayload();
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });
    formData.append("items", JSON.stringify(items));
    if (paymentEvidence) {
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

      if (invoiceId && moveToPreview) {
        await api.post(`/invoices/${invoiceId}/preview`);
        navigate(`/dashboard/invoices/${invoiceId}/preview`);
        return;
      }

      toast.success("Invoice saved as draft");
      if (invoiceId && !isEdit) {
        navigate(`/dashboard/invoices/${invoiceId}/edit`);
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
        {isEdit ? "Edit Invoice" : "Create Invoice"}
      </h1>

      {/* Branch Info */}
      <div className="mb-6 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Branch</div>
        <div className="text-gray-800 dark:text-gray-200 font-medium">{branch?.name || "No branch assigned"}</div>
      </div>

      {/* Customer */}
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
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.first_name} {customer.last_name} ({customer.email})
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
          <label className="block mb-1 text-sm font-medium dark:text-gray-300">Payment Method</label>
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
            {salesPersons.map((person) => (
              <option key={person.id} value={person.id}>
                {person.first_name} {person.last_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium dark:text-gray-300">Assistant Sales Person</label>
          <select
            value={form.assistantSalesPersonId}
            onChange={(e) => setForm((prev) => ({ ...prev, assistantSalesPersonId: e.target.value }))}
            className="w-full border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select assistant</option>
            {assistantSalesPersons.map((person) => (
              <option key={person.id} value={person.id}>
                {person.first_name} {person.last_name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block mb-1 text-sm font-medium dark:text-gray-300">Contract Template</label>
          <select
            value={form.contractTemplateId}
            onChange={(e) => handleContractTemplateChange(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select template</option>
            {contractTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          {form.contractTemplateId && availableServices.length === 0 && (
            <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
              No services are linked to the selected contract template.
            </p>
          )}
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium dark:text-gray-300">Payment Evidence</label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setPaymentEvidence(e.target.files?.[0] || null)}
            className="w-full border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200"
          />
        </div>
      </div>

      {/* Items */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold dark:text-gray-200">Services / Items</h2>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white dark:bg-gray-700 disabled:opacity-50"
            disabled={!canAddMoreItems}
          >
            <Plus size={16} /> Add Item
          </button>
        </div>
        {!selectedContractTemplate && (
          <p className="mb-3 text-sm text-amber-600 dark:text-amber-400">
            Select a contract template first. Services / items will come from that template only.
          </p>
        )}
        {selectedContractTemplate && availableServices.length > 0 && hasIncompleteItem && (
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
            Select a service first, then you can add another item.
          </p>
        )}
        {selectedContractTemplate && availableServices.length > 0 && !hasIncompleteItem && !canAddMoreItems && (
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
            All services linked to this contract template have already been selected.
          </p>
        )}

        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="min-w-full text-base bg-white dark:bg-gray-900">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">Service</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">Price</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-700">
                    <select
                      value={item.service_id}
                      onChange={(e) => handleItemChange(index, "service_id", e.target.value)}
                      className="w-full border px-2 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!selectedContractTemplate}
                    >
                      <option value="">Select service</option>
                      {getServiceOptionsForRow(index).map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-700">
                    <input
                      type="text"
                      value={item.name}
                      readOnly
                      placeholder="Auto-filled from selected service"
                      className="w-full border px-2 py-2 rounded-lg text-base bg-gray-50 dark:bg-gray-800 dark:text-gray-200 focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-700">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.price}
                      readOnly
                      placeholder="Auto-filled"
                      className="w-full border px-2 py-2 rounded-lg text-base bg-gray-50 dark:bg-gray-800 dark:text-gray-200 focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      disabled={items.length === 1}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Discounts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div>
          <label className="block mb-1 text-sm font-medium dark:text-gray-300">Discount Type</label>
          <select
            value={form.discountType}
            onChange={(e) => setForm((prev) => ({ ...prev, discountType: e.target.value, discountValue: "" }))}
            className="w-full border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No discount</option>
            <option value="amount">Amount</option>
            <option value="percent">Percent</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium dark:text-gray-300">Discount Value</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.discountValue}
            onChange={(e) => setForm((prev) => ({ ...prev, discountValue: e.target.value }))}
            className="w-full border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!form.discountType}
          />
        </div>
        <div className="flex flex-col justify-center text-gray-700 dark:text-gray-300">
          <div>Subtotal: ${subtotal.toFixed(2)}</div>
          <div>Discount: -${discountAmount.toFixed(2)}</div>
          <div className="font-semibold text-gray-900 dark:text-gray-100">Total: ${total.toFixed(2)}</div>
        </div>
      </div>

      {/* Contract Template */}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => handleSave(false)}
          className="px-6 py-3 rounded-lg border dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          disabled={saving}
        >
          Save Draft
        </button>
        <button
          type="button"
          onClick={() => handleSave(true)}
          className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save & Preview"}
        </button>
      </div>

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
                onChange={(e) => setCustomerForm((prev) => ({ ...prev, first_name: e.target.value }))}
                className="w-full border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200"
              />
              <input
                type="text"
                placeholder="Last name"
                value={customerForm.last_name}
                onChange={(e) => setCustomerForm((prev) => ({ ...prev, last_name: e.target.value }))}
                className="w-full border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200"
              />
              <input
                type="email"
                placeholder="Email"
                value={customerForm.email}
                onChange={(e) => setCustomerForm((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full border px-3 py-2 rounded-lg text-base dark:bg-gray-700 dark:text-gray-200"
              />
              <input
                type="text"
                placeholder="Phone"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm((prev) => ({ ...prev, phone: e.target.value }))}
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
