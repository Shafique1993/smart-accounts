import Sidebar from "../Sidebar";
import Header from "../Header";

function MainLayout({ children }) {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar />

      <div style={{ flex: 1 }}>
        <Header />

        <div style={{ padding: "30px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default MainLayout;