import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

function MainLayout() {
  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <div className="print:hidden">
        <Sidebar />
      </div>

      {/* Main Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="print:hidden">
          <Header />
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-7 print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;