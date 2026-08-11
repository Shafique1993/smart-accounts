function GroupList({ selectedCategory, onSelect, selectedGroup }) {
  if (!selectedCategory) return null;

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="text-lg font-bold mb-4">
        Account Groups
      </h2>

      <div className="space-y-2">
        {selectedCategory.groups.map((group) => (
          <button
            key={group.name}
            onClick={() => onSelect(group)}
            className={`w-full text-left px-4 py-3 rounded-lg transition ${
              selectedGroup?.name === group.name
                ? "bg-green-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {group.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default GroupList;