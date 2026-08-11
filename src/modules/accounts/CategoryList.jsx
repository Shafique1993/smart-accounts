import accountStructure from "../../data/accountStructure";

function CategoryList({ onSelect, selectedCategory }) {
  return (
    <div className="bg-white rounded-xl shadow p-5">

      <h2 className="text-lg font-bold mb-4">
        Account Categories
      </h2>

      <div className="space-y-2">

        {accountStructure.map((category) => (

          <button
            key={category.category}
            onClick={() => onSelect(category)}
            className={`w-full text-left px-4 py-3 rounded-lg transition ${
              selectedCategory?.category === category.category
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {category.category}
          </button>

        ))}

      </div>

    </div>
  );
}

export default CategoryList;