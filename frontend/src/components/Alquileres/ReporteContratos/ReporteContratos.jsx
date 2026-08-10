import React, { useEffect, useState, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import Select from 'react-select';
import { getContratos, reset, renovacionFlota, cambioVehiculo } from "./../../../reducers/Alquileres/alquileresSlice"
import { getVehiculos } from "./../../../reducers/Vehiculos/vehiculosSlice"
import { getClientes } from "./../../../reducers/Clientes/clientesSlice"
import { getModelos } from "./../../../reducers/Generales/generalesSlice"
import { useDispatch, useSelector } from "react-redux"
import DataGrid, {
  Column, Scrolling, Paging, TotalItem, Summary,
  FilterRow, HeaderFilter, Export, Lookup
} from "devextreme-react/data-grid"
import styles from "./ReporteContratos.module.css"
import 'devextreme/dist/css/dx.carmine.css';
import { ClipLoader } from "react-spinners";
import { esAnteriorAHoy } from '../../../helpers/esAnteriorAHoy'
import { ToastContainer, toast } from 'react-toastify';
import { useToastFeedback } from '../../../customHooks/useToastFeedback.jsx'
import { Workbook } from 'devextreme-exceljs-fork';
import { saveAs } from 'file-saver-es';
import { exportDataGrid } from 'devextreme/excel_exporter';
import { hasAdminAccess } from '../../../helpers/hasAdminAccess.js'

const ReporteContratos = () => {
  const dispatch = useDispatch()
  const location = useLocation();
  const esAVencer = location.pathname === "/alquileres/contrato/reporte/a-vencer";


  
  const [modalCambioVehiculo, setModalCambioVehiculo] = useState({
    visible: false,
    id_contrato: null,
    id_vehiculo_actual: null,
    id_vehiculo_nuevo: null
  });

  const [modalFlota, setModalFlota] = useState({
    visible: false,
    id_alquiler: null,
    fecha_desde: '',
    fecha_hasta: '',
    importe_total_nuevo: '',
    vehiculos_flota: [],
  });

  useEffect(() => {
    Promise.all([
      dispatch(getContratos({ fecha_desde: "", fecha_hasta: "", vigentes: 1 })),
      dispatch(getVehiculos()),
      dispatch(getClientes()),
      dispatch(getModelos())
    ])
  }, [])

  const {
    contratos,
    contratosAVencer,
    message,
    isError,
    isSuccess,
    isLoading
  } = useSelector((state) => state.alquileresReducer)
  const { vehiculos } = useSelector((state) => state.vehiculosReducer)
  const { roles, username } = useSelector((state) => state.loginReducer)
  const { modelos } = useSelector((state) => state.generalesReducer)
  const { clientes } = useSelector((state) => state.clientesReducer)

  const [form, setForm] = useState({
    fecha_desde: '',
    fecha_hasta: '',
    vigentes: 1
  })

  useToastFeedback({
    isError,
    isSuccess,
    message,
    resetAction: reset,
  })

  useEffect(() => {
    dispatch(getContratos({ fecha_desde: "", fecha_hasta: "", vigentes: form.vigentes }))
  }, [form.vigentes]);

  
  const opcionesVehiculosLibres = useMemo(() => {
    if (!vehiculos) return [];
    return vehiculos
      .filter(v => !v.fecha_venta && v.activo === 1 && v.estado_actual === 2 && v.vehiculo_alquilado === 0 && v.vehiculo_reservado === 0)
      .map(e => {
        const dominio = e.dominio || e.dominio_provisorio || "SIN DOMINIO";
        const modeloNombre = modelos?.find(m => m.id == e.modelo)?.nombre || "";
        return {
          value: e.id,
          label: `${dominio} - ${modeloNombre}`,
          searchKey: `${dominio} ${modeloNombre}`.toLowerCase()
        };
      });
  }, [vehiculos, modelos]);

  const handleConfirmarCambioVehiculo = () => {
    if (!modalCambioVehiculo.id_vehiculo_nuevo) {
      toast.error("Debe seleccionar un vehículo nuevo");
      return;
    }
    
    dispatch(cambioVehiculo({
      id_contrato: modalCambioVehiculo.id_contrato,
      id_vehiculo: modalCambioVehiculo.id_vehiculo_nuevo
    })).then((res) => {
      if (res.payload?.status) {
        toast.success("Vehículo cambiado exitosamente");
        setModalCambioVehiculo({ visible: false, id_contrato: null, id_vehiculo_actual: null, id_vehiculo_nuevo: null });
        handleActualizar();
      } else {
        toast.error(res.payload?.message || "Error al cambiar vehículo");
      }
    });
  };

  const handleActualizar = () => {
    dispatch(getContratos({ fecha_desde: form["fecha_desde"], fecha_hasta: form["fecha_hasta"], vigentes: form["vigentes"] }))
  }

  const handleCheckChange = (e) => {
    const { name, checked } = e.target;
    setForm(prevForm => ({
      ...prevForm,
      [name]: checked ? 1 : 0
    }));
  }

  const renderFecha = (data) => {
    if (data.value) {
      let fechaSplit = data?.value?.split("-")
      return `${fechaSplit[2]}/${fechaSplit[1]}/${fechaSplit[0]}`
    }
  }

  const renderVehiculo = (data) => {
    if (data.value) {
      const vehiculo = vehiculos?.find(e => e.id == data.value)
      return <div style={{ display: "flex", justifyContent: "space-evenly" }}>
        <span>{vehiculo?.dominio ? vehiculo?.dominio : vehiculo?.dominio_provisorio ?
          vehiculo?.dominio_provisorio : "SIN DOMINIO"}</span>
        <span>{" "}</span>
        <span>{modelos?.find(e => e.id == vehiculo?.modelo)?.nombre}</span>
      </div>
    }
  }

  const renderCliente = (data) => {
    if (data.value) {
      const cliente = clientes?.find(e => e.id == data.value)
      if (!cliente) return <div><span>CLIENTE NO ENCONTRADO</span></div>;
      let nombre_final = cliente.nombre ? `${cliente.nombre} ${cliente.apellido}` : (cliente.razon_social || "SIN DATOS");
      return <div>
        <span>{nombre_final}</span>
      </div>
    }
  }

  const normalizar = (str) => {
    if (!str) return "";
    return str.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  const clientesParaGrid = useMemo(() => {
    if (!clientes?.length) return [];
    return clientes.map(c => ({
      ...c,
      nombreNorm: normalizar(c.nombre),
      apellidoNorm: normalizar(c.apellido),
      razonsocialNorm: normalizar(c.razon_social)
    }));
  }, [clientes]);

  const vehiculosGrid = useMemo(() => {
    if (!vehiculos?.length) return [];
    return vehiculos?.map(c => ({
      ...c,
      dominio: normalizar(c.dominio),
      modelo: normalizar(c.modelo)
    }));
  }, [vehiculos]);

  const renderModificar = (data) => {
    return (
      <button
        onClick={() => window.open(`${import.meta.env.VITE_BASENAME}contrato/actualizar/${data.data.id}`, '_blank')}
        style={{
          color: '#1976d2', fontSize: "11px",
          textDecoration: 'underline', background: 'none', border: 'none',
          cursor: 'pointer'
        }}
      >
        Modificar
      </button>
    );
  }

  const renderModificarVehiculo = (data) => {
    return (
      <button
        style={{
          color: "blue", fontSize: "11px",
          textDecoration: 'underline', background: 'none', border: 'none',
          cursor: "pointer"
        }}
        onClick={() => {
          setModalCambioVehiculo({
            visible: true,
            id_contrato: data.data.id,
            id_vehiculo_actual: data.data.id_vehiculo,
            id_vehiculo_nuevo: null
          });
        }}
      >
        Modificar vehículo
      </button>
    )
  }

  const renderRenovarAlquiler = (data) => {
    const row = data.data;
    const cliente = clientes?.find(c => c.id == row.id_cliente);
    const esEmpresa = !!(cliente?.razon_social);

    if (esEmpresa) {
      return (
        <button
          onClick={() => {
            let fechaDesde = row.ultima_fecha_hasta || row.fecha_hasta;
            if (row.ultima_fecha_hasta) {
              const [year, month, day] = row.ultima_fecha_hasta.split('-');
              const d = new Date(year, month - 1, day);
              d.setDate(d.getDate() + 1);
              const m = String(d.getMonth() + 1).padStart(2, '0');
              const dDay = String(d.getDate()).padStart(2, '0');
              fechaDesde = `${d.getFullYear()}-${m}-${dDay}`;
            }

            // Buscar todos los contratos de la misma flota (mismo cliente) para permitir unificar contratos viejos con distintas fechas
            const contratosFlota = (esAVencer ? contratosAVencer : contratos)?.filter(
              c => c.id_cliente === row.id_cliente
            ) || [];

            const vehiculosFlota = contratosFlota.map(c => {
              const v = vehiculos?.find(veh => veh.id === c.id_vehiculo);
              const m = modelos?.find(mod => mod.id === v?.modelo);
              return {
                id: c.id_vehiculo,
                id_alquiler: c.ultimo_alquiler_id,
                dominio: v?.dominio || v?.dominio_provisorio || 'SIN DOMINIO',
                modelo: m?.nombre || ''
              };
            });

            setModalFlota({
              visible: true,
              id_alquiler: row.ultimo_alquiler_id,
              fecha_desde: fechaDesde,
              fecha_hasta: '',
              importe_total_nuevo: '',
              vehiculos_flota: vehiculosFlota,
              alquileres_ids: contratosFlota.map(c => c.ultimo_alquiler_id),
            });
          }}
          style={{
            color: '#2e7d32', fontSize: "11px",
            textDecoration: 'underline', background: 'none', border: 'none',
            cursor: 'pointer', fontWeight: 'bold'
          }}
        >
          🔄 Renovar Flota
        </button>
      );
    }

    return (
      <button
        onClick={() => window.open(`${import.meta.env.VITE_BASENAME}alquileres/${data.data.id}`, '_blank')}
        style={{
          color: '#1976d2', fontSize: "11px",
          textDecoration: 'underline', background: 'none', border: 'none',
          cursor: 'pointer'
        }}
      >
        Renovar alquiler
      </button>
    );
  }

  const handleCustomSummary = (e) => {
    if (e.name === "countVehiculos") {
      if (e.summaryProcess === "start") {
        e.totalValue = 0;
      }
      if (e.summaryProcess === "calculate") {
        e.totalValue += 1;
      }
    }
  };

  const getVehiculoExportValue = (id_vehiculo) => {
    if (!id_vehiculo) return '';
    const vehiculo = vehiculos?.find(e => e.id == id_vehiculo);
    if (!vehiculo) return "SIN DATOS";
    const dominio = vehiculo.dominio || vehiculo.dominio_provisorio || "SIN DOMINIO";
    const modeloNombre = modelos?.find(e => e.id == vehiculo.modelo)?.nombre || "";
    return `${dominio} ${modeloNombre}`;
  };

  const getClienteExportValue = (id_cliente) => {
    if (!id_cliente) return '';
    const cliente = clientes?.find(e => e.id == id_cliente);
    if (!cliente) return "CLIENTE NO ENCONTRADO";
    return cliente.nombre ? `${cliente.nombre} ${cliente.apellido}` : (cliente.razon_social || "SIN DATOS");
  };

  const getFechaExportValue = (fecha_iso) => {
    if (!fecha_iso) return '';
    const fechaSplit = fecha_iso.split("-");
    return `${fechaSplit[2]}/${fechaSplit[1]}/${fechaSplit[0]}`;
  };

  const onExporting = (e) => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Contratos');
    exportDataGrid({
      component: e.component,
      worksheet: worksheet,
      autoFilterEnabled: true,
      customizeCell: ({ gridCell, excelCell }) => {
        if (gridCell.rowType === 'data') {
          const dataField = gridCell.column.dataField;
          const rawValue = gridCell.data[dataField];
          if (dataField === 'id_vehiculo') {
            excelCell.value = getVehiculoExportValue(rawValue);
          } else if (dataField === 'id_cliente') {
            excelCell.value = getClienteExportValue(rawValue);
          } else if (dataField === 'fecha_desde' || dataField === 'fecha_hasta') {
            excelCell.value = getFechaExportValue(rawValue);
          }
        }
      },
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'Listado_Contratos.xlsx');
      });
    });
  };

  const handleRenovarFlota = () => {
    if (!modalFlota.importe_total_nuevo || parseFloat(modalFlota.importe_total_nuevo) <= 0) {
      toast.error("Ingresá el importe total de la renovación");
      return;
    }
    if (!modalFlota.alquileres_ids || modalFlota.alquileres_ids.length === 0) {
      toast.error("Tenés que incluir al menos un vehículo en la renovación");
      return;
    }
    dispatch(renovacionFlota({
      id_alquiler: modalFlota.id_alquiler,
      alquileres_ids: modalFlota.alquileres_ids,
      fecha_desde_nuevo: modalFlota.fecha_desde,
      fecha_hasta_nuevo: modalFlota.fecha_hasta,
      importe_total_nuevo: parseFloat(modalFlota.importe_total_nuevo),
      usuario: username,
    }));
    setModalFlota({ visible: false, id_alquiler: null, alquileres_ids: [], fecha_desde: '', fecha_hasta: '', importe_total_nuevo: '', vehiculos_flota: [] });
  };

  return (
    <div className={styles.container}>
      <ToastContainer />

      {/* ===== MODAL RENOVACIÓN DE FLOTA ===== */}
      {modalFlota.visible && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: '#fff', borderRadius: '10px', padding: '2rem',
            minWidth: '340px', maxWidth: '400px', boxShadow: '0 8px 32px rgba(0,0,0,0.25)'
          }}>
            <h3 style={{ marginBottom: '1.2rem', color: '#1a1a2e' }}>🔄 Renovar Flota Empresarial</h3>

            {/* Listado de autos de la flota */}
            {modalFlota.vehiculos_flota?.length > 0 && (
              <div style={{ marginBottom: '1rem', background: '#f5f5f5', borderRadius: '8px', padding: '10px 12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '6px' }}>
                  Vehículos incluidos ({modalFlota.alquileres_ids.length} de {modalFlota.vehiculos_flota.length}) - Clickeá para excluir/incluir
                </span>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {modalFlota.vehiculos_flota.map(v => {
                    const isSelected = modalFlota.alquileres_ids.includes(v.id_alquiler);
                    return (
                      <li 
                        key={v.id} 
                        onClick={() => {
                          setModalFlota(prev => {
                            const newIds = isSelected 
                              ? prev.alquileres_ids.filter(id => id !== v.id_alquiler)
                              : [...prev.alquileres_ids, v.id_alquiler];
                            return { ...prev, alquileres_ids: newIds };
                          });
                        }}
                        style={{
                          background: isSelected ? '#1a1a2e' : '#e0e0e0', 
                          color: isSelected ? '#fff' : '#666',
                          borderRadius: '4px', padding: '3px 8px',
                          fontSize: '11px', fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          border: isSelected ? '1px solid #1a1a2e' : '1px solid #ccc'
                        }}
                        title={isSelected ? "Clic para quitar de la renovación" : "Clic para incluir en la renovación"}
                      >
                        {v.dominio} <span style={{ fontWeight: 'normal', opacity: isSelected ? 0.8 : 1 }}>{v.modelo}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#555' }}>Fecha desde (inicio del nuevo mes)</label>
              <input
                type="date"
                value={modalFlota.fecha_desde}
                onChange={e => setModalFlota(p => ({ ...p, fecha_desde: e.target.value }))}
                style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#555' }}>Hasta</label>
              <input
                type="date"
                value={modalFlota.fecha_hasta}
                min={modalFlota.fecha_desde}
                onChange={e => setModalFlota(p => ({ ...p, fecha_hasta: e.target.value }))}
                style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#555' }}>Importe total de la flota (IVA incluido)</label>
              <input
                type="number"
                placeholder="Ej: 150000"
                value={modalFlota.importe_total_nuevo}
                onChange={e => setModalFlota(p => ({ ...p, importe_total_nuevo: e.target.value }))}
                style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setModalFlota({ visible: false, id_alquiler: null, fecha_desde: '', fecha_hasta: '', importe_total_nuevo: '', vehiculos_flota: [] })}
                style={{
                  padding: '8px 18px', borderRadius: '6px', border: '1px solid #ccc',
                  background: '#f5f5f5', cursor: 'pointer', fontSize: '13px'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleRenovarFlota}
                style={{
                  padding: '8px 18px', borderRadius: '6px', border: 'none',
                  background: '#2e7d32', color: '#fff', cursor: 'pointer',
                  fontSize: '13px', fontWeight: 'bold'
                }}
              >
                Confirmar Renovación
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ===== FIN MODAL ===== */}

      {isLoading && (
        <div className={styles.spinnerOverlay}>
          <ClipLoader
            size={60}
            color="#800020"
            loading={true}
          />
          <span className={styles.loadingText}>Cargando contratos...</span>
        </div>
      )}
      <h2>Listado de contratos</h2>
      <button onClick={handleActualizar} className={styles.refreshButton}>
        🔄 Actualizar reporte
      </button>
      <div className={styles.inputContainer} style={{ alignItems: "self-end" }}>
        <span>Vigentes</span>
        <input type="checkbox" name='vigentes' value={form["vigentes"]}
          onChange={handleCheckChange} checked={!!form.vigentes} />
      </div>
      <DataGrid
        className={styles.dataGrid}
        dataSource={esAVencer ? (contratosAVencer || []) : contratos || []}
        showBorders={true}
        style={{ fontFamily: "IBM" }}
        rowAlternationEnabled={true}
        allowColumnResizing={true}
        columnAutoWidth={true}
        height="70vh"
        onExporting={onExporting}
      >
        <Scrolling mode="standard" />
        <FilterRow visible={true} showAllText={""} />
        <Export enabled={true} fileName="Listado_Contratos" />
        <HeaderFilter visible={true} />
        <Paging defaultPageSize={20} />
        <Column dataField="id" caption="ID" allowHeaderFiltering={false} alignment="center" />
        <Column dataField="id_vehiculo" caption="Vehículo" allowHeaderFiltering={false} cellRender={renderVehiculo} alignment="center" >
          <Lookup
            dataSource={vehiculosGrid}
            valueExpr="id"
            displayExpr={(item) => item ? `${item.dominio}` : ""}
            searchExpr={["dominio"]}
          />
        </Column>
        <Column
          dataField="id_cliente"
          dataType="number"
          caption="Cliente"
          cellRender={renderCliente}
          alignment="center"
          allowHeaderFiltering={false}
        >
          <Lookup
            dataSource={clientesParaGrid}
            valueExpr="id"
            displayExpr={(item) => item && item.nombre ? `${item.nombre} ${item.apellido}` : item && item.razon_social ? `${item.razon_social}` : ""}
            searchExpr={["nombreNorm", "apellidoNorm", "razonsocialNorm"]}
          />
        </Column>
        <Column dataField="fecha_desde" caption="Desde" allowHeaderFiltering={false} allowFiltering={false} cellRender={renderFecha} alignment="center" />
        <Column dataField="fecha_hasta" caption="Hasta" allowHeaderFiltering={false} allowFiltering={false} cellRender={renderFecha} alignment="center" />
        <Column dataField="deposito_garantia" alignment="right" allowHeaderFiltering={false} allowFiltering={false} caption="Depósito"
          customizeText={(e) => Math.trunc(e.value).toLocaleString("es-AR")} />
        <Column caption="" cellRender={renderModificar} alignment="center" />
        {
          hasAdminAccess(roles) && <Column caption="" cellRender={renderModificarVehiculo} alignment="center" />
        }
        <Column dataField="nro_asiento" caption="Asiento depósito" alignment="center" />
        <Column caption="" cellRender={renderRenovarAlquiler} alignment="center" />
        <Summary calculateCustomSummary={handleCustomSummary}>
          <TotalItem
            name="countVehiculos"
            column="id_vehiculo"
            summaryType="custom"
            displayFormat="Total registros: {0}"
            showInColumn="id_vehiculo" />
        </Summary>
      </DataGrid>

      {modalCambioVehiculo.visible && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
          <div style={{
            background: 'white', padding: '2rem', borderRadius: '8px',
            width: '400px', maxWidth: '90%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '18px', color: '#333' }}>
              Cambiar Vehículo del Contrato
            </h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '8px', color: '#555' }}>
                Seleccione el nuevo vehículo a entregar:
              </label>
              <Select
                options={opcionesVehiculosLibres}
                value={opcionesVehiculosLibres.find(opt => opt.value === modalCambioVehiculo.id_vehiculo_nuevo) || null}
                onChange={(opt) => setModalCambioVehiculo(p => ({ ...p, id_vehiculo_nuevo: opt?.value }))}
                placeholder="Buscar vehículo libre..."
                filterOption={(option, inputValue) => option.data.searchKey.includes(inputValue.toLowerCase())}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setModalCambioVehiculo({ visible: false, id_contrato: null, id_vehiculo_actual: null, id_vehiculo_nuevo: null })}
                style={{
                  padding: '8px 18px', borderRadius: '6px', border: '1px solid #ccc',
                  background: '#f5f5f5', cursor: 'pointer', fontSize: '13px'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarCambioVehiculo}
                style={{
                  padding: '8px 18px', borderRadius: '6px', border: 'none',
                  background: '#800020', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
                }}
              >
                Confirmar Cambio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReporteContratos