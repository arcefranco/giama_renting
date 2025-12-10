import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

const PrivateRoute = ({ allowedRoles }) => {
  const { roles } = useSelector((state) => state.loginReducer); 

  const userRoles = roles ? roles.split(",") : [];

  // Si es admin, siempre pasa
  if (userRoles.includes("1")) {
    return <Outlet />;
  }

  // Si tiene al menos uno de los roles permitidos
  const hasRole = userRoles.some((rol) => allowedRoles.includes(rol));

  return hasRole ? <Outlet /> : <Navigate to="/unauthorized" replace />;
};

export default PrivateRoute;