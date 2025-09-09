import { ServiceErrorHandler } from "../../helpers/ServiceErrorHandler";
import axios from "axios";

const logIn = async (data) => {
  try {
    const response = await axios.post(
      import.meta.env.VITE_REACT_APP_HOST + "login/login",
      data,
      { withCredentials: true } // Asegura que se envíen y reciban cookies
    );
    if (response.data.status) {
      return response.data;
    } else {
      throw response.data;
    }
  } catch (error) {
    return ServiceErrorHandler(error, "login/login");
  }
};

const loginService = {
  logIn,
};

export default loginService;
