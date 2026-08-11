import accountStructure from "../../data/accountStructure";

function AccountTree() {
  return (
    <div className="bg-white rounded-xl shadow p-6">

      <h2 className="text-2xl font-bold mb-6">
        Chart of Accounts
      </h2>

      {accountStructure.map((category) => (

        <div
          key={category.category}
          className="mb-8"
        >

          <h3 className="text-xl font-bold text-blue-700 mb-4">
            {category.category}
          </h3>

          {category.groups.map((group) => (

            <div
              key={group.name}
              className="ml-6 mb-4"
            >

              <h4 className="font-semibold text-gray-800">
                {group.name}
              </h4>

              <ul className="list-disc ml-8 mt-2">

                {group.subGroups.map((subGroup) => (

                  <li
                    key={subGroup}
                    className="text-gray-600 py-1"
                  >
                    {subGroup}
                  </li>

                ))}

              </ul>

            </div>

          ))}

        </div>

      ))}

    </div>
  );
}

export default AccountTree;