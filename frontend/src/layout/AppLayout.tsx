import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import Footer from "../components/footer/Footer"; // import your footer

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen flex-col bg-transparent text-slate-900 transition-colors dark:text-slate-100 xl:flex">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[300px]" : "lg:ml-[96px]"
        } ${isMobileOpen ? "ml-0" : ""} flex flex-col`}
      >
        <AppHeader />
        <div className="mx-auto flex-1 w-full max-w-[1600px] px-4 pb-8 pt-4 md:px-6 md:pb-10 md:pt-5">
          <Outlet />
        </div>

        {/* Footer only for AppLayout */}
        <Footer />
      </div>
    </div>
  );
};


const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
