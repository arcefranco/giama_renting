import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import siniestrosService from "../../../reducers/Siniestros/siniestrosService.js";
import styles from "./SiniestrosListado.module.css";

const SiniestrosListado = () => {
  const navigate = useNavigate();
  const [siniestros, setSiniestros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("Todos");
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");

  const cargarSiniestros = async () => {
    setLoading(true);
    try {
      const res = await siniestrosService.getSiniestros();
      const list = Array.isArray(res) ? res : res?.data || [];
      setSiniestros(list);
    } catch (err) {
      console.error("Error al cargar siniestros/inspecciones:", err);
      Swal.fire("Error", "No se pudieron cargar las inspecciones.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSiniestros();
  }, []);

  const handleEstadoChange = async (id, nuevoEstado) => {
    try {
      const res = await siniestrosService.updateSiniestroEstado(id, nuevoEstado);
      if (res && res.status !== false) {
        setSiniestros((prev) =>
          prev.map((s) => (s.id === id ? { ...s, estado: nuevoEstado } : s))
        );
        Swal.fire({
          icon: "success",
          title: "Estado actualizado",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire("Error", res?.message || "No se pudo actualizar el estado", "error");
      }
    } catch (err) {
      console.error("Error actualizando estado:", err);
      Swal.fire("Error", "Ocurrió un error al cambiar el estado.", "error");
    }
  };

  const filteredData = useMemo(() => {
    return siniestros.filter((item) => {
      // Filtro tipo
      if (tipoFiltro !== "Todos" && item.tipo !== tipoFiltro) {
        return false;
      }
      // Filtro estado
      if (estadoFiltro !== "Todos" && item.estado !== estadoFiltro) {
        return false;
      }
      // Filtro búsqueda
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const idStr = String(item.id || "");
      const contratoIdStr = String(item.id_contrato || "");
      const dominio = (item.vehiculo_dominio || item.vehiculo_dominio_provisorio || "").toLowerCase();
      const modelo = (item.vehiculo_modelo || "").toLowerCase();
      const cliente = (
        `${item.cliente_nombre || ""} ${item.cliente_apellido || ""} ${item.cliente_razon_social || ""}`
      ).toLowerCase();
      const verificador = (item.verificador || "").toLowerCase();

      return (
        idStr.includes(q) ||
        contratoIdStr.includes(q) ||
        dominio.includes(q) ||
        modelo.includes(q) ||
        cliente.includes(q) ||
        verificador.includes(q)
      );
    });
  }, [siniestros, search, tipoFiltro, estadoFiltro]);

  const getTypeBadgeClass = (tipo) => {
    switch (tipo?.toLowerCase()) {
      case "entrega":
        return `${styles.typeBadge} ${styles.typeEntrega}`;
      case "devolución":
      case "devolucion":
        return `${styles.typeBadge} ${styles.typeDevolucion}`;
      case "siniestro":
        return `${styles.typeBadge} ${styles.typeSiniestro}`;
      default:
        return styles.typeBadge;
    }
  };

  const getStatusSelectClass = (estado) => {
    switch (estado?.toLowerCase()) {
      case "pendiente":
        return `${styles.statusSelect} ${styles.statusPendiente}`;
      case "finalizada":
        return `${styles.statusSelect} ${styles.statusFinalizada}`;
      case "cancelada":
      case "anulada":
        return `${styles.statusSelect} ${styles.statusCancelada}`;
      default:
        return styles.statusSelect;
    }
  };

  const formatFechaHora = (fechaStr) => {
    if (!fechaStr) return "-";
    try {
      const d = new Date(fechaStr);
      if (isNaN(d.getTime())) return fechaStr;
      return d.toLocaleString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return fechaStr;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Siniestros e Inspecciones</h1>
          <p>Control integral de actas de entrega, devolución y registro de siniestros</p>
        </div>
        <button
          className={styles.newButton}
          onClick={() => navigate("/vehiculos/siniestros/nuevo")}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nueva inspección
        </button>
      </div>

      <div className={styles.filtersBar}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Buscar por ID, contrato, patente, cliente, modelo o verificador..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className={styles.filterSelect}
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
        >
          <option value="Todos">Tipo: Todos</option>
          <option value="Entrega">Entrega</option>
          <option value="Devolución">Devolución</option>
          <option value="Siniestro">Siniestro</option>
        </select>

        <select
          className={styles.filterSelect}
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
        >
          <option value="Todos">Estado: Todos</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Finalizada">Finalizada</option>
          <option value="Cancelada">Cancelada</option>
        </select>
      </div>

      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loadingState}>
            Cargando inspecciones y siniestros...
          </div>
        ) : filteredData.length === 0 ? (
          <div className={styles.emptyState}>
            <svg
              className={styles.emptyStateIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <h3>No se encontraron registros</h3>
            <p>No hay actas registradas que coincidan con los filtros actuales.</p>
            <button
              className={styles.newButton}
              onClick={() => navigate("/vehiculos/siniestros/nuevo")}
            >
              Crear primera acta
            </button>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>N.º Acta</th>
                  <th>Fecha y Hora</th>
                  <th>Tipo</th>
                  <th>Vehículo</th>
                  <th>Cliente</th>
                  <th>Contrato</th>
                  <th>Verificador</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => {
                  const clienteNombre =
                    `${item.cliente_nombre || ""} ${item.cliente_apellido || ""}`.trim() ||
                    item.cliente_razon_social ||
                    "-";
                  const vehiculoDominio =
                    item.vehiculo_dominio || item.vehiculo_dominio_provisorio || "S/D";
                  const vehiculoModelo = item.vehiculo_modelo || "";

                  return (
                    <tr key={item.id}>
                      <td>
                        <span className={styles.idBadge}>#{item.id}</span>
                      </td>
                      <td>
                        <span className={styles.dateTime}>
                          {formatFechaHora(item.fecha_hora)}
                        </span>
                      </td>
                      <td>
                        <span className={getTypeBadgeClass(item.tipo)}>
                          {item.tipo || "Entrega"}
                        </span>
                      </td>
                      <td>
                        <div className={styles.vehicleDominio}>{vehiculoDominio}</div>
                        {vehiculoModelo && (
                          <div className={styles.vehicleModel}>{vehiculoModelo}</div>
                        )}
                      </td>
                      <td>
                        <div className={styles.clientName}>{clienteNombre}</div>
                      </td>
                      <td>
                        <span className={styles.idBadge}>#{item.id_contrato}</span>
                      </td>
                      <td>{item.verificador || "-"}</td>
                      <td>
                        <select
                          className={getStatusSelectClass(item.estado)}
                          value={item.estado || "Pendiente"}
                          onChange={(e) => handleEstadoChange(item.id, e.target.value)}
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="Finalizada">Finalizada</option>
                          <option value="Cancelada">Cancelada</option>
                        </select>
                      </td>
                      <td>
                        <button
                          className={styles.actionButton}
                          onClick={() => navigate(`/vehiculos/siniestros/${item.id}`)}
                          title="Ver detalle de inspección"
                        >
                          Ver / Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SiniestrosListado;
