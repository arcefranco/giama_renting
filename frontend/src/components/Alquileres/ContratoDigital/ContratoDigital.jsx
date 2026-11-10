import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AsyncSelect from "react-select/async";
import Swal from "sweetalert2";
import {
  buscarContratosParaDigital,
  postContratoDigital,
  getContratoDigitalById,
} from "../../../reducers/ContratoDigital/contratoDigitalService";
import {
  IconPlus,
  IconPrinter,
  IconList,
  IconCheck,
  IconTrash,
} from "./ContratoDigitalIcons";
import styles from "./ContratoDigital.module.css";

export function contractEndDate(start, modality) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start || "")) return "";
  const d = new Date(start + "T12:00:00Z");
  if (isNaN(d)) return "";
  if (modality === "purchase_24m") {
    const day = d.getUTCDate();
    d.setUTCDate(1);
    d.setUTCFullYear(d.getUTCFullYear() + 2);
    const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(day, last));
  } else {
    d.setUTCDate(d.getUTCDate() + 84); // 12 semanas * 7 días = 84 días
  }
  return d.toISOString().slice(0, 10);
}

const initialForm = {
  id_contrato: null,
  id_cliente: null,
  id_vehiculo: null,
  numero_contrato: "",
  fecha: new Date().toISOString().slice(0, 10),
  hora: new Date().toTimeString().slice(0, 5),
  locatario_nombre: "",
  locatario_dni: "",
  locatario_telefono: "",
  locatario_domicilio: "",
  locatario_localidad: "",
  locatario_email: "",
  vehiculo_marca: "",
  vehiculo_modelo: "",
  vehiculo_patente: "",
  vehiculo_color: "",
  vehiculo_kilometraje: "",
  alquiler_semanal: "",
  deposito_garantia: "",
  km_limite_semanal: 2000,
  valor_km_excedente: 520,
  plazo_semanas: "12",
  observaciones: "",
  verify_address: false,
  verify_email: false,
  verify_phone: false,
  acepta_contrato: false,
  acepta_cabify: false,
  acepta_telepase: false,
};

const formatMoney = (val) => {
  if (val === "" || val === null || val === undefined) return "-";
  const num = Number(String(val).replace(/\D/g, ""));
  return isNaN(num) || num === 0 ? "-" : num.toLocaleString("es-AR");
};

const formatDate = (val) => {
  if (!val) return "fecha";
  const parts = val.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return val;
};

const ContratoDigital = () => {
  const { idContrato, idDigital } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialForm);
  const [selectedContratoOption, setSelectedContratoOption] = useState(null);
  const [signatureData, setSignatureData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const searchTimeoutRef = useRef(null);

  // Inicializar canvas de firma
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(140 * dpr);
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#14233b";

    if (signatureData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, 140);
      };
      img.src = signatureData;
    }
  }, []);

  const formatContratoOption = (c) => {
    const cliente = c.cliente_razon_social || `${c.cliente_nombre || ""} ${c.cliente_apellido || ""}`.trim();
    const auto = `${c.vehiculo_marca || ""} ${c.vehiculo_modelo || ""} (${c.vehiculo_patente || "S/P"})`.trim();
    return {
      value: c.id_contrato,
      label: `Contrato #${c.id_contrato} - ${cliente} - ${auto}`,
      raw: c,
    };
  };

  const loadContratosOptions = (inputValue, callback) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const term = (inputValue || "").trim();

    if (!term) {
      buscarContratosParaDigital("")
        .then((res) => {
          const list = Array.isArray(res) ? res : res?.data || [];
          callback(list.map(formatContratoOption));
        })
        .catch(() => callback([]));
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      buscarContratosParaDigital(term)
        .then((res) => {
          const list = Array.isArray(res) ? res : res?.data || [];
          callback(list.map(formatContratoOption));
        })
        .catch((err) => {
          console.error("Error al buscar contratos:", err);
          callback([]);
        });
    }, 300);
  };

  // Si viene con idContrato por URL, cargarlo
  useEffect(() => {
    if (idContrato) {
      buscarContratosParaDigital(idContrato).then((res) => {
        const list = Array.isArray(res) ? res : res?.data || [];
        if (list.length > 0) {
          const match = list.find((c) => String(c.id_contrato) === String(idContrato)) || list[0];
          aplicarContrato(match);
        }
      });
    }
  }, [idContrato]);

  // Si viene con idDigital por URL (para ver y reimprimir), cargarlo desde la base de datos
  useEffect(() => {
    if (idDigital) {
      getContratoDigitalById(idDigital).then((res) => {
        const c = res?.data || res;
        if (c && c.numero_contrato) {
          setFormData({
            id_contrato: c.id_contrato,
            id_cliente: c.id_cliente,
            id_vehiculo: c.id_vehiculo,
            numero_contrato: c.numero_contrato,
            fecha: c.fecha ? String(c.fecha).slice(0, 10) : "",
            hora: c.hora ? String(c.hora).slice(0, 5) : "",
            locatario_nombre: c.locatario_nombre || "",
            locatario_dni: c.locatario_dni || "",
            locatario_telefono: c.locatario_telefono || "",
            locatario_domicilio: c.locatario_domicilio || "",
            locatario_localidad: c.locatario_localidad || "",
            locatario_email: c.locatario_email || "",
            vehiculo_marca: c.vehiculo_marca || "",
            vehiculo_modelo: c.vehiculo_modelo || "",
            vehiculo_patente: c.vehiculo_patente ? c.vehiculo_patente.toUpperCase() : "",
            vehiculo_color: c.vehiculo_color || "",
            vehiculo_kilometraje: c.vehiculo_kilometraje || "",
            alquiler_semanal: c.alquiler_semanal || "",
            deposito_garantia: c.deposito_garantia || "",
            km_limite_semanal: c.km_limite_semanal || 2000,
            valor_km_excedente: c.valor_km_excedente || 520,
            plazo_semanas: String(c.plazo_semanas || "12"),
            observaciones: c.observaciones || "",
            verify_address: true,
            verify_email: true,
            verify_phone: true,
            acepta_contrato: Boolean(c.acepta_contrato),
            acepta_cabify: Boolean(c.acepta_cabify),
            acepta_telepase: Boolean(c.acepta_telepase),
          });

          if (c.firma_digital) {
            setSignatureData(c.firma_digital);
            const canvas = canvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext("2d");
              const img = new Image();
              img.onload = () => {
                const rect = canvas.getBoundingClientRect();
                ctx.drawImage(img, 0, 0, rect.width, 140);
              };
              img.src = c.firma_digital;
            }
          }

          if (c.id_contrato) {
            setSelectedContratoOption({
              value: c.id_contrato,
              label: `Contrato #${c.id_contrato} - ${c.locatario_nombre} - ${c.vehiculo_patente}`,
            });
          }
        }
      }).catch((err) => {
        console.error("Error al cargar contrato digital:", err);
      });
    }
  }, [idDigital]);

  const aplicarContrato = (c) => {
    const cliente = c.cliente_razon_social || `${c.cliente_nombre || ""} ${c.cliente_apellido || ""}`.trim();
    const domicilio = [
      c.cliente_direccion,
      c.cliente_nro_direccion,
      c.cliente_piso ? `Piso ${c.cliente_piso}` : "",
      c.cliente_depto ? `Depto ${c.cliente_depto}` : "",
    ]
      .filter(Boolean)
      .join(" ");

    const fechaHoy = new Date().toISOString().slice(0, 10);
    const horaActual = new Date().toTimeString().slice(0, 5);

    let defaultDeposit = c.deposito_garantia;
    if (!defaultDeposit) {
      if (/cronos/i.test(c.vehiculo_modelo || "")) {
        defaultDeposit = "250000";
      } else if (/eu5/i.test(c.vehiculo_modelo || "")) {
        defaultDeposit = "300000";
      }
    }

    setFormData((prev) => ({
      ...prev,
      id_contrato: c.id_contrato,
      id_cliente: c.id_cliente,
      id_vehiculo: c.id_vehiculo,
      numero_contrato: `GR-${String(c.id_contrato).padStart(4, "0")}`,
      fecha: c.fecha_contrato || c.fecha_desde ? String(c.fecha_contrato || c.fecha_desde).slice(0, 10) : fechaHoy,
      hora: c.hora_desde ? String(c.hora_desde).slice(0, 5) : horaActual,
      locatario_nombre: cliente,
      locatario_dni: c.cliente_dni || "",
      locatario_telefono: c.cliente_telefono || c.cliente_telefono_alt || "",
      locatario_domicilio: domicilio,
      locatario_localidad: c.cliente_ciudad || "",
      locatario_email: c.cliente_email || "",
      vehiculo_marca: c.vehiculo_marca || "",
      vehiculo_modelo: c.vehiculo_modelo || "",
      vehiculo_patente: c.vehiculo_patente ? c.vehiculo_patente.toUpperCase() : "",
      vehiculo_color: c.vehiculo_color || "",
      vehiculo_kilometraje: c.vehiculo_kilometraje || "",
      alquiler_semanal: c.alquiler_semanal || "",
      deposito_garantia: defaultDeposit || "",
      km_limite_semanal: 2000,
      valor_km_excedente: 520,
      plazo_semanas: prev.plazo_semanas || "12",
    }));

    setSelectedContratoOption({
      value: c.id_contrato,
      label: `Contrato #${c.id_contrato} - ${cliente} - ${c.vehiculo_patente}`,
    });
  };

  const limpiarSeleccion = () => {
    setSelectedContratoOption(null);
    setFormData(initialForm);
    clearSignature();
  };

  // Manejo de cambios en el formulario
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      // Si cambia el modelo del vehículo, sugerir depósito según modelo
      if (name === "vehiculo_modelo") {
        if (/cronos/i.test(value) && (!prev.deposito_garantia || prev.deposito_garantia === "300000")) {
          updated.deposito_garantia = "250000";
        } else if (/eu5/i.test(value) && (!prev.deposito_garantia || prev.deposito_garantia === "250000")) {
          updated.deposito_garantia = "300000";
        }
      }

      return updated;
    });
  };

  // Métodos de firma canvas
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    isDrawing.current = true;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setSignatureData(canvas.toDataURL("image/png"));
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignatureData(null);
  };

  // Validación
  const validarFormulario = () => {
    const requiredFields = [
      { key: "numero_contrato", label: "Número de contrato" },
      { key: "fecha", label: "Fecha" },
      { key: "hora", label: "Hora" },
      { key: "locatario_nombre", label: "Nombre y apellido del cliente" },
      { key: "locatario_dni", label: "DNI del cliente" },
      { key: "locatario_domicilio", label: "Domicilio del cliente" },
      { key: "locatario_localidad", label: "Localidad" },
      { key: "locatario_email", label: "Correo electrónico" },
      { key: "vehiculo_patente", label: "Patente del vehículo" },
      { key: "alquiler_semanal", label: "Alquiler semanal" },
    ];

    for (const f of requiredFields) {
      if (!formData[f.key] || String(formData[f.key]).trim() === "") {
        Swal.fire("Atención", `Por favor completá el campo obligatorio: ${f.label}`, "warning");
        return false;
      }
    }

    if (!formData.verify_address || !formData.verify_email || !formData.verify_phone) {
      Swal.fire(
        "Verificaciones previas pendientes",
        "Debes confirmar las 3 verificaciones previas (domicilio/DNI, correo electrónico y WhatsApp).",
        "warning"
      );
      return false;
    }

    if (!formData.acepta_contrato || !formData.acepta_cabify || !formData.acepta_telepase) {
      Swal.fire("Atención", "Debes tildar todas las conformidades y declaraciones de aceptación.", "warning");
      return false;
    }

    if (!signatureData) {
      Swal.fire("Atención", "Falta registrar la firma manuscrita del cliente.", "warning");
      return false;
    }

    return true;
  };

  // Guardar en sistema
  const handleGuardar = async (silent = false) => {
    if (!validarFormulario()) return false;

    setIsSaving(true);
    try {
      const computedFechaFin = contractEndDate(formData.fecha, formData.plazo_semanas);
      const payload = {
        ...formData,
        fecha_fin: computedFechaFin,
        vehiculo_patente: formData.vehiculo_patente ? formData.vehiculo_patente.toUpperCase() : "",
        firma_digital: signatureData,
      };

      const res = await postContratoDigital(payload);
      if (res?.status) {
        if (!silent) {
          Swal.fire("Guardado", "La Carta Acuerdo ha sido guardada exitosamente en el sistema.", "success");
        }
        return true;
      } else {
        Swal.fire("Error", res?.message || "No se pudo guardar la carta acuerdo.", "error");
        return false;
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Ocurrió un error inesperado al guardar.", "error");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Descargar / Imprimir PDF
  const handleImprimirPdf = async () => {
    if (!validarFormulario()) return;

    // Guardar en la base de datos automáticamente
    const ok = await handleGuardar(true);
    if (!ok) return;

    setStatusMsg({ type: "ok", text: "Carta acuerdo lista. En la ventana de impresión seleccioná 'Guardar como PDF'." });

    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <div className={styles.brand}>
          Contrato Digital
          <small>Carta acuerdo de locación</small>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            type="button"
            className={styles.listButton}
            onClick={() => navigate("/alquileres/contratos-digitales/listado")}
          >
            <IconList size={16} /> Listado de contratos
          </button>
          <span className={styles.badge}>Modelo 21/09/2026</span>
        </div>
      </div>

      <main className={styles.layout}>
        {/* PANEL LATERAL DE CARGA */}
        <aside className={styles.panel}>
          <h1>Preparar contrato</h1>
          <p className={styles.intro}>
            Revisá los datos y el contrato completo antes de firmar. Modelo del 21/09/2026. Después guardá el PDF en Archivos del contrato.
          </p>

          {/* BUSCADOR DE CONTRATO EXISTENTE */}
          <div className={styles.searchBox}>
            <div className={styles.searchBoxTitle}>
              <span>Autocargar desde contrato existente:</span>
              {selectedContratoOption && (
                <button type="button" className={styles.clearSearchBtn} onClick={limpiarSeleccion}>
                  Limpiar / Carga manual
                </button>
              )}
            </div>
            <AsyncSelect
              cacheOptions
              defaultOptions
              filterOption={() => true}
              loadOptions={loadContratosOptions}
              value={selectedContratoOption}
              onChange={(opt) => {
                if (opt && opt.raw) {
                  aplicarContrato(opt.raw);
                } else {
                  limpiarSeleccion();
                }
              }}
              placeholder="Buscar por nro de contrato, cliente, DNI o patente..."
              isClearable
              noOptionsMessage={() => "No se encontraron contratos coincidentes"}
              loadingMessage={() => "Buscando contratos..."}
              styles={{
                control: (base) => ({
                  ...base,
                  fontSize: "0.86rem",
                  borderRadius: "8px",
                  borderColor: "#c9d7e8",
                }),
              }}
            />
          </div>

          <form onSubmit={(e) => e.preventDefault()}>
            {/* SECCION CONTRATO */}
            <div className={styles.section} style={{ borderTop: "none", marginTop: 0, paddingTop: 0 }}>
              <h2>Contrato</h2>
              <div className={styles.grid}>
                <div>
                  <label className={styles.label} htmlFor="fecha">Fecha</label>
                  <input
                    id="fecha"
                    name="fecha"
                    type="date"
                    className={styles.input}
                    value={formData.fecha}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className={styles.label} htmlFor="hora">Hora</label>
                  <input
                    id="hora"
                    name="hora"
                    type="time"
                    className={styles.input}
                    value={formData.hora}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className={styles.full}>
                  <label className={styles.label} htmlFor="numero_contrato">Número de contrato</label>
                  <input
                    id="numero_contrato"
                    name="numero_contrato"
                    placeholder="Ej. GR-2026-0001"
                    className={styles.input}
                    value={formData.numero_contrato}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* SECCION CLIENTE */}
            <div className={styles.section}>
              <h2>Cliente</h2>
              <div className={styles.grid}>
                <div className={styles.full}>
                  <label className={styles.label} htmlFor="locatario_nombre">Nombre y apellido</label>
                  <input
                    id="locatario_nombre"
                    name="locatario_nombre"
                    className={styles.input}
                    value={formData.locatario_nombre}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className={styles.label} htmlFor="locatario_dni">DNI</label>
                  <input
                    id="locatario_dni"
                    name="locatario_dni"
                    className={styles.input}
                    value={formData.locatario_dni}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className={styles.label} htmlFor="locatario_telefono">Teléfono</label>
                  <input
                    id="locatario_telefono"
                    name="locatario_telefono"
                    className={styles.input}
                    value={formData.locatario_telefono}
                    onChange={handleChange}
                  />
                </div>
                <div className={styles.full}>
                  <label className={styles.label} htmlFor="locatario_domicilio">Domicilio</label>
                  <input
                    id="locatario_domicilio"
                    name="locatario_domicilio"
                    className={styles.input}
                    value={formData.locatario_domicilio}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className={styles.label} htmlFor="locatario_localidad">Localidad</label>
                  <input
                    id="locatario_localidad"
                    name="locatario_localidad"
                    className={styles.input}
                    value={formData.locatario_localidad}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className={styles.label} htmlFor="locatario_email">Correo electrónico</label>
                  <input
                    id="locatario_email"
                    name="locatario_email"
                    type="email"
                    className={styles.input}
                    value={formData.locatario_email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* SECCION VEHICULO */}
            <div className={styles.section}>
              <h2>Vehículo</h2>
              <div className={styles.grid}>
                <div>
                  <label className={styles.label} htmlFor="vehiculo_marca">Marca</label>
                  <input
                    id="vehiculo_marca"
                    name="vehiculo_marca"
                    className={styles.input}
                    value={formData.vehiculo_marca}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className={styles.label} htmlFor="vehiculo_modelo">Modelo</label>
                  <input
                    id="vehiculo_modelo"
                    name="vehiculo_modelo"
                    className={styles.input}
                    value={formData.vehiculo_modelo}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className={styles.label} htmlFor="vehiculo_patente">Patente</label>
                  <input
                    id="vehiculo_patente"
                    name="vehiculo_patente"
                    style={{ textTransform: "uppercase" }}
                    className={styles.input}
                    value={formData.vehiculo_patente}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className={styles.label} htmlFor="vehiculo_color">Color</label>
                  <input
                    id="vehiculo_color"
                    name="vehiculo_color"
                    className={styles.input}
                    value={formData.vehiculo_color}
                    onChange={handleChange}
                  />
                </div>
                <div className={styles.full}>
                  <label className={styles.label} htmlFor="vehiculo_kilometraje">Kilometraje de entrega</label>
                  <input
                    id="vehiculo_kilometraje"
                    name="vehiculo_kilometraje"
                    type="number"
                    className={styles.input}
                    value={formData.vehiculo_kilometraje}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* CONDICIONES ECONOMICAS */}
            <div className={styles.section}>
              <h2>Condiciones económicas</h2>
              <div className={styles.grid}>
                <div className={styles.moneyWrapper}>
                  <label className={styles.label} htmlFor="alquiler_semanal">Alquiler semanal</label>
                  <span className={styles.moneyPrefix}>$</span>
                  <input
                    id="alquiler_semanal"
                    name="alquiler_semanal"
                    type="number"
                    className={`${styles.input} ${styles.moneyInput}`}
                    value={formData.alquiler_semanal}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className={styles.moneyWrapper}>
                  <label className={styles.label} htmlFor="deposito_garantia">Depósito</label>
                  <span className={styles.moneyPrefix}>$</span>
                  <input
                    id="deposito_garantia"
                    name="deposito_garantia"
                    type="number"
                    className={`${styles.input} ${styles.moneyInput}`}
                    value={formData.deposito_garantia}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className={styles.label} htmlFor="km_limite_semanal">Límite km/semana</label>
                  <input
                    id="km_limite_semanal"
                    name="km_limite_semanal"
                    type="number"
                    className={styles.input}
                    value={formData.km_limite_semanal}
                    readOnly
                    required
                  />
                </div>
                <div className={styles.moneyWrapper}>
                  <label className={styles.label} htmlFor="valor_km_excedente">Valor km excedente</label>
                  <span className={styles.moneyPrefix}>$</span>
                  <input
                    id="valor_km_excedente"
                    name="valor_km_excedente"
                    type="number"
                    className={`${styles.input} ${styles.moneyInput}`}
                    value={formData.valor_km_excedente}
                    readOnly
                  />
                </div>
                <div className={styles.full}>
                  <label className={styles.label} htmlFor="plazo_semanas">Plazo inicial</label>
                  <select
                    id="plazo_semanas"
                    name="plazo_semanas"
                    className={styles.select}
                    value={formData.plazo_semanas}
                    onChange={handleChange}
                  >
                    <option value="12">12 semanas</option>
                    <option value="purchase_24m">24 meses con opción de compra</option>
                  </select>
                </div>
              </div>
            </div>

            {/* OBSERVACIONES */}
            <div className={styles.section}>
              <label className={styles.label} htmlFor="observaciones">Observaciones</label>
              <textarea
                id="observaciones"
                name="observaciones"
                rows={3}
                placeholder="Observaciones que deben figurar en la carta acuerdo"
                className={styles.input}
                value={formData.observaciones}
                onChange={handleChange}
              />
            </div>

            {/* VERIFICACIONES PREVIAS */}
            <div className={styles.section}>
              <h2>Verificaciones previas</h2>
              <p className={styles.intro} style={{ marginBottom: 10 }}>
                Confirmá las verificaciones indicadas en el modelo antes de emitir el documento.
              </p>
              <label className={styles.check}>
                <input
                  name="verify_address"
                  type="checkbox"
                  checked={formData.verify_address}
                  onChange={handleChange}
                  required
                />
                <span>Verifiqué el domicilio real y la localidad del cliente contra su DNI.</span>
              </label>

              <label className={styles.check}>
                <input
                  name="verify_email"
                  type="checkbox"
                  checked={formData.verify_email}
                  onChange={handleChange}
                  required
                />
                <span>Recibí un correo de prueba desde el email del cliente.</span>
              </label>

              <label className={styles.check}>
                <input
                  name="verify_phone"
                  type="checkbox"
                  checked={formData.verify_phone}
                  onChange={handleChange}
                  required
                />
                <span>Recibí un WhatsApp desde el teléfono del cliente.</span>
              </label>
            </div>

            {/* ACEPTACIONES DEL CLIENTE */}
            <div className={styles.section}>
              <h2>Aceptación del cliente</h2>
              <label className={styles.check}>
                <input
                  name="acepta_contrato"
                  type="checkbox"
                  checked={formData.acepta_contrato}
                  onChange={handleChange}
                />
                <span>Declaro haber leído la totalidad del contrato y acepto sus condiciones.</span>
              </label>

              <label className={styles.check}>
                <input
                  name="acepta_cabify"
                  type="checkbox"
                  checked={formData.acepta_cabify}
                  onChange={handleChange}
                />
                <span>
                  Acepto el pago del 100% mediante retención de Cabify y el cargo administrativo de $60.000 si no pudiera retenerse la totalidad.
                </span>
              </label>

              <label className={styles.check}>
                <input
                  name="acepta_telepase"
                  type="checkbox"
                  checked={formData.acepta_telepase}
                  onChange={handleChange}
                />
                <span>Comprendo que TelePASE y los peajes no están incluidos y que debo gestionar y pagar mi propio TelePASE.</span>
              </label>
            </div>

            {/* FIRMA DEL CLIENTE */}
            <div className={styles.section}>
              <h2>Firma del cliente</h2>
              <div className={styles.sigWrap}>
                <div className={styles.sigTitle}>Firmar dentro del recuadro (táctil o con mouse)</div>
                <canvas
                  ref={canvasRef}
                  className={styles.sigCanvas}
                  onPointerDown={startDrawing}
                  onPointerMove={draw}
                  onPointerUp={stopDrawing}
                  onPointerLeave={stopDrawing}
                />
                <div className={styles.sigActions}>
                  <button type="button" className={`${styles.button} ${styles.secondary}`} onClick={clearSignature}>
                    <IconTrash size={14} /> Borrar firma
                  </button>
                </div>
              </div>
            </div>

            {/* BOTONES DE ACCION */}
            <div className={styles.actions}>
              <button
                type="button"
                className={`${styles.button} ${styles.secondary}`}
                onClick={() => {
                  Swal.fire({
                    title: "¿Limpiar formulario?",
                    text: "Se borrarán todos los datos cargados y la firma.",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Sí, limpiar",
                    cancelButtonText: "Cancelar",
                  }).then((res) => {
                    if (res.isConfirmed) limpiarSeleccion();
                  });
                }}
              >
                <IconPlus size={15} /> Nuevo contrato
              </button>

              <button
                type="button"
                className={`${styles.button} ${styles.primary}`}
                onClick={handleImprimirPdf}
                disabled={isSaving}
              >
                <IconPrinter size={15} /> Imprimir / PDF
              </button>
            </div>

            <div className={styles.saveAction}>
              <button
                type="button"
                className={`${styles.button} ${styles.successBtn}`}
                style={{ width: "100%" }}
                onClick={() => handleGuardar(false)}
                disabled={isSaving}
              >
                {isSaving ? "Guardando..." : <><IconCheck size={16} /> Guardar en sistema</>}
              </button>
            </div>

            {statusMsg && (
              <div className={`${styles.statusMessage} ${statusMsg.type === "ok" ? styles.statusOk : styles.statusWarn}`}>
                {statusMsg.text}
              </div>
            )}
          </form>
        </aside>

        {/* DOCUMENTO OFICIAL PREVIEW (PAPER) */}
        <article className={styles.paper} id="contrato-digital-document">
          <div className={styles.docHead}>
            <h2>CARTA ACUERDO</h2>
            <p>
              Dirigida a GIAMA RENTING S.A. ·{" "}
              <span className={!formData.numero_contrato ? styles.empty : ""}>
                {formData.numero_contrato || "N.º de contrato"}
              </span>
            </p>
          </div>

          <p>
            <b>Señores GIAMA RENTING S.A.</b><br />
            Av. San Juan 1733, Ciudad Autónoma de Buenos Aires info@giamarenting.com
          </p>

          <p>
            En la Ciudad Autónoma de Buenos Aires, el{" "}
            <span className={!formData.fecha ? styles.empty : ""}>{formatDate(formData.fecha)}</span>, a las{" "}
            <span className={!formData.hora ? styles.empty : ""}>{formData.hora || "hora"}</span>, quien suscribe,{" "}
            <b className={!formData.locatario_nombre ? styles.empty : ""}>
              {formData.locatario_nombre || "nombre del cliente"}
            </b>, DNI{" "}
            <span className={!formData.locatario_dni ? styles.empty : ""}>{formData.locatario_dni || "DNI"}</span>, con domicilio en{" "}
            <span className={!formData.locatario_domicilio ? styles.empty : ""}>
              {formData.locatario_domicilio || "domicilio"}
            </span>, localidad de{" "}
            <span className={!formData.locatario_localidad ? styles.empty : ""}>
              {formData.locatario_localidad || "localidad"}
            </span>, correo electrónico{" "}
            <span className={!formData.locatario_email ? styles.empty : ""}>
              {formData.locatario_email || "correo"}
            </span> y teléfono{" "}
            <span className={!formData.locatario_telefono ? styles.empty : ""}>
              {formData.locatario_telefono || "teléfono"}
            </span>, en adelante el <b>CLIENTE</b>, formula a <b>GIAMA RENTING S.A.</b>, en adelante la <b>EMPRESA</b>, la presente oferta de locación del vehículo identificado a continuación, sujeta a los términos y condiciones siguientes.
          </p>

          <div className={styles.highlight}>
            <p>
              <b>Forma de aceptación.</b> La presente carta oferta está firmada únicamente por el CLIENTE. Se considerará aceptada por el EMPRESA mediante la entrega material del vehículo al CLIENTE y la emisión del acta de entrega correspondiente. La ausencia de entrega implica falta de aceptación y no genera obligación para el EMPRESA.
            </p>
          </div>

          <table className={styles.dataTable}>
            <tbody>
              <tr>
                <td>
                  <b>Vehículo</b><br />
                  <span className={!formData.vehiculo_marca && !formData.vehiculo_modelo ? styles.empty : ""}>
                    {formData.vehiculo_marca || "-"} {formData.vehiculo_modelo || ""}
                  </span>
                </td>
                <td>
                  <b>Patente</b><br />
                  <span className={!formData.vehiculo_patente ? styles.empty : ""}>
                    {formData.vehiculo_patente ? formData.vehiculo_patente.toUpperCase() : "-"}
                  </span>
                </td>
                <td>
                  <b>Color</b><br />
                  <span className={!formData.vehiculo_color ? styles.empty : ""}>
                    {formData.vehiculo_color || "-"}
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <b>Kilometraje</b><br />
                  <span>{formData.vehiculo_kilometraje ? Number(formData.vehiculo_kilometraje).toLocaleString("es-AR") : "-"}</span> km
                </td>
                <td>
                  <b>Canon semanal</b><br />
                  $ <span>{formatMoney(formData.alquiler_semanal)}</span>
                </td>
                <td>
                  <b>Depósito</b><br />
                  $ <span>{formatMoney(formData.deposito_garantia)}</span>
                </td>
              </tr>
            </tbody>
          </table>

          <h3>PRIMERA: OBJETO E IDENTIFICACIÓN</h3>
          <p>
            El CLIENTE propone tomar en locación el vehículo individualizado precedentemente. La marca, modelo, patente, color, kilometraje, canon y depósito consignados en esta carta oferta son los cargados en el formulario al momento de su emisión y forman parte esencial de la oferta.
          </p>

          <h3>SEGUNDA: ESTADO DE ENTREGA Y ACTA</h3>
          <p>
            El vehículo será recibido conforme al acta digital de entrega, sus fotografías, croquis, kilometraje y observaciones, que integrarán esta carta oferta como Anexo I. El CLIENTE deberá revisarlos antes de firmar y restituir la unidad en el mismo estado, salvo el desgaste normal derivado de su utilización correcta.
          </p>

          <h3>TERCERA: DESTINO, CONDUCTOR Y ÁMBITO</h3>
          <p>
            El vehículo será destinado exclusivamente al uso laboral del CLIENTE mediante aplicaciones habilitadas de transporte de pasajeros, principalmente CABIFY, dentro del AMBA. No podrá ser cedido, prestado, subarrendado, utilizado para otro destino ni conducido por terceros sin autorización previa y escrita del EMPRESA. La salida del AMBA también requerirá autorización previa y escrita.
          </p>

          <h3>CUARTA: KILOMETRAJE</h3>
          <p>
            El límite máximo de utilización será de 2.000 kilómetros por semana. Cada kilómetro excedente tendrá un cargo de $ 520, que podrá cobrarse junto con el alquiler o al finalizar la locación.
          </p>

          <h3>QUINTA: PRECIO, ACTUALIZACIÓN Y FORMA DE PAGO</h3>
          <p>
            El canon inicial será de $ <b>{formatMoney(formData.alquiler_semanal)}</b> por semana, pagadero en forma anticipada. El EMPRESA podrá actualizarlo mensualmente a su solo arbitrio conforme al IPC, previa comunicación al CLIENTE al solo efecto de la toma de conocimiento.
          </p>

          <div className={styles.highlight}>
            <p>
              <b>Pago mediante retención de CABIFY.</b> El CLIENTE acepta que el canon semanal sea abonado en su totalidad mediante el sistema de retención de CABIFY. Si por cualquier motivo no pudiera retenerse el cien por ciento (100%) del canon, deberá cancelar inmediatamente la diferencia por el medio indicado por el EMPRESA. Además, se aplicará un cargo de <b>PESOS SESENTA MIL ($60.000)</b> en concepto de gastos administrativos por la gestión extraordinaria de cobro.
            </p>
          </div>

          <p>
            El canon incluye patente, el seguro descripto en esta carta oferta y el mantenimiento ordinario autorizado. No incluye combustible, multas, peajes, TelePASE, limpieza, daños, franquicias ni demás conceptos expresamente puestos a cargo del CLIENTE.
          </p>

          <h3>SEXTA: PLAZO, RENOVACIÓN Y RESCISIÓN</h3>
          {formData.plazo_semanas === "purchase_24m" ? (
            <div>
              <p>
                El plazo de la locación será de veinticuatro (24) meses contados desde el{" "}
                <span>{formatDate(formData.fecha)}</span>, con finalización el{" "}
                <b>{formatDate(contractEndDate(formData.fecha, "purchase_24m"))}</b>. El canon se abonará semanalmente, con vencimiento los miércoles antes de las 14:00. La EMPRESA podrá rescindir la locación y requerir la devolución de la unidad conforme a las condiciones de esta oferta. Si el CLIENTE rescinde antes del plazo pactado, abonará una penalidad equivalente a una semana de alquiler, salvo la excepción prevista por aumentos superiores al IPC.
              </p>
              <p>
                <b>Opción de compra:</b> Al finalizar el plazo de veinticuatro (24) meses, el CLIENTE tendrá la opción de adquirir el vehículo identificado en este contrato u otro de características y estado similares, por un precio equivalente al cincuenta por ciento (50%) del precio de lista vigente al momento de finalizar el contrato, correspondiente al vehículo objeto de la compra.
              </p>
            </div>
          ) : (
            <p>
              El plazo inicial será de 12 semanas, abonado semanalmente, con vencimiento los miércoles antes de las 14:00. Se renovará automáticamente por períodos de una semana mientras se abone anticipadamente el canon y no exista aviso de devolución con al menos 24 horas de anticipación. El EMPRESA podrá rescindir la locación y requerir la devolución de la unidad conforme a las condiciones de esta oferta. Si el CLIENTE rescinde antes del plazo inicial, abonará una penalidad equivalente a una semana de alquiler, salvo la excepción prevista por aumentos superiores al IPC.
            </p>
          )}

          <p>
            Si el CLIENTE registra una deuda pendiente de pago superior a <b>PESOS UN MILLÓN ($1.000.000)</b> derivada de esta locación, la EMPRESA podrá rescindir la locación por el nivel de deuda y requerir la devolución del vehículo. La devolución de la unidad no extinguirá la deuda pendiente.
          </p>

          <h3>SÉPTIMA: GUARDA, CUSTODIA Y LOCALIZACIÓN</h3>
          <p>
            El CLIENTE será depositario y custodio del vehículo desde su recepción hasta la devolución efectiva. Deberá conservarlo en condiciones seguras e informar expresamente a la EMPRESA el domicilio habitual de guarda. Cualquier cambio deberá notificarse expresamente con quince (15) días de anticipación y quedará sujeto a autorización. El CLIENTE acepta la utilización del sistema de localización satelital instalado en la unidad para fines de seguridad, recuperación, control del ámbito autorizado y verificación del kilometraje.
          </p>

          <h3>OCTAVA: MANTENIMIENTO Y REVISIONES</h3>
          <p>
            El CLIENTE deberá presentar el vehículo a las revisiones, controles y servicios indicados por la EMPRESA en el lugar, fecha y horario que notifique la EMPRESA, respetar las alertas del tablero y comunicar inmediatamente cualquier falla. No podrá realizar modificaciones, reparaciones ni instalar accesorios sin autorización escrita. Los daños agravados por falta de aviso o incumplimiento serán a su cargo.
          </p>

          <h3>NOVENA: LIMPIEZA Y COMBUSTIBLE</h3>
          <p>
            El vehículo deberá devolverse y presentarse a toda verificación en condiciones razonables de limpieza. Si estuviera sucio de modo que impida o dificulte la inspección, o requiera limpieza, el CLIENTE deberá abonar el costo proporcional al valor promedio de lavado aplicable al tipo y estado del vehículo, con un <b>cargo mínimo de PESOS OCHENTA MIL ($80.000)</b>. También deberá reponer el combustible o nivel de carga acordado en el acta de entrega.
          </p>

          <h3>DÉCIMA: SEGURO</h3>
          <p>
            Durante la locación, el vehículo contará con seguro contra terceros y de responsabilidad civil, con cobertura para transporte de pasajeros, sujeto a los términos, límites, exclusiones y condiciones de la póliza vigente que el cliente declara conocer. El seguro no implica cobertura total de los daños propios del vehículo ni exime al CLIENTE de las franquicias, exclusiones, incumplimientos o importes que correspondan.
          </p>

          <h3>DÉCIMA PRIMERA: SINIESTROS</h3>
          <p>
            Todo accidente, incendio, robo, hurto, daño o siniestro deberá ser comunicado al EMPRESA en forma detallada dentro de las cuatro (4) horas de ocurrido. El CLIENTE deberá efectuar las denuncias requeridas, aportar documentación, fotografías y datos de terceros, y colaborar con el EMPRESA y la aseguradora. La omisión o demora que provoque pérdida o rechazo de cobertura hará responsable al CLIENTE por los perjuicios ocasionados.
          </p>

          <h3>DÉCIMA SEGUNDA: DAÑOS Y FRANQUICIA</h3>
          <div className={styles.highlight}>
            <p>
              Ante daños, roturas, faltantes o deterioros que excedan el uso normal, el EMPRESA evaluará su alcance y el costo de reparación, reposición y demás consecuencias comprobables. El CLIENTE deberá abonar el importe determinado según dicha evaluación, con una <b>franquicia máxima total de hasta PESOS TRES MILLONES ($3.000.000)</b> por cada hecho o evento. El monto podrá ser inferior según la gravedad y el costo del daño, pero nunca superior a ese tope por el mismo evento, sin perjuicio de importes no cubiertos por el seguro cuando correspondan conforme a la ley y a la póliza.
            </p>
          </div>

          <h3>DÉCIMA TERCERA: RESPONSABILIDAD</h3>
          <p>
            El CLIENTE responderá por el uso, guarda y conducción del vehículo, por los actos de terceros a quienes permita utilizarlo con o sin autorización de la EMPRESA, por daños no cubiertos por el seguro, faltantes, gastos de recuperación y lucro cesante razonablemente acreditado cuando la unidad no pueda utilizarse por un hecho que le sea imputable. No podrá presentarse como representante, agente o mandatario del EMPRESA.
          </p>

          <h3>DÉCIMA CUARTA: MULTAS E INFRACCIONES</h3>
          <p>
            El CLIENTE será responsable por todas las infracciones de tránsito cometidas durante la vigencia y sus prórrogas, aunque fueran notificadas después de la devolución. Deberá abonar multas, gastos administrativos y cargos asociados, e identificar al conductor o entregar las constancias que solicite el EMPRESA.
          </p>

          <h3>DÉCIMA QUINTA: TELEPASE Y PEAJES</h3>
          <div className={styles.highlight}>
            <p>
              El servicio de <b>TelePASE y los importes de autopistas y peajes no están incluidos en el alquiler</b>. El CLIENTE se obliga a gestionar, mantener vigente y abonar, a su exclusivo cargo, su propio TelePASE asociado al vehículo, siguiendo las instrucciones de la EMPRESA. Todos los cargos, intereses, multas y gastos ocasionados por falta de alta, falta de pago o utilización serán a cargo del CLIENTE.
            </p>
          </div>

          <h3>DÉCIMA SEXTA: DEPÓSITO EN GARANTÍA</h3>
          <p>
            El depósito se fija en <b>$ {formatMoney(formData.deposito_garantia)}</b>, según el vehículo informado en el formulario. Podrá aplicarse a alquileres, franquicias, daños, limpieza, multas, peajes, faltantes y cualquier obligación pendiente del CLIENTE. El saldo resultante, si lo hubiere será devuelto dentro de los <b>ciento veinte (120) días corridos</b> posteriores a la finalización y devolución del vehículo, siempre que no existan cobros, infracciones, daños o conceptos pendientes de determinación. Si existieran, el plazo se contará desde su liquidación definitiva.
          </p>

          <h3>DÉCIMA SÉPTIMA: MORA Y DEVOLUCIÓN</h3>
          <p>
            La falta de pago o de restitución en término producirá la mora automática. Por cada día de retraso podrá aplicarse un cargo equivalente al veinte por ciento (20%) del canon semanal, sin perjuicio de las acciones para recuperar el vehículo y reclamar los daños acreditados. La unidad deberá devolverse en el lugar, fecha y horario indicados por el EMPRESA, junto con llaves, documentación, accesorios y elementos recibidos.
          </p>

          <h3>DÉCIMA OCTAVA: DOCUMENTACIÓN DIGITAL Y NOTIFICACIONES</h3>
          <p>
            El CLIENTE acepta el uso de esta carta oferta digital, el acta de entrega, fotografías, registros de aceptación y comunicaciones cursadas a los domicilios electrónicos constituidos (Art 75 Código Civil y Comercial). Declara que los datos son correctos y que pudo leer el documento completo antes de firmarlo.
          </p>

          <h3>DÉCIMA NOVENA: JURISDICCIÓN</h3>
          <p>
            Las partes constituyen los domicilios físicos y/o electrónicos indicados y se someten a la jurisdicción de los tribunales competentes con asiento en la Ciudad Autónoma de Buenos Aires, con renuncia a cualquier otro fuero o jurisdicción que pudiera corresponder, sin perjuicio de las normas imperativas aplicables.
          </p>

          <h3>RATIFICACIÓN DE LA OFERTA</h3>
          <p>
            El CLIENTE declara conocer y aceptar íntegramente las condiciones precedentes, mantiene la presente oferta y solicita al EMPRESA su aceptación mediante la entrega del vehículo. La firma que sigue pertenece exclusivamente al CLIENTE; no se requiere la firma del EMPRESA.
          </p>

          {formData.observaciones && formData.observaciones.trim() && (
            <div style={{ marginTop: 20 }}>
              <h3>Observaciones</h3>
              <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                {formData.observaciones}
              </p>
            </div>
          )}

          <div className={styles.signatures} style={{ gridTemplateColumns: "1fr" }}>
            <div className={styles.sigBox}>
              {signatureData ? (
                <img src={signatureData} alt="Firma del cliente" className={styles.sigImage} />
              ) : (
                <div style={{ height: 60 }} />
              )}
              <b>Firma del CLIENTE</b><br />
              Aclaración: <span>{formData.locatario_nombre || "—"}</span><br />
              DNI: <span>{formData.locatario_dni || "—"}</span>
            </div>
          </div>

          <p className={styles.footerNote}>
            Contrato digital generado electrónicamente: {formData.numero_contrato || "-"}. Fecha y hora declaradas: {formatDate(formData.fecha)} {formData.hora || "-"}. La aceptación del EMPRESA se instrumenta mediante la entrega del vehículo y su acta correspondiente.
          </p>
        </article>
      </main>
    </div>
  );
};

export default ContratoDigital;
