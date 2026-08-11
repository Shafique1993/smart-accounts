import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

function Header() {
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout Error:", error);

      alert(
        error?.message ||
          "Failed to logout."
      );
    }
  }

  return (
    <header
      style={{
        height: "70px",
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 25px",
      }}
    >
      <div>
        <h1
          style={{
            fontSize: "22px",
            fontWeight: "700",
            color: "#111827",
            margin: 0,
          }}
        >
          Smart Accounts
        </h1>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        style={{
          background: "#dc2626",
          color: "#ffffff",
          border: "none",
          padding: "10px 18px",
          borderRadius: "8px",
          fontWeight: "600",
          cursor: "pointer",
        }}
      >
        Logout
      </button>
    </header>
  );
}

export default Header;