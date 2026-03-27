import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { ScrollToTop } from "./components/common/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import RootRedirect from "./components/RootRedirect";

// Route-level code splitting for faster initial load.
const SignIn = lazy(() => import("./pages/AuthPages/SignIn"));
const SignUp = lazy(() => import("./pages/AuthPages/SignUp"));
const ForgotPassword = lazy(() => import("./pages/AuthPages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/AuthPages/ResetPassword"));
const NotFound = lazy(() => import("./pages/OtherPage/NotFound"));

const UserProfiles = lazy(() => import("./pages/UserProfiles"));
const Videos = lazy(() => import("./pages/UiElements/Videos"));
const Images = lazy(() => import("./pages/UiElements/Images"));
const Alerts = lazy(() => import("./pages/UiElements/Alerts"));
const Badges = lazy(() => import("./pages/UiElements/Badges"));
const Avatars = lazy(() => import("./pages/UiElements/Avatars"));
const Buttons = lazy(() => import("./pages/UiElements/Buttons"));

const LineChart = lazy(() => import("./pages/Charts/LineChart"));
const BarChart = lazy(() => import("./pages/Charts/BarChart"));
const Calendar = lazy(() => import("./pages/Calendar"));
const BasicTables = lazy(() => import("./pages/Tables/BasicTables"));
const FormElements = lazy(() => import("./pages/Forms/FormElements"));
const Blank = lazy(() => import("./pages/Blank"));

const AppLayout = lazy(() => import("./layout/AppLayout"));
const Home = lazy(() => import("./pages/Dashboard/Home"));

const AdminUsers = lazy(() => import("./pages/Admin/AdminUsers"));
const AdminUserForm = lazy(() => import("./pages/Admin/AdminUserForm"));

const Profile = lazy(() => import("./pages/Profile/EditProfile"));

const Introduction = lazy(() => import("./pages/User/pages/Introduction"));
const MyReport = lazy(() => import("./pages/User/pages/MyReport.tsx"));
const IndustryData = lazy(() => import("./pages/User/pages/IndustryData.tsx"));

const Report = lazy(() => import("./pages/Admin/Report/Report.tsx"));
const ReportDetails = lazy(() => import("./pages/Admin/Report/ReportDetails.tsx"));


const BranchBoards = lazy(() => import("./pages/Branch/BranchBoards.tsx"));
const BoardsPage = lazy(() => import("./pages/Branch/BoardsPage.tsx"));

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

        {/* ================= PUBLIC ROUTES ================= */}

        <Route path="/" element={<RootRedirect />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ================= USER ROUTES ================= */}

        <Route
          path="/industry-data"
          element={
            <ProtectedRoute>
              <IndustryData />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-report"
          element={
            <ProtectedRoute>
              <MyReport />
            </ProtectedRoute>
          }
        />

        <Route
          path="/introduction"
          element={
            <ProtectedRoute>
              <Introduction />
            </ProtectedRoute>
          }
        />

        {/* ================= PUBLIC / SEMI PUBLIC ================= */}

        <Route path="/branch/:branchId" element={<BranchBoards />} />
        <Route path="/boards" element={<BoardsPage />} />

        <Route path="/invoice/:token" element={<InvoicePublic />} />

        {/* ================= ADMIN DASHBOARD (LAYOUT) ================= */}

        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >

          <Route index element={<Home />} />

          <Route path="profile" element={<UserProfiles />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="blank" element={<Blank />} />

          <Route path="form-elements" element={<FormElements />} />
          <Route path="basic-tables" element={<BasicTables />} />

          <Route path="alerts" element={<Alerts />} />
          <Route path="avatars" element={<Avatars />} />
          <Route path="badges" element={<Badges />} />
          <Route path="buttons" element={<Buttons />} />
          <Route path="images" element={<Images />} />
          <Route path="videos" element={<Videos />} />

          <Route path="line-chart" element={<LineChart />} />
          <Route path="bar-chart" element={<BarChart />} />

          {/* ===== USERS ===== */}

          <Route path="admin-users" element={<AdminUsers />} />
          <Route path="admin-users/add" element={<AdminUserForm />} />
          <Route path="admin-users/:id/edit" element={<AdminUserForm />} />

          {/* ===== REPORTS ===== */}

          <Route path="report" element={<Report />} />
          <Route path="users-report" element={<Report />} />
          <Route path="reports/:id" element={<ReportDetails />} />

          {/* ===== DATA MANAGEMENT ===== */}

          <Route path="customers" element={<Customers />} />
          <Route path="sales-persons" element={<SalesPersons />} />
          <Route path="assistant-sales-persons" element={<AssistantSalesPersons />} />
          <Route path="services" element={<Services />} />
          <Route path="contract-templates" element={<ContractTemplates />} />
          <Route path="branches" element={<Branches />} />

          {/* ===== INVOICES ===== */}

          <Route path="invoices" element={<Invoices />} />
          <Route path="invoices/create" element={<InvoiceForm />} />
          <Route path="invoices/:id/edit" element={<InvoiceForm />} />
          <Route path="invoices/:id/preview" element={<InvoicePreview />} />

          <Route path="*" element={<NotFound />} />

        </Route>

        {/* ================= NOT FOUND ================= */}

        <Route path="*" element={<NotFound />} />

      </Routes>
      </Suspense>
    </Router>
  );
}
