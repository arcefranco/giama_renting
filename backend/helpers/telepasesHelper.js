/**
 * Helper functions and domain logic for Telepases import & processing
 */

export function parseMonto(valor) {
    if (typeof valor === "number") return valor;
    if (!valor) return 0;
    let str = String(valor).replace(/[^0-9,\.-]/g, '');
    if (str.includes(',')) {
        str = str.replace(/\./g, '').replace(',', '.');
    }
    return parseFloat(str) || 0;
}

export function parseFechaTelepase(valor) {
    if (!valor) return null;
    if (valor instanceof Date && !isNaN(valor.getTime())) {
        return valor;
    }
    if (typeof valor === "number") {
        const fechaJS = new Date(Math.round((valor - 25569) * 86400 * 1000));
        return isNaN(fechaJS.getTime()) ? null : fechaJS;
    }
    if (typeof valor === "string") {
        const str = valor.trim();
        const slashMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
        if (slashMatch) {
            const dia = parseInt(slashMatch[1], 10);
            const mes = parseInt(slashMatch[2], 10) - 1;
            let anio = parseInt(slashMatch[3], 10);
            if (anio < 100) anio += 2000;
            const d = new Date(Date.UTC(anio, mes, dia));
            return isNaN(d.getTime()) ? null : d;
        }
        const dashMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (dashMatch) {
            const anio = parseInt(dashMatch[1], 10);
            const mes = parseInt(dashMatch[2], 10) - 1;
            const dia = parseInt(dashMatch[3], 10);
            const d = new Date(Date.UTC(anio, mes, dia));
            return isNaN(d.getTime()) ? null : d;
        }
        const dashMatchDMY = str.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})/);
        if (dashMatchDMY) {
            const dia = parseInt(dashMatchDMY[1], 10);
            const mes = parseInt(dashMatchDMY[2], 10) - 1;
            let anio = parseInt(dashMatchDMY[3], 10);
            if (anio < 100) anio += 2000;
            const d = new Date(Date.UTC(anio, mes, dia));
            return isNaN(d.getTime()) ? null : d;
        }
        const parsed = new Date(str);
        if (!isNaN(parsed.getTime())) return parsed;
    }
    return null;
}

export function formatFechaDDMMAAAA(date) {
    if (!date) return "";
    const d = String(date.getUTCDate()).padStart(2, "0");
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const y = date.getUTCFullYear();
    return `${d}/${m}/${y}`;
}

export function formatFechaYYYYMMDD(date) {
    if (!date) return "";
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

export function findContratoParaFecha(contratos, fechaPasadaStr) {
    if (!contratos || contratos.length === 0) return null;
    if (!fechaPasadaStr) return contratos[contratos.length - 1];

    return contratos.find(c => {
        const fDesde = c.fecha_desde instanceof Date ? formatFechaYYYYMMDD(c.fecha_desde) : String(c.fecha_desde).slice(0, 10);
        const fHasta = c.fecha_hasta ? (c.fecha_hasta instanceof Date ? formatFechaYYYYMMDD(c.fecha_hasta) : String(c.fecha_hasta).slice(0, 10)) : null;
        return fDesde <= fechaPasadaStr && (!fHasta || fHasta >= fechaPasadaStr);
    }) || null;
}

/**
 * Agrupa pasadas de telepase evaluando fecha individual contra contratos vigentes
 */
export function agruparPasadasTelepases({ pasadasValidas, vehiculosMap, contratosPorVehiculo }) {
    const grupos = {};

    for (const pasada of pasadasValidas) {
        const { patente, dateObj, tarifa, bonificacion, montoNeto, chofer, autopista } = pasada;
        const fechaPasadaStr = dateObj ? formatFechaYYYYMMDD(dateObj) : null;
        const idVehiculo = vehiculosMap.get(patente) || null;
        const contratosDelVehiculo = idVehiculo ? (contratosPorVehiculo.get(idVehiculo) || []) : [];
        const contrato = idVehiculo ? findContratoParaFecha(contratosDelVehiculo, fechaPasadaStr) : null;

        const grupoKey = idVehiculo
            ? (contrato ? `${patente}__CLIENTE_${contrato.id_cliente}` : `${patente}__SIN_CONTRATO`)
            : `${patente}__SIN_VEHICULO`;

        if (!grupos[grupoKey]) {
            const nombreCliente = contrato
                ? (contrato.razon_social || `${contrato.nombre || ''} ${contrato.apellido || ''}`.trim())
                : 'Sin cliente asignado';

            grupos[grupoKey] = {
                patente,
                idVehiculo,
                idCliente: contrato ? contrato.id_cliente : null,
                cuitCliente: contrato ? (contrato.nro_documento || '') : '',
                nombreCliente,
                esEmpresa: contrato ? Boolean(contrato.razon_social) : false,
                chofer: chofer !== "S/D" ? chofer : (contrato ? nombreCliente : "S/D"),
                totalTarifa: 0,
                totalBonificacion: 0,
                totalNeto: 0,
                cantidadPasadas: 0,
                autopistas: new Set(),
                fechas: []
            };
        }

        const g = grupos[grupoKey];
        g.totalTarifa += tarifa;
        g.totalBonificacion += bonificacion;
        g.totalNeto += montoNeto;
        g.cantidadPasadas += 1;
        if (autopista) g.autopistas.add(autopista);
        if (dateObj) g.fechas.push(dateObj);
        if ((!g.chofer || g.chofer === "S/D") && chofer && chofer !== "S/D") {
            g.chofer = chofer;
        }
    }

    const gruposList = Object.values(grupos);
    gruposList.sort((a, b) => {
        if (a.patente !== b.patente) return a.patente.localeCompare(b.patente);
        const fechaA = a.fechas.length > 0 ? a.fechas[0].getTime() : 0;
        const fechaB = b.fechas.length > 0 ? b.fechas[0].getTime() : 0;
        return fechaA - fechaB;
    });

    for (const grupo of gruposList) {
        let advertencia = null;
        if (!grupo.idVehiculo) {
            advertencia = "El vehículo no existe en el sistema";
        } else if (!grupo.idCliente) {
            advertencia = "No se encontró un contrato de alquiler activo para este vehículo en la fecha de las pasadas.";
        }

        grupo.fechas.sort((a, b) => a.getTime() - b.getTime());

        let rangoFechas = "S/D";
        if (grupo.fechas.length > 0) {
            const fechaMin = formatFechaDDMMAAAA(grupo.fechas[0]);
            const fechaMax = formatFechaDDMMAAAA(grupo.fechas[grupo.fechas.length - 1]);
            rangoFechas = fechaMin === fechaMax ? fechaMin : `${fechaMin} al ${fechaMax}`;
        }

        grupo.rangoFechas = rangoFechas;
        grupo.advertencia = advertencia;
    }

    return gruposList;
}
