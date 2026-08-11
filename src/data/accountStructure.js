const accountStructure = [
  {
    category: "Assets",
    groups: [
      {
        name: "Non Current Assets",
        subGroups: [
          "Property, Plant & Equipment",
          "Intangible Assets",
          "Investment",
          "Long Term Receivable",
        ],
      },
      {
        name: "Current Assets",
        subGroups: [
          "Cash & Cash Equivalents",
          "Bank Accounts",
          "Accounts Receivable",
          "Inventory",
          "Advance & Deposits",
          "Other Current Assets",
        ],
      },
    ],
  },

  {
    category: "Equity & Liabilities",
    groups: [
      {
        name: "Owner's Equity",
        subGroups: [
          "Capital",
          "Retained Earnings",
          "Current Year Profit",
        ],
      },
      {
        name: "Non Current Liabilities",
        subGroups: [
          "Long Term Loan",
          "Deferred Liability",
        ],
      },
      {
        name: "Current Liabilities",
        subGroups: [
          "Accounts Payable",
          "Accrued Expenses",
          "Short Term Loan",
          "VAT & Tax Payable",
        ],
      },
    ],
  },

  {
    category: "Revenue",
    groups: [
      {
        name: "Operating Revenue",
        subGroups: [
          "Sales Revenue",
          "Service Revenue",
        ],
      },
      {
        name: "Non Operating Revenue",
        subGroups: [
          "Interest Income",
          "Other Income",
        ],
      },
    ],
  },

  {
    category: "Expenses",
    groups: [
      {
        name: "Direct Expenses",
        subGroups: [
          "Cost of Goods Sold",
          "Direct Labour",
        ],
      },
      {
        name: "Administrative Expenses",
        subGroups: [
          "Salary",
          "Office Rent",
          "Electricity",
          "Internet",
          "Stationery",
          "Depreciation",
        ],
      },
      {
        name: "Selling & Distribution",
        subGroups: [
          "Marketing",
          "Transport",
          "Commission",
        ],
      },
      {
        name: "Financial Expenses",
        subGroups: [
          "Bank Charge",
          "Interest Expense",
        ],
      },
    ],
  },
];

export default accountStructure;