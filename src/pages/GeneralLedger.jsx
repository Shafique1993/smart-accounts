import { useEffect, useState } from "react";
import {
  getAllLedgers,
  getLedgerTransactions,
} from "../services/ledgerService";

function GeneralLedger() {
  const [ledgers, setLedgers] = useState([]);
  const [ledgerId, setLedgerId] = useState("");
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    loadLedgers();
  }, []);

  async function loadLedgers() {
    try {
      const data = await getAllLedgers();
      setLedgers(data);
    } catch (err) {
      alert(err.message);
    }
  }

  async function loadLedger(id) {
    setLedgerId(id);

    if (!id) {
      setTransactions([]);
      return;
    }

    try {
      const data = await getLedgerTransactions(id);
      setTransactions(data);
    } catch (err) {
      alert(err.message);
    }
  }

  let runningBalance = 0;

  return (
    <div className="space-y-6">

      <div>

        <h1 className="text-3xl font-bold">
          General Ledger
        </h1>

        <p className="text-gray-500">
          Ledger Wise Transactions
        </p>

      </div>

      <select
        value={ledgerId}
        onChange={(e) => loadLedger(e.target.value)}
        className="border rounded p-2 w-full"
      >
        <option value="">
          Select Ledger
        </option>

        {ledgers.map((ledger) => (
          <option
            key={ledger.id}
            value={ledger.id}
          >
            {ledger.account_code} - {ledger.account_name}
          </option>
        ))}
      </select>

      <table className="w-full border">

        <thead>

          <tr className="bg-gray-100">

            <th className="border p-2">
              Date
            </th>

            <th className="border p-2">
              Voucher
            </th>

            <th className="border p-2">
              Debit
            </th>

            <th className="border p-2">
              Credit
            </th>

            <th className="border p-2">
              Balance
            </th>

          </tr>

        </thead>

        <tbody>

          {transactions.map((row) => {

            runningBalance +=
              Number(row.debit) -
              Number(row.credit);

            return (
              <tr key={row.id}>

                <td className="border p-2">
                  {row.vouchers.voucher_date}
                </td>

                <td className="border p-2">
                  {row.vouchers.voucher_no}
                </td>

                <td className="border p-2 text-right">
                  {Number(row.debit).toFixed(2)}
                </td>

                <td className="border p-2 text-right">
                  {Number(row.credit).toFixed(2)}
                </td>

                <td className="border p-2 text-right">
                  {runningBalance.toFixed(2)}
                </td>

              </tr>
            );

          })}

        </tbody>

      </table>

    </div>
  );
}

export default GeneralLedger;