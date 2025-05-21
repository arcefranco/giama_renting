import { getFunction, postFunction } from "../axios/axiosFunctions";
import axios from "axios";

const getCuentasContables = async () => {
  return getFunction("costos/cuentasContables");
};

const postConceptoCostos = async (form) => {
  return postFunction("costos/concepto", form);
};
const updateConcepto = async (form) => {
  return postFunction("costos/updateConcepto", form);
};
const getConceptosCostosById = async (form, header = {}) => {
  try {
    const response = await axios.post(
      import.meta.env.VITE_REACT_APP_HOST + "costos/getConceptosCostosById",
      form,
      {
        ...header,
        withCredentials: true,
      }
    );
    if (Array.isArray(response.data)) {
      console.log("response: ", response);
      return response.data;
    } else {
      console.log("response: ", response);
      throw response.data;
    }
  } catch (error) {
    return ServiceErrorHandler(error, "costos/getConceptosCostosById");
  }
};
const deleteConceptosCostos = async (form) => {
  return postFunction("costos/deleteConcepto", form);
};
const getConceptosCostos = async () => {
  return getFunction("costos/concepto");
};
const postCostos_Ingresos = async (form) => {
  return postFunction("costos/costos_ingresos", form);
};

const getCostosIngresosByIdVehiculo = async (id, header = {}) => {
  try {
    const response = await axios.post(
      import.meta.env.VITE_REACT_APP_HOST +
        "costos/costos_ingresos_id_vehiculo",
      id,
      {
        ...header,
        withCredentials: true,
      }
    );
    if (Array.isArray(response.data)) {
      console.log("response: ", response);
      return response.data;
    } else {
      console.log("response: ", response);
      throw response.data;
    }
  } catch (error) {
    return ServiceErrorHandler(error, "costos/getConceptosCostosById");
  }
};

const prorrateoIE = async (form) => {
  return postFunction("costos/prorrateoIE", form);
};

const costosService = {
  getCuentasContables,
  postConceptoCostos,
  updateConcepto,
  getConceptosCostos,
  getConceptosCostosById,
  deleteConceptosCostos,
  postCostos_Ingresos,
  getCostosIngresosByIdVehiculo,
  prorrateoIE,
};
export default costosService;
