import { getFunction, postFunction } from "../axios/axiosFunctions";
import axios from "axios";
import { ServiceErrorHandler } from "../../helpers/ServiceErrorHandler";
const getVehiculos = async () => {
  return getFunction("vehiculos/getVehiculos");
};

const postVehiculo = async (form) => {
  try {
    const response = await axios.post(
      import.meta.env.VITE_REACT_APP_HOST + "vehiculos/postVehiculo",
      form,
      {
        headers:
          form instanceof FormData
            ? {}
            : { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );
    if (response.data.hasOwnProperty("status") && response.data.status) {
      return response.data;
    } else {
      console.log("response: ", response);
      throw response.data;
    }
  } catch (error) {
    return ServiceErrorHandler(error, "vehiculos/postVehiculo");
  }
};

const vehiculosService = {
  getVehiculos,
  postVehiculo,
};
export default vehiculosService;
