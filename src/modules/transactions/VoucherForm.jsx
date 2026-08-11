import { useEffect, useState } from "react";
import VoucherDetails from "./VoucherDetails";
import {
  getVoucherNo,
  getAllLedgers,
  saveVoucher,
  updateVoucher,
  calculateTotals,
} from "../../services/voucherService";
import { supabase } from "../../lib/supabase";

const initialRow = {
  ledger_id: "",
  debit: "",
  credit: "",
  remarks: "",
};

const initialVoucher = {
  voucher_no: "",
  voucher_type: "Journal",
  voucher_date: new Date().toISOString().slice(0, 10),
  reference_no: "",
  narration: "",
};

function VoucherForm({
  onSaved,
  editVoucher = null,
  onCancelEdit,
}) {
  const [voucher, setVoucher] =
    useState(initialVoucher);

  const [rows, setRows] = useState([
    { ...initialRow },
  ]);

  const [ledgers, setLedgers] = useState([]);

  const [saving, setSaving] = useState(false);

  // ===============================
  // LOAD LEDGERS
  // ===============================
  useEffect(() => {
    loadLedgers();
  }, []);

  async function loadLedgers() {
    try {
      const data = await getAllLedgers();
      setLedgers(data);
    } catch (error) {
      alert(error.message);
    }
  }

  // ===============================
  // LOAD EDIT VOUCHER
  // ===============================
  useEffect(() => {
    if (!editVoucher) {
      loadNewVoucher();
      return;
    }

    loadEditVoucher();
  }, [editVoucher]);

  async function loadNewVoucher() {
    try {
      const voucherNo =
        await getVoucherNo("Journal");

      setVoucher({
        ...initialVoucher,
        voucher_no: voucherNo,
        voucher_date: new Date()
          .toISOString()
          .slice(0, 10),
      });

      setRows([
        {
          ...initialRow,
        },
      ]);
    } catch (error) {
      alert(error.message);
    }
  }

  async function loadEditVoucher() {
    try {
      const {
        getVoucherDetails,
      } = await import(
        "../../services/voucherService"
      );

      const details =
        await getVoucherDetails(
          editVoucher.id
        );

      setVoucher({
        voucher_no:
          editVoucher.voucher_no || "",
        voucher_type:
          editVoucher.voucher_type || "Journal",
        voucher_date:
          editVoucher.voucher_date ||
          new Date()
            .toISOString()
            .slice(0, 10),
        reference_no:
          editVoucher.reference_no || "",
        narration:
          editVoucher.narration || "",
      });

      if (details.length > 0) {
        setRows(
          details.map((row) => ({
            ledger_id:
              row.ledger_id || "",
            debit:
              row.debit ?? "",
            credit:
              row.credit ?? "",
            remarks:
              row.remarks || "",
          }))
        );
      } else {
        setRows([
          {
            ...initialRow,
          },
        ]);
      }
    } catch (error) {
      alert(error.message);
    }
  }

  // ===============================
  // CHECK ACCOUNTING PERIOD
  // ===============================
  async function checkAccountingPeriod(
    voucherDate
  ) {
    const { data, error } = await supabase
      .from("accounting_periods")
      .select(
        "id, period_name, start_date, end_date, status"
      )
      .lte("start_date", voucherDate)
      .gte("end_date", voucherDate)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error(
        `No accounting period found for ${voucherDate}. Please create an accounting period first.`
      );
    }

    if (data.status === "Closed") {
      throw new Error(
        `Accounting period "${data.period_name}" is closed. Voucher cannot be saved or updated in this period.`
      );
    }

    return data;
  }

  // ===============================
  // VOUCHER CHANGE
  // ===============================
  function handleVoucherChange(e) {
    const { name, value } = e.target;

    setVoucher((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // ===============================
  // ROW UPDATE
  // ===============================
  function updateRow(
    index,
    field,
    value
  ) {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    );
  }

  // ===============================
  // ADD ROW
  // ===============================
  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        ...initialRow,
      },
    ]);
  }

  // ===============================
  // REMOVE ROW
  // ===============================
  function removeRow(index) {
    if (rows.length === 1) return;

    setRows((prev) =>
      prev.filter(
        (_, i) => i !== index
      )
    );
  }

  // ===============================
  // TOTALS
  // ===============================
  const {
    totalDebit,
    totalCredit,
  } = calculateTotals(rows);

  // ===============================
  // SUBMIT
  // ===============================
  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);

      // Check Accounting Period
      await checkAccountingPeriod(
        voucher.voucher_date
      );

      let result;

      // EDIT
      if (editVoucher) {
        result = await updateVoucher(
          editVoucher.id,
          voucher,
          rows
        );

        alert(
          "Voucher Updated Successfully."
        );
      }

      // NEW
      else {
        result = await saveVoucher(
          voucher,
          rows
        );

        alert(
          "Voucher Saved Successfully."
        );
      }

      console.log(
        "Voucher Result:",
        result
      );

      if (onSaved) {
        onSaved();
      }

      // After edit, close edit mode
      if (editVoucher) {
        if (onCancelEdit) {
          onCancelEdit();
        }

        return;
      }

      // Reset after new voucher
      const nextVoucherNo =
        await getVoucherNo(
          voucher.voucher_type
        );

      setVoucher({
        ...initialVoucher,
        voucher_type:
          voucher.voucher_type,
        voucher_no:
          nextVoucherNo,
        voucher_date:
          new Date()
            .toISOString()
            .slice(0, 10),
      });

      setRows([
        {
          ...initialRow,
        },
      ]);
    } catch (error) {
      console.error(error);

      alert(
        error?.message ||
          "Failed to save voucher."
      );
    } finally {
      setSaving(false);
    }
  }

  // ===============================
  // RESET
  // ===============================
  async function handleReset() {
    try {
      if (editVoucher) {
        if (onCancelEdit) {
          onCancelEdit();
        }

        return;
      }

      const voucherNo =
        await getVoucherNo(
          voucher.voucher_type
        );

      setVoucher({
        ...initialVoucher,
        voucher_type:
          voucher.voucher_type,
        voucher_no: voucherNo,
        voucher_date:
          new Date()
            .toISOString()
            .slice(0, 10),
      });

      setRows([
        {
          ...initialRow,
        },
      ]);
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {/* EDIT MODE HEADER */}
      {editVoucher && (
        <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 rounded p-3 font-semibold">
          Editing Voucher:{" "}
          {editVoucher.voucher_no}
        </div>
      )}

      {/* VOUCHER HEADER */}
      <div className="grid grid-cols-5 gap-4">
        <div>
          <label className="block mb-1 font-medium">
            Voucher No
          </label>

          <input
            value={voucher.voucher_no}
            readOnly
            className="border rounded p-2 w-full bg-gray-100"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            Voucher Type
          </label>

          <select
            name="voucher_type"
            value={
              voucher.voucher_type
            }
            onChange={
              handleVoucherChange
            }
            disabled={!!editVoucher}
            className="border rounded p-2 w-full disabled:bg-gray-100"
          >
            <option value="Journal">
              Journal
            </option>

            <option value="Payment">
              Payment
            </option>

            <option value="Receipt">
              Receipt
            </option>

            <option value="Contra">
              Contra
            </option>
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">
            Date
          </label>

          <input
            type="date"
            name="voucher_date"
            value={
              voucher.voucher_date
            }
            onChange={
              handleVoucherChange
            }
            className="border rounded p-2 w-full"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            Reference No
          </label>

          <input
            name="reference_no"
            value={
              voucher.reference_no
            }
            onChange={
              handleVoucherChange
            }
            className="border rounded p-2 w-full"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            Narration
          </label>

          <input
            name="narration"
            value={
              voucher.narration
            }
            onChange={
              handleVoucherChange
            }
            className="border rounded p-2 w-full"
          />
        </div>
      </div>

      {/* DETAILS */}
      <div className="border rounded-lg overflow-hidden">
        <VoucherDetails
          rows={rows}
          ledgers={ledgers}
          updateRow={updateRow}
          addRow={addRow}
          removeRow={removeRow}
        />
      </div>

      {/* TOTALS */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded p-4 font-bold bg-gray-50">
          <div className="flex justify-between">
            <span>
              Total Debit
            </span>

            <span>
              {totalDebit.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="border rounded p-4 font-bold bg-gray-50">
          <div className="flex justify-between">
            <span>
              Total Credit
            </span>

            <span>
              {totalCredit.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* BALANCE WARNING */}
      {totalDebit !==
        totalCredit && (
        <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded font-medium">
          Debit and Credit must
          be equal before saving.
        </div>
      )}

      {/* BUTTONS */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={
            saving ||
            totalDebit <= 0 ||
            totalCredit <= 0 ||
            totalDebit !==
              totalCredit
          }
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded"
        >
          {saving
            ? "Saving..."
            : editVoucher
            ? "Update Voucher"
            : "Save Voucher"}
        </button>

        <button
          type="button"
          onClick={handleReset}
          disabled={saving}
          className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-6 py-2 rounded"
        >
          {editVoucher
            ? "Cancel Edit"
            : "Reset"}
        </button>
      </div>
    </form>
  );
}

export default VoucherForm;