import { useState, useEffect } from "react";
import MainLayout from "../components/layout/MainLayout";
import ExpenseForm from "../components/ui/ExpenseForm";
import ExpenseTable from "../components/ui/ExpenseTable";

function Expense() {
  const [expenseList, setExpenseList] = useState([]);

  useEffect(() => {
    const savedExpense = localStorage.getItem("expenseList");

    if (savedExpense) {
      setExpenseList(JSON.parse(savedExpense));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "expenseList",
      JSON.stringify(expenseList)
    );
  }, [expenseList]);

  const addExpense = (expense) => {
    setExpenseList([...expenseList, expense]);
  };

  const deleteExpense = (index) => {
    const updatedList = expenseList.filter((_, i) => i !== index);
    setExpenseList(updatedList);
  };

  return (
    <MainLayout>
      <h1 className="text-3xl font-bold mb-6">
        Expense
      </h1>

      <ExpenseForm addExpense={addExpense} />

      <ExpenseTable
        expenseList={expenseList}
        deleteExpense={deleteExpense}
      />
    </MainLayout>
  );
}

export default Expense;