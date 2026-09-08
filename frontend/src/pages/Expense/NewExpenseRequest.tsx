import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import {
  ArrowLeft,
  Banknote,
  ChevronDown,
  Landmark,
  ListChecks,
  Plus,
  Smartphone,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ExpenseCategoryItem, PaymentPreference } from "./types";

const PAYMENT_OPTIONS: { value: PaymentPreference; label: string; icon: typeof Banknote }[] = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "bank", label: "Bank", icon: Landmark },
  { value: "bkash", label: "bKash", icon: Smartphone },
  { value: "nagad", label: "Nagad", icon: Smartphone },
];

interface ItemRow {
  name: string;
  price: string;
}

interface CategoryGroup {
  category_id: string;
  items: ItemRow[];
}

const EMPTY_ITEM: ItemRow = { name: "", price: "" };
const EMPTY_GROUP = (): CategoryGroup => ({ category_id: "", items: [{ ...EMPTY_ITEM }] });

const formatBdt = (value: number) =>
  value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function NewExpenseRequest() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const [categories, setCategories] = useState<ExpenseCategoryItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEditMode);

  const [form, setForm] = useState({
    groups: [EMPTY_GROUP()] as CategoryGroup[],
    purpose: "",
    payment_preference: "" as PaymentPreference | "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusTarget, setFocusTarget] = useState<{ group: number; item: number } | null>(null);

  // Refs are keyed "groupIndex-itemIndex" so focus can be moved precisely
  // across groups when items are added/removed.
  const nameInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const priceInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    api
      .get("/expense/categories")
      .then((res) => {
        const active = (Array.isArray(res.data) ? res.data : []).filter((c: ExpenseCategoryItem) => c.is_active);
        setCategories(active);
      })
      .catch(() => toast.error("Failed to load categories"));
  }, []);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/expense/requests/${id}`)
      .then((res) => {
        const request = res.data;
        if (request.status !== "submitted") {
          toast.error("This request can no longer be edited");
          navigate("/dashboard/expense/my-requests");
          return;
        }

        const rawItems: { category_id: number; name: string; price: number }[] =
          Array.isArray(request.items) && request.items.length > 0
            ? request.items
            : [{ category_id: request.category?.id ?? 0, name: "", price: request.amount ?? 0 }];

        // Fold the flat item list back into category groups, in the order
        // each category first appears.
        const groups: CategoryGroup[] = [];
        const groupByCategory = new Map<number, CategoryGroup>();
        rawItems.forEach((item) => {
          let group = groupByCategory.get(item.category_id);
          if (!group) {
            group = { category_id: String(item.category_id || ""), items: [] };
            groupByCategory.set(item.category_id, group);
            groups.push(group);
          }
          group.items.push({ name: item.name ?? "", price: String(item.price ?? "") });
        });

        setForm({
          groups: groups.length > 0 ? groups : [EMPTY_GROUP()],
          purpose: request.purpose ?? "",
          payment_preference: request.payment_preference ?? "",
        });
      })
      .catch(() => {
        toast.error("Failed to load request");
        navigate("/dashboard/expense/my-requests");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // After an item is added (button click or pressing Enter in the last
  // price field of a group), move focus straight into its name field.
  useEffect(() => {
    if (focusTarget) {
      nameInputRefs.current[`${focusTarget.group}-${focusTarget.item}`]?.focus();
      setFocusTarget(null);
    }
  }, [focusTarget]);

  const filledGroups = form.groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.name.trim() || item.price.trim()),
    }))
    .filter((group) => group.category_id || group.items.length > 0);

  const itemCount = filledGroups.reduce((sum, group) => sum + group.items.length, 0);
  const totalAmount = form.groups.reduce(
    (sum, group) => sum + group.items.reduce((s, item) => s + (Number(item.price) || 0), 0),
    0,
  );

  const setGroupCategory = (groupIndex: number, categoryId: string) => {
    setForm((prev) => ({
      ...prev,
      groups: prev.groups.map((g, i) => (i === groupIndex ? { ...g, category_id: categoryId } : g)),
    }));
    if (errors.items) setErrors((prev) => ({ ...prev, items: "" }));
  };

  const updateItem = (groupIndex: number, itemIndex: number, patch: Partial<ItemRow>) => {
    setForm((prev) => ({
      ...prev,
      groups: prev.groups.map((g, gi) =>
        gi === groupIndex
          ? { ...g, items: g.items.map((it, ii) => (ii === itemIndex ? { ...it, ...patch } : it)) }
          : g,
      ),
    }));
    if (errors.items) setErrors((prev) => ({ ...prev, items: "" }));
  };

  const addItem = (groupIndex: number) => {
    const newItemIndex = form.groups[groupIndex].items.length;
    setForm((prev) => ({
      ...prev,
      groups: prev.groups.map((g, gi) => (gi === groupIndex ? { ...g, items: [...g.items, { ...EMPTY_ITEM }] } : g)),
    }));
    setFocusTarget({ group: groupIndex, item: newItemIndex });
  };

  const removeItem = (groupIndex: number, itemIndex: number) => {
    setForm((prev) => ({
      ...prev,
      groups: prev.groups.map((g, gi) =>
        gi === groupIndex ? { ...g, items: g.items.length === 1 ? g.items : g.items.filter((_, ii) => ii !== itemIndex) } : g,
      ),
    }));
  };

  const addGroup = () => {
    const newGroupIndex = form.groups.length;
    setForm((prev) => ({ ...prev, groups: [...prev.groups, EMPTY_GROUP()] }));
    setFocusTarget({ group: newGroupIndex, item: 0 });
  };

  const removeGroup = (groupIndex: number) => {
    setForm((prev) => ({
      ...prev,
      groups: prev.groups.length === 1 ? prev.groups : prev.groups.filter((_, i) => i !== groupIndex),
    }));
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, groupIndex: number, itemIndex: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      priceInputRefs.current[`${groupIndex}-${itemIndex}`]?.focus();
    }
  };

  const handlePriceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, groupIndex: number, itemIndex: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const group = form.groups[groupIndex];
      if (itemIndex === group.items.length - 1) {
        addItem(groupIndex);
      } else {
        nameInputRefs.current[`${groupIndex}-${itemIndex + 1}`]?.focus();
      }
    }
  };

  const validate = () => {
    const next: Record<string, string> = {};

    if (filledGroups.length === 0) {
      next.items = "Add at least one category with an item name and price.";
    } else if (filledGroups.some((group) => !group.category_id || group.items.length === 0)) {
      next.items = "Every category needs at least one item.";
    } else if (
      filledGroups.some((group) => group.items.some((item) => !item.name.trim() || !(Number(item.price) > 0)))
    ) {
      next.items = "Every item needs a name and a price greater than 0.";
    }

    if (!form.purpose.trim()) next.purpose = "Purpose is required.";
    if (!form.payment_preference) next.payment_preference = "Select a payment preference.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        items: filledGroups.flatMap((group) =>
          group.items.map((item) => ({
            category_id: Number(group.category_id),
            name: item.name.trim(),
            price: Number(item.price),
          })),
        ),
        purpose: form.purpose,
        payment_preference: form.payment_preference,
      };

      if (isEditMode) {
        await api.put(`/expense/requests/${id}`, payload);
      } else {
        await api.post("/expense/requests", payload);
      }

      navigate("/dashboard/expense/my-requests", {
        state: {
          message: isEditMode ? "Payment request updated successfully!" : "Payment request submitted successfully!",
          type: "success",
        },
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-slate-500">Loading...</div>;
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="colored" />

      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-medium">Back</span>
      </button>

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5 dark:border-slate-800 sm:px-8">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <Wallet size={20} />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {isEditMode ? "Edit Payment Request" : "New Payment Request"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isEditMode ? "Update your request before Finance reviews it." : "Submit an expense for Finance review."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6 sm:px-8">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Items</label>
              {itemCount > 0 && (
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                  {itemCount} item{itemCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <p className="mb-2 text-xs text-slate-400 dark:text-slate-500">
              Pick a category, add as many items as you like under it, then add another category if needed (e.g.
              Fruit + Vegetable for a market run).
            </p>

            <div className="space-y-3">
              {form.groups.map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-900/30"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div className="relative flex-1">
                      <select
                        value={group.category_id}
                        onChange={(e) => setGroupCategory(groupIndex, e.target.value)}
                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm font-medium text-slate-800 shadow-none focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-500/20"
                      >
                        <option value="">Select category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeGroup(groupIndex)}
                      disabled={form.groups.length === 1}
                      className="shrink-0 rounded-full p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-0 dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                      title="Remove this category"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {group.items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2 pl-3 transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:focus-within:border-blue-500 dark:focus-within:ring-blue-500/20 dark:hover:border-slate-700"
                      >
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          {itemIndex + 1}
                        </span>

                        <input
                          ref={(el) => {
                            nameInputRefs.current[`${groupIndex}-${itemIndex}`] = el;
                          }}
                          type="text"
                          placeholder="Item name"
                          value={item.name}
                          onChange={(e) => updateItem(groupIndex, itemIndex, { name: e.target.value })}
                          onKeyDown={(e) => handleNameKeyDown(e, groupIndex, itemIndex)}
                          className="min-w-0 flex-1 border-0 bg-transparent p-0 py-1.5 text-sm text-slate-900 shadow-none placeholder:text-slate-400 focus:border-0 focus:shadow-none focus:outline-none focus:ring-0 dark:text-slate-100 dark:placeholder:text-slate-500"
                        />

                        <div className="flex shrink-0 items-center gap-1 border-l border-slate-100 pl-2.5 dark:border-slate-800">
                          <input
                            ref={(el) => {
                              priceInputRefs.current[`${groupIndex}-${itemIndex}`] = el;
                            }}
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={item.price}
                            onChange={(e) => updateItem(groupIndex, itemIndex, { price: e.target.value })}
                            onKeyDown={(e) => handlePriceKeyDown(e, groupIndex, itemIndex)}
                            className="w-20 border-0 bg-transparent p-0 py-1.5 text-right text-sm font-medium text-slate-900 shadow-none placeholder:font-normal placeholder:text-slate-400 focus:border-0 focus:shadow-none focus:outline-none focus:ring-0 dark:text-slate-100 dark:placeholder:text-slate-500 sm:w-24"
                          />
                          <span className="text-xs font-medium text-slate-400">BDT</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(groupIndex, itemIndex)}
                          disabled={group.items.length === 1}
                          className="shrink-0 rounded-full p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-0 dark:text-slate-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => addItem(groupIndex)}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-2 text-xs font-medium text-slate-500 transition hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-blue-500/60 dark:hover:bg-blue-500/5 dark:hover:text-blue-400"
                  >
                    <Plus size={14} /> Add Item to this category
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addGroup}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-slate-300 py-2.5 text-sm font-medium text-slate-500 transition hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-blue-500/60 dark:hover:bg-blue-500/5 dark:hover:text-blue-400"
            >
              <Plus size={16} /> Add Category
            </button>

            {errors.items && <p className="mt-1.5 text-sm text-red-500">{errors.items}</p>}

            <div className="mt-3 flex items-center justify-between rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3.5 dark:from-blue-500/10 dark:to-indigo-500/10">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                <ListChecks size={16} className="text-blue-500 dark:text-blue-400" />
                Total Amount
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {formatBdt(totalAmount)} <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">BDT</span>
              </span>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Payment Preference
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PAYMENT_OPTIONS.map((option) => {
                const Icon = option.icon;
                const selected = form.payment_preference === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setForm({ ...form, payment_preference: option.value })}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-medium transition ${
                      selected
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-500/10 dark:text-blue-400"
                        : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon size={18} />
                    {option.label}
                  </button>
                );
              })}
            </div>
            {errors.payment_preference && <p className="mt-1 text-sm text-red-500">{errors.payment_preference}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Purpose</label>
            <textarea
              rows={4}
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 dark:bg-slate-900 dark:text-slate-100 ${
                errors.purpose
                  ? "border-red-400 focus:ring-red-400"
                  : "border-slate-200 focus:ring-blue-500 dark:border-slate-700"
              }`}
              placeholder="Explain what this expense is for"
            />
            {errors.purpose && <p className="mt-1 text-sm text-red-500">{errors.purpose}</p>}
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
            <button
              type="button"
              onClick={() => navigate("/dashboard/expense/my-requests")}
              className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Saving..." : isEditMode ? "Save Changes" : "Submit Request"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
