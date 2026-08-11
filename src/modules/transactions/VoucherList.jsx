import { useEffect, useMemo, useState } from "react";
import {
  getVoucherList,
  getVoucherDetails,
  deleteVoucher,
} from "../../services/voucherService";
import { supabase } from "../../lib/supabase";

function VoucherList({ refreshKey, onEdit }) {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // View Modal
  const [showView, setShowView] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [details, setDetails] = useState([]);
  const [viewLoading, setViewLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  async function loadData() {
    try {
      setLoading(true);

      const data = await getVoucherList();

      setVouchers(data || []);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  // ===============================
  // CHECK ACCOUNTING PERIOD
  // ===============================
  async function getVoucherPeriod(voucherDate) {
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

    return data;
  }

  // ===============================
  // DELETE
  // ===============================
  async function handleDelete(voucher) {
    try {
      const period = await getVoucherPeriod(
        voucher.voucher_date
      );

      if (!period) {
        alert(
          "No accounting period found for this voucher date."
        );
        return;
      }

      if (period.status === "Closed") {
        alert(
          `This voucher belongs to closed accounting period "${period.period_name}". It cannot be deleted.`
        );
        return;
      }

      const ok = window.confirm(
        "Delete this voucher?"
      );

      if (!ok) return;

      await deleteVoucher(voucher.id);

      alert(
        "Voucher Deleted Successfully."
      );

      await loadData();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }

  // ===============================
  // VIEW
  // ===============================
  async function handleView(voucher) {
    try {
      setViewLoading(true);

      const data = await getVoucherDetails(
        voucher.id
      );

      setSelectedVoucher(voucher);
      setDetails(data || []);
      setShowView(true);
    } catch (error) {
      alert(error.message);
    } finally {
      setViewLoading(false);
    }
  }

  // ===============================
  // EDIT
  // ===============================
  async function handleEdit(voucher) {
    try {
      const period = await getVoucherPeriod(
        voucher.voucher_date
      );

      if (!period) {
        alert(
          "No accounting period found for this voucher date."
        );
        return;
      }

      if (period.status === "Closed") {
        alert(
          `This voucher belongs to closed accounting period "${period.period_name}". It cannot be edited.`
        );
        return;
      }

      if (onEdit) {
        onEdit(voucher);
        return;
      }

      alert(
        "Edit function is not connected."
      );
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }

  // ===============================
  // PRINT
  // ===============================
  function handlePrint(voucher) {
    const printWindow = window.open(
      "",
      "_blank",
      "width=900,height=700"
    );

    if (!printWindow) {
      alert(
        "Please allow popup window for printing."
      );
      return;
    }

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${voucher.voucher_no || "Voucher"}</title>

        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 30px;
            color: #000;
          }

          h1 {
            text-align: center;
            margin-bottom: 5px;
          }

          .company {
            text-align: center;
            font-size: 20px;
            font-weight: bold;
          }

          .title {
            text-align: center;
            font-size: 16px;
            margin-bottom: 25px;
          }

          .info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 25px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }

          th,
          td {
            border: 1px solid #000;
            padding: 8px;
          }

          th {
            background: #eee;
          }

          .right {
            text-align: right;
          }

          .total {
            font-weight: bold;
          }

          .narration {
            margin-top: 20px;
          }

          .signature {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            margin-top: 80px;
            text-align: center;
          }
        </style>
      </head>

      <body>

        <div class="company">
          SMART ACCOUNTS
        </div>

        <h1>Voucher</h1>

        <div class="title">
          ${voucher.voucher_type || ""}
        </div>

        <div class="info">

          <div>
            <strong>Voucher No:</strong>
            ${voucher.voucher_no || ""}
          </div>

          <div>
            <strong>Date:</strong>
            ${voucher.voucher_date || ""}
          </div>

          <div>
            <strong>Reference No:</strong>
            ${voucher.reference_no || "-"}
          </div>

          <div>
            <strong>Type:</strong>
            ${voucher.voucher_type || ""}
          </div>

        </div>

        <table>

          <thead>
            <tr>
              <th>SL</th>
              <th>Ledger</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Remarks</th>
            </tr>
          </thead>

          <tbody>

            ${details
              .map(
                (row, index) => `
                  <tr>

                    <td>
                      ${index + 1}
                    </td>

                    <td>
                      ${
                        row.coa_accounts
                          ?.account_code || ""
                      }
                      -
                      ${
                        row.coa_accounts
                          ?.account_name || ""
                      }
                    </td>

                    <td class="right">
                      ${Number(
                        row.debit || 0
                      ).toFixed(2)}
                    </td>

                    <td class="right">
                      ${Number(
                        row.credit || 0
                      ).toFixed(2)}
                    </td>

                    <td>
                      ${row.remarks || ""}
                    </td>

                  </tr>
                `
              )
              .join("")}

            <tr class="total">

              <td colspan="2">
                Total
              </td>

              <td class="right">
                ${Number(
                  voucher.total_debit || 0
                ).toFixed(2)}
              </td>

              <td class="right">
                ${Number(
                  voucher.total_credit || 0
                ).toFixed(2)}
              </td>

              <td></td>

            </tr>

          </tbody>

        </table>

        <div class="narration">
          <strong>Narration:</strong>
          ${voucher.narration || "-"}
        </div>

        <div class="signature">

          <div>
            Prepared By
          </div>

          <div>
            Checked By
          </div>

          <div>
            Approved By
          </div>

        </div>

      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();

    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 500);
  }

  // ===============================
  // FILTER
  // ===============================
  const filtered = useMemo(() => {
    const text = search
      .toLowerCase()
      .trim();

    if (!text) return vouchers;

    return vouchers.filter((item) => {
      return (
        (item.voucher_no || "")
          .toLowerCase()
          .includes(text) ||
        (item.voucher_type || "")
          .toLowerCase()
          .includes(text) ||
        (item.reference_no || "")
          .toLowerCase()
          .includes(text) ||
        (item.narration || "")
          .toLowerCase()
          .includes(text)
      );
    });
  }, [vouchers, search]);

  if (loading) {
    return (
      <div className="p-5 text-center">
        Loading Voucher List...
      </div>
    );
  }

  return (
    <div>

      <div className="flex justify-between items-center mb-5">

        <h2 className="text-2xl font-bold">
          Voucher List ({filtered.length})
        </h2>

        <input
          type="text"
          placeholder="Search Voucher..."
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
                Date
              </th>

              <th className="border p-2">
                Voucher No
              </th>

              <th className="border p-2">
                Type
              </th>

              <th className="border p-2">
                Reference
              </th>

              <th className="border p-2 text-right">
                Debit
              </th>

              <th className="border p-2 text-right">
                Credit
              </th>

              <th className="border p-2">
                Action
              </th>

            </tr>

          </thead>

          <tbody>

            {filtered.length === 0 ? (

              <tr>

                <td
                  colSpan={7}
                  className="border p-5 text-center"
                >
                  No Voucher Found
                </td>

              </tr>

            ) : (

              filtered.map((voucher) => (

                <tr key={voucher.id}>

                  <td className="border p-2">
                    {voucher.voucher_date}
                  </td>

                  <td className="border p-2 font-medium">
                    {voucher.voucher_no}
                  </td>

                  <td className="border p-2">
                    {voucher.voucher_type}
                  </td>

                  <td className="border p-2">
                    {voucher.reference_no || "-"}
                  </td>

                  <td className="border p-2 text-right">
                    {Number(
                      voucher.total_debit || 0
                    ).toFixed(2)}
                  </td>

                  <td className="border p-2 text-right">
                    {Number(
                      voucher.total_credit || 0
                    ).toFixed(2)}
                  </td>

                  <td className="border p-2">

                    <div className="flex gap-2 flex-wrap">

                      {/* VIEW */}
                      <button
                        type="button"
                        onClick={() =>
                          handleView(voucher)
                        }
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                      >
                        View
                      </button>

                      {/* EDIT */}
                      <button
                        type="button"
                        onClick={() =>
                          handleEdit(voucher)
                        }
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                      >
                        Edit
                      </button>

                      {/* DELETE */}
                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(voucher)
                        }
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                      >
                        Delete
                      </button>

                      {/* PRINT */}
                      <button
                        type="button"
                        onClick={() =>
                          handlePrint(voucher)
                        }
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                      >
                        Print
                      </button>

                    </div>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

      {/* VIEW MODAL */}

      {showView && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-5">

          <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl p-6 max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-center mb-5">

              <h2 className="text-2xl font-bold">
                Voucher Details
              </h2>

              <div className="flex gap-2">

                <button
                  type="button"
                  onClick={() =>
                    handlePrint(
                      selectedVoucher
                    )
                  }
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  Print
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setShowView(false)
                  }
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                >
                  Close
                </button>

              </div>

            </div>

            {viewLoading ? (

              <div className="text-center p-10">
                Loading Voucher Details...
              </div>

            ) : (

              <>

                <div className="grid grid-cols-2 gap-4 mb-5">

                  <div>
                    <strong>
                      Voucher No :
                    </strong>{" "}
                    {
                      selectedVoucher?.voucher_no
                    }
                  </div>

                  <div>
                    <strong>
                      Date :
                    </strong>{" "}
                    {
                      selectedVoucher?.voucher_date
                    }
                  </div>

                  <div>
                    <strong>
                      Type :
                    </strong>{" "}
                    {
                      selectedVoucher?.voucher_type
                    }
                  </div>

                  <div>
                    <strong>
                      Reference :
                    </strong>{" "}
                    {
                      selectedVoucher?.reference_no ||
                      "-"
                    }
                  </div>

                  <div className="col-span-2">

                    <strong>
                      Narration :
                    </strong>{" "}
                    {
                      selectedVoucher?.narration ||
                      "-"
                    }

                  </div>

                </div>

                <table className="w-full border-collapse">

                  <thead>

                    <tr className="bg-gray-100">

                      <th className="border p-2">
                        SL
                      </th>

                      <th className="border p-2">
                        Ledger
                      </th>

                      <th className="border p-2 text-right">
                        Debit
                      </th>

                      <th className="border p-2 text-right">
                        Credit
                      </th>

                      <th className="border p-2">
                        Remarks
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {details.length === 0 ? (

                      <tr>

                        <td
                          colSpan={5}
                          className="border p-5 text-center"
                        >
                          No Details Found
                        </td>

                      </tr>

                    ) : (

                      details.map(
                        (row, index) => (

                          <tr key={row.id}>

                            <td className="border p-2 text-center">
                              {index + 1}
                            </td>

                            <td className="border p-2">
                              {
                                row.coa_accounts
                                  ?.account_code
                              }{" "}
                              -{" "}
                              {
                                row.coa_accounts
                                  ?.account_name
                              }
                            </td>

                            <td className="border p-2 text-right">
                              {Number(
                                row.debit || 0
                              ).toFixed(2)}
                            </td>

                            <td className="border p-2 text-right">
                              {Number(
                                row.credit || 0
                              ).toFixed(2)}
                            </td>

                            <td className="border p-2">
                              {row.remarks || ""}
                            </td>

                          </tr>

                        )
                      )

                    )}

                  </tbody>

                </table>

                <div className="grid grid-cols-2 gap-4 mt-5">

                  <div className="border rounded p-3 font-bold text-right">

                    Total Debit:{" "}

                    {Number(
                      selectedVoucher?.total_debit ||
                        0
                    ).toFixed(2)}

                  </div>

                  <div className="border rounded p-3 font-bold text-right">

                    Total Credit:{" "}

                    {Number(
                      selectedVoucher?.total_credit ||
                        0
                    ).toFixed(2)}

                  </div>

                </div>

              </>

            )}

          </div>

        </div>

      )}

    </div>
  );
}

export default VoucherList;