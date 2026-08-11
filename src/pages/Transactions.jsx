import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [voucherType, setVoucherType] =
    useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    try {
      setLoading(true);

      const { data, error } = await supabase
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
        `)
        .order("id", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setTransactions(data || []);
    } catch (error) {
      console.error(
        "Transactions Error:",
        error
      );

      alert(
        error?.message ||
          "Failed to load transactions."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredTransactions =
    transactions.filter((row) => {
      const voucher =
        row.vouchers || {};

      const account =
        row.coa_accounts || {};

      const searchText =
        `${voucher.voucher_no || ""} ${
          voucher.voucher_type || ""
        } ${
          voucher.reference_no || ""
        } ${
          voucher.narration || ""
        } ${
          account.account_code || ""
        } ${
          account.account_name || ""
        } ${
          row.remarks || ""
        }`.toLowerCase();

      if (
        search &&
        !searchText.includes(
          search.toLowerCase()
        )
      ) {
        return false;
      }

      if (
        voucherType !== "All" &&
        voucher.voucher_type !== voucherType
      ) {
        return false;
      }

      if (
        fromDate &&
        voucher.voucher_date &&
        voucher.voucher_date < fromDate
      ) {
        return false;
      }

      if (
        toDate &&
        voucher.voucher_date &&
        voucher.voucher_date > toDate
      ) {
        return false;
      }

      return true;
    });

  const totalDebit =
    filteredTransactions.reduce(
      (sum, row) =>
        sum + Number(row.debit || 0),
      0
    );

  const totalCredit =
    filteredTransactions.reduce(
      (sum, row) =>
        sum + Number(row.credit || 0),
      0
    );

  const netMovement =
    totalDebit - totalCredit;

  const voucherTypes = [
    ...new Set(
      transactions
        .map(
          (row) =>
            row.vouchers?.voucher_type
        )
        .filter(Boolean)
    ),
  ];

  if (loading) {
    return (
      <div className="p-6">
        Loading Transactions...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}

      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-3xl font-bold">
            Transactions
          </h1>

          <p className="text-gray-500 mt-1">
            Complete transaction history
          </p>
        </div>

        <button
          type="button"
          onClick={loadTransactions}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
        >
          Refresh
        </button>

      </div>

      {/* FILTERS */}

      <div className="bg-white border rounded-xl shadow p-5">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          <div>

            <label className="block text-sm font-medium mb-1">
              Search
            </label>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Voucher, account, reference..."
              className="w-full border rounded-lg px-4 py-2"
            />

          </div>

          <div>

            <label className="block text-sm font-medium mb-1">
              Voucher Type
            </label>

            <select
              value={voucherType}
              onChange={(e) =>
                setVoucherType(e.target.value)
              }
              className="w-full border rounded-lg px-4 py-2"
            >
              <option value="All">
                All
              </option>

              {voucherTypes.map(
                (type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {type}
                  </option>
                )
              )}

            </select>

          </div>

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
              className="w-full border rounded-lg px-4 py-2"
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
              className="w-full border rounded-lg px-4 py-2"
            />

          </div>

        </div>

        <div className="mt-4">

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setVoucherType("All");
              setFromDate("");
              setToDate("");
            }}
            className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2 rounded-lg"
          >
            Clear Filters
          </button>

        </div>

      </div>

      {/* SUMMARY */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        <div className="bg-white border rounded-xl shadow p-5">

          <p className="text-sm text-gray-500">
            Total Debit
          </p>

          <h2 className="text-2xl font-bold text-blue-600 mt-2">
            {totalDebit.toFixed(2)}
          </h2>

        </div>

        <div className="bg-white border rounded-xl shadow p-5">

          <p className="text-sm text-gray-500">
            Total Credit
          </p>

          <h2 className="text-2xl font-bold text-orange-600 mt-2">
            {totalCredit.toFixed(2)}
          </h2>

        </div>

        <div className="bg-white border rounded-xl shadow p-5">

          <p className="text-sm text-gray-500">
            Net Movement
          </p>

          <h2
            className={`text-2xl font-bold mt-2 ${
              netMovement >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {netMovement.toFixed(2)}
          </h2>

        </div>

      </div>

      {/* TRANSACTION TABLE */}

      <div className="bg-white border rounded-xl shadow">

        <div className="p-5 border-b flex justify-between items-center">

          <div>

            <h2 className="text-xl font-bold">
              Transaction List
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              {filteredTransactions.length} transaction
              {filteredTransactions.length !== 1
                ? "s"
                : ""}
            </p>

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
                  Account
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

              </tr>

            </thead>

            <tbody>

              {filteredTransactions.length ===
              0 ? (

                <tr>

                  <td
                    colSpan="8"
                    className="border p-8 text-center text-gray-500"
                  >
                    No transactions found.
                  </td>

                </tr>

              ) : (

                filteredTransactions.map(
                  (row) => {

                    const voucher =
                      row.vouchers || {};

                    const account =
                      row.coa_accounts || {};

                    return (
                      <tr key={row.id}>

                        <td className="border p-3">
                          {
                            voucher.voucher_date ||
                            "-"
                          }
                        </td>

                        <td className="border p-3 font-medium">
                          {
                            voucher.voucher_no ||
                            "-"
                          }
                        </td>

                        <td className="border p-3">
                          {
                            voucher.voucher_type ||
                            "-"
                          }
                        </td>

                        <td className="border p-3">

                          <div className="font-medium">
                            {
                              account.account_code ||
                              "-"
                            }
                          </div>

                          <div className="text-sm text-gray-500">
                            {
                              account.account_name ||
                              "-"
                            }
                          </div>

                        </td>

                        <td className="border p-3">
                          {
                            voucher.reference_no ||
                            "-"
                          }
                        </td>

                        <td className="border p-3">
                          {row.remarks ||
                            voucher.narration ||
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

                      </tr>
                    );
                  }
                )

              )}

            </tbody>

            {filteredTransactions.length >
              0 && (

              <tfoot>

                <tr className="bg-gray-100 font-bold">

                  <td
                    colSpan="6"
                    className="border p-3 text-right"
                  >
                    Total
                  </td>

                  <td className="border p-3 text-right">
                    {totalDebit.toFixed(2)}
                  </td>

                  <td className="border p-3 text-right">
                    {totalCredit.toFixed(2)}
                  </td>

                </tr>

              </tfoot>

            )}

          </table>

        </div>

      </div>

    </div>
  );
}

export default Transactions;