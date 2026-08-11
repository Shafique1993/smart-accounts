import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import accountStructure from "../../data/accountStructure";

import {
  getNextAccountCode,
  checkDuplicateLedger,
  updateLedger,
} from "../../services/accountService";

const initialData = {
  account_code: "",
  account_name: "",
  category: "",
  group_name: "",
  sub_group: "",
  account_type: "Asset",
  opening_balance: 0,
  opening_type: "Debit",
};

function LedgerForm({
  editingLedger,
  setEditingLedger,
  onSaved,
}) {
  const [formData, setFormData] = useState(initialData);
  const [saving, setSaving] = useState(false);

  const [groups, setGroups] = useState([]);
  const [subGroups, setSubGroups] = useState([]);

  useEffect(() => {
    if (editingLedger) {
      loadEditData();
    } else {
      loadNextCode();
    }
  }, [editingLedger]);

  async function loadNextCode() {
    try {
      const code = await getNextAccountCode();

      setGroups([]);
      setSubGroups([]);

      setFormData({
        ...initialData,
        account_code: code,
      });
    } catch (error) {
      alert(error.message);
    }
  }

  function loadEditData() {
    const categoryObj = accountStructure.find(
      (item) => item.category === editingLedger.category
    );

    if (!categoryObj) return;

    const groupList = categoryObj.groups;

    const groupObj = groupList.find(
      (g) => g.name === editingLedger.group_name
    );

    const subList = groupObj ? groupObj.subGroups : [];

    setGroups(groupList);
    setSubGroups(subList);

    setFormData({
      account_code: editingLedger.account_code,
      account_name: editingLedger.account_name,
      category: editingLedger.category,
      group_name: editingLedger.group_name,
      sub_group: editingLedger.sub_group,
      account_type: editingLedger.account_type,
      opening_balance: editingLedger.opening_balance,
      opening_type: editingLedger.opening_type,
    });
  }

  function handleChange(e) {
    const { name, value } = e.target;

    if (name === "category") {
      const categoryObj = accountStructure.find(
        (item) => item.category === value
      );

      const groupList = categoryObj
        ? categoryObj.groups
        : [];

      setGroups(groupList);
      setSubGroups([]);

      setFormData((prev) => ({
        ...prev,
        category: value,
        group_name: "",
        sub_group: "",
      }));

      return;
    }

    if (name === "group_name") {
      const groupObj = groups.find(
        (g) => g.name === value
      );

      const subList = groupObj
        ? groupObj.subGroups
        : [];

      setSubGroups(subList);

      setFormData((prev) => ({
        ...prev,
        group_name: value,
        sub_group: "",
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }
    async function saveLedger(e) {
    e.preventDefault();

    if (
      !formData.account_name ||
      !formData.category ||
      !formData.group_name ||
      !formData.sub_group
    ) {
      alert("সব তথ্য পূরণ করুন");
      return;
    }

    try {
      setSaving(true);

      if (editingLedger) {
        const duplicate = await checkDuplicateLedger(
          formData.account_code,
          formData.account_name
        );

        const hasDuplicate = duplicate.some(
          (item) => item.id !== editingLedger.id
        );

        if (hasDuplicate) {
          alert("Duplicate Account Code or Account Name.");
          return;
        }

        await updateLedger(editingLedger.id, formData);

        alert("Ledger Updated Successfully");
      } else {
        const duplicate = await checkDuplicateLedger(
          formData.account_code,
          formData.account_name
        );

        if (duplicate.length > 0) {
          alert("Duplicate Account Code or Account Name.");
          return;
        }

        const { error } = await supabase
          .from("coa_accounts")
          .insert([formData]);

        if (error) throw error;

        alert("Ledger Saved Successfully");
      }

      if (onSaved) {
        await onSaved();
      }

      if (setEditingLedger) {
        setEditingLedger(null);
      }

      await loadNextCode();

    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    if (setEditingLedger) {
      setEditingLedger(null);
    }

    loadNextCode();
  }

  return (
        <form onSubmit={saveLedger} className="space-y-4">

      <div className="grid grid-cols-2 gap-4">

        {/* Account Code */}
        <div>
          <label className="block text-sm font-medium">
            Account Code
          </label>

          <input
            type="text"
            value={formData.account_code}
            readOnly
            className="border p-2 w-full bg-gray-100 rounded"
          />
        </div>


        {/* Account Name */}
        <div>
          <label className="block text-sm font-medium">
            Account Name
          </label>

          <input
            type="text"
            name="account_name"
            value={formData.account_name}
            onChange={handleChange}
            className="border p-2 w-full rounded"
          />
        </div>


        {/* Category */}
        <div>
          <label className="block text-sm font-medium">
            Category
          </label>

          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="border p-2 w-full rounded"
          >
            <option value="">
              Select Category
            </option>

            {accountStructure.map((item)=>(
              <option 
                key={item.category}
                value={item.category}
              >
                {item.category}
              </option>
            ))}

          </select>
        </div>



        {/* Group */}
        <div>
          <label className="block text-sm font-medium">
            Group
          </label>

          <select
            name="group_name"
            value={formData.group_name}
            onChange={handleChange}
            className="border p-2 w-full rounded"
          >

            <option value="">
              Select Group
            </option>


            {groups.map((group)=>(
              <option 
                key={group.name}
                value={group.name}
              >
                {group.name}
              </option>
            ))}

          </select>

        </div>


        {/* Sub Group */}
        <div>

          <label className="block text-sm font-medium">
            Sub Group
          </label>


          <select
            name="sub_group"
            value={formData.sub_group}
            onChange={handleChange}
            className="border p-2 w-full rounded"
          >

            <option value="">
              Select Sub Group
            </option>


            {subGroups.map((sub)=>(
              <option
                key={sub}
                value={sub}
              >
                {sub}
              </option>
            ))}


          </select>

        </div>


        {/* Account Type */}
        <div>

          <label className="block text-sm font-medium">
            Account Type
          </label>


          <select
            name="account_type"
            value={formData.account_type}
            onChange={handleChange}
            className="border p-2 w-full rounded"
          >

            <option value="Asset">
              Asset
            </option>

            <option value="Liability">
              Liability
            </option>

            <option value="Equity">
              Equity
            </option>

            <option value="Income">
              Income
            </option>

            <option value="Expense">
              Expense
            </option>

          </select>

        </div>


        {/* Opening Balance */}
        <div>

          <label className="block text-sm font-medium">
            Opening Balance
          </label>


          <input
            type="number"
            name="opening_balance"
            value={formData.opening_balance}
            onChange={handleChange}
            className="border p-2 w-full rounded"
          />

        </div>


        {/* Opening Type */}
        <div>

          <label className="block text-sm font-medium">
            Opening Type
          </label>


          <select
            name="opening_type"
            value={formData.opening_type}
            onChange={handleChange}
            className="border p-2 w-full rounded"
          >

            <option value="Debit">
              Debit
            </option>

            <option value="Credit">
              Credit
            </option>

          </select>

        </div>


      </div>


      <div className="flex gap-3">


        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-5 py-2 rounded"
        >

          {saving 
            ? "Saving..." 
            : editingLedger 
              ? "Update Ledger"
              : "Save Ledger"
          }

        </button>



        {editingLedger && (

          <button
            type="button"
            onClick={cancelEdit}
            className="bg-gray-500 text-white px-5 py-2 rounded"
          >

            Cancel

          </button>

        )}


      </div>


    </form>
  );
}

export default LedgerForm;