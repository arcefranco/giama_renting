import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import Swal from "sweetalert2";
import { getContratosDigitales } from "../../../reducers/ContratoDigital/contratoDigitalService";
import {
  IconPlus,
  IconSearch,
  IconPrinter,
  IconCheck,
  IconClose,
} from "./ContratoDigitalIcons";
import styles from "./ContratosDigitalesListado.module.css";

const ContratosDigitalesListado = () => {
  const navigate = useNavigate();
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const cargarContratos = async (term = "") => {
    setLoading(true);
    try {
      const res = await getContratosDigitales(term);
      const list = Array.isArray(res) ? res : res?.data || [];
      setContratos(list);
    } catch (err) {
      console.error("Error al cargar contratos digitales:", err);
      Swal.fire("Error", "No se pudieron cargar los contratos digitales.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarContratos();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    cargarContratos(search);
  };

  const formatFecha = (d) => {
    if (!d) return "-";
    const str = String(d).slice(0, 10);
    const parts = str.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return str;
  };

  const formatMoney = (val) => {
    if (val === null || val === undefined || val === "") return "-";
    const num = Number(val);
    return isNaN(num) ? "-" : `$ ${num.toLocaleString("es-AR")}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerCard}>
        <div>
          <h1>Contratos Digitales</h1>
          <p>Registro histórico de cartas oferta digitales emitidas y firmadas</p>
        </div>
        <button
          className={styles.newButton}
          onClick={() => navigate("/alquileres/contrato-digital")}
        >
          <IconPlus size={16} /> Nueva carta oferta digital
        </button>
      </div>

      <div className={styles.filterCard}>
        <form onSubmit={handleSearchSubmit} style={{ display: "contents" }}>
          <input
            className={styles.searchInput}
            placeholder="Buscar por nro de contrato, locatario, DNI o patente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className={styles.refreshButton} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <IconSearch size={15} /> Buscar
          </button>
          {search && (
            <button
              type="button"
              className={styles.refreshButton}
              onClick={() => {
                setSearch("");
                cargarContratos("");
              }}
            >
              Limpiar
            </button>
          )}
        </form>
      </div>

      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loadingWrapper}>
            <ClipLoader color="#1e5a91" size={40} />
          </div>
        ) : contratos.length === 0 ? (
          <div className={styles.emptyState}>
            No se encontraron contratos digitales registrados.
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>N.º Contrato</th>
                  <th>Fecha y Hora</th>
                  <th>Locatario</th>
                  <th>DNI / CUIT</th>
                  <th>Vehículo</th>
                  <th>Alquiler Semanal</th>
                  <th>Depósito</th>
                  <th>Plazo</th>
                  <th>Firma</th>
                  <th style={{ textAlign: "center" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {contratos.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <b>#{c.id}</b>
                    </td>
                    <td>
                      <span className={styles.contractBadge}>
                        {c.numero_contrato || "-"}
                      </span>
                    </td>
                    <td>
                      {formatFecha(c.fecha)} {c.hora ? String(c.hora).slice(0, 5) : ""}
                    </td>
                    <td>
                      <b>{c.locatario_nombre || "-"}</b>
                      {c.locatario_telefono && (
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          Tel: {c.locatario_telefono}
                        </div>
                      )}
                    </td>
                    <td>{c.locatario_dni || "-"}</td>
                    <td>
                      <span className={styles.plateBadge}>
                        {c.vehiculo_patente || "-"}
                      </span>
                      {(c.vehiculo_marca || c.vehiculo_modelo) && (
                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 2 }}>
                          {c.vehiculo_marca} {c.vehiculo_modelo}
                        </div>
                      )}
                    </td>
                    <td><b>{formatMoney(c.alquiler_semanal)}</b></td>
                    <td>{formatMoney(c.deposito_garantia)}</td>
                    <td>{c.plazo_semanas || 12} sem.</td>
                    <td>
                      {c.firma_digital ? (
                        <span className={styles.signedBadge}>
                          <IconCheck size={14} /> Firmado
                        </span>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                          Sin firma
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className={styles.actionButton}
                        onClick={() => window.open(`${import.meta.env.VITE_BASENAME}alquileres/contrato-digital/ver/${c.id}`, "_blank")}
                        title="Ver documento y reimprimir"
                      >
                        <IconPrinter size={15} /> Ver / Imprimir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContratosDigitalesListado;
