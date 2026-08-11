import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function Dashboard() {
  const today = new Date().toISOString().slice(0, 10);

  const firstDayOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  )
    .toISOString()
    .slice(0, 10);

  const [fromDate, setFromDate] = useState(firstDayOfMonth);
  const [toDate, setToDate] = useState(today);

  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalAccounts, setTotalAccounts] = useState(0);

  const [totalAssets, setTotalAssets] = useState(0);
  const [totalLiabilities, setTotalLiabilities] = useState(0);
  const [totalEquity, setTotalEquity] = useState(0);

  const [cashBalance, setCashBalance] = useState(0);
  const [bankBalance, setBankBalance] = useState(0);

  const [recentTransactions, setRecentTransactions] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);

      const {
        data: accounts,
        error: accountError,
      } = await supabase
        .from("coa_accounts")
        .select(
          "id, account_code, account_name, account_type, opening_balance"
        )
        .eq("is_active", true);

      if (accountError) {
        throw accountError;
      }

      const {
        data: allDetails,
        error: detailsError,
      } = await supabase
        .from("voucher_details")
        .select(`
          id,
          ledger_id,
          debit,
          credit,
          remarks,
          vouchers (
            id,
            voucher_no,
            voucher_type,
            voucher_date,
            reference_no,
            narration
          ),
          coa_accounts (
            account_code,
            account_name,
            account_type
          )
        `);

      if (detailsError) {
        throw detailsError;
      }

      const accountList = accounts || [];
      const detailList = allDetails || [];

      setTotalAccounts(accountList.length);

      const filteredDetails = detailList.filter((row) => {
        const date = row.vouchers?.voucher_date;

        if (!date) return false;

        return (
          date >= fromDate &&
          date <= toDate
        );
      });

      setRecentTransactions(
        [...filteredDetails]
          .sort((a, b) => {
            const dateA =
              a.vouchers?.voucher_date || "";
            const dateB =
              b.vouchers?.voucher_date || "";

            return dateB.localeCompare(dateA);
          })
          .slice(0, 10)
      );

      /*
       * P&L
       */

      let income = 0;
      let expense = 0;

      filteredDetails.forEach((row) => {
        const account = accountList.find(
          (item) =>
            String(item.id) ===
            String(row.ledger_id)
        );

        if (!account) return;

        const type = String(
          account.account_type || ""
        ).toLowerCase();

        const debit = Number(row.debit || 0);
        const credit = Number(row.credit || 0);

        if (
          type === "income" ||
          type === "revenue"
        ) {
          income += credit - debit;
        }

        if (
          type === "expense" ||
          type === "expenses"
        ) {
          expense += debit - credit;
        }
      });

      /*
       * Balance Sheet
       *
       * Calculate from ALL transactions
       * up to selected To Date.
       */

      const balanceDetails = detailList.filter(
        (row) => {
          const date = row.vouchers?.voucher_date;

          return date && date <= toDate;
        }
      );

      let assets = 0;
      let liabilities = 0;
      let equity = 0;

      let cash = 0;
      let bank = 0;

      accountList.forEach((account) => {
        let balance = Number(
          account.opening_balance || 0
        );

        balanceDetails.forEach((row) => {
          if (
            String(row.ledger_id) ===
            String(account.id)
          ) {
            balance +=
              Number(row.debit || 0) -
              Number(row.credit || 0);
          }
        });

        const type = String(
          account.account_type || ""
        ).toLowerCase();

        const accountName = String(
          account.account_name || ""
        ).toLowerCase();

        const accountCode = String(
          account.account_code || ""
        ).toLowerCase();

        /*
         * Asset
         */

        if (
          type === "asset" ||
          type === "assets"
        ) {
          assets += balance;
        }

        /*
         * Liability
         */

        if (
          type === "liability" ||
          type === "liabilities"
        ) {
          liabilities -= balance;
        }

        /*
         * Equity
         */

        if (
          type === "equity" ||
          type === "capital"
        ) {
          equity -= balance;
        }

        /*
         * Cash
         */

        if (
          accountName.includes("cash") ||
          accountCode === "1001"
        ) {
          cash += balance;
        }

        /*
         * Bank
         */

        if (
          accountName.includes("bank") ||
          accountCode.startsWith("11")
        ) {
          bank += balance;
        }
      });

      /*
       * Current Period Profit
       */

      const netProfit =
        income - expense;

      /*
       * Closing Equity
       */

      const closingEquity =
        equity + netProfit;

      setTotalIncome(
        Math.max(0, income)
      );

      setTotalExpense(
        Math.max(0, expense)
      );

      setTotalAssets(
        Math.max(0, assets)
      );

      setTotalLiabilities(
        Math.max(0, liabilities)
      );

      setTotalEquity(
        closingEquity
      );

      setCashBalance(cash);
      setBankBalance(bank);
    } catch (error) {
      console.error(
        "Dashboard Error:",
        error
      );

      alert(
        error?.message ||
          "Failed to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleFilter() {
    if (
      fromDate &&
      toDate &&
      fromDate > toDate
    ) {
      alert(
        "From Date cannot be greater than To Date."
      );
      return;
    }

    loadDashboard();
  }

  function setThisMonth() {
    const now = new Date();

    const first = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    )
      .toISOString()
      .slice(0, 10);

    const last = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    )
      .toISOString()
      .slice(0, 10);

    setFromDate(first);
    setToDate(last);
  }

  function setLastMonth() {
    const now = new Date();

    const first = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    )
      .toISOString()
      .slice(0, 10);

    const last = new Date(
      now.getFullYear(),
      now.getMonth(),
      0
    )
      .toISOString()
      .slice(0, 10);

    setFromDate(first);
    setToDate(last);
  }

  function setThisYear() {
    const year =
      new Date().getFullYear();

    setFromDate(`${year}-01-01`);
    setToDate(`${year}-12-31`);
  }

  if (loading) {
    return (
      <div className="p-6">
        Loading Dashboard...
      </div>
    );
  }

  const netProfit =
    totalIncome - totalExpense;

  const balanceSheetTotal =
    totalLiabilities +
    totalEquity;

  const difference =
    totalAssets -
    balanceSheetTotal;

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}

      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-3xl font-bold">
            Dashboard
          </h1>

          <p className="text-gray-500 mt-1">
            Smart Accounts Overview
          </p>
        </div>

        <button
          type="button"
          onClick={loadDashboard}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
        >
          Refresh
        </button>

      </div>

      {/* DATE FILTER */}

      <div className="bg-white border rounded-xl shadow p-5">

        <div className="flex flex-wrap items-end gap-4">

          <div>
            <label className="block text-sm font-medium mb-1">
              From Date
            </label>

            <input
              type="date"
              value={fromDate}
              onChange={(e) =>
                setFromDate(e.target.value)
              }
              className="border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              To Date
            </label>

            <input
              type="date"
              value={toDate}
              onChange={(e) =>
                setToDate(e.target.value)
              }
              className="border rounded-lg px-3 py-2"
            />
          </div>

          <button
            type="button"
            onClick={handleFilter}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
          >
            Apply Filter
          </button>

          <button
            type="button"
            onClick={setThisMonth}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
          >
            This Month
          </button>

          <button
            type="button"
            onClick={setLastMonth}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
          >
            Last Month
          </button>

          <button
            type="button"
            onClick={setThisYear}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
          >
            This Year
          </button>

        </div>

      </div>

      {/* PROFIT & LOSS */}

      <div>

        <h2 className="text-xl font-bold mb-4">
          Profit & Loss
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          <div className="bg-white border rounded-xl shadow p-5">
            <p className="text-sm text-gray-500">
              Total Income
            </p>

            <h2 className="text-2xl font-bold text-green-600 mt-2">
              {totalIncome.toFixed(2)}
            </h2>
          </div>

          <div className="bg-white border rounded-xl shadow p-5">
            <p className="text-sm text-gray-500">
              Total Expense
            </p>

            <h2 className="text-2xl font-bold text-red-600 mt-2">
              {totalExpense.toFixed(2)}
            </h2>
          </div>

          <div className="bg-white border rounded-xl shadow p-5">
            <p className="text-sm text-gray-500">
              Net Profit / Loss
            </p>

            <h2
              className={`text-2xl font-bold mt-2 ${
                netProfit >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {netProfit.toFixed(2)}
            </h2>
          </div>

        </div>

      </div>

      {/* BALANCE SHEET */}

      <div>

        <h2 className="text-xl font-bold mb-4">
          Balance Sheet Summary
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          <div className="bg-white border rounded-xl shadow p-5">
            <p className="text-sm text-gray-500">
              Total Assets
            </p>

            <h2 className="text-2xl font-bold text-blue-600 mt-2">
              {totalAssets.toFixed(2)}
            </h2>
          </div>

          <div className="bg-white border rounded-xl shadow p-5">
            <p className="text-sm text-gray-500">
              Total Liabilities
            </p>

            <h2 className="text-2xl font-bold text-orange-600 mt-2">
              {totalLiabilities.toFixed(2)}
            </h2>
          </div>

          <div className="bg-white border rounded-xl shadow p-5">
            <p className="text-sm text-gray-500">
              Total Equity
            </p>

            <h2 className="text-2xl font-bold text-purple-600 mt-2">
              {totalEquity.toFixed(2)}
            </h2>
          </div>

        </div>

      </div>

      {/* BALANCE CHECK */}

      <div
        className={`border rounded-xl p-5 ${
          Math.abs(difference) < 0.01
            ? "bg-green-50 border-green-300"
            : "bg-red-50 border-red-300"
        }`}
      >

        <div className="flex justify-between items-center">

          <div>
            <p className="text-sm text-gray-500">
              Balance Sheet Check
            </p>

            <h3 className="text-xl font-bold mt-1">
              Assets = Liabilities + Equity
            </h3>
          </div>

          <div className="text-right">

            <p
              className={`font-bold ${
                Math.abs(difference) < 0.01
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {Math.abs(difference) < 0.01
                ? "BALANCED"
                : "NOT BALANCED"}
            </p>

            <p className="text-sm mt-1">
              Difference:{" "}
              {difference.toFixed(2)}
            </p>

          </div>

        </div>

      </div>

      {/* CASH / BANK */}

      <div>

        <h2 className="text-xl font-bold mb-4">
          Cash & Bank
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <div className="bg-white border rounded-xl shadow p-5">
            <p className="text-sm text-gray-500">
              Cash Balance
            </p>

            <h2 className="text-2xl font-bold mt-2">
              {cashBalance.toFixed(2)}
            </h2>
          </div>

          <div className="bg-white border rounded-xl shadow p-5">
            <p className="text-sm text-gray-500">
              Bank Balance
            </p>

            <h2 className="text-2xl font-bold mt-2">
              {bankBalance.toFixed(2)}
            </h2>
          </div>

        </div>

      </div>

      {/* RECENT TRANSACTIONS */}

      <div className="bg-white border rounded-xl shadow">

        <div className="p-5 border-b">

          <div className="flex justify-between items-center">

            <h2 className="text-xl font-bold">
              Recent Transactions
            </h2>

            <span className="text-sm text-gray-500">
              {fromDate} → {toDate}
            </span>

          </div>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full border-collapse">

            <thead>

              <tr className="bg-gray-100">

                <th className="border p-3 text-left">
                  Date
                </th>

                <th className="border p-3 text-left">
                  Voucher
                </th>

                <th className="border p-3 text-left">
                  Type
                </th>

                <th className="border p-3 text-left">
                  Ledger
                </th>

                <th className="border p-3 text-right">
                  Debit
                </th>

                <th className="border p-3 text-right">
                  Credit
                </th>

              </tr>

            </thead>

            <tbody>

              {recentTransactions.length === 0 ? (

                <tr>
                  <td
                    colSpan="6"
                    className="border p-6 text-center text-gray-500"
                  >
                    No transactions found
                    for this period.
                  </td>
                </tr>

              ) : (

                recentTransactions.map(
                  (row) => (

                    <tr key={row.id}>

                      <td className="border p-3">
                        {
                          row.vouchers
                            ?.voucher_date || "-"
                        }
                      </td>

                      <td className="border p-3">
                        {
                          row.vouchers
                            ?.voucher_no || "-"
                        }
                      </td>

                      <td className="border p-3">
                        {
                          row.vouchers
                            ?.voucher_type || "-"
                        }
                      </td>

                      <td className="border p-3">
                        {
                          row.coa_accounts
                            ?.account_code || ""
                        }
                        {" - "}
                        {
                          row.coa_accounts
                            ?.account_name || "-"
                        }
                      </td>

                      <td className="border p-3 text-right">
                        {Number(
                          row.debit || 0
                        ).toFixed(2)}
                      </td>

                      <td className="border p-3 text-right">
                        {Number(
                          row.credit || 0
                        ).toFixed(2)}
                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;