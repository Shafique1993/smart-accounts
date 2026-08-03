import { useState, useEffect } from "react";
import MainLayout from "../components/layout/MainLayout";
import IncomeForm from "../components/ui/IncomeForm";
import IncomeTable from "../components/ui/IncomeTable";

function Income() {
  const [incomeList, setIncomeList] = useState([]);
  useEffect(() => {
  const savedIncome = localStorage.getItem("incomeList");

  if (savedIncome) {
    setIncomeList(JSON.parse(savedIncome));
  }
}, []);
useEffect(() => {
  localStorage.setItem(
    "incomeList",
    JSON.stringify(incomeList)
  );
}, [incomeList]);
  const addIncome = (income) => {
    setIncomeList([...incomeList, income]);
  };

  const deleteIncome = (index) => {
    const updatedList = incomeList.filter((_, i) => i !== index);
    setIncomeList(updatedList);
  };

  return (
    <MainLayout>
      <h1 className="text-3xl font-bold mb-6">
        Income
      </h1>

      <IncomeForm addIncome={addIncome} />

      <IncomeTable
        incomeList={incomeList}
        deleteIncome={deleteIncome}
      />
    </MainLayout>
  );
}

export default Income;