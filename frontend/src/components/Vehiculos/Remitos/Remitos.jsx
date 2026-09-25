import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  getRemitos,
  anularRemito,
  getVehiculos,
} from "../../../reducers/Vehiculos/vehiculosSlice.js";
import { getModelos } from "../../../reducers/Generales/generalesSlice.js";
import DataGrid, {
  Column,
  Scrolling,
  Paging,
  FilterRow,
  HeaderFilter,
  Export,
} from "devextreme-react/data-grid";
import "devextreme/dist/css/dx.carmine.css";
import Swal from "sweetalert2";
import { format, parseISO } from "date-fns";
import NuevoRemitoModal from "./NuevoRemitoModal.jsx";
import DetalleRemitoModal from "./DetalleRemitoModal.jsx";

const Remitos = () => {
  const dispatch = useDispatch();
  const { remitos } = useSelector((state) => state.vehiculosReducer);
  const { username } = useSelector((state) => state.loginReducer);

  const [modalNuevoOpen, setModalNuevoOpen] = useState(false);
  const [detalleModal, setDetalleModal] = useState({
    isOpen: false,
    id_remito: null,
  });

  useEffect(() => {
    dispatch(getRemitos());
    dispatch(getVehiculos());
    dispatch(getModelos());
  }, [dispatch]);

  const handleAnular = (row) => {
    if (row.estado === "ANULADO") {
      Swal.fire("Atención", "El remito ya se encuentra anulado", "warning");
      return;
    }

    const nroFormatted = `${String(row.punto_venta).padStart(4, "0")}-${String(row.numero).padStart(8, "0")}`;

    Swal.fire({
      title: `¿Anular Remito N° ${nroFormatted}?`,
      text: "Se eliminarán los movimientos asociados de la tabla unidad_movimientos y el remito pasará a estado ANULADO.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, anular",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await dispatch(
          anularRemito({
            id_remito: row.id,
            usuario_anulacion: username,
            motivo_anulacion: "Anulado desde el panel de remitos",
          })
        );

        if (res.meta.requestStatus === "fulfilled" && res.payload?.status !== false) {
          Swal.fire("Anulado", res.payload?.message || "Remito anulado con éxito", "success");
          dispatch(getRemitos());
        } else {
          Swal.fire("Error", res.payload?.message || "Error al anular el remito", "error");
        }
      }
    });
  };

  const renderNumeroRemito = (data) => {
    const row = data.data;
    const nro = `${String(row.punto_venta).padStart(4, "0")}-${String(row.numero).padStart(8, "0")}`;
    const isAnulado = row.estado === "ANULADO";
    return (
      <span style={{ fontWeight: "bold", color: isAnulado ? "#94a3b8" : "#1e293b" }}>
        {nro}
      </span>
    );
  };

  const renderFechaEmision = (data) => {
    const row = data.data;
    const isAnulado = row.estado === "ANULADO";
    return (
      <span style={{ color: isAnulado ? "#94a3b8" : "inherit" }}>
        {row.fecha_emision ? format(parseISO(row.fecha_emision), "dd/MM/yyyy HH:mm") : "-"}
      </span>
    );
  };

  const renderTipoMovimiento = (data) => {
    const row = data.data;
    const isAnulado = row.estado === "ANULADO";
    const tipo = row.tipo_movimiento ? row.tipo_movimiento.toLowerCase() : "egreso";
    return (
      <span
        style={{
          padding: "2px 8px",
          borderRadius: "12px",
          fontSize: "0.8rem",
          fontWeight: 600,
          opacity: isAnulado ? 0.5 : 1,
          backgroundColor: tipo === "egreso" ? "#fee2e2" : "#dcfce7",
          color: tipo === "egreso" ? "#991b1b" : "#166534",
        }}
      >
        {tipo.toUpperCase()}
      </span>
    );
  };

  const renderEstado = (data) => {
    const row = data.data;
    const isAnulado = row.estado === "ANULADO";
    return (
      <span
        style={{
          fontWeight: "bold",
          color: isAnulado ? "#94a3b8" : "#16a34a",
          fontSize: "0.85rem",
        }}
      >
        {row.estado}
      </span>
    );
  };

  const renderAcciones = (data) => {
    const row = data.data;
    const isAnulado = row.estado === "ANULADO";
    return (
      <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
        <button
          onClick={() => setDetalleModal({ isOpen: true, id_remito: row.id })}
          style={{
            backgroundColor: "#0284c7",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            padding: "4px 8px",
            fontSize: "11px",
            fontWeight: "600",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            transition: "all 0.2s",
          }}
          title="Ver detalle"
        >
          <i className="fa-solid fa-eye"></i> Ver
        </button>

        <button
          onClick={() => setDetalleModal({ isOpen: true, id_remito: row.id })}
          style={{
            backgroundColor: "#059669",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            padding: "4px 8px",
            fontSize: "11px",
            fontWeight: "600",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            transition: "all 0.2s",
          }}
          title="Descargar / Imprimir"
        >
          <i className="fa-solid fa-print"></i> Descargar
        </button>

        <button
          onClick={() => handleAnular(row)}
          disabled={isAnulado}
          style={{
            backgroundColor: isAnulado ? "#cbd5e1" : "#dc2626",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            padding: "4px 8px",
            fontSize: "11px",
            fontWeight: "600",
            cursor: isAnulado ? "not-allowed" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            transition: "all 0.2s",
          }}
          title="Anular remito"
        >
          <i className="fa-solid fa-ban"></i> Anular
        </button>
      </div>
    );
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto", fontFamily: "IBM, sans-serif" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ margin: 0, color: "#1e293b" }}>Gestión de Remitos</h2>
        <button
          onClick={() => setModalNuevoOpen(true)}
          style={{
            backgroundColor: "#800020",
            color: "#fff",
            border: "none",
            padding: "9px 20px",
            borderRadius: "6px",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 2px 5px rgba(128,0,32,0.2)",
            transition: "all 0.2s ease-in-out",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#5c0017";
            e.currentTarget.style.boxShadow = "0 4px 8px rgba(128,0,32,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#800020";
            e.currentTarget.style.boxShadow = "0 2px 5px rgba(128,0,32,0.2)";
          }}
        >
          <i className="fa-solid fa-plus"></i>
          Nuevo Remito
        </button>
      </div>

      <DataGrid
        dataSource={remitos || []}
        showBorders={true}
        rowAlternationEnabled={true}
        allowColumnResizing={true}
        columnAutoWidth={true}
        height="70vh"
        style={{
          fontFamily: "IBM, 'Segoe UI', sans-serif",
          fontSize: "12px",
          borderRadius: "6px",
          border: "1px solid #ccc",
          boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
        }}
        onRowPrepared={(e) => {
          if (e.rowType === "data" && e.data?.estado === "ANULADO") {
            e.rowElement.style.color = "#94a3b8";
            e.rowElement.style.backgroundColor = "#f8fafc";
          }
        }}
      >
        <Scrolling mode="standard" />
        <FilterRow visible={true} />
        <HeaderFilter visible={true} />
        <Export enabled={true} fileName="Listado_Remitos" />
        <Paging defaultPageSize={20} />

        <Column
          caption="Número Remito"
          cellRender={renderNumeroRemito}
          alignment="center"
          allowHeaderFiltering={false}
        />
        <Column
          caption="Fecha Emisión"
          cellRender={renderFechaEmision}
          alignment="center"
          allowHeaderFiltering={false}
        />
        <Column
          caption="Movimiento"
          cellRender={renderTipoMovimiento}
          alignment="center"
          allowHeaderFiltering={true}
        />
        <Column
          dataField="cantidad_unidades"
          caption="Cant. Unidades"
          alignment="center"
          allowHeaderFiltering={false}
        />
        <Column
          dataField="motivo"
          caption="Motivo"
          alignment="center"
          allowHeaderFiltering={true}
          cellRender={(data) => {
            const val = data.value || data.data?.destino;
            return (
              <span style={{ fontWeight: 600, textTransform: "uppercase" }}>
                {val && val !== "-" ? val : "-"}
              </span>
            );
          }}
        />
        <Column
          dataField="usuario_alta"
          caption="Usuario Alta"
          alignment="center"
          allowHeaderFiltering={true}
        />
        <Column
          caption="Estado"
          cellRender={renderEstado}
          alignment="center"
          allowHeaderFiltering={true}
        />
        <Column
          caption="Acciones"
          cellRender={renderAcciones}
          alignment="center"
          allowFiltering={false}
          allowHeaderFiltering={false}
          width={260}
        />
      </DataGrid>

      <NuevoRemitoModal isOpen={modalNuevoOpen} onClose={() => setModalNuevoOpen(false)} />

      <DetalleRemitoModal
        idRemito={detalleModal.id_remito}
        isOpen={detalleModal.isOpen}
        onClose={() => setDetalleModal({ isOpen: false, id_remito: null })}
      />
    </div>
  );
};

export default Remitos;
