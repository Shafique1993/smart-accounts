import { useState } from "react";
function ExpenseForm({ addExpense }) {
const [date, setDate] = useState("");
const [category, setCategory] = useState("Salary");
const [description, setDescription] = useState("");
const [amount, setAmount] = useState("");
const handleSubmit = (e) => {
  e.preventDefault();

  const newExpense = {
    date,
    category,
    description,
    amount,
  };
  console.log(newExpense);

  addExpense(newExpense);

  setDate("");
  setCategory("Salary");
  setDescription("");
  setAmount("");
};
  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">
        Add New Expense
      </h2>

      <form
    onSubmit={handleSubmit}
  className="grid grid-cols-2 gap-4"
>

        <div>
          <label className="block mb-2 font-medium">
            Date
          </label>

          <input
            type="date"
            value={date}
             onChange={(e) => setDate(e.target.value)}
             className="w-full border rounded-lg p-3"
            />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Category
          </label>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border rounded-lg p-3"
>
            <option>Salary</option>
            <option>Business</option>
            <option>Freelancing</option>
            <option>Other</option>
            </select>
        </div>

        <div className="col-span-2">
          <label className="block mb-2 font-medium">
            Description
          </label>

          <input
            type="text"
            placeholder="Expense Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded-lg p-3"
            />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Amount
          </label>

          <input
            type="number"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border rounded-lg p-3"
            />
        </div>

        <div className="flex items-end">
          <button
          type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg"
          >
            Save Expense
          </button>
        </div>

      </form>
    </div>
  );
}

export default ExpenseForm;