import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

function Reports() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [reportType, setReportType] = useState("trial-balance");

  const [asOfDate, setAsOfDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    loadReportData();
  }, []);

  async function loadReportData() {
    try {
      setLoading(true);

      const { data: accountData, error: accountError } =
        await supabase
          .from("coa_accounts")
          .select(`
            id,
            account_code,
            account_name,
            account_type,
            opening_balance,
            is_active
          `)
          .eq("is_active", true)
          .order("account_code", {
            ascending: true,
          });

      if (accountError) throw accountError;

      const { data: transactionData, error: transactionError } =
        await supabase
          .from("voucher_details")
          .select(`
            id,
            ledger_id,
            debit,
            credit,
            vouchers (
              voucher_date,
              voucher_no,
              voucher_type
            )
          `);

      if (transactionError) throw transactionError;

      setAccounts(accountData || []);
      setTransactions(transactionData || []);
    } catch (error) {
      console.error("Reports Error:", error);
      alert(error?.message || "Failed to load report data.");
    } finally {
      setLoading(false);
    }
  }

  function getAccountBalance(account) {
    let debit = 0;
    let credit = 0;

    const openingBalance = Number(account.opening_balance || 0);

    const type = String(account.account_type || "").toLowerCase();

    const isDebitNature =
      type === "asset" ||
      type === "expense" ||
      type === "expenses";

    if (openingBalance > 0) {
      if (isDebitNature) {
        debit += openingBalance;
      } else {
        credit += openingBalance;
      }
    } else if (openingBalance < 0) {
      if (isDebitNature) {
        credit += Math.abs(openingBalance);
      } else {
        debit += Math.abs(openingBalance);
      }
    }

    transactions.forEach((row) => {
      if (String(row.ledger_id) !== String(account.id)) {
        return;
      }

      const voucherDate = row.vouchers?.voucher_date;

      if (voucherDate && voucherDate > asOfDate) {
        return;
      }

      debit += Number(row.debit || 0);
      credit += Number(row.credit || 0);
    });

    return {
      debit,
      credit,
      balance: debit - credit,
    };
  }

  const accountBalances = useMemo(() => {
    return accounts.map((account) => ({
      ...account,
      ...getAccountBalance(account),
    }));
  }, [accounts, transactions, asOfDate]);

  /*
   * TRIAL BALANCE
   *
   * এখানে account-এর closing balance অনুযায়ী
   * Debit / Credit side দেখানো হচ্ছে।
   */
  const trialBalanceDebit = accountBalances.reduce(
    (sum, account) => sum + Math.max(account.balance, 0),
    0
  );

  const trialBalanceCredit = accountBalances.reduce(
    (sum, account) => sum + Math.max(-account.balance, 0),
    0
  );

  /*
   * ACCOUNT CLASSIFICATION
   */

  const assets = accountBalances.filter(
    (account) =>
      String(account.account_type || "").toLowerCase() === "asset"
  );

  const liabilities = accountBalances.filter(
    (account) =>
      String(account.account_type || "").toLowerCase() === "liability"
  );

  const equity = accountBalances.filter(
    (account) =>
      String(account.account_type || "").toLowerCase() === "equity"
  );

  const income = accountBalances.filter((account) => {
    const type = String(account.account_type || "").toLowerCase();

    return type === "income" || type === "revenue";
  });

  const expenses = accountBalances.filter((account) => {
    const type = String(account.account_type || "").toLowerCase();

    return type === "expense" || type === "expenses";
  });

  /*
   * BALANCE SHEET / P&L
   */

  const totalAssets = assets.reduce(
    (sum, account) => sum + Math.max(account.balance, 0),
    0
  );

  const totalLiabilities = liabilities.reduce(
    (sum, account) => sum + Math.max(-account.balance, 0),
    0
  );

  const totalEquity = equity.reduce(
    (sum, account) => sum + Math.max(-account.balance, 0),
    0
  );

  const totalIncome = income.reduce(
    (sum, account) => sum + Math.max(-account.balance, 0),
    0
  );

  const totalExpenses = expenses.reduce(
    (sum, account) => sum + Math.max(account.balance, 0),
    0
  );

  const netProfit = totalIncome - totalExpenses;

  const totalEquityWithProfit = totalEquity + netProfit;

  const balanceSheetTotal =
    totalLiabilities + totalEquityWithProfit;

  /*
   * FORMATTING
   */

  function formatAmount(value) {
    return Number(value || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function printReport() {
    window.print();
  }

  /*
   * COMMON ACCOUNT TABLE
   */

  function renderAccountRows(accountList) {
    if (accountList.length === 0) {
      return (
        <tr>
          <td
            colSpan="4"
            className="border p-4 text-center text-gray-500"
          >
            No accounts found.
          </td>
        </tr>
      );
    }

    return accountList.map((account) => (
      <tr key={account.id} className="hover:bg-gray-50">
        <td className="border p-3">
          {account.account_code}
        </td>

        <td className="border p-3">
          {account.account_name}
        </td>

        <td className="border p-3 text-right">
          {account.balance > 0
            ? formatAmount(account.balance)
            : "-"}
        </td>

        <td className="border p-3 text-right">
          {account.balance < 0
            ? formatAmount(Math.abs(account.balance))
            : "-"}
        </td>
      </tr>
    ));
  }

  /*
   * ACCOUNTING PERIOD / DATE
   */

  function getReportTitle() {
    if (reportType === "trial-balance") {
      return "Trial Balance";
    }

    if (reportType === "balance-sheet") {
      return "Balance Sheet";
    }

    return "Profit & Loss Statement";
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        Loading Reports...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 print:hidden">

        <div>
          <h1 className="text-3xl font-bold">
            Reports
          </h1>

          <p className="text-gray-500 mt-1">
            Financial Reports
          </p>
        </div>

        <div className="flex gap-3">

          <button
            type="button"
            onClick={loadReportData}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-5 py-2 rounded-lg"
          >
            Refresh
          </button>

          <button
            type="button"
            onClick={printReport}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg"
          >
            Print
          </button>

        </div>

      </div>

      {/* CONTROLS */}

      <div className="bg-white border rounded-xl shadow p-5 print:hidden">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <div>
            <label className="block text-sm font-medium mb-1">
              Report
            </label>

            <select
              value={reportType}
              onChange={(e) =>
                setReportType(e.target.value)
              }
              className="w-full border rounded-lg px-4 py-2"
            >
              <option value="trial-balance">
                Trial Balance
              </option>

              <option value="balance-sheet">
                Balance Sheet
              </option>

              <option value="profit-loss">
                Profit & Loss
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              As of Date
            </label>

            <input
              type="date"
              value={asOfDate}
              onChange={(e) =>
                setAsOfDate(e.target.value)
              }
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>

        </div>

      </div>

      {/* REPORT AREA */}

      <div
        id="financial-report"
        className="bg-white border rounded-xl shadow p-6"
      >

        {/* COMPANY HEADER */}

        <div className="text-center mb-8">

          <h1 className="text-2xl font-bold">
            SMART ACCOUNTS
          </h1>

          <h2 className="text-xl font-bold mt-2">
            {getReportTitle()}
          </h2>

          <p className="text-gray-600 mt-1">
            As of {asOfDate}
          </p>

        </div>

        {/* ================================================== */}
        {/* TRIAL BALANCE */}
        {/* ================================================== */}

        {reportType === "trial-balance" && (
          <div>

            <table className="w-full border-collapse">

              <thead>
                <tr className="bg-gray-100">

                  <th className="border p-3 text-left">
                    Code
                  </th>

                  <th className="border p-3 text-left">
                    Account Name
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

                {accountBalances.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="border p-6 text-center text-gray-500"
                    >
                      No accounts found.
                    </td>
                  </tr>
                ) : (
                  accountBalances.map((account) => (
                    <tr
                      key={account.id}
                      className="hover:bg-gray-50"
                    >

                      <td className="border p-3">
                        {account.account_code}
                      </td>

                      <td className="border p-3">
                        {account.account_name}
                      </td>

                      <td className="border p-3 text-right">
                        {account.balance > 0
                          ? formatAmount(account.balance)
                          : "-"}
                      </td>

                      <td className="border p-3 text-right">
                        {account.balance < 0
                          ? formatAmount(
                              Math.abs(account.balance)
                            )
                          : "-"}
                      </td>

                    </tr>
                  ))
                )}

                <tr className="font-bold bg-gray-100">

                  <td
                    colSpan="2"
                    className="border p-3 text-right"
                  >
                    Total
                  </td>

                  <td className="border p-3 text-right">
                    {formatAmount(trialBalanceDebit)}
                  </td>

                  <td className="border p-3 text-right">
                    {formatAmount(trialBalanceCredit)}
                  </td>

                </tr>

              </tbody>

            </table>

            {/* TRIAL BALANCE CHECK */}

            <div
              className={`mt-6 border rounded-xl p-5 ${
                Math.abs(
                  trialBalanceDebit -
                    trialBalanceCredit
                ) < 0.01
                  ? "bg-green-50 border-green-300"
                  : "bg-red-50 border-red-300"
              }`}
            >

              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">

                <div>

                  <h3 className="font-bold">
                    Trial Balance Check
                  </h3>

                  <p className="text-sm text-gray-600 mt-1">
                    Total Debit must equal Total Credit
                  </p>

                </div>

                <div
                  className={`text-xl font-bold ${
                    Math.abs(
                      trialBalanceDebit -
                        trialBalanceCredit
                    ) < 0.01
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {Math.abs(
                    trialBalanceDebit -
                      trialBalanceCredit
                  ) < 0.01
                    ? "BALANCED"
                    : "NOT BALANCED"}
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">

                <div>
                  <p className="text-sm text-gray-500">
                    Total Debit
                  </p>

                  <p className="font-bold">
                    {formatAmount(trialBalanceDebit)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Total Credit
                  </p>

                  <p className="font-bold">
                    {formatAmount(trialBalanceCredit)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Difference
                  </p>

                  <p className="font-bold">
                    {formatAmount(
                      trialBalanceDebit -
                        trialBalanceCredit
                    )}
                  </p>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ================================================== */}
        {/* BALANCE SHEET */}
        {/* ================================================== */}

        {reportType === "balance-sheet" && (
          <div className="space-y-8">

            {/* ASSETS */}

            <div>

              <h3 className="text-lg font-bold bg-gray-100 border p-3">
                Assets
              </h3>

              <table className="w-full border-collapse">

                <thead>
                  <tr>
                    <th className="border p-3 text-left">
                      Code
                    </th>

                    <th className="border p-3 text-left">
                      Account
                    </th>

                    <th className="border p-3 text-right">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {assets.length === 0 ? (
                    <tr>
                      <td
                        colSpan="3"
                        className="border p-4 text-center text-gray-500"
                      >
                        No asset accounts found.
                      </td>
                    </tr>
                  ) : (
                    assets.map((account) => (
                      <tr key={account.id}>

                        <td className="border p-3">
                          {account.account_code}
                        </td>

                        <td className="border p-3">
                          {account.account_name}
                        </td>

                        <td className="border p-3 text-right">
                          {formatAmount(
                            Math.abs(account.balance)
                          )}
                        </td>

                      </tr>
                    ))
                  )}

                  <tr className="font-bold bg-gray-50">

                    <td
                      colSpan="2"
                      className="border p-3 text-right"
                    >
                      Total Assets
                    </td>

                    <td className="border p-3 text-right">
                      {formatAmount(totalAssets)}
                    </td>

                  </tr>

                </tbody>

              </table>

            </div>

            {/* LIABILITIES */}

            <div>

              <h3 className="text-lg font-bold bg-gray-100 border p-3">
                Liabilities
              </h3>

              <table className="w-full border-collapse">

                <thead>
                  <tr>
                    <th className="border p-3 text-left">
                      Code
                    </th>

                    <th className="border p-3 text-left">
                      Account
                    </th>

                    <th className="border p-3 text-right">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {liabilities.length === 0 ? (
                    <tr>
                      <td
                        colSpan="3"
                        className="border p-4 text-center text-gray-500"
                      >
                        No liability accounts found.
                      </td>
                    </tr>
                  ) : (
                    liabilities.map((account) => (
                      <tr key={account.id}>

                        <td className="border p-3">
                          {account.account_code}
                        </td>

                        <td className="border p-3">
                          {account.account_name}
                        </td>

                        <td className="border p-3 text-right">
                          {formatAmount(
                            Math.abs(account.balance)
                          )}
                        </td>

                      </tr>
                    ))
                  )}

                  <tr className="font-bold bg-gray-50">

                    <td
                      colSpan="2"
                      className="border p-3 text-right"
                    >
                      Total Liabilities
                    </td>

                    <td className="border p-3 text-right">
                      {formatAmount(totalLiabilities)}
                    </td>

                  </tr>

                </tbody>

              </table>

            </div>

            {/* EQUITY */}

            <div>

              <h3 className="text-lg font-bold bg-gray-100 border p-3">
                Equity
              </h3>

              <table className="w-full border-collapse">

                <thead>
                  <tr>
                    <th className="border p-3 text-left">
                      Code
                    </th>

                    <th className="border p-3 text-left">
                      Account
                    </th>

                    <th className="border p-3 text-right">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {equity.length === 0 ? (
                    <tr>
                      <td
                        colSpan="3"
                        className="border p-4 text-center text-gray-500"
                      >
                        No equity accounts found.
                      </td>
                    </tr>
                  ) : (
                    equity.map((account) => (
                      <tr key={account.id}>

                        <td className="border p-3">
                          {account.account_code}
                        </td>

                        <td className="border p-3">
                          {account.account_name}
                        </td>

                        <td className="border p-3 text-right">
                          {formatAmount(
                            Math.abs(account.balance)
                          )}
                        </td>

                      </tr>
                    ))
                  )}

                  <tr>

                    <td
                      colSpan="2"
                      className="border p-3 text-right"
                    >
                      Current Year Profit
                    </td>

                    <td className="border p-3 text-right">
                      {formatAmount(netProfit)}
                    </td>

                  </tr>

                  <tr className="font-bold bg-gray-50">

                    <td
                      colSpan="2"
                      className="border p-3 text-right"
                    >
                      Total Equity
                    </td>

                    <td className="border p-3 text-right">
                      {formatAmount(
                        totalEquityWithProfit
                      )}
                    </td>

                  </tr>

                </tbody>

              </table>

            </div>

            {/* BALANCE SHEET CHECK */}

            <div
              className={`border rounded-xl p-5 ${
                Math.abs(
                  totalAssets -
                    balanceSheetTotal
                ) < 0.01
                  ? "bg-green-50 border-green-300"
                  : "bg-red-50 border-red-300"
              }`}
            >

              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">

                <div>

                  <h3 className="font-bold">
                    Balance Sheet Check
                  </h3>

                  <p className="text-sm text-gray-600 mt-1">
                    Assets vs Liabilities + Equity
                  </p>

                </div>

                <div
                  className={`text-xl font-bold ${
                    Math.abs(
                      totalAssets -
                        balanceSheetTotal
                    ) < 0.01
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {Math.abs(
                    totalAssets -
                      balanceSheetTotal
                  ) < 0.01
                    ? "BALANCED"
                    : "NOT BALANCED"}
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">

                <div>
                  <p className="text-sm text-gray-500">
                    Total Assets
                  </p>

                  <p className="font-bold">
                    {formatAmount(totalAssets)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Liabilities + Equity
                  </p>

                  <p className="font-bold">
                    {formatAmount(
                      balanceSheetTotal
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Difference
                  </p>

                  <p className="font-bold">
                    {formatAmount(
                      totalAssets -
                        balanceSheetTotal
                    )}
                  </p>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ================================================== */}
        {/* PROFIT & LOSS */}
        {/* ================================================== */}

        {reportType === "profit-loss" && (
          <div className="space-y-8">

            {/* INCOME */}

            <div>

              <h3 className="text-lg font-bold bg-gray-100 border p-3">
                Income
              </h3>

              <table className="w-full border-collapse">

                <thead>
                  <tr>
                    <th className="border p-3 text-left">
                      Code
                    </th>

                    <th className="border p-3 text-left">
                      Account
                    </th>

                    <th className="border p-3 text-right">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {income.length === 0 ? (
                    <tr>
                      <td
                        colSpan="3"
                        className="border p-4 text-center text-gray-500"
                      >
                        No income accounts found.
                      </td>
                    </tr>
                  ) : (
                    income.map((account) => (
                      <tr key={account.id}>

                        <td className="border p-3">
                          {account.account_code}
                        </td>

                        <td className="border p-3">
                          {account.account_name}
                        </td>

                        <td className="border p-3 text-right">
                          {formatAmount(
                            Math.abs(account.balance)
                          )}
                        </td>

                      </tr>
                    ))
                  )}

                  <tr className="font-bold bg-gray-50">

                    <td
                      colSpan="2"
                      className="border p-3 text-right"
                    >
                      Total Income
                    </td>

                    <td className="border p-3 text-right">
                      {formatAmount(totalIncome)}
                    </td>

                  </tr>

                </tbody>

              </table>

            </div>

            {/* EXPENSE */}

            <div>

              <h3 className="text-lg font-bold bg-gray-100 border p-3">
                Expenses
              </h3>

              <table className="w-full border-collapse">

                <thead>
                  <tr>
                    <th className="border p-3 text-left">
                      Code
                    </th>

                    <th className="border p-3 text-left">
                      Account
                    </th>

                    <th className="border p-3 text-right">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {expenses.length === 0 ? (
                    <tr>
                      <td
                        colSpan="3"
                        className="border p-4 text-center text-gray-500"
                      >
                        No expense accounts found.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((account) => (
                      <tr key={account.id}>

                        <td className="border p-3">
                          {account.account_code}
                        </td>

                        <td className="border p-3">
                          {account.account_name}
                        </td>

                        <td className="border p-3 text-right">
                          {formatAmount(
                            Math.abs(account.balance)
                          )}
                        </td>

                      </tr>
                    ))
                  )}

                  <tr className="font-bold bg-gray-50">

                    <td
                      colSpan="2"
                      className="border p-3 text-right"
                    >
                      Total Expenses
                    </td>

                    <td className="border p-3 text-right">
                      {formatAmount(totalExpenses)}
                    </td>

                  </tr>

                </tbody>

              </table>

            </div>

            {/* NET PROFIT */}

            <div
              className={`border rounded-xl p-6 ${
                netProfit >= 0
                  ? "bg-green-50 border-green-300"
                  : "bg-red-50 border-red-300"
              }`}
            >

              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">

                <h3 className="text-xl font-bold">
                  {netProfit >= 0
                    ? "Net Profit"
                    : "Net Loss"}
                </h3>

                <p
                  className={`text-2xl font-bold ${
                    netProfit >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatAmount(
                    Math.abs(netProfit)
                  )}
                </p>

              </div>

            </div>

          </div>
        )}

      </div>

      {/* PRINT STYLE */}

      <style>
        {`
          @media print {
            body {
              background: white !important;
            }

            .print\\:hidden {
              display: none !important;
            }

            #financial-report {
              border: none !important;
              box-shadow: none !important;
              width: 100% !important;
              padding: 0 !important;
            }

            table {
              page-break-inside: auto;
            }

            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }

            h3 {
              page-break-after: avoid;
            }
          }
        `}
      </style>

    </div>
  );
}

export default Reports;