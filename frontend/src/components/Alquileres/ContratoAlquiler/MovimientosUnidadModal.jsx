import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  getMovimientosContrato,
  postMovimientoContrato,
} from "../../../reducers/Alquileres/alquileresSlice.js";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import es from "date-fns/locale/es";
import { format, parseISO } from "date-fns";
import Swal from "sweetalert2";
import DetalleRemitoModal from "../../Vehiculos/Remitos/DetalleRemitoModal.jsx";

registerLocale("es", es);

const MovimientosUnidadModal = ({ idContrato, contratoInfo, isOpen, onClose, onMovimientoRegistrado }) => {
  const dispatch = useDispatch();
  const { movimientosContrato } = useSelector(
    (state) => state.alquileresReducer
  );
  const { username } = useSelector((state) => state.loginReducer);

  const [selectedRemitoId, setSelectedRemitoId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    fecha_movimiento: new Date(),
    hora_movimiento: format(new Date(), "HH:mm"),
    tipo: "egreso",
    retira: "",
    autorizo: "",
    observaciones: "",
  });

  useEffect(() => {
    if (isOpen && idContrato) {
      dispatch(getMovimientosContrato({ id_contrato: idContrato }));
      setSelectedRemitoId(null);
      setForm({
        fecha_movimiento: new Date(),
        hora_movimiento: format(new Date(), "HH:mm"),
        tipo: "egreso",
        retira: "",
        autorizo: "",
        observaciones: "",
      });
    }
  }, [isOpen, idContrato, dispatch]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fecha_movimiento || !form.hora_movimiento || !form.tipo) {
      Swal.fire("Error", "Debe completar fecha, hora y tipo de movimiento", "warning");
      return;
    }

    const fechaStr = format(form.fecha_movimiento, "yyyy-MM-dd");
    const horaStr = form.hora_movimiento || "00:00";
    const payload = {
      id_contrato: idContrato,
      fecha_movimiento: `${fechaStr} ${horaStr}:00`,
      tipo: form.tipo,
      retira: form.retira,
      autorizo: form.autorizo,
      observaciones: form.observaciones,
      usuario_alta: username,
    };

    setIsSubmitting(true);
    const res = await dispatch(postMovimientoContrato(payload));
    setIsSubmitting(false);

    if (res.meta.requestStatus === "fulfilled" && res.payload?.status !== false) {
      const idRemitoGenerado = res.payload?.id_remito;
      const nroRemito = res.payload?.numero_remito;

      if (onMovimientoRegistrado) {
        onMovimientoRegistrado({ id_remito: idRemitoGenerado, numero_remito: nroRemito });
      } else {
        onClose();
        Swal.fire({
          title: "¡Movimiento y Remito Registrados!",
          text: nroRemito
            ? `Se generó el Remito N° ${nroRemito}. ¿Desea ver e imprimir el remito ahora?`
            : "Movimiento registrado con éxito. ¿Desea ver el remito?",
          icon: "success",
          showCancelButton: true,
          confirmButtonText: "Imprimir Remito",
          cancelButtonText: "Cerrar",
          confirmButtonColor: "#800020",
          cancelButtonColor: "#64748b",
        }).then((result) => {
          if (result.isConfirmed && idRemitoGenerado) {
            setSelectedRemitoId(idRemitoGenerado);
          }
        });
      }
    } else {
      Swal.fire("Error", res.payload?.message || "Error al registrar movimiento", "error");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "8px",
          width: "90%",
          maxWidth: "850px",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "24px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #e2e8f0",
            paddingBottom: "12px",
            marginBottom: "16px",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#1e293b" }}>
              Movimientos de la Unidad (Contrato #{idContrato})
            </h3>
            {contratoInfo && (
              <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
                {contratoInfo}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: "#64748b",
            }}
          >
            &times;
          </button>
        </div>

        {/* Formulario de registro de movimiento */}
        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: "#f8fafc",
            padding: "16px",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            marginBottom: "20px",
          }}
        >
          <h4 style={{ margin: "0 0 12px 0", fontSize: "1rem", color: "#334155" }}>
            Registrar Nuevo Movimiento
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
              alignItems: "flex-end",
            }}
          >
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px", color: "#475569" }}>
                Tipo de Movimiento *
              </label>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                style={{ width: "100%", height: "38px", padding: "0 8px", borderRadius: "4px", border: "1px solid #cbd5e1", outline: "none", backgroundColor: "#fff" }}
              >
                <option value="egreso">Egreso (Entrega / Salida)</option>
                <option value="ingreso">Ingreso (Devolución / Entrada)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px", color: "#475569" }}>
                Fecha *
              </label>
              <DatePicker
                selected={form.fecha_movimiento}
                onChange={(date) => setForm({ ...form, fecha_movimiento: date })}
                dateFormat="dd/MM/yyyy"
                locale="es"
                customInput={
                  <input
                    style={{
                      width: "100%",
                      height: "38px",
                      padding: "0 8px",
                      borderRadius: "4px",
                      border: "1px solid #cbd5e1",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                }
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px", color: "#475569" }}>
                Hora *
              </label>
              <input
                type="time"
                value={form.hora_movimiento}
                onChange={(e) => setForm({ ...form, hora_movimiento: e.target.value })}
                style={{
                  width: "100%",
                  height: "38px",
                  padding: "0 8px",
                  borderRadius: "4px",
                  border: "1px solid #cbd5e1",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px", color: "#475569" }}>
                Persona que retira
              </label>
              <input
                type="text"
                value={form.retira}
                onChange={(e) => setForm({ ...form, retira: e.target.value })}
                placeholder="Nombre y Apellido"
                style={{ width: "100%", height: "38px", padding: "0 8px", borderRadius: "4px", border: "1px solid #cbd5e1", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px", color: "#475569" }}>
                Autorizó
              </label>
              <input
                type="text"
                value={form.autorizo}
                onChange={(e) => setForm({ ...form, autorizo: e.target.value })}
                placeholder="Persona que autoriza"
                style={{ width: "100%", height: "38px", padding: "0 8px", borderRadius: "4px", border: "1px solid #cbd5e1", outline: "none", boxSizing: "border-box" }}
              />
            </div>
          </div>

          <div style={{ marginTop: "12px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px", color: "#475569" }}>
              Observaciones
            </label>
            <input
              type="text"
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
              placeholder="Detalle o notas adicionales del movimiento"
              style={{ width: "100%", height: "38px", padding: "0 8px", borderRadius: "4px", border: "1px solid #cbd5e1", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginTop: "16px", textAlign: "right" }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                backgroundColor: "#800020",
                color: "#fff",
                border: "none",
                padding: "8px 20px",
                height: "38px",
                borderRadius: "6px",
                fontWeight: 600,
                fontSize: "14px",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                opacity: isSubmitting ? 0.7 : 1,
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#5c0017"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#800020"}
            >
              {isSubmitting ? "Guardando..." : "Registrar Movimiento"}
            </button>
          </div>
        </form>

        {/* Historial de movimientos */}
        <h4 style={{ margin: "0 0 12px 0", fontSize: "1rem", color: "#334155" }}>
          Historial de Movimientos del Contrato
        </h4>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ backgroundColor: "#f1f5f9", textAlign: "left", color: "#475569" }}>
                <th style={{ padding: "10px", borderBottom: "2px solid #cbd5e1" }}>Fecha / Hora</th>
                <th style={{ padding: "10px", borderBottom: "2px solid #cbd5e1" }}>Tipo</th>
                <th style={{ padding: "10px", borderBottom: "2px solid #cbd5e1" }}>Motivo</th>
                <th style={{ padding: "10px", borderBottom: "2px solid #cbd5e1" }}>Retira</th>
                <th style={{ padding: "10px", borderBottom: "2px solid #cbd5e1" }}>Autorizó</th>
                <th style={{ padding: "10px", borderBottom: "2px solid #cbd5e1" }}>Observaciones</th>
                <th style={{ padding: "10px", borderBottom: "2px solid #cbd5e1" }}>Usuario</th>
                <th style={{ padding: "10px", borderBottom: "2px solid #cbd5e1", textAlign: "center" }}>Remito</th>
              </tr>
            </thead>
            <tbody>
              {movimientosContrato && movimientosContrato.length > 0 ? (
                movimientosContrato.map((m) => (
                  <tr key={m.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "10px", whiteSpace: "nowrap" }}>
                      {m.fecha_movimiento
                        ? format(parseISO(m.fecha_movimiento), "dd/MM/yyyy HH:mm")
                        : "-"}
                    </td>
                    <td style={{ padding: "10px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "12px",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          backgroundColor: m.tipo === "egreso" ? "#fee2e2" : "#dcfce7",
                          color: m.tipo === "egreso" ? "#991b1b" : "#166534",
                        }}
                      >
                        {m.tipo ? m.tipo.toUpperCase() : "-"}
                      </span>
                    </td>
                    <td style={{ padding: "10px" }}>{m.motivo || "-"}</td>
                    <td style={{ padding: "10px" }}>{m.retira || "-"}</td>
                    <td style={{ padding: "10px" }}>{m.autorizo || "-"}</td>
                    <td style={{ padding: "10px" }}>{m.observaciones || "-"}</td>
                    <td style={{ padding: "10px" }}>{m.usuario_alta || "-"}</td>
                    <td style={{ padding: "10px", textAlign: "center" }}>
                      {m.id_remito ? (
                        <button
                          type="button"
                          onClick={() => setSelectedRemitoId(m.id_remito)}
                          title="Ver e Imprimir Remito"
                          style={{
                            backgroundColor: "#800020",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            padding: "4px 10px",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <i className="fa-solid fa-print"></i>
                          <span>
                            {m.remito_numero
                              ? `${String(m.remito_punto_venta || 1).padStart(4, "0")}-${String(m.remito_numero).padStart(8, "0")}`
                              : "Imprimir"}
                          </span>
                        </button>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
                    No hay movimientos registrados para este contrato.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: "24px", textAlign: "right" }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: "#f1f5f9",
              color: "#334155",
              border: "1px solid #cbd5e1",
              padding: "8px 18px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: "13px"
            }}
          >
            Cerrar
          </button>
        </div>
      </div>

      {selectedRemitoId && (
        <DetalleRemitoModal
          isOpen={!!selectedRemitoId}
          idRemito={selectedRemitoId}
          onClose={() => setSelectedRemitoId(null)}
        />
      )}
    </div>
  );
};

export default MovimientosUnidadModal;
