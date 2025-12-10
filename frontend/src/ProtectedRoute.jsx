import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import axios from "axios";

const ProtectedRoute = () => {
  const [isAuth, setIsAuth] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(import.meta.env.VITE_REACT_APP_HOST + "login/validar-token", {
        withCredentials: true,
      })
      .then((res) => {
        if (res.data.status) {
          setIsAuth(true);
        } else {
          navigate("/");
        }
      })
      .catch(() => {
        navigate("/");
      });
  }, []);

  if (isAuth === null) return <p>Cargando...</p>;

  return <Outlet />;
};

export default ProtectedRoute;