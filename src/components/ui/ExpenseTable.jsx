function ExpenseTable({ expenseList, deleteExpense }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 mt-6">
      <h2 className="text-xl font-bold mb-4">
        Expense List
      </h2>

      {expenseList.length === 0 ? (
        <p className="text-gray-500">
          No expense added yet.
        </p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Category</th>
              <th className="text-left p-3">Description</th>
              <th className="text-right p-3">Amount</th>
              <th className="text-center p-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {expenseList.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="p-3">{item.date}</td>
                <td className="p-3">{item.category}</td>
                <td className="p-3">{item.description}</td>
                <td className="p-3 text-right">
                  ৳ {item.amount}
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => deleteExpense(index)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ExpenseTable;