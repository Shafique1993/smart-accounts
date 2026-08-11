import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { toggleLedgerStatus } from "../../services/accountService";

function LedgerList({ onEdit }) {
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchLedgers();
  }, []);

  async function fetchLedgers() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("coa_accounts")
        .select("*")
        .order("account_code");

      if (error) throw error;

      setLedgers(data || []);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteLedger(id) {
    const ok = window.confirm(
      "Are you sure delete this ledger?"
    );

    if (!ok) return;

    const { error } = await supabase
      .from("coa_accounts")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchLedgers();
  }

  async function changeStatus(ledger) {
    try {
      await toggleLedgerStatus(
        ledger.id,
        ledger.is_active
      );

      fetchLedgers();
    } catch (error) {
      alert(error.message);
    }
  }

  const filteredLedgers = useMemo(() => {
    const text = search.toLowerCase().trim();

    if (!text) return ledgers;

    return ledgers.filter((item) => {
      return (
        (item.account_code || "")
          .toLowerCase()
          .includes(text) ||
        (item.account_name || "")
          .toLowerCase()
          .includes(text) ||
        (item.category || "")
          .toLowerCase()
          .includes(text) ||
        (item.group_name || "")
          .toLowerCase()
          .includes(text) ||
        (item.sub_group || "")
          .toLowerCase()
          .includes(text)
      );
    });
  }, [ledgers, search]);

  if (loading) {
    return (
      <div className="p-5 text-center">
        Loading Ledger...
      </div>
    );
  }

  return (
    <div>

      <div className="flex justify-between items-center mb-4">

        <h2 className="text-2xl font-bold">
          Ledger List ({filteredLedgers.length})
        </h2>

        <input
          type="text"
          placeholder="Search Ledger..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="border rounded-lg px-3 py-2 w-72"
        />

      </div>

      <div className="overflow-x-auto">

        <table className="w-full border-collapse">

          <thead>

            <tr className="bg-gray-100">

              <th className="border p-2">
                Code
              </th>

              <th className="border p-2">
                Account Name
              </th>

              <th className="border p-2">
                Category
              </th>

              <th className="border p-2">
                Group
              </th>

              <th className="border p-2">
                Opening
              </th>

              <th className="border p-2">
                Status
              </th>

              <th className="border p-2">
                Action
              </th>

            </tr>

          </thead>

          <tbody>

            {filteredLedgers.length === 0 ? (

              <tr>

                <td
                  colSpan={7}
                  className="border p-5 text-center"
                >
                  No Ledger Found
                </td>

              </tr>

            ) : (

              filteredLedgers.map((ledger) => (

                <tr key={ledger.id}>

                  <td className="border p-2">
                    {ledger.account_code}
                  </td>

                  <td className="border p-2">
                    {ledger.account_name}
                  </td>

                  <td className="border p-2">
                    {ledger.category}
                  </td>

                  <td className="border p-2">
                    {ledger.group_name}
                  </td>

                  <td className="border p-2">
                    {ledger.opening_balance}{" "}
                    {ledger.opening_type}
                  </td>

                  <td className="border p-2 text-center">

                    {ledger.is_active ? (
                      <span className="text-green-600 font-semibold">
                        Active
                      </span>
                    ) : (
                      <span className="text-red-600 font-semibold">
                        Inactive
                      </span>
                    )}

                  </td>

                  <td className="border p-2">

                    <div className="flex gap-2">

                      <button
                        onClick={() =>
                          onEdit(ledger)
                        }
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          changeStatus(ledger)
                        }
                        className={`text-white px-3 py-1 rounded ${
                          ledger.is_active
                            ? "bg-orange-500 hover:bg-orange-600"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        {ledger.is_active
                          ? "Deactivate"
                          : "Activate"}
                      </button>

                      <button
                        onClick={() =>
                          deleteLedger(
                            ledger.id
                          )
                        }
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                      >
                        Delete
                      </button>

                    </div>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default LedgerList;