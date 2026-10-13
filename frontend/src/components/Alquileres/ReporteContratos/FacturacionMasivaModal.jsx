import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { postFacturacionMasiva, getValoresModelos } from '../../../reducers/Alquileres/alquileresSlice';
import { calcularPeriodoFacturacion } from '../../../helpers/calcularPeriodoFacturacion';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import ClipLoader from "react-spinners/ClipLoader";

const descargarExcelErroresFacturacion = (errores) => {
  if (!errores || errores.length === 0) return;
  const hoyStr = new Date().toISOString().split('T')[0];
  const data = errores.map(e => ({
    "N° Contrato": e.id_contrato,
    "Cliente / Razón Social": e.cliente,
    "CUIT / Documento": e.cuit,
    "Vehículo": e.vehiculo,
    "Período Desde": e.fecha_desde,
    "Período Hasta": e.fecha_hasta,
    "Importe ($)": e.importe,
    "Motivo del Rechazo": e.motivo
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Contratos_No_Procesados");
  XLSX.writeFile(workbook, `Errores_Facturacion_Masiva_${hoyStr}.xlsx`);
};

const formatFechaDisplay = (fechaStr) => {
  if (!fechaStr) return "-";
  const clean = String(fechaStr).split("T")[0];
  const parts = clean.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return clean;
};

const FacturacionMasivaModal = ({ visible, onClose, contratos, clientes, vehiculos, modelos }) => {
  const dispatch = useDispatch();
  const { username } = useSelector((state) => state.loginReducer);
  const { valoresModelos } = useSelector((state) => state.alquileresReducer);

  // Estado local para los contratos que se mostrarán en la tabla
  const [contratosEditables, setContratosEditables] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [erroresParaDescargar, setErroresParaDescargar] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Inicializar estado cuando se abre el modal
  useEffect(() => {
    if (visible) {
      dispatch(getValoresModelos());
    }
  }, [visible, dispatch]);

  useEffect(() => {
    if (visible && contratos?.length > 0 && clientes?.length > 0 && vehiculos?.length > 0) {
      // Filtrar contratos estrictamente activos (cuya fecha_hasta sea mayor o igual a hoy)
      const hoyStr = new Date().toISOString().split('T')[0];
      const contratosActivos = contratos.filter(c => c.fecha_hasta >= hoyStr);

      const mapeados = contratosActivos.map(contrato => {
        const cliente = clientes.find(c => c.id == contrato.id_cliente);
        const vehiculo = vehiculos.find(v => v.id == contrato.id_vehiculo);
        const modelo = modelos?.find(m => m.id == vehiculo?.modelo);

        const nombreCliente = cliente?.nombre ? `${cliente.nombre} ${cliente.apellido}` : (cliente?.razon_social || "SIN DATOS");
        const vehiculoDisplay = `${vehiculo?.dominio || vehiculo?.dominio_provisorio || "SIN DOMINIO"} - ${modelo?.nombre || ""}`;
        
        let valorPorDefecto = "";
        if (modelo && valoresModelos && valoresModelos.length > 0) {
          const mVal = valoresModelos.find(v => v.id_modelo == modelo.id);
          if (mVal && parseFloat(mVal.valor) > 0) {
            valorPorDefecto = mVal.valor;
          }
        }

        const { fechaDesde, fechaHasta } = calcularPeriodoFacturacion(
          contrato.fecha_desde,
          contrato.fecha_hasta
        );

        return {
          id: contrato.id,
          id_cliente: contrato.id_cliente,
          id_vehiculo: contrato.id_vehiculo,
          nombreCliente,
          vehiculoDisplay,
          cuit: cliente?.nro_documento ? String(cliente.nro_documento) : "S/D",
          fecha_desde_contrato: contrato.fecha_desde,
          fecha_hasta_contrato: contrato.fecha_hasta,
          incluir: false, // Checkbox desmarcado por defecto
          fecha_desde_alquiler: fechaDesde,
          fecha_hasta_alquiler: fechaHasta,
          debe_alquiler: valorPorDefecto,
          observacion: ""
        };
      });
      setContratosEditables(mapeados);
    } else {
      setContratosEditables([]);
    }
  }, [visible, contratos, clientes, vehiculos, modelos, valoresModelos]);

  if (!visible) return null;

  const contratosFiltrados = contratosEditables.filter(c => {
    if (!busqueda) return true;
    const searchLower = String(busqueda).toLowerCase().trim();
    return (
      String(c.nombreCliente || '').toLowerCase().includes(searchLower) ||
      String(c.cuit || '').toLowerCase().includes(searchLower) ||
      String(c.vehiculoDisplay || '').toLowerCase().includes(searchLower)
    );
  });

  const todosSeleccionados = contratosFiltrados.length > 0 && contratosFiltrados.every(c => c.incluir);
  const seleccionadosCount = contratosEditables.filter(c => c.incluir).length;
  
  const totalAImputar = contratosEditables
    .filter(c => c.incluir && c.debe_alquiler)
    .reduce((acc, curr) => acc + parseFloat(curr.debe_alquiler || 0), 0);

  const handleToggleSelectAll = (checked) => {
    const idsFiltrados = contratosFiltrados.map(c => c.id);
    setContratosEditables(prev => prev.map(c => 
      idsFiltrados.includes(c.id) ? { ...c, incluir: checked } : c
    ));
  };

  const handleToggleRow = (id) => {
    setContratosEditables(prev => prev.map(c => 
      c.id === id ? { ...c, incluir: !c.incluir } : c
    ));
  };

  const handleInputChange = (id, field, value) => {
    setContratosEditables(prev => prev.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const handleConfirmar = async () => {
    const seleccionados = contratosEditables.filter(c => c.incluir);
    
    if (seleccionados.length === 0) {
      toast.warning("Debe seleccionar al menos un contrato para facturar.");
      return;
    }

    const payload = [];

    for (let c of seleccionados) {
      if (!c.fecha_desde_alquiler || !c.fecha_hasta_alquiler || !c.debe_alquiler) {
        toast.error(`El contrato de ${c.nombreCliente} tiene campos incompletos.`);
        return;
      }

      const debe_alquiler = parseFloat(c.debe_alquiler);
      if (isNaN(debe_alquiler) || debe_alquiler <= 0) {
        toast.error(`El importe de ${c.nombreCliente} no es válido.`);
        return;
      }

      const debe_alquiler_neto = debe_alquiler / 1.21;
      const debe_alquiler_iva = debe_alquiler - debe_alquiler_neto;

      payload.push({
        id_contrato: c.id,
        id_cliente: c.id_cliente,
        id_vehiculo: c.id_vehiculo,
        apellido_cliente: c.nombreCliente,
        fecha_desde_alquiler: c.fecha_desde_alquiler,
        fecha_hasta_alquiler: c.fecha_hasta_alquiler,
        fecha_factura_alquiler: new Date().toISOString().split('T')[0], // hoy
        debe_alquiler: debe_alquiler.toFixed(2),
        debe_alquiler_neto: debe_alquiler_neto.toFixed(2),
        debe_alquiler_iva: debe_alquiler_iva.toFixed(2),
        observacion: c.observacion || ""
      });
    }

    setIsProcessing(true);
    try {
      const res = await dispatch(postFacturacionMasiva({ alquileres: payload, usuario: username })).unwrap();
      const fallidos = (res.data || []).filter(r => !r.success);

      if (fallidos.length > 0) {
        const reporteErrores = fallidos.map(f => {
          const cLocal = contratosEditables.find(c => c.id === f.id_contrato);
          return {
            id_contrato: f.id_contrato,
            cliente: f.cliente || cLocal?.nombreCliente || "S/D",
            cuit: cLocal?.cuit || "S/D",
            vehiculo: f.dominio || cLocal?.vehiculoDisplay || "S/D",
            fecha_desde: f.fecha_desde || cLocal?.fecha_desde_alquiler || "",
            fecha_hasta: f.fecha_hasta || cLocal?.fecha_hasta_alquiler || "",
            importe: f.importe || cLocal?.debe_alquiler || 0,
            motivo: f.error || "Rechazado por validación de negocio"
          };
        });

        setErroresParaDescargar(reporteErrores);
        descargarExcelErroresFacturacion(reporteErrores);
        toast.error(`Atención: ${fallidos.length} contratos no pudieron procesarse. Se descargó el reporte con los motivos.`);
      } else if (res.status) {
        setErroresParaDescargar([]);
        onClose(); // Cerrar modal al éxito (useToastFeedback muestra el toast de éxito)
      } else {
        toast.error(res.message || "Ocurrió un error.");
      }
    } catch (error) {
      toast.error(error.message || "Ocurrió un error al enviar al servidor.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '8px',
        width: '95%', maxWidth: '1400px', height: '90vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        position: 'relative'
      }}>
        {isProcessing && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(255,255,255,0.75)', zIndex: 1100,
            borderRadius: '8px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            gap: '12px'
          }}>
            <ClipLoader size={50} color="#800020" />
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#800020' }}>
              Procesando facturación masiva...
            </span>
          </div>
        )}

        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>Facturación Masiva de Alquileres</h2>
          <button onClick={onClose} disabled={isProcessing} style={{ border: 'none', background: 'transparent', fontSize: '20px', cursor: isProcessing ? 'not-allowed' : 'pointer', color: '#999' }}>&times;</button>
        </div>

        {/* Info y Buscador */}
        <div style={{ padding: '12px 24px', backgroundColor: '#fafafa', borderBottom: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span>Contratos Seleccionados: <strong style={{ color: '#1890ff' }}>{seleccionadosCount} de {contratosEditables.length}</strong></span>
            <input 
              type="text"
              placeholder="Buscar por cliente, CUIT o patente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                padding: '6px 12px', borderRadius: '4px', border: '1px solid #d9d9d9',
                width: '300px', fontSize: '13px'
              }}
            />
          </div>
          <div>
            <span>Total a Facturar: <strong style={{ color: '#800020', fontSize: '16px' }}>${totalAImputar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong></span>
          </div>
        </div>

        {/* Tabla custom interactiva */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', marginTop: '10px' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 10, borderBottom: '2px solid #e8e8e8' }}>
              <tr>
                <th style={{ padding: '12px 8px', width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={todosSeleccionados}
                    onChange={(e) => handleToggleSelectAll(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th style={{ padding: '12px 8px', minWidth: '180px' }}>Cliente</th>
                <th style={{ padding: '12px 8px', width: '100px' }}>CUIT</th>
                <th style={{ padding: '12px 8px', minWidth: '150px' }}>Vehículo (Patente - Mod.)</th>
                <th style={{ padding: '12px 8px', width: '150px', textAlign: 'center' }}>Inf. Contrato</th>
                <th style={{ padding: '12px 8px', width: '130px' }}>Fecha Desde</th>
                <th style={{ padding: '12px 8px', width: '130px' }}>Fecha Hasta</th>
                <th style={{ padding: '12px 8px', width: '130px' }}>Importe Total</th>
                <th style={{ padding: '12px 8px' }}>Observación</th>
              </tr>
            </thead>
            <tbody>
              {contratosFiltrados.map((row) => (
                <tr
                  key={row.id}
                  style={{
                    backgroundColor: row.incluir ? '#f6ffed' : '#fff',
                    borderBottom: '1px solid #f0f0f0',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={row.incluir}
                      onChange={() => handleToggleRow(row.id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ padding: '10px 8px', fontWeight: '500' }}>
                    {row.nombreCliente}
                  </td>
                  <td style={{ padding: '10px 8px', color: '#666' }}>
                    {row.cuit}
                  </td>
                  <td style={{ padding: '10px 8px', fontWeight: '500', color: '#1890ff' }}>
                    {row.vehiculoDisplay}
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', lineHeight: '1.4', color: '#555', whiteSpace: 'nowrap' }}>
                      <div><span style={{ color: '#888' }}>Ini:</span> <strong>{formatFechaDisplay(row.fecha_desde_contrato)}</strong></div>
                      <div><span style={{ color: '#888' }}>Fin:</span> <strong style={{ color: '#800020' }}>{formatFechaDisplay(row.fecha_hasta_contrato)}</strong></div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <input
                      type="date"
                      disabled={!row.incluir}
                      value={row.fecha_desde_alquiler}
                      onChange={(e) => handleInputChange(row.id, 'fecha_desde_alquiler', e.target.value)}
                      style={{ width: '100%', padding: '4px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                    />
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <input
                      type="date"
                      disabled={!row.incluir}
                      value={row.fecha_hasta_alquiler}
                      onChange={(e) => handleInputChange(row.id, 'fecha_hasta_alquiler', e.target.value)}
                      style={{ width: '100%', padding: '4px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                    />
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ej: 50000"
                      disabled={!row.incluir}
                      value={row.debe_alquiler}
                      onChange={(e) => handleInputChange(row.id, 'debe_alquiler', e.target.value)}
                      style={{ width: '100%', padding: '4px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                    />
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <input
                      type="text"
                      placeholder="Opcional..."
                      disabled={!row.incluir}
                      value={row.observacion}
                      onChange={(e) => handleInputChange(row.id, 'observacion', e.target.value)}
                      style={{ width: '100%', padding: '4px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                    />
                  </td>
                </tr>
              ))}
              {contratosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    No hay contratos que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {erroresParaDescargar.length > 0 && (
              <button
                type="button"
                onClick={() => descargarExcelErroresFacturacion(erroresParaDescargar)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#fff1f0',
                  color: '#cf1322',
                  border: '1px solid #ffa39e',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                📥 Descargar Excel de Errores ({erroresParaDescargar.length})
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={onClose}
              disabled={isProcessing}
              style={{ 
                padding: '8px 16px', border: '1px solid #d9d9d9', backgroundColor: '#fff', 
                cursor: isProcessing ? 'not-allowed' : 'pointer', borderRadius: '4px' 
              }}
            >
              Cancelar
            </button>
            <button 
              onClick={handleConfirmar}
              disabled={seleccionadosCount === 0 || isProcessing}
              style={{ 
                padding: '8px 20px', border: 'none', borderRadius: '4px',
                backgroundColor: (seleccionadosCount === 0 || isProcessing) ? '#d9d9d9' : '#800020', 
                color: '#fff', cursor: (seleccionadosCount === 0 || isProcessing) ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              {isProcessing && <ClipLoader size={15} color="#fff" />}
              {isProcessing ? "Procesando..." : "Facturar Seleccionados"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacturacionMasivaModal;
