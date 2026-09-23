import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  getMovimientosContrato,
  postMovimientoContrato,
} from "../../../reducers/Alquileres/alquileresSlice.js";
import DatePicker, { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es";
import { format, parseISO } from "date-fns";
import Swal from "sweetalert2";
import styles from "../AlquileresForm/AlquileresForm.module.css";

registerLocale("es", es);

const MovimientosUnidadModal = ({ idContrato, isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { movimientosContrato, isLoading } = useSelector(
    (state) => state.alquileresReducer
  );
  const { username } = useSelector((state) => state.loginReducer);

  const [form, setForm] = useState({
    fecha_movimiento: new Date(),
    tipo: "egreso",
    retira: "",
    autorizo: "",
    observaciones: "",
  });

  useEffect(() => {
    if (isOpen && idContrato) {
      dispatch(getMovimientosContrato({ id_contrato: idContrato }));
    }
  }, [isOpen, idContrato, dispatch]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fecha_movimiento || !form.tipo) {
      Swal.fire("Error", "Debe completar fecha/hora y tipo de movimiento", "warning");
      return;
    }

    const payload = {
      id_contrato: idContrato,
      fecha_movimiento: format(form.fecha_movimiento, "yyyy-MM-dd HH:mm:ss"),
      tipo: form.tipo,
      retira: form.retira,
      autorizo: form.autorizo,
      observaciones: form.observaciones,
      usuario_alta: username,
    };

    const res = await dispatch(postMovimientoContrato(payload));
    if (res.meta.requestStatus === "fulfilled") {
      Swal.fire("Éxito", res.payload?.message || "Movimiento registrado con éxito", "success");
      setForm({
        fecha_movimiento: new Date(),
        tipo: "egreso",
        retira: "",
        autorizo: "",
        observaciones: "",
      });
      dispatch(getMovimientosContrato({ id_contrato: idContrato }));
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
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "8px",
          width: "90%",
          maxWidth: "800px",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "24px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
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
          <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#1e293b" }}>
            Movimientos de la Unidad (Contrato #{idContrato})
          </h3>
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
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "12px",
            }}
          >
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                Fecha y Hora *
              </label>
              <DatePicker
                selected={form.fecha_movimiento}
                onChange={(date) => setForm({ ...form, fecha_movimiento: date })}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="dd/MM/yyyy HH:mm"
                locale="es"
                className="form-control"
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                Tipo de Movimiento *
              </label>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
              >
                <option value="egreso">Egreso (Entrega / Salida)</option>
                <option value="ingreso">Ingreso (Devolución / Entrada)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                Persona que retira
              </label>
              <input
                type="text"
                value={form.retira}
                onChange={(e) => setForm({ ...form, retira: e.target.value })}
                placeholder="Nombre y Apellido"
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                Autorizó
              </label>
              <input
                type="text"
                value={form.autorizo}
                onChange={(e) => setForm({ ...form, autorizo: e.target.value })}
                placeholder="Persona que autoriza"
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
              />
            </div>
          </div>

          <div style={{ marginTop: "12px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
              Observaciones
            </label>
            <textarea
              rows={2}
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
              placeholder="Detalle o notas adicionales del movimiento"
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
            />
          </div>

          <div style={{ marginTop: "12px", textAlign: "right" }}>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                backgroundColor: "#2563eb",
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "4px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {isLoading ? "Guardando..." : "Guardar Movimiento"}
            </button>
          </div>
        </form>

        {/* Historial de movimientos */}
        <h4 style={{ margin: "0 0 12px 0", fontSize: "1rem", color: "#334155" }}>
          Historial de Movimientos del Contrato
        </h4>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ backgroundColor: "#f1f5f9", textAlign: "left" }}>
                <th style={{ padding: "8px", borderBottom: "2px solid #cbd5e1" }}>Fecha / Hora</th>
                <th style={{ padding: "8px", borderBottom: "2px solid #cbd5e1" }}>Tipo</th>
                <th style={{ padding: "8px", borderBottom: "2px solid #cbd5e1" }}>Motivo</th>
                <th style={{ padding: "8px", borderBottom: "2px solid #cbd5e1" }}>Retira</th>
                <th style={{ padding: "8px", borderBottom: "2px solid #cbd5e1" }}>Autorizó</th>
                <th style={{ padding: "8px", borderBottom: "2px solid #cbd5e1" }}>Observaciones</th>
                <th style={{ padding: "8px", borderBottom: "2px solid #cbd5e1" }}>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {movimientosContrato && movimientosContrato.length > 0 ? (
                movimientosContrato.map((m) => (
                  <tr key={m.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "8px" }}>
                      {m.fecha_movimiento
                        ? format(parseISO(m.fecha_movimiento), "dd/MM/yyyy HH:mm")
                        : "-"}
                    </td>
                    <td style={{ padding: "8px" }}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          backgroundColor: m.tipo === "egreso" ? "#fee2e2" : "#dcfce7",
                          color: m.tipo === "egreso" ? "#991b1b" : "#166534",
                        }}
                      >
                        {m.tipo ? m.tipo.toUpperCase() : "-"}
                      </span>
                    </td>
                    <td style={{ padding: "8px" }}>{m.motivo || "-"}</td>
                    <td style={{ padding: "8px" }}>{m.retira || "-"}</td>
                    <td style={{ padding: "8px" }}>{m.autorizo || "-"}</td>
                    <td style={{ padding: "8px" }}>{m.observaciones || "-"}</td>
                    <td style={{ padding: "8px" }}>{m.usuario_alta || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: "16px", textAlign: "center", color: "#64748b" }}>
                    No hay movimientos registrados para este contrato.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: "20px", textAlign: "right" }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: "#64748b",
              color: "#fff",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovimientosUnidadModal;
