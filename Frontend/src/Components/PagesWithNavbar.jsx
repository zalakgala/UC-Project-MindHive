import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

function PagesWithNavbar() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

export default PagesWithNavbar;
