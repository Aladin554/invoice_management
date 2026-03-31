import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { ScrollToTop } from "./components/common/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import RootRedirect from "./components/RootRedirect";

const SignIn = lazy(() => import("./pages/AuthPages/SignIn"));
const ForgotPassword = lazy(() => import("./pages/AuthPages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/AuthPages/ResetPassword"));
const NotFound = lazy(() => import("./pages/OtherPage/NotFound"));

const AppLayout = lazy(() => import("./layout/AppLayout"));
const Home = lazy(() => import("./pages/Dashboard/Home"));
const Profile = lazy(() => import("./pages/Profile/EditProfile"));

const AdminUsers = lazy(() => import("./pages/Admin/AdminUsers"));
const AdminUserForm = lazy(() => import("./pages/Admin/AdminUserForm"));
const Report = lazy(() => import("./pages/Admin/Report/Report.tsx"));
const ReportDetails = lazy(() => import("./pages/Admin/Report/ReportDetails.tsx"));

const Customers = lazy(() => import("./pages/Admin/DataManagement/Customers.tsx"));
const SalesPersons = lazy(() => import("./pages/Admin/DataManagement/SalesPersons.tsx"));
const AssistantSalesPersons = lazy(
  () => import("./pages/Admin/DataManagement/AssistantSalesPersons.tsx")
);
const Services = lazy(() => import("./pages/Admin/DataManagement/Services.tsx"));
const ContractTemplates = lazy(() => import("./pages/Admin/DataManagement/ContractTemplates.tsx"));
const Branches = lazy(() => import("./pages/Admin/DataManagement/Branches.tsx"));

const Invoices = lazy(() => import("./pages/Invoices/Invoices.tsx"));
const InvoiceForm = lazy(() => import("./pages/Invoices/InvoiceForm.tsx"));
const InvoicePreview = lazy(() => import("./pages/Invoices/InvoicePreview.tsx"));
const InvoicePublic = lazy(() => import("./pages/Public/InvoicePublic.tsx"));

export default function App() {
  return (
    <Router>
      <ScrollToTop />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar
        toastStyle={{ zIndex: 100000 }}
      />

      <Suspense fallback={<div className="p-6 text-sm text-gray-500">Loading...</div>}>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route path="/invoice/:token" element={<InvoicePublic />} />

          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />

            <Route path="admin-users" element={<AdminUsers />} />
            <Route path="admin-users/add" element={<AdminUserForm />} />
            <Route path="admin-users/:id/edit" element={<AdminUserForm />} />

            <Route path="report" element={<Report />} />
            <Route path="users-report" element={<Report />} />
            <Route path="reports/:id" element={<ReportDetails />} />

            <Route path="customers" element={<Customers />} />
            <Route path="sales-persons" element={<SalesPersons />} />
            <Route path="assistant-sales-persons" element={<AssistantSalesPersons />} />
            <Route path="services" element={<Services />} />
            <Route path="contract-templates" element={<ContractTemplates />} />
            <Route path="branches" element={<Branches />} />

            <Route path="invoices" element={<Invoices />} />
            <Route path="invoices/create" element={<InvoiceForm />} />
            <Route path="invoices/:id/edit" element={<InvoiceForm />} />
            <Route path="invoices/:id/preview" element={<InvoicePreview />} />

            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
