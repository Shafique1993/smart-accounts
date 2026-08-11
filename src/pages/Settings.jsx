import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function Settings() {
  const [settings, setSettings] = useState({
    company_name: "",
    address: "",
    phone: "",
    email: "",
    financial_year_start: "",
    financial_year_end: "",
    currency: "BDT",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        setSettings({
          company_name:
            data.company_name || "",
          address: data.address || "",
          phone: data.phone || "",
          email: data.email || "",
          financial_year_start:
            data.financial_year_start || "",
          financial_year_end:
            data.financial_year_end || "",
          currency:
            data.currency || "BDT",
        });
      }
    } catch (error) {
      console.error(
        "Settings Load Error:",
        error
      );

      alert(
        error?.message ||
          "Failed to load settings."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function saveSettings(e) {
    e.preventDefault();

    if (!settings.company_name.trim()) {
      alert("Company name is required.");
      return;
    }

    if (
      settings.financial_year_start &&
      settings.financial_year_end &&
      settings.financial_year_start >
        settings.financial_year_end
    ) {
      alert(
        "Financial year start date cannot be after end date."
      );
      return;
    }

    try {
      setSaving(true);

      const { data: existing } =
        await supabase
          .from("company_settings")
          .select("id")
          .limit(1)
          .maybeSingle();

      if (existing?.id) {
        const { error } = await supabase
          .from("company_settings")
          .update(settings)
          .eq("id", existing.id);

        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase
          .from("company_settings")
          .insert([settings]);

        if (error) {
          throw error;
        }
      }

      alert(
        "Settings saved successfully."
      );

      await loadSettings();
    } catch (error) {
      console.error(
        "Settings Save Error:",
        error
      );

      alert(
        error?.message ||
          "Failed to save settings."
      );
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    loadSettings();
  }

  if (loading) {
    return (
      <div className="p-6">
        Loading Settings...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}

      <div>

        <h1 className="text-3xl font-bold">
          Settings
        </h1>

        <p className="text-gray-500 mt-1">
          Company and financial year settings
        </p>

      </div>

      <form
        onSubmit={saveSettings}
        className="space-y-6"
      >

        {/* COMPANY INFORMATION */}

        <div className="bg-white border rounded-xl shadow">

          <div className="p-5 border-b">

            <h2 className="text-xl font-bold">
              Company Information
            </h2>

          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* COMPANY NAME */}

            <div className="md:col-span-2">

              <label className="block text-sm font-medium mb-1">
                Company Name
              </label>

              <input
                type="text"
                name="company_name"
                value={settings.company_name}
                onChange={handleChange}
                placeholder="Enter company name"
                className="w-full border rounded-lg px-4 py-2"
              />

            </div>

            {/* ADDRESS */}

            <div className="md:col-span-2">

              <label className="block text-sm font-medium mb-1">
                Address
              </label>

              <textarea
                name="address"
                value={settings.address}
                onChange={handleChange}
                rows="3"
                placeholder="Enter company address"
                className="w-full border rounded-lg px-4 py-2"
              />

            </div>

            {/* PHONE */}

            <div>

              <label className="block text-sm font-medium mb-1">
                Phone
              </label>

              <input
                type="text"
                name="phone"
                value={settings.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                className="w-full border rounded-lg px-4 py-2"
              />

            </div>

            {/* EMAIL */}

            <div>

              <label className="block text-sm font-medium mb-1">
                Email
              </label>

              <input
                type="email"
                name="email"
                value={settings.email}
                onChange={handleChange}
                placeholder="Enter email address"
                className="w-full border rounded-lg px-4 py-2"
              />

            </div>

          </div>

        </div>

        {/* FINANCIAL YEAR */}

        <div className="bg-white border rounded-xl shadow">

          <div className="p-5 border-b">

            <h2 className="text-xl font-bold">
              Financial Year
            </h2>

          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* START */}

            <div>

              <label className="block text-sm font-medium mb-1">
                Financial Year Start
              </label>

              <input
                type="date"
                name="financial_year_start"
                value={
                  settings.financial_year_start
                }
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2"
              />

            </div>

            {/* END */}

            <div>

              <label className="block text-sm font-medium mb-1">
                Financial Year End
              </label>

              <input
                type="date"
                name="financial_year_end"
                value={
                  settings.financial_year_end
                }
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2"
              />

            </div>

            {/* CURRENCY */}

            <div>

              <label className="block text-sm font-medium mb-1">
                Currency
              </label>

              <select
                name="currency"
                value={settings.currency}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2"
              >
                <option value="BDT">
                  BDT - Bangladeshi Taka
                </option>

                <option value="USD">
                  USD - US Dollar
                </option>

                <option value="EUR">
                  EUR - Euro
                </option>

                <option value="GBP">
                  GBP - British Pound
                </option>

              </select>

            </div>

          </div>

        </div>

        {/* BUTTONS */}

        <div className="flex gap-3">

          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg"
          >
            {saving
              ? "Saving..."
              : "Save Settings"}
          </button>

          <button
            type="button"
            onClick={resetForm}
            disabled={saving}
            className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg"
          >
            Reset
          </button>

        </div>

      </form>

    </div>
  );
}

export default Settings;