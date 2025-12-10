import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

const AdminRoute = () => {
  const { roles } = useSelector((state) => state.loginReducer); 

  const userRoles = roles ? roles.split(",") : [];

  if (userRoles.includes("1")) {
    return <Outlet />;
  }else{
    return <Navigate to="/unauthorized" replace />;
  }
};

export default AdminRoute;