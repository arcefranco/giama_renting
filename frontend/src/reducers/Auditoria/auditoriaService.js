import { getFunction } from "../axios/axiosFunctions.js";

const getAsientos = async () => {
    const response = await getFunction("auditoria/asientos");
    if (response.status === true) {
        return response.data;
    }
    throw new Error(response.message || "Error al obtener asientos");
};

const getAsientoLineas = async (payload) => {
    const nroAsiento = typeof payload === "object" ? payload.nroAsiento : payload;
    const fecha = typeof payload === "object" ? payload.fecha : null;
    const url = fecha
        ? `auditoria/asientos/${nroAsiento}/${encodeURIComponent(fecha)}`
        : `auditoria/asientos/${nroAsiento}`;
    const response = await getFunction(url);
    if (response.status === true) {
        return response.data;
    }
    throw new Error(response.message || "Error al obtener líneas del asiento");
};

const getFacturas = async () => {
    const response = await getFunction("auditoria/facturas");
    if (response.status === true) {
        return response.data;
    }
    throw new Error(response.message || "Error al obtener facturas");
};

const getFacturaItems = async (idFactura) => {
    const response = await getFunction(`auditoria/facturas/${idFactura}/items`);
    if (response.status === true) {
        return response.data;
    }
    throw new Error(response.message || "Error al obtener ítems de la factura");
};

const auditoriaService = {
    getAsientos,
    getAsientoLineas,
    getFacturas,
    getFacturaItems
};

export default auditoriaService;
