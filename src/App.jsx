import { Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Income from "./pages/Income";
import Expense from "./pages/Expense";

function App() {
  return (
    <Routes>
  <Route path="/" element={<Dashboard />} />
  <Route path="/income" element={<Income />} />
  <Route path="/expense" element={<Expense />} />
</Routes>
  );
}

export default App;