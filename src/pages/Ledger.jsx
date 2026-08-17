import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function Ledger() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [selectedAccount, setSelectedAccount] = useState("");
  const [search, setSearch] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    loadLedgerData();
  }, []);

  async function loadLedgerData() {
    try {
      setLoading(true);

      const { data: accountData, error: accountError } =
        await supabase
          .from("coa_accounts")
          .select(
            "id, account_code, account_name, account_type, opening_balance"
          )
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
            voucher_id,
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
          .order("id", {
            ascending: true,
          });

      if (transactionError) throw transactionError;

      setAccounts(accountData || []);
      setTransactions(transactionData || []);
    } catch (error) {
      console.error("Ledger Error:", error);

      alert(
        error?.message ||
          "Failed to load ledger."
      );
    } finally {
      setLoading(false);
    }
  }

  const selectedAccountData = useMemo(() => {
    return accounts.find(
      (account) =>
        String(account.id) ===
        String(selectedAccount)
    );
  }, [accounts, selectedAccount]);

  const accountTransactions = useMemo(() => {
    if (!selectedAccount) return [];

    return transactions.filter(
      (item) =>
        String(item.ledger_id) ===
        String(selectedAccount)
    );
  }, [transactions, selectedAccount]);

  const filteredRows = useMemo(() => {
    const text = search.toLowerCase().trim();

    return accountTransactions.filter((item) => {
      const voucherDate =
        item.vouchers?.voucher_date || "";

      if (fromDate && voucherDate < fromDate) {
        return false;
      }

      if (toDate && voucherDate > toDate) {
        return false;
      }

      if (!text) return true;

      return (
        String(item.vouchers?.voucher_no || "")
          .toLowerCase()
          .includes(text) ||
        String(item.vouchers?.voucher_type || "")
          .toLowerCase()
          .includes(text) ||
        String(item.vouchers?.reference_no || "")
          .toLowerCase()
          .includes(text) ||
        String(item.remarks || "")
          .toLowerCase()
          .includes(text) ||
        String(item.vouchers?.narration || "")
          .toLowerCase()
          .includes(text)
      );
    });
  }, [
    accountTransactions,
    search,
    fromDate,
    toDate,
  ]);

  const ledgerData = useMemo(() => {
    let runningBalance = Number(
      selectedAccountData?.opening_balance || 0
    );

    const sortedRows = [...filteredRows].sort(
      (a, b) => {
        const dateA =
          a.vouchers?.voucher_date || "";

        const dateB =
          b.vouchers?.voucher_date || "";

        if (dateA !== dateB) {
          return dateA.localeCompare(dateB);
        }

        return (
          Number(a.id || 0) -
          Number(b.id || 0)
        );
      }
    );

    return sortedRows.map((item) => {
      const debit = Number(item.debit || 0);
      const credit = Number(item.credit || 0);

      runningBalance +=
        debit - credit;

      return {
        ...item,
        debit,
        credit,
        runningBalance,
      };
    });
  }, [
    filteredRows,
    selectedAccountData,
  ]);

  const totalDebit = ledgerData.reduce(
    (sum, row) =>
      sum + Number(row.debit || 0),
    0
  );

  const totalCredit = ledgerData.reduce(
    (sum, row) =>
      sum + Number(row.credit || 0),
    0
  );

  const openingBalance = Number(
    selectedAccountData?.opening_balance || 0
  );

  const closingBalance =
    openingBalance +
    totalDebit -
    totalCredit;

  function handleAccountChange(e) {
    setSelectedAccount(e.target.value);
    setSearch("");
    setFromDate("");
    setToDate("");
  }

  function handleResetFilters() {
    setSearch("");
    setFromDate("");
    setToDate("");
  }

  function handlePrint() {
    window.print();
  }

  async function generatePDF() {
    if (!selectedAccountData) {
      alert("Please select a ledger account first.");
      return;
    }

    try {
      setPdfLoading(true);

      const element =
        document.getElementById(
          "ledger-pdf-content"
        );

      if (!element) {
        throw new Error(
          "Ledger content not found."
        );
      }

      const canvas =
        await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        });

      const imageData =
        canvas.toDataURL(
          "image/png",
          1.0
        );

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth =
        pdf.internal.pageSize.getWidth();

      const pageHeight =
        pdf.internal.pageSize.getHeight();

      const margin = 8;

      const usableWidth =
        pageWidth - margin * 2;

      const imageHeight =
        (canvas.height * usableWidth) /
        canvas.width;

      let heightLeft = imageHeight;
      let position = margin;

      pdf.addImage(
        imageData,
        "PNG",
        margin,
        position,
        usableWidth,
        imageHeight
      );

      heightLeft -=
        pageHeight - margin * 2;

      while (heightLeft > 0) {
        position =
          margin -
          (imageHeight - heightLeft);

        pdf.addPage();

        pdf.addImage(
          imageData,
          "PNG",
          margin,
          position,
          usableWidth,
          imageHeight
        );

        heightLeft -=
          pageHeight - margin * 2;
      }

      const accountCode =
        selectedAccountData.account_code ||
        "ledger";

      const accountName =
        selectedAccountData.account_name ||
        "account";

      const safeFileName =
        `${accountCode}-${accountName}`
          .replace(
            /[^a-zA-Z0-9-_]/g,
            "_"
          );

      pdf.save(
        `${safeFileName}-ledger.pdf`
      );
    } catch (error) {
      console.error(
        "PDF Error:",
        error
      );

      alert(
        error?.message ||
          "Failed to generate PDF."
      );
    } finally {
      setPdfLoading(false);
    }
  }

  function handlePDFPreview() {
    if (!selectedAccountData) {
      alert("Please select a ledger account first.");
      return;
    }

    const element =
      document.getElementById(
        "ledger-pdf-content"
      );

    if (!element) {
      alert("Ledger content not found.");
      return;
    }

    const previewWindow =
      window.open(
        "",
        "_blank",
        "width=1200,height=800"
      );

    if (!previewWindow) {
      alert(
        "Please allow pop-ups for this website."
      );
      return;
    }

    previewWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ledger PDF Preview</title>

        <style>
          body {
            margin: 0;
            padding: 30px;
            background: #e5e7eb;
            font-family: Arial, sans-serif;
          }

          .preview-toolbar {
            position: sticky;
            top: 0;
            background: white;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          }

          button {
            padding: 10px 18px;
            border: 0;
            border-radius: 6px;
            background: #2563eb;
            color: white;
            font-size: 14px;
            cursor: pointer;
            margin-right: 10px;
          }

          .paper {
            background: white;
            max-width: 1100px;
            margin: auto;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th,
          td {
            border: 1px solid #999;
            padding: 7px;
          }

          th {
            background: #f3f4f6;
          }

          @media print {
            body {
              background: white;
              padding: 0;
            }

            .preview-toolbar {
              display: none;
            }

            .paper {
              box-shadow: none;
              max-width: none;
            }
          }
        </style>
      </head>

      <body>

        <div class="preview-toolbar">
          <button onclick="window.print()">
            Print / Save as PDF
          </button>

          <button onclick="window.close()">
            Close
          </button>
        </div>

        <div class="paper">
          ${element.innerHTML}
        </div>

      </body>
      </html>
    `);

    previewWindow.document.close();
  }

  if (loading) {
    return (
      <div className="p-6">
        Loading Ledger...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 print:p-0">

      {/* SCREEN HEADER */}

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 print:hidden">

        <div>
          <h1 className="text-3xl font-bold">
            Ledger
          </h1>

          <p className="text-gray-500 mt-1">
            Account-wise transaction ledger
          </p>
        </div>

        <div className="flex flex-wrap gap-3">

          <button
            type="button"
            onClick={loadLedgerData}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-lg"
          >
            Refresh
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={!selectedAccount}
            className="bg-gray-700 hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold px-5 py-3 rounded-lg"
          >
            Print
          </button>

          <button
            type="button"
            onClick={handlePDFPreview}
            disabled={!selectedAccount}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold px-5 py-3 rounded-lg"
          >
            PDF Preview
          </button>

          <button
            type="button"
            onClick={generatePDF}
            disabled={
              !selectedAccount ||
              pdfLoading
            }
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold px-5 py-3 rounded-lg"
          >
            {pdfLoading
              ? "Generating..."
              : "Download PDF"}
          </button>

        </div>

      </div>

      {/* ACCOUNT SELECT */}

      <div className="bg-white border rounded-xl shadow p-5 print:hidden">

        <label className="block font-semibold mb-2">
          Select Ledger Account
        </label>

        <select
          value={selectedAccount}
          onChange={handleAccountChange}
          className="border rounded-lg px-4 py-3 w-full md:w-1/2"
        >
          <option value="">
            -- Select Account --
          </option>

          {accounts.map((account) => (
            <option
              key={account.id}
              value={account.id}
            >
              {account.account_code} -{" "}
              {account.account_name}
            </option>
          ))}
        </select>

      </div>

      {selectedAccount ? (
        <>

          {/* PDF / PRINT CONTENT */}

          <div
            id="ledger-pdf-content"
            className="bg-white p-4 md:p-6"
          >

            {/* ACCOUNT HEADER */}

            <div className="border rounded-xl p-5 mb-6">

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                <div>
                  <p className="text-sm text-gray-500">
                    Account Code
                  </p>

                  <p className="text-lg font-bold">
                    {selectedAccountData?.account_code}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Account Name
                  </p>

                  <p className="text-lg font-bold">
                    {selectedAccountData?.account_name}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Account Type
                  </p>

                  <p className="text-lg font-bold">
                    {selectedAccountData?.account_type ||
                      "-"}
                  </p>
                </div>

              </div>

            </div>

            {/* FILTER */}

            <div className="bg-white border rounded-xl shadow p-5 mb-6 print:hidden">

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                <div>
                  <label className="block text-sm font-medium mb-1">
                    From Date
                  </label>

                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) =>
                      setFromDate(
                        e.target.value
                      )
                    }
                    className="border rounded-lg px-4 py-3 w-full"
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
                      setToDate(
                        e.target.value
                      )
                    }
                    className="border rounded-lg px-4 py-3 w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Search
                  </label>

                  <input
                    type="text"
                    value={search}
                    onChange={(e) =>
                      setSearch(
                        e.target.value
                      )
                    }
                    placeholder="Voucher / Reference / Remarks"
                    className="border rounded-lg px-4 py-3 w-full"
                  />
                </div>

                <div className="flex items-end">

                  <button
                    type="button"
                    onClick={
                      handleResetFilters
                    }
                    className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-5 py-3 rounded-lg w-full"
                  >
                    Reset Filters
                  </button>

                </div>

              </div>

            </div>

            {/* SUMMARY */}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">

              <div className="border rounded-xl p-5">
                <p className="text-sm text-gray-500">
                  Opening Balance
                </p>

                <p className="text-xl font-bold mt-2">
                  {openingBalance.toFixed(2)}
                </p>
              </div>

              <div className="border rounded-xl p-5">
                <p className="text-sm text-gray-500">
                  Total Debit
                </p>

                <p className="text-xl font-bold mt-2">
                  {totalDebit.toFixed(2)}
                </p>
              </div>

              <div className="border rounded-xl p-5">
                <p className="text-sm text-gray-500">
                  Total Credit
                </p>

                <p className="text-xl font-bold mt-2">
                  {totalCredit.toFixed(2)}
                </p>
              </div>

              <div className="border rounded-xl p-5">
                <p className="text-sm text-gray-500">
                  Closing Balance
                </p>

                <p className="text-xl font-bold mt-2">
                  {closingBalance.toFixed(2)}
                </p>
              </div>

            </div>

            {/* PRINT HEADER */}

            <div className="text-center mb-6">

              <h1 className="text-2xl font-bold">
                SMART ACCOUNTS
              </h1>

              <h2 className="text-xl font-bold mt-2">
                Ledger
              </h2>

              <p className="mt-1">
                {selectedAccountData?.account_code} -{" "}
                {selectedAccountData?.account_name}
              </p>

              {(fromDate || toDate) && (
                <p className="text-sm mt-1">
                  {fromDate || "Beginning"}{" "}
                  to{" "}
                  {toDate || "Present"}
                </p>
              )}

            </div>

            {/* TABLE */}

            <div className="border rounded-xl overflow-hidden">

              <div className="overflow-x-auto">

                <table className="w-full border-collapse">

                  <thead>

                    <tr className="bg-gray-100">

                      <th className="border p-3 text-left">
                        Date
                      </th>

                      <th className="border p-3 text-left">
                        Voucher No
                      </th>

                      <th className="border p-3 text-left">
                        Type
                      </th>

                      <th className="border p-3 text-left">
                        Reference
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

                      <th className="border p-3 text-left">
                        Remarks
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {ledgerData.length === 0 ? (

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

                      ledgerData.map((row) => (

                        <tr key={row.id}>

                          <td className="border p-3">
                            {row.vouchers?.voucher_date ||
                              "-"}
                          </td>

                          <td className="border p-3 font-medium">
                            {row.vouchers?.voucher_no ||
                              "-"}
                          </td>

                          <td className="border p-3">
                            {row.vouchers?.voucher_type ||
                              "-"}
                          </td>

                          <td className="border p-3">
                            {row.vouchers?.reference_no ||
                              "-"}
                          </td>

                          <td className="border p-3 text-right">
                            {row.debit.toFixed(2)}
                          </td>

                          <td className="border p-3 text-right">
                            {row.credit.toFixed(2)}
                          </td>

                          <td className="border p-3 text-right font-semibold">
                            {row.runningBalance.toFixed(
                              2
                            )}
                          </td>

                          <td className="border p-3">
                            {row.remarks ||
                              row.vouchers?.narration ||
                              "-"}
                          </td>

                        </tr>

                      ))

                    )}

                  </tbody>

                  {ledgerData.length > 0 && (

                    <tfoot>

                      <tr className="bg-gray-100 font-bold">

                        <td
                          colSpan="4"
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

                        <td className="border p-3 text-right">
                          {closingBalance.toFixed(2)}
                        </td>

                        <td className="border p-3"></td>

                      </tr>

                    </tfoot>

                  )}

                </table>

              </div>

            </div>

          </div>

        </>

      ) : (

        <div className="bg-white border rounded-xl shadow p-10 text-center text-gray-500">
          Select an account to view its ledger.
        </div>

      )}

      {/* PRINT CSS */}

      <style>
        {`
          @media print {
            @page {
              size: landscape;
              margin: 10mm;
            }

            body {
              background: white !important;
            }

            #ledger-pdf-content {
              width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
              background: white !important;
            }

            #ledger-pdf-content table {
              font-size: 10px;
            }

            #ledger-pdf-content th,
            #ledger-pdf-content td {
              padding: 5px;
            }

            .print\\:hidden {
              display: none !important;
            }

            .print\\:p-0 {
              padding: 0 !important;
            }

            button,
            input,
            select {
              display: none !important;
            }
          }
        `}
      </style>

    </div>
  );
}

export default Ledger;