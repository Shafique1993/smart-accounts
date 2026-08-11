import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [ledger, setLedger] = useState([]);

  const [loading, setLoading] = useState(true);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  const [form, setForm] = useState({
    account_code: "",
    account_name: "",
    account_type: "Asset",
    opening_balance: "0",
    is_active: true,
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("coa_accounts")
        .select(`
          id,
          account_code,
          account_name,
          account_type,
          opening_balance,
          is_active
        `)
        .order("account_code", {
          ascending: true,
        });

      if (error) throw error;

      setAccounts(data || []);
    } catch (error) {
      console.error("Accounts Error:", error);
      alert(
        error?.message ||
          "Failed to load accounts."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadLedger(account) {
    try {
      setSelectedAccount(account);
      setLedgerLoading(true);
      setLedger([]);

      const { data, error } = await supabase
        .from("voucher_details")
        .select(`
          id,
          ledger_id,
          debit,
          credit,
          remarks,
          vouchers (
            voucher_no,
            voucher_type,
            voucher_date,
            reference_no,
            narration
          )
        `)
        .eq("ledger_id", account.id);

      if (error) throw error;

      const rows = data || [];

      rows.sort((a, b) => {
        const dateA =
          a.vouchers?.voucher_date || "";
        const dateB =
          b.vouchers?.voucher_date || "";

        if (dateA !== dateB) {
          return dateA.localeCompare(dateB);
        }

        return Number(a.id) - Number(b.id);
      });

      let runningBalance = Number(
        account.opening_balance || 0
      );

      const ledgerRows = rows.map((row) => {
        const debit = Number(row.debit || 0);
        const credit = Number(row.credit || 0);

        runningBalance += debit - credit;

        return {
          ...row,
          runningBalance,
        };
      });

      setLedger(ledgerRows);
    } catch (error) {
      console.error("Ledger Error:", error);

      alert(
        error?.message ||
          "Failed to load ledger."
      );
    } finally {
      setLedgerLoading(false);
    }
  }

  function openAddForm() {
    setEditingAccount(null);

    setForm({
      account_code: "",
      account_name: "",
      account_type: "Asset",
      opening_balance: "0",
      is_active: true,
    });

    setShowForm(true);
  }

  function openEditForm(account) {
    setEditingAccount(account);

    setForm({
      account_code:
        account.account_code || "",
      account_name:
        account.account_name || "",
      account_type:
        account.account_type || "Asset",
      opening_balance:
        String(
          account.opening_balance || 0
        ),
      is_active:
        account.is_active !== false,
    });

    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingAccount(null);
  }

  function handleFormChange(e) {
    const { name, value, type, checked } =
      e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.account_code.trim()) {
      alert("Account Code is required.");
      return;
    }

    if (!form.account_name.trim()) {
      alert("Account Name is required.");
      return;
    }

    const openingBalance = Number(
      form.opening_balance || 0
    );

    if (Number.isNaN(openingBalance)) {
      alert("Invalid opening balance.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        account_code:
          form.account_code.trim(),
        account_name:
          form.account_name.trim(),
        account_type:
          form.account_type,
        opening_balance:
          openingBalance,
        is_active:
          form.is_active,
      };

      if (editingAccount) {
        const { error } = await supabase
          .from("coa_accounts")
          .update(payload)
          .eq("id", editingAccount.id);

        if (error) throw error;

        alert(
          "Account updated successfully."
        );
      } else {
        const { error } = await supabase
          .from("coa_accounts")
          .insert([payload]);

        if (error) throw error;

        alert(
          "Account created successfully."
        );
      }

      setShowForm(false);
      setEditingAccount(null);

      await loadAccounts();

      if (
        selectedAccount &&
        editingAccount &&
        selectedAccount.id ===
          editingAccount.id
      ) {
        const updatedAccount = {
          ...selectedAccount,
          ...payload,
        };

        await loadLedger(updatedAccount);
      }
    } catch (error) {
      console.error(
        "Save Account Error:",
        error
      );

      alert(
        error?.message ||
          "Failed to save account."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleAccountStatus(account) {
    const action = account.is_active
      ? "deactivate"
      : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this account?`
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("coa_accounts")
        .update({
          is_active:
            !account.is_active,
        })
        .eq("id", account.id);

      if (error) throw error;

      await loadAccounts();

      if (
        selectedAccount?.id === account.id
      ) {
        setSelectedAccount({
          ...selectedAccount,
          is_active:
            !account.is_active,
        });
      }
    } catch (error) {
      console.error(
        "Status Update Error:",
        error
      );

      alert(
        error?.message ||
          "Failed to update account status."
      );
    }
  }

  const filteredAccounts =
    accounts.filter((account) => {
      const text =
        `${account.account_code || ""} ${
          account.account_name || ""
        } ${
          account.account_type || ""
        }`.toLowerCase();

      return text.includes(
        search.toLowerCase()
      );
    });

  const totalDebit = ledger.reduce(
    (sum, row) =>
      sum + Number(row.debit || 0),
    0
  );

  const totalCredit = ledger.reduce(
    (sum, row) =>
      sum + Number(row.credit || 0),
    0
  );

  const currentBalance =
    ledger.length > 0
      ? ledger[ledger.length - 1]
          .runningBalance
      : Number(
          selectedAccount?.opening_balance ||
            0
        );

  if (loading) {
    return (
      <div className="p-6">
        Loading Accounts...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}

      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-3xl font-bold">
            Accounts
          </h1>

          <p className="text-gray-500 mt-1">
            Chart of Accounts & Ledger
          </p>
        </div>

        <div className="flex gap-3">

          <button
            type="button"
            onClick={loadAccounts}
            className="bg-gray-600 hover:bg-gray-700 text-white px-5 py-2 rounded-lg"
          >
            Refresh
          </button>

          <button
            type="button"
            onClick={openAddForm}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
          >
            + Add Account
          </button>

        </div>

      </div>

      {/* ADD / EDIT FORM */}

      {showForm && (

        <div className="bg-white border rounded-xl shadow p-6">

          <div className="flex justify-between items-center mb-5">

            <h2 className="text-xl font-bold">
              {editingAccount
                ? "Edit Account"
                : "Add Account"}
            </h2>

            <button
              type="button"
              onClick={closeForm}
              className="text-gray-500 hover:text-red-600 text-xl"
            >
              ×
            </button>

          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >

            {/* ACCOUNT CODE */}

            <div>
              <label className="block text-sm font-medium mb-1">
                Account Code
              </label>

              <input
                type="text"
                name="account_code"
                value={form.account_code}
                onChange={handleFormChange}
                placeholder="e.g. 1001"
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>

            {/* ACCOUNT NAME */}

            <div>
              <label className="block text-sm font-medium mb-1">
                Account Name
              </label>

              <input
                type="text"
                name="account_name"
                value={form.account_name}
                onChange={handleFormChange}
                placeholder="e.g. Cash"
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>

            {/* ACCOUNT TYPE */}

            <div>
              <label className="block text-sm font-medium mb-1">
                Account Type
              </label>

              <select
                name="account_type"
                value={form.account_type}
                onChange={handleFormChange}
                className="w-full border rounded-lg px-4 py-2"
              >
                <option value="Asset">
                  Asset
                </option>

                <option value="Liability">
                  Liability
                </option>

                <option value="Equity">
                  Equity
                </option>

                <option value="Income">
                  Income
                </option>

                <option value="Expense">
                  Expense
                </option>
              </select>
            </div>

            {/* OPENING BALANCE */}

            <div>
              <label className="block text-sm font-medium mb-1">
                Opening Balance
              </label>

              <input
                type="number"
                step="0.01"
                name="opening_balance"
                value={form.opening_balance}
                onChange={handleFormChange}
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>

            {/* STATUS */}

            <div className="md:col-span-2">

              <label className="inline-flex items-center gap-2">

                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleFormChange}
                  className="w-4 h-4"
                />

                <span className="text-sm font-medium">
                  Active Account
                </span>

              </label>

            </div>

            {/* BUTTONS */}

            <div className="md:col-span-2 flex gap-3">

              <button
                type="submit"
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg"
              >
                {saving
                  ? "Saving..."
                  : editingAccount
                  ? "Update Account"
                  : "Save Account"}
              </button>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg"
              >
                Cancel
              </button>

            </div>

          </form>

        </div>

      )}

      {/* SEARCH */}

      <div className="bg-white border rounded-xl shadow p-5">

        <label className="block text-sm font-medium mb-2">
          Search Account
        </label>

        <input
          type="text"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Account code, name or type..."
          className="w-full md:w-1/2 border rounded-lg px-4 py-2"
        />

      </div>

      {/* ACCOUNT LIST */}

      <div className="bg-white border rounded-xl shadow">

        <div className="p-5 border-b">

          <h2 className="text-xl font-bold">
            Chart of Accounts
          </h2>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full border-collapse">

            <thead>

              <tr className="bg-gray-100">

                <th className="border p-3 text-left">
                  Code
                </th>

                <th className="border p-3 text-left">
                  Account Name
                </th>

                <th className="border p-3 text-left">
                  Type
                </th>

                <th className="border p-3 text-right">
                  Opening Balance
                </th>

                <th className="border p-3 text-center">
                  Status
                </th>

                <th className="border p-3 text-center">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredAccounts.length === 0 ? (

                <tr>

                  <td
                    colSpan="6"
                    className="border p-6 text-center text-gray-500"
                  >
                    No accounts found.
                  </td>

                </tr>

              ) : (

                filteredAccounts.map(
                  (account) => (

                    <tr
                      key={account.id}
                      className={
                        selectedAccount?.id ===
                        account.id
                          ? "bg-blue-50"
                          : ""
                      }
                    >

                      <td className="border p-3 font-medium">
                        {account.account_code}
                      </td>

                      <td className="border p-3">
                        {account.account_name}
                      </td>

                      <td className="border p-3">
                        {account.account_type}
                      </td>

                      <td className="border p-3 text-right">
                        {Number(
                          account.opening_balance ||
                            0
                        ).toFixed(2)}
                      </td>

                      <td className="border p-3 text-center">

                        {account.is_active ? (

                          <span className="text-green-600 font-medium">
                            Active
                          </span>

                        ) : (

                          <span className="text-red-600 font-medium">
                            Inactive
                          </span>

                        )}

                      </td>

                      <td className="border p-3">

                        <div className="flex flex-wrap justify-center gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              loadLedger(account)
                            }
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm"
                          >
                            Ledger
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openEditForm(account)
                            }
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-sm"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleAccountStatus(
                                account
                              )
                            }
                            className={`${
                              account.is_active
                                ? "bg-red-500 hover:bg-red-600"
                                : "bg-green-600 hover:bg-green-700"
                            } text-white px-3 py-1.5 rounded-lg text-sm`}
                          >
                            {account.is_active
                              ? "Deactivate"
                              : "Activate"}
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* LEDGER */}

      {selectedAccount && (

        <div className="bg-white border rounded-xl shadow">

          <div className="p-5 border-b">

            <div className="flex justify-between items-start">

              <div>

                <h2 className="text-2xl font-bold">
                  Account Ledger
                </h2>

                <p className="text-gray-600 mt-1">
                  {selectedAccount.account_code}
                  {" - "}
                  {selectedAccount.account_name}
                </p>

                <p className="text-sm text-gray-500 mt-1">
                  Type:{" "}
                  {selectedAccount.account_type}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedAccount(null)
                }
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Close
              </button>

            </div>

          </div>

          {/* LEDGER SUMMARY */}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 border-b">

            <div className="border rounded-lg p-4">

              <p className="text-sm text-gray-500">
                Opening Balance
              </p>

              <p className="text-xl font-bold mt-1">
                {Number(
                  selectedAccount.opening_balance ||
                    0
                ).toFixed(2)}
              </p>

            </div>

            <div className="border rounded-lg p-4">

              <p className="text-sm text-gray-500">
                Total Debit
              </p>

              <p className="text-xl font-bold text-blue-600 mt-1">
                {totalDebit.toFixed(2)}
              </p>

            </div>

            <div className="border rounded-lg p-4">

              <p className="text-sm text-gray-500">
                Total Credit
              </p>

              <p className="text-xl font-bold text-orange-600 mt-1">
                {totalCredit.toFixed(2)}
              </p>

            </div>

            <div className="border rounded-lg p-4">

              <p className="text-sm text-gray-500">
                Current Balance
              </p>

              <p
                className={`text-xl font-bold mt-1 ${
                  currentBalance >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {currentBalance.toFixed(2)}
              </p>

            </div>

          </div>

          {/* LEDGER TABLE */}

          {ledgerLoading ? (

            <div className="p-8 text-center text-gray-500">
              Loading Ledger...
            </div>

          ) : (

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
                      Reference
                    </th>

                    <th className="border p-3 text-left">
                      Remarks
                    </th>

                    <th className="border p-3 text-right">
                      Debit
                    </th>

                    <th className="border p-3 text-right">
                      Credit
                    </th>

                    <th className="border p-3 text-right">
                      Balance
                    </th>

                  </tr>

                </thead>

                <tbody>

                  <tr className="bg-blue-50">

                    <td
                      colSpan="5"
                      className="border p-3 font-medium"
                    >
                      Opening Balance
                    </td>

                    <td className="border p-3 text-right">
                      {Number(
                        selectedAccount.opening_balance ||
                          0
                      ) > 0
                        ? Number(
                            selectedAccount.opening_balance
                          ).toFixed(2)
                        : "0.00"}
                    </td>

                    <td className="border p-3 text-right">
                      {Number(
                        selectedAccount.opening_balance ||
                          0
                      ) < 0
                        ? Math.abs(
                            Number(
                              selectedAccount.opening_balance
                            )
                          ).toFixed(2)
                        : "0.00"}
                    </td>

                    <td className="border p-3 text-right font-bold">
                      {Number(
                        selectedAccount.opening_balance ||
                          0
                      ).toFixed(2)}
                    </td>

                  </tr>

                  {ledger.length === 0 ? (

                    <tr>

                      <td
                        colSpan="8"
                        className="border p-8 text-center text-gray-500"
                      >
                        No transactions found
                        for this account.
                      </td>

                    </tr>

                  ) : (

                    ledger.map((row) => (

                      <tr key={row.id}>

                        <td className="border p-3">
                          {
                            row.vouchers
                              ?.voucher_date ||
                            "-"
                          }
                        </td>

                        <td className="border p-3 font-medium">
                          {
                            row.vouchers
                              ?.voucher_no ||
                            "-"
                          }
                        </td>

                        <td className="border p-3">
                          {
                            row.vouchers
                              ?.voucher_type ||
                            "-"
                          }
                        </td>

                        <td className="border p-3">
                          {
                            row.vouchers
                              ?.reference_no ||
                            "-"
                          }
                        </td>

                        <td className="border p-3">
                          {row.remarks ||
                            row.vouchers
                              ?.narration ||
                            "-"}
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

                        <td
                          className={`border p-3 text-right font-medium ${
                            row.runningBalance >=
                            0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {Number(
                            row.runningBalance
                          ).toFixed(2)}
                        </td>

                      </tr>

                    ))

                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      )}

    </div>
  );
}

export default Accounts;