import { supabase } from "../lib/supabase";

export async function getAllLedgers() {
  const { data, error } = await supabase
    .from("coa_accounts")
    .select("*")
    .order("account_code", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getNextAccountCode() {
  const { data, error } = await supabase
    .from("coa_accounts")
    .select("account_code")
    .order("account_code", { ascending: false })
    .limit(1);

  if (error) throw error;

  if (!data?.length) return "100001";

  return String(Number(data[0].account_code) + 1);
}

export async function checkDuplicateLedger(accountCode, accountName) {
  const { data, error } = await supabase
    .from("coa_accounts")
    .select("id, account_code, account_name")
    .or(`account_code.eq.${accountCode},account_name.eq.${accountName}`);

  if (error) throw error;

  return data;
}

export async function updateLedger(id, values) {
  const { error } = await supabase
    .from("coa_accounts")
    .update(values)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteLedger(id) {
  const { error } = await supabase
    .from("coa_accounts")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function toggleLedgerStatus(id, status) {
  const { error } = await supabase
    .from("coa_accounts")
    .update({
      is_active: !status,
    })
    .eq("id", id);

  if (error) throw error;
}