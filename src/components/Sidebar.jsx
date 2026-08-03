import { NavLink } from "react-router-dom";

const menuItems = [
  { name: "Dashboard", path: "/", icon: "🏠" },
  { name: "Income", path: "/income", icon: "💰" },
  { name: "Expense", path: "/expense", icon: "💸" },
  { name: "Accounts", path: "/accounts", icon: "🏦" },
  { name: "Ledger", path: "/ledger", icon: "📒" },
  { name: "Reports", path: "/reports", icon: "📊" },
  { name: "Settings", path: "/settings", icon: "⚙" },
];

function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-blue-400">
          Smart Accounts
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Personal Accounting
        </p>
      </div>

      <nav className="flex-1 p-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700 text-center text-xs text-slate-500">
        Smart Accounts v1.0
      </div>
    </aside>
  );
}

export default Sidebar;