import { useState } from "react";
import VoucherForm from "../modules/transactions/VoucherForm";
import VoucherList from "../modules/transactions/VoucherList";

function Vouchers() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [editVoucher, setEditVoucher] = useState(null);

  function handleSaved() {
    setEditVoucher(null);
    setRefreshKey((prev) => prev + 1);
  }

  function handleEdit(voucher) {
    setEditVoucher(voucher);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleCancelEdit() {
    setEditVoucher(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Voucher Management
        </h1>

        <p className="text-gray-500 mt-2">
          Journal, Payment, Receipt & Contra Voucher
        </p>
      </div>

      <div className="bg-white rounded-lg shadow border p-6">
        <VoucherForm
          key={
            editVoucher
              ? `edit-${editVoucher.id}`
              : `new-${refreshKey}`
          }
          editVoucher={editVoucher}
          onSaved={handleSaved}
          onCancelEdit={handleCancelEdit}
        />
      </div>

      <div className="bg-white rounded-lg shadow border p-6">
        <VoucherList
          refreshKey={refreshKey}
          onEdit={handleEdit}
        />
      </div>
    </div>
  );
}

export default Vouchers;