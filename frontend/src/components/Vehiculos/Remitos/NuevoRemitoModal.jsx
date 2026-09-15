import React, { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { postRemito, getRemitos } from "../../../reducers/Vehiculos/vehiculosSlice.js";
import DatePicker, { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es";
import { format } from "date-fns";
import Select from "react-select";
import Swal from "sweetalert2";

registerLocale("es", es);

const NuevoRemitoModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { vehiculos, isLoading } = useSelector((state) => state.vehiculosReducer);
  const { modelos } = useSelector((state) => state.generalesReducer);
  const { username } = useSelector((state) => state.loginReducer);

  const [form, setForm] = useState({
    punto_venta: 1,
    fecha_movimiento: new Date(),
    tipo: "egreso",
    destino: "",
    retira: "",
    autorizo: "",
    observaciones: "",
    unidades: [], // array de IDs de vehiculos
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

    if (!form.tipo || !form.fecha_movimiento) {
      Swal.fire("Atención", "El tipo de movimiento y la fecha/hora son obligatorios", "warning");
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

    const payload = {
      punto_venta: Number(form.punto_venta) || 1,
      fecha_movimiento: format(form.fecha_movimiento, "yyyy-MM-dd HH:mm:ss"),
      tipo: form.tipo,
      destino: form.destino,
      retira: form.retira,
      autorizo: form.autorizo,
      observaciones: form.observaciones,
      usuario_alta: username,
      unidades: form.unidades,
    };

    const res = await dispatch(postRemito(payload));
    if (res.meta.requestStatus === "fulfilled" && res.payload?.status !== false) {
      Swal.fire("Éxito", res.payload?.message || "Remito generado con éxito", "success");
      dispatch(getRemitos());
      onClose();
      setForm({
        punto_venta: 1,
        fecha_movimiento: new Date(),
        tipo: "egreso",
        destino: "",
        retira: "",
        autorizo: "",
        observaciones: "",
        unidades: [],
      });
    } else {
      Swal.fire("Error", res.payload?.message || "No se pudo generar el remito", "error");
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
        zIndex: 10000,
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "8px",
          width: "90%",
          maxWidth: "750px",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "24px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
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
            Generación de Nuevo Remito
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

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                Tipo de Movimiento *
              </label>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
              >
                <option value="egreso">Egreso (Salida / Entrega)</option>
                <option value="ingreso">Ingreso (Entrada / Devolución)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                Fecha y Hora del Movimiento *
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
                Punto de Venta
              </label>
              <input
                type="number"
                min="1"
                value={form.punto_venta}
                onChange={(e) => setForm({ ...form, punto_venta: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                Destino
              </label>
              <input
                type="text"
                value={form.destino}
                onChange={(e) => setForm({ ...form, destino: e.target.value })}
                placeholder="Lugar de destino / Sucursal"
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
              />
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

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
              Seleccionar Unidades a Incluir *
            </label>
            <Select
              isMulti
              options={opcionesVehiculos}
              onChange={handleSelectUnidades}
              placeholder="Buscar y seleccionar una o más unidades..."
              filterOption={(option, inputValue) => option.data.searchKey.includes(inputValue.toLowerCase())}
            />
            <small style={{ color: "#64748b", marginTop: "4px", display: "block" }}>
              {form.unidades.length} unidad(es) seleccionada(s).
            </small>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
              Observaciones (opcional)
            </label>
            <textarea
              rows={2}
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
              placeholder="Detalle o aclaraciones del remito..."
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
            <button
              type="button"
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
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                backgroundColor: "#2563eb",
                color: "#fff",
                border: "none",
                padding: "8px 18px",
                borderRadius: "4px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
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
