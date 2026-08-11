import { supabase } from "../lib/supabase";

export async function getAllLedgers() {
  const { data, error } = await supabase
    .from("coa_accounts")
    .select("*")
    .order("account_code", {
      ascending: true,
    });

  if (error) throw error;

  return data || [];
}

export async function getLedgerTransactions(
  ledgerId
) {
  const { data, error } = await supabase
    .from("voucher_details")
    .select(`
      id,
      voucher_id,
      ledger_id,
      debit,
      credit,
      remarks,
      vouchers (
        id,
        voucher_no,
        voucher_type,
        voucher_date,
        reference_no,
        narration
      )
    `)
    .eq("ledger_id", ledgerId);

  if (error) throw error;

  const transactions = data || [];

  transactions.sort((a, b) => {
    const dateA =
      a.vouchers?.voucher_date || "";

    const dateB =
      b.vouchers?.voucher_date || "";

    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }

    return String(a.id).localeCompare(
      String(b.id)
    );
  });

  return transactions;
}

export function calculateLedgerBalance(
  ledger,
  transactions
) {
  const openingBalance = Number(
    ledger?.opening_balance || 0
  );

  const openingType =
    ledger?.opening_balance_type ||
    ledger?.opening_type ||
    "Debit";

  let totalDebit = 0;
  let totalCredit = 0;

  transactions.forEach((row) => {
    totalDebit += Number(row.debit || 0);
    totalCredit += Number(row.credit || 0);
  });

  let currentBalance;

  if (
    String(openingType).toLowerCase() ===
    "credit"
  ) {
    currentBalance =
      -openingBalance +
      totalDebit -
      totalCredit;
  } else {
    currentBalance =
      openingBalance +
      totalDebit -
      totalCredit;
  }

  return {
    openingBalance,
    openingType,
    totalDebit,
    totalCredit,
    currentBalance,
  };
}

export function calculateRunningBalance(
  ledger,
  transactions
) {
  const openingBalance = Number(
    ledger?.opening_balance || 0
  );

  const openingType =
    ledger?.opening_balance_type ||
    ledger?.opening_type ||
    "Debit";

  let runningBalance =
    String(openingType).toLowerCase() ===
    "credit"
      ? -openingBalance
      : openingBalance;

  return transactions.map((row) => {
    const debit = Number(row.debit || 0);
    const credit = Number(row.credit || 0);

    runningBalance += debit - credit;

    return {
      ...row,
      running_balance: runningBalance,
      running_balance_type:
        runningBalance >= 0 ? "Debit" : "Credit",
    };
  });
}