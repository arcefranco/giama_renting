import {
  getFunction,
  postArrayFunction,
  postFunction,
} from "../axios/axiosFunctions";

const getCuentasContables = async () => {
  return getFunction("costos/cuentasContables");
};
const postConceptoCostos = async (form) => {
  return postFunction("costos/concepto", form);
};
const updateConcepto = async (form) => {
  return postFunction("costos/updateConcepto", form);
};
const getConceptosCostosById = async (form) => {
  return postArrayFunction("costos/getConceptosCostosById", form);
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
  return postArrayFunction("costos/costos_ingresos_id_vehiculo", id);
};


const prorrateo = async (form) => {
  return postFunction("costos/prorrateo", form);
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
  prorrateo
};
export default costosService;
