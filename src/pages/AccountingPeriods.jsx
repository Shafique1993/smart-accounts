import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function AccountingPeriods() {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);

  const [periodName, setPeriodName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    loadPeriods();
  }, []);

  async function loadPeriods() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("accounting_periods")
        .select("*")
        .order("start_date", {
          ascending: false,
        });

      if (error) throw error;

      setPeriods(data || []);
    } catch (error) {
      console.error(
        "Accounting Period Error:",
        error
      );

      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();

    if (!periodName.trim()) {
      alert("Enter period name.");
      return;
    }

    if (!startDate || !endDate) {
      alert("Select start date and end date.");
      return;
    }

    if (startDate > endDate) {
      alert("Start date cannot be after end date.");
      return;
    }

    try {
      const { error } = await supabase
        .from("accounting_periods")
        .insert([
          {
            period_name: periodName.trim(),
            start_date: startDate,
            end_date: endDate,
            status: "Open",
          },
        ]);

      if (error) throw error;

      alert(
        "Accounting Period Created Successfully."
      );

      setPeriodName("");
      setStartDate("");
      setEndDate("");

      await loadPeriods();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }

  async function handleToggleStatus(period) {
    const newStatus =
      period.status === "Closed"
        ? "Open"
        : "Closed";

    const ok = window.confirm(
      newStatus === "Closed"
        ? "Close this accounting period?"
        : "Re-open this accounting period?"
    );

    if (!ok) return;

    try {
      const { error } = await supabase
        .from("accounting_periods")
        .update({
          status: newStatus,
        })
        .eq("id", period.id);

      if (error) throw error;

      await loadPeriods();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        Loading Accounting Periods...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div>
        <h1 className="text-3xl font-bold">
          Accounting Periods
        </h1>

        <p className="text-gray-500 mt-1">
          Manage accounting periods
        </p>
      </div>

      {/* CREATE PERIOD */}

      <div className="bg-white border rounded-xl shadow p-6">

        <h2 className="text-xl font-bold mb-5">
          Create Accounting Period
        </h2>

        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >

          <div>
            <label className="block mb-1 font-medium">
              Period Name
            </label>

            <input
              type="text"
              value={periodName}
              onChange={(e) =>
                setPeriodName(e.target.value)
              }
              placeholder="2026-2027"
              className="border rounded-lg p-2 w-full"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">
              Start Date
            </label>

            <input
              type="date"
              value={startDate}
              onChange={(e) =>
                setStartDate(e.target.value)
              }
              className="border rounded-lg p-2 w-full"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">
              End Date
            </label>

            <input
              type="date"
              value={endDate}
              onChange={(e) =>
                setEndDate(e.target.value)
              }
              className="border rounded-lg p-2 w-full"
            />
          </div>

          <div className="flex items-end">

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg w-full"
            >
              Create Period
            </button>

          </div>

        </form>
      </div>

      {/* PERIOD LIST */}

      <div className="bg-white border rounded-xl shadow">

        <div className="p-5 border-b">

          <h2 className="text-xl font-bold">
            Accounting Period List
          </h2>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full border-collapse">

            <thead>

              <tr className="bg-gray-100">

                <th className="border p-3 text-left">
                  Period
                </th>

                <th className="border p-3 text-left">
                  Start Date
                </th>

                <th className="border p-3 text-left">
                  End Date
                </th>

                <th className="border p-3 text-center">
                  Status
                </th>

                <th className="border p-3 text-center">
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {periods.length === 0 ? (

                <tr>

                  <td
                    colSpan={5}
                    className="border p-6 text-center text-gray-500"
                  >
                    No accounting periods found.
                  </td>

                </tr>

              ) : (

                periods.map((period) => (

                  <tr key={period.id}>

                    <td className="border p-3 font-medium">
                      {period.period_name}
                    </td>

                    <td className="border p-3">
                      {period.start_date}
                    </td>

                    <td className="border p-3">
                      {period.end_date}
                    </td>

                    <td className="border p-3 text-center">

                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          period.status === "Closed"
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {period.status}
                      </span>

                    </td>

                    <td className="border p-3 text-center">

                      <button
                        type="button"
                        onClick={() =>
                          handleToggleStatus(period)
                        }
                        className={`px-4 py-2 rounded text-white font-medium ${
                          period.status === "Closed"
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-red-600 hover:bg-red-700"
                        }`}
                      >
                        {period.status === "Closed"
                          ? "Re-open"
                          : "Close Period"}
                      </button>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

export default AccountingPeriods;