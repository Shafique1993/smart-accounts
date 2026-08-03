function Header() {
  return (
    <header className="bg-white h-16 px-6 flex items-center justify-between border-b">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">
          Dashboard
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <button className="text-2xl">🔔</button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
            S
          </div>

          <div>
            <p className="font-semibold">Shafique</p>
            <p className="text-sm text-gray-500">
              Administrator
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;