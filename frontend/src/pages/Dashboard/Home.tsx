import { Link } from "react-router-dom";
import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import PageMeta from "../../components/common/PageMeta";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Connected Invoice System"
        description="Connected Invoice System dashboard"
      />

      <section className="mb-8 rounded-[28px] border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-sky-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/78 dark:bg-none">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-0">
              Admin dashboard
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-[2.3rem]">
              Invoice operations at a glance
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
              Use this dashboard to move between invoices, approvals, and reporting with the same
              clean blue panel style used across the updated admin invoice screens.
            </p>
          </div>

          <Link
            to="/dashboard/invoices"
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Open invoices
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-12 gap-3 md:gap-6">
        <div className="col-span-12 space-y-10 xl:col-span-9">
          <EcommerceMetrics />
        </div>
      </div>
    </>
  );
}
