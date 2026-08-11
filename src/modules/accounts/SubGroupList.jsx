function SubGroupList({
  selectedGroup,
  selectedSubGroup,
  onSelect,
}) {
  if (!selectedGroup) return null;

  return (
    <div className="bg-white rounded-xl shadow p-5">

      <h2 className="text-lg font-bold mb-4">
        Sub Groups
      </h2>

      <div className="space-y-2">

        {selectedGroup.subGroups.map((subGroup) => (

          <button
            key={subGroup}
            onClick={() => onSelect(subGroup)}
            className={`w-full text-left px-4 py-3 rounded-lg transition ${
              selectedSubGroup === subGroup
                ? "bg-purple-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {subGroup}
          </button>

        ))}

      </div>

    </div>
  );
}

export default SubGroupList;