function TransactionTable() {
  const transactions = [
    {
      date: "02 Aug 2026",
      description: "Salary",
      type: "Income",
      amount: "৳50,000",
    },
    {
      date: "02 Aug 2026",
      description: "Office Rent",
      type: "Expense",
      amount: "৳15,000",
    },
    {
      date: "01 Aug 2026",
      description: "Internet Bill",
      type: "Expense",
      amount: "৳2,000",
    },
    {
      date: "01 Aug 2026",
      description: "Client Payment",
      type: "Income",
      amount: "৳30,000",
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-md mt-8 overflow-hidden">
      <div className="p-5 border-b">
        <h2 className="text-xl font-bold">
          Recent Transactions
        </h2>
      </div>

      <table className="w-full">
        <thead className="bg-slate-100">
          <tr>
            <th className="text-left p-4">Date</th>
            <th className="text-left p-4">Description</th>
            <th className="text-left p-4">Type</th>
            <th className="text-right p-4">Amount</th>
          </tr>
        </thead>

        <tbody>
          {transactions.map((item, index) => (
            <tr key={index} className="border-b hover:bg-slate-50">
              <td className="p-4">{item.date}</td>
              <td className="p-4">{item.description}</td>

              <td className="p-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    item.type === "Income"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {item.type}
                </span>
              </td>

              <td className="p-4 text-right font-semibold">
                {item.amount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TransactionTable;