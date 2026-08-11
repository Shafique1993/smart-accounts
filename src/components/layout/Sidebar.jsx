import { NavLink } from "react-router-dom";

const menus = [
  {
    title: "Dashboard",
    path: "/",
  },
  {
    title: "Accounts",
    path: "/accounts",
  },
  {
    title: "Vouchers",
    path: "/vouchers",
  },
  {
    title: "Transactions",
    path: "/transactions",
  },
  {
    title: "Ledger",
    path: "/ledger",
  },
  {
    title: "Reports",
    path: "/reports",
  },
  {
    title: "Accounting Periods",
    path: "/accounting-periods",
  },
  {
    title: "Settings",
    path: "/settings",
  },
];

function Sidebar() {
  return (
    <aside
      style={{
        width: "260px",
        background: "#0f172a",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
      }}
    >
      <div
        style={{
          padding: "24px",
          borderBottom: "1px solid #334155",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "24px",
          }}
        >
          Smart Accounts
        </h2>

        <p
          style={{
            marginTop: "6px",
            color: "#94a3b8",
            fontSize: "14px",
          }}
        >
          Personal ERP
        </p>
      </div>

      <nav
        style={{
          flex: 1,
          padding: "20px",
        }}
      >
        {menus.map((menu) => (
          <NavLink
            key={menu.path}
            to={menu.path}
            end={menu.path === "/"}
            style={({ isActive }) => ({
              display: "block",
              padding: "12px 16px",
              marginBottom: "10px",
              borderRadius: "8px",
              textDecoration: "none",
              color: "#fff",
              background: isActive
                ? "#2563eb"
                : "transparent",
              transition: "0.2s",
            })}
          >
            {menu.title}
          </NavLink>
        ))}
      </nav>

      <div
        style={{
          padding: "20px",
          borderTop: "1px solid #334155",
          fontSize: "12px",
          color: "#94a3b8",
          textAlign: "center",
        }}
      >
        Version 1.0
      </div>
    </aside>
  );
}

export default Sidebar;