import React, { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { postRemito, getRemitos } from "../../../reducers/Vehiculos/vehiculosSlice.js";
import DatePicker, { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es";
import { format } from "date-fns";
import Select from "react-select";
import Swal from "sweetalert2";
import { ESTADOS_ESTATICOS } from "../../../utils/estadosVehiculoConfig.js";

registerLocale("es", es);

const NuevoRemitoModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { vehiculos, isLoading } = useSelector((state) => state.vehiculosReducer);
  const { modelos } = useSelector((state) => state.generalesReducer);
  const { username } = useSelector((state) => state.loginReducer);

  const [form, setForm] = useState({
    punto_venta: 1,
    fecha_movimiento: new Date(),
    hora_movimiento: "00:00",
    tipo: "egreso",
    destino: "",
    retira: "",
    autorizo: "",
    observaciones: "",
    unidades: [], // array de IDs de vehiculos
    estado_vehiculos: "",
  });

  const opcionesVehiculos = useMemo(() => {
    if (!vehiculos) return [];
    return vehiculos
      .filter((v) => !v.fecha_venta && v.activo === 1)
      .map((v) => {
        const dominio = v.dominio || v.dominio_provisorio || "SIN DOMINIO";
        const modeloNombre = modelos?.find((m) => m.id === v.modelo)?.nombre || "";
        return {
          value: v.id,
          label: `${dominio} - ${modeloNombre}`,
          searchKey: `${dominio} ${modeloNombre}`.toLowerCase(),
        };
      });
  }, [vehiculos, modelos]);

  if (!isOpen) return null;

  const handleSelectUnidades = (selectedOptions) => {
    const ids = selectedOptions ? selectedOptions.map((opt) => opt.value) : [];
    setForm({ ...form, unidades: ids });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.tipo || !form.fecha_movimiento || !form.hora_movimiento) {
      Swal.fire("Atención", "El tipo de movimiento, fecha y hora son obligatorios", "warning");
      return;
    }

    if (!form.unidades || form.unidades.length === 0) {
      Swal.fire("Atención", "Debe seleccionar al menos una unidad para el remito", "warning");
      return;
    }

    // Validar duplicados
    const unidadesUnicas = [...new Set(form.unidades)];
    if (unidadesUnicas.length !== form.unidades.length) {
      Swal.fire("Atención", "No se puede incluir dos veces la misma unidad", "warning");
      return;
    }

    const fechaStr = format(form.fecha_movimiento, "yyyy-MM-dd");
    const fechaHora = `${fechaStr} ${form.hora_movimiento || "00:00"}:00`;

    const payload = {
      punto_venta: Number(form.punto_venta) || 1,
      fecha_movimiento: fechaHora,
      tipo: form.tipo,
      motivo: form.destino || "",
      destino: form.destino || "",
      retira: form.retira,
      autorizo: form.autorizo,
      observaciones: form.observaciones,
      usuario_alta: username,
      unidades: form.unidades,
      estado_vehiculos: form.estado_vehiculos || null,
    };

    const res = await dispatch(postRemito(payload));
    if (res.meta.requestStatus === "fulfilled" && res.payload?.status !== false) {
      Swal.fire("Éxito", res.payload?.message || "Remito generado con éxito", "success");
      dispatch(getRemitos());
      onClose();
      setForm({
        punto_venta: 1,
        fecha_movimiento: new Date(),
        hora_movimiento: "00:00",
        tipo: "egreso",
        destino: "",
        retira: "",
        autorizo: "",
        observaciones: "",
        unidades: [],
        estado_vehiculos: "",
      });
    } else {
      Swal.fire("Error", res.payload?.message || "No se pudo generar el remito", "error");
    }
  };

  const inputStyle = {
    width: "100%",
    height: "38px",
    padding: "0 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    color: "#1e293b",
    backgroundColor: "#fff",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
    marginBottom: "6px",
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
        zIndex: 10000,
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "10px",
          width: "90%",
          maxWidth: "760px",
          maxHeight: "92vh",
          overflowY: "auto",
          padding: "24px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          fontFamily: "IBM, 'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #e2e8f0",
            paddingBottom: "14px",
            marginBottom: "20px",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#1e293b", fontWeight: 700 }}>
              Generación de Nuevo Remito
            </h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#64748b" }}>
              Registre el traslado, entrega o devolución de unidades de flota.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.6rem",
              cursor: "pointer",
              color: "#94a3b8",
              lineHeight: 1,
              padding: "4px",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#475569"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#94a3b8"}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <style>{`
            .modal-datepicker-wrapper .react-datepicker-wrapper,
            .modal-datepicker-wrapper .react-datepicker__input-container {
              width: 100%;
              display: block;
            }
          `}</style>

          {/* Sección 1: Datos de Emisión y Movimiento */}
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1.1fr 1fr", gap: "14px" }}>
            <div>
              <label style={labelStyle}>Tipo de movimiento *</label>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="egreso">Egreso (Salida / Entrega)</option>
                <option value="ingreso">Ingreso (Entrada / Devolución)</option>
              </select>
            </div>
            <div className="modal-datepicker-wrapper">
              <label style={labelStyle}>Fecha *</label>
              <DatePicker
                selected={form.fecha_movimiento}
                onChange={(date) => setForm({ ...form, fecha_movimiento: date })}
                dateFormat="dd/MM/yyyy"
                locale="es"
                customInput={<input style={inputStyle} />}
              />
            </div>
            <div>
              <label style={labelStyle}>Hora *</label>
              <input
                type="time"
                value={form.hora_movimiento}
                onChange={(e) => setForm({ ...form, hora_movimiento: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Sección 2: Traslado y Responsables */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "14px" }}>
            <div>
              <label style={labelStyle}>Motivo</label>
              <input
                type="text"
                value={form.destino}
                onChange={(e) => setForm({ ...form, destino: e.target.value })}
                placeholder="Ej. Taller, Traslado, etc."
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Persona que retira</label>
              <input
                type="text"
                value={form.retira}
                onChange={(e) => setForm({ ...form, retira: e.target.value })}
                placeholder="Nombre y Apellido"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Autorizado por</label>
              <input
                type="text"
                value={form.autorizo}
                onChange={(e) => setForm({ ...form, autorizo: e.target.value })}
                placeholder="Persona que autoriza"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Sección 3: Unidades */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Unidades a incluir en el remito *</label>
              <span style={{ fontSize: "12px", color: form.unidades.length > 0 ? "#166534" : "#64748b", fontWeight: 600 }}>
                {form.unidades.length} seleccionada(s)
              </span>
            </div>
            <Select
              isMulti
              options={opcionesVehiculos}
              onChange={handleSelectUnidades}
              placeholder="Buscar por dominio o modelo de vehículo..."
              filterOption={(option, inputValue) => option.data.searchKey.includes(inputValue.toLowerCase())}
              styles={{
                control: (base, state) => ({
                  ...base,
                  minHeight: "38px",
                  borderColor: state.isFocused ? "#800020" : "#cbd5e1",
                  boxShadow: state.isFocused ? "0 0 0 1px #800020" : "none",
                  "&:hover": { borderColor: "#800020" },
                  borderRadius: "6px",
                  fontSize: "14px",
                }),
                multiValue: (base) => ({
                  ...base,
                  backgroundColor: "#f1f5f9",
                  borderRadius: "4px",
                }),
                multiValueLabel: (base) => ({
                  ...base,
                  color: "#1e293b",
                  fontWeight: 600,
                  fontSize: "13px",
                }),
              }}
            />
          </div>

          {/* Sección 3.5: Cambio de Estado (Opcional) */}
          <div>
            <label style={labelStyle}>Cambiar estado de las unidades a (opcional)</label>
            <select
              value={form.estado_vehiculos}
              onChange={(e) => setForm({ ...form, estado_vehiculos: e.target.value })}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">No cambiar estado</option>
              {ESTADOS_ESTATICOS.map((est) => (
                <option key={est.id} value={est.id}>
                  {est.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Sección 4: Observaciones */}
          <div>
            <label style={labelStyle}>Observaciones (opcional)</label>
            <textarea
              rows={2}
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
              placeholder="Detalle o aclaraciones del remito..."
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
                color: "#1e293b",
                backgroundColor: "#fff",
                outline: "none",
                boxSizing: "border-box",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Botones de acción */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: "#fff",
                color: "#475569",
                border: "1px solid #cbd5e1",
                padding: "0 18px",
                height: "38px",
                borderRadius: "6px",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f8fafc";
                e.currentTarget.style.borderColor = "#94a3b8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#fff";
                e.currentTarget.style.borderColor = "#cbd5e1";
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                backgroundColor: "#800020",
                color: "#fff",
                border: "none",
                padding: "0 22px",
                height: "38px",
                borderRadius: "6px",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(128,0,32,0.2)",
                transition: "all 0.2s",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#5c0017"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#800020"}
            >
              {isLoading ? "Generando..." : "Confirmar y Generar Remito"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NuevoRemitoModal;
