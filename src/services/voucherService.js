import { supabase } from "../lib/supabase";

// ===============================
// GET NEXT VOUCHER NUMBER
// ===============================
export async function getVoucherNo(voucherType) {
  const { data, error } = await supabase.rpc(
    "generate_voucher_no",
    {
      vtype: voucherType,
    }
  );

  if (error) throw error;

  return data;
}

// ===============================
// GET ACTIVE LEDGERS
// ===============================
export async function getAllLedgers() {
  const { data, error } = await supabase
    .from("coa_accounts")
    .select("id, account_code, account_name")
    .eq("is_active", true)
    .order("account_code");

  if (error) throw error;

  return data || [];
}

// ===============================
// CALCULATE TOTALS
// ===============================
export function calculateTotals(rows) {
  const totalDebit = rows.reduce(
    (sum, row) => sum + Number(row.debit || 0),
    0
  );

  const totalCredit = rows.reduce(
    (sum, row) => sum + Number(row.credit || 0),
    0
  );

  return {
    totalDebit,
    totalCredit,
  };
}

// ===============================
// VALIDATE VOUCHER
// ===============================
export function validateVoucher(rows) {
  if (rows.length < 2) {
    throw new Error(
      "Minimum two ledger rows required."
    );
  }

  const { totalDebit, totalCredit } =
    calculateTotals(rows);

  if (totalDebit <= 0) {
    throw new Error("Debit amount required.");
  }

  if (totalCredit <= 0) {
    throw new Error("Credit amount required.");
  }

  if (totalDebit !== totalCredit) {
    throw new Error(
      "Debit and Credit are not equal."
    );
  }

  for (const row of rows) {
    if (!row.ledger_id) {
      throw new Error("Please select ledger.");
    }
  }

  return {
    totalDebit,
    totalCredit,
  };
}

// ===============================
// SAVE NEW VOUCHER
// ===============================
export async function saveVoucher(voucher, rows) {
  const { totalDebit, totalCredit } =
    validateVoucher(rows);

  // Voucher Master
  const { data: master, error: masterError } =
    await supabase
      .from("vouchers")
      .insert([
        {
          voucher_no: voucher.voucher_no,
          voucher_type: voucher.voucher_type,
          voucher_date: voucher.voucher_date,
          reference_no: voucher.reference_no,
          narration: voucher.narration,
          total_debit: totalDebit,
          total_credit: totalCredit,
        },
      ])
      .select()
      .single();

  if (masterError) throw masterError;

  // Voucher Details
  const details = rows.map((row) => ({
    voucher_id: master.id,
    ledger_id: Number(row.ledger_id),
    debit: Number(row.debit || 0),
    credit: Number(row.credit || 0),
    remarks: row.remarks || "",
  }));

  const { error: detailError } = await supabase
    .from("voucher_details")
    .insert(details);

  if (detailError) throw detailError;

  return master;
}

// ===============================
// GET ALL VOUCHERS
// ===============================
export async function getVoucherList() {
  const { data, error } = await supabase
    .from("vouchers")
    .select("*")
    .order("voucher_date", {
      ascending: false,
    });

  if (error) throw error;

  return data || [];
}

// ===============================
// GET VOUCHER DETAILS
// ===============================
export async function getVoucherDetails(
  voucherId
) {
  const { data, error } = await supabase
    .from("voucher_details")
    .select(`
      *,
      coa_accounts(
        account_code,
        account_name
      )
    `)
    .eq("voucher_id", voucherId)
    .order("id");

  if (error) throw error;

  return data || [];
}

// ===============================
// UPDATE VOUCHER
// ===============================
export async function updateVoucher(
  voucherId,
  voucher,
  rows
) {
  const { totalDebit, totalCredit } =
    validateVoucher(rows);

  // Update Voucher Master
  const { error: masterError } = await supabase
    .from("vouchers")
    .update({
      voucher_type: voucher.voucher_type,
      voucher_date: voucher.voucher_date,
      reference_no: voucher.reference_no,
      narration: voucher.narration,
      total_debit: totalDebit,
      total_credit: totalCredit,
    })
    .eq("id", voucherId);

  if (masterError) throw masterError;

  // Delete old details
  const { error: deleteError } = await supabase
    .from("voucher_details")
    .delete()
    .eq("voucher_id", voucherId);

  if (deleteError) throw deleteError;

  // Insert updated details
  const details = rows.map((row) => ({
    voucher_id: voucherId,
    ledger_id: Number(row.ledger_id),
    debit: Number(row.debit || 0),
    credit: Number(row.credit || 0),
    remarks: row.remarks || "",
  }));

  const { error: detailError } = await supabase
    .from("voucher_details")
    .insert(details);

  if (detailError) throw detailError;

  return {
    id: voucherId,
    ...voucher,
    total_debit: totalDebit,
    total_credit: totalCredit,
  };
}

// ===============================
// DELETE VOUCHER
// ===============================
export async function deleteVoucher(id) {
  // Delete voucher details first
  const { error: detailError } = await supabase
    .from("voucher_details")
    .delete()
    .eq("voucher_id", id);

  if (detailError) throw detailError;

  // Delete voucher master
  const { error } = await supabase
    .from("vouchers")
    .delete()
    .eq("id", id);

  if (error) throw error;
}