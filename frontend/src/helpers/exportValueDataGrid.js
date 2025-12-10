  export const getVehiculoExportValue = (id_vehiculo, vehiculos, modelos) => {
    if (!id_vehiculo) return '';
    const vehiculo = vehiculos?.find(e => e.id == id_vehiculo);
    if (!vehiculo) return "SIN DATOS";

    // Obtener dominio
    const dominio = vehiculo.dominio || vehiculo.dominio_provisorio || "SIN DOMINIO";

    // Obtener modelo
    const modeloNombre = modelos?.find(e => e.id == vehiculo.modelo)?.nombre || "";

    return `${dominio} ${modeloNombre}`;
  };

  // Cliente: Nombre y Apellido
  export const getClienteExportValue = (id_cliente, clientes) => {
    if (!id_cliente) return '';
    const cliente = clientes?.find(e => e.id == id_cliente);
    return cliente ? `${cliente.nombre} ${cliente.apellido}` : '';
  };

  // Fechas: YYYY-MM-DD a DD/MM/YYYY
  export const getFechaExportValue = (fecha_iso) => {
    if (!fecha_iso) return '';
    const fechaSplit = fecha_iso.split("-");
    // Formato DD/MM/YYYY
    return `${fechaSplit[2]}/${fechaSplit[1]}/${fechaSplit[0]}`;
  };