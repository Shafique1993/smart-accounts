function VoucherDetails({
  rows,
  ledgers,
  updateRow,
  addRow,
  removeRow,
}) {
  return (
    <div className="bg-white rounded-lg shadow border overflow-hidden">

      <table className="w-full border-collapse">

        <thead>

          <tr className="bg-gray-100">

            <th className="border p-2 w-16">
              SL
            </th>

            <th className="border p-2">
              Ledger
            </th>

            <th className="border p-2 w-40">
              Debit
            </th>

            <th className="border p-2 w-40">
              Credit
            </th>

            <th className="border p-2">
              Remarks
            </th>

            <th className="border p-2 w-36">
              Action
            </th>

          </tr>

        </thead>

        <tbody>

          {rows.map((row, index) => (

            <tr key={index}>

              <td className="border p-2 text-center">
                {index + 1}
              </td>

              <td className="border p-2">

                <select
                  value={row.ledger_id}
                  onChange={(e) =>
                    updateRow(
                      index,
                      "ledger_id",
                      e.target.value
                    )
                  }
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

              </td>

              <td className="border p-2">

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.debit}
                  onChange={(e) =>
                    updateRow(
                      index,
                      "debit",
                      e.target.value
                    )
                  }
                  className="border rounded p-2 w-full"
                />

              </td>

              <td className="border p-2">

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.credit}
                  onChange={(e) =>
                    updateRow(
                      index,
                      "credit",
                      e.target.value
                    )
                  }
                  className="border rounded p-2 w-full"
                />

              </td>

              <td className="border p-2">

                <input
                  type="text"
                  value={row.remarks}
                  onChange={(e) =>
                    updateRow(
                      index,
                      "remarks",
                      e.target.value
                    )
                  }
                  className="border rounded p-2 w-full"
                  placeholder="Remarks"
                />

              </td>

              <td className="border p-2">

                <div className="flex justify-center gap-2">

                  <button
                    type="button"
                    onClick={addRow}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded"
                  >
                    +
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      removeRow(index)
                    }
                    disabled={rows.length === 1}
                    className={`px-3 py-2 rounded text-white ${
                      rows.length === 1
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    −
                  </button>

                </div>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

      <div className="flex justify-between items-center p-4 bg-gray-50 border-t">

        <button
          type="button"
          onClick={addRow}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          + Add New Row
        </button>

        <span className="text-sm text-gray-500">
          Total Rows : {rows.length}
        </span>

      </div>

    </div>
  );
}

export default VoucherDetails;