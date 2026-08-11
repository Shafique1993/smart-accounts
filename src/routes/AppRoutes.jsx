import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { supabase } from "../lib/supabase";

import MainLayout from "../components/layout/MainLayout";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Accounts from "../pages/Accounts";
import Transactions from "../pages/Transactions";
import Ledger from "../pages/Ledger";
import GeneralLedger from "../pages/GeneralLedger";
import Reports from "../pages/Reports";
import Settings from "../pages/Settings";
import Vouchers from "../pages/Vouchers";
import AccountingPeriods from "../pages/AccountingPeriods";

function AppRoutes() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function getSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted) {
        setSession(session);
        setLoading(false);
      }
    }

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-lg font-semibold">
          Loading Smart Accounts...
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>

        {/* LOGIN */}
        <Route
          path="/login"
          element={
            session ? (
              <Navigate to="/" replace />
            ) : (
              <Login />
            )
          }
        />

        {/* PROTECTED APPLICATION */}
        <Route
          path="/"
          element={
            session ? (
              <MainLayout />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route
            index
            element={<Dashboard />}
          />

          <Route
            path="accounts"
            element={<Accounts />}
          />

          <Route
            path="vouchers"
            element={<Vouchers />}
          />

          <Route
            path="transactions"
            element={<Transactions />}
          />

          <Route
            path="ledger"
            element={<Ledger />}
          />

          <Route
            path="general-ledger"
            element={<GeneralLedger />}
          />

          <Route
            path="reports"
            element={<Reports />}
          />

          <Route
            path="settings"
            element={<Settings />}
          />

          <Route
            path="accounting-periods"
            element={<AccountingPeriods />}
          />
        </Route>

        {/* UNKNOWN URL */}
        <Route
          path="*"
          element={
            <Navigate
              to={session ? "/" : "/login"}
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;