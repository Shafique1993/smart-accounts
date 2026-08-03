import MainLayout from "../components/layout/MainLayout";
import Card from "../components/ui/Card";
import TransactionTable from "../components/ui/TransactionTable";

function Dashboard() {
  return (
    <MainLayout>
    <div className="grid grid-cols-4 gap-6">
  <Card
    title="Cash Balance"
    value="৳ 25,000"
    color="#22C55E"
  />

  <Card
    title="Total Income"
    value="৳ 150,000"
    color="#3B82F6"
  />

  <Card
    title="Total Expense"
    value="৳ 95,000"
    color="#EF4444"
  />

  <Card
    title="Net Balance"
    value="৳ 55,000"
    color="#8B5CF6"
  />
</div>
<TransactionTable />
    </MainLayout>
  );
}

export default Dashboard;