import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import AsyncSelect from "react-select/async";
import Swal from "sweetalert2";
import siniestrosService from "../../../reducers/Siniestros/siniestrosService.js";
import styles from "./SiniestrosInspeccion.module.css";

const PHOTO_STEPS = [
  "Frente",
  "Lateral izquierdo",
  "Trasera",
  "Lateral derecho",
  "Baúl",
  "Interior delantero",
  "Interior trasero",
  "Kilometraje",
];

const CHECK_ITEMS = [
  "Documentación",
  "Kit de seguridad",
  "Rueda de auxilio",
  "Estado de neumáticos",
  "Estado de cristales",
];

const TIRES_OPTIONS = [
  "Delantera izquierda",
  "Delantera derecha",
  "Trasera izquierda",
  "Trasera derecha",
];

const GLASS_OPTIONS = [
  "Parabrisas",
  "Luneta trasera",
  "Delantero izquierdo",
  "Delantero derecho",
  "Trasero izquierdo",
  "Trasero derecho",
];

const CameraIcon = ({ size = 22, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const SaveIcon = ({ size = 16, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <polyline points="9 15 11 17 15 13" />
  </svg>
);

const TrashIcon = ({ size = 14, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const compressImageFile = (file, maxWidth = 1280, quality = 0.7) => {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result);
      reader.readAsDataURL(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(e.target?.result);
      img.src = e.target?.result;
    };
    reader.readAsDataURL(file);
  });
};

const SiniestrosInspeccion = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { username, nombre } = useSelector((state) => state.loginReducer);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [tipo, setTipo] = useState("Entrega");
  const [fecha, setFecha] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  const [selectedContratoOption, setSelectedContratoOption] = useState(null);
  const [verificador, setVerificador] = useState(nombre || username || "");

  useEffect(() => {
    if (!verificador && (nombre || username)) {
      setVerificador(nombre || username);
    }
  }, [nombre, username, verificador]);

  // Cliente & Vehículo
  const [clienteNombre, setClienteNombre] = useState("");
  const [dni, setDni] = useState("");
  const [telefono, setTelefono] = useState("");
  const [patente, setPatente] = useState("");
  const [vehiculoInfo, setVehiculoInfo] = useState("");
  const [color, setColor] = useState("");
  const [nivelCombustible, setNivelCombustible] = useState("");
  const [segundoJuegoLlaves, setSegundoJuegoLlaves] = useState("Sí");

  // Carga de inspección existente si viene ID por parámetro
  useEffect(() => {
    if (!id) return;

    const loadSiniestro = async () => {
      try {
        const res = await siniestrosService.getSiniestroById(id);
        const data = res?.data || res;
        if (!data || !data.id) return;

        if (data.tipo) setTipo(data.tipo);
        if (data.fecha_hora) {
          const d = new Date(data.fecha_hora);
          d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
          setFecha(d.toISOString().slice(0, 16));
        }
        if (data.verificador) setVerificador(data.verificador);
        if (data.nivel_combustible) setNivelCombustible(data.nivel_combustible);
        if (data.segundo_juego_llaves) setSegundoJuegoLlaves(data.segundo_juego_llaves);
        if (data.kilometraje !== undefined) setKm(String(data.kilometraje));
        if (data.kilometraje_manual !== undefined) setManualKm(Boolean(data.kilometraje_manual));
        if (data.observaciones) setObservaciones(data.observaciones);
        if (data.aclaracion_cliente) setClientSignName(data.aclaracion_cliente);
        if (data.aclaracion_verificador) setStaffSignName(data.aclaracion_verificador);

        if (data.cliente_nombre) {
          setClienteNombre(
            `${data.cliente_nombre || ""} ${data.cliente_apellido || ""}`.trim() ||
              data.cliente_razon_social ||
              ""
          );
        }
        if (data.vehiculo_dominio) setPatente(data.vehiculo_dominio);
        if (data.vehiculo_modelo || data.vehiculo_marca) {
          setVehiculoInfo(`${data.vehiculo_marca || ""} ${data.vehiculo_modelo || ""}`.trim());
        }

        setSelectedContratoOption({
          value: data.id_contrato,
          contrato: {
            id: data.id_contrato,
            id_vehiculo: data.id_vehiculo,
            id_cliente: data.id_cliente,
          },
          label: `Contrato #${data.id_contrato} — ${data.vehiculo_dominio || "S/D"} — ${data.cliente_nombre || ""}`,
        });

        if (data.danos) {
          try {
            const parsedDanos = typeof data.danos === "string" ? JSON.parse(data.danos) : data.danos;
            if (Array.isArray(parsedDanos)) setDamages(parsedDanos);
          } catch (e) {
            console.error("Error al parsear danos:", e);
          }
        }

        if (data.control_general) {
          try {
            const parsedControl =
              typeof data.control_general === "string"
                ? JSON.parse(data.control_general)
                : data.control_general;
            if (parsedControl.checks) setChecks(parsedControl.checks);
            if (parsedControl.selectedTires) setSelectedTires(parsedControl.selectedTires);
            if (parsedControl.selectedGlass) setSelectedGlass(parsedControl.selectedGlass);
          } catch (e) {
            console.error("Error al parsear control_general:", e);
          }
        }

        if (data.fotos_guiadas) {
          try {
            const parsedPhotos =
              typeof data.fotos_guiadas === "string"
                ? JSON.parse(data.fotos_guiadas)
                : data.fotos_guiadas;
            if (Array.isArray(parsedPhotos)) setPhotos(parsedPhotos);
          } catch (e) {
            console.error("Error al parsear fotos_guiadas:", e);
          }
        }

        if (data.fotos_adicionales) {
          try {
            const parsedExtra =
              typeof data.fotos_adicionales === "string"
                ? JSON.parse(data.fotos_adicionales)
                : data.fotos_adicionales;
            if (Array.isArray(parsedExtra)) setExtraPhotos(parsedExtra);
          } catch (e) {
            console.error("Error al parsear fotos_adicionales:", e);
          }
        }

        if (data.firma_cliente) {
          setClientSigned(true);
          const img = new Image();
          img.onload = () => {
            const ctx = clientCanvasRef.current?.getContext("2d");
            if (ctx && clientCanvasRef.current) {
              ctx.drawImage(img, 0, 0, clientCanvasRef.current.width, clientCanvasRef.current.height);
            }
          };
          img.src = data.firma_cliente;
        }

        if (data.firma_verificador) {
          setStaffSigned(true);
          const img = new Image();
          img.onload = () => {
            const ctx = staffCanvasRef.current?.getContext("2d");
            if (ctx && staffCanvasRef.current) {
              ctx.drawImage(img, 0, 0, staffCanvasRef.current.width, staffCanvasRef.current.height);
            }
          };
          img.src = data.firma_verificador;
        }
      } catch (err) {
        console.error("Error al cargar acta existente:", err);
      }
    };

    loadSiniestro();
  }, [id]);

  const searchTimeoutRef = useRef(null);

  // Formateador de opciones para el selector de contratos
  const formatContratoOption = (c) => {
    const dom = c.vehiculo_dominio || c.vehiculo_dominio_provisorio || "S/D";
    const mod = String(c.vehiculo_modelo || "").trim();
    const cli =
      `${c.cliente_nombre || ""} ${c.cliente_apellido || ""}`.trim() ||
      c.cliente_razon_social ||
      "Cliente N/D";

    return {
      value: c.id,
      contrato: c,
      label: `Contrato #${c.id} — ${dom} ${mod ? `(${mod}) ` : ""}— ${cli}`,
    };
  };

  // Búsqueda asíncrona de contratos on-demand con debounce
  const loadContratosOptions = (inputValue, callback) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const term = (inputValue || "").trim();

    // Consulta inmediata si no hay texto (para defaultOptions)
    if (!term) {
      siniestrosService
        .buscarContratos("")
        .then((res) => {
          const list = Array.isArray(res) ? res : res?.data || [];
          callback(list.map(formatContratoOption));
        })
        .catch(() => callback([]));
      return;
    }

    // Debounce de 300ms al tipear
    searchTimeoutRef.current = setTimeout(() => {
      siniestrosService
        .buscarContratos(term)
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

  const handleSelectContrato = (selected) => {
    setSelectedContratoOption(selected);
    if (!selected) {
      setClienteNombre("");
      setDni("");
      setTelefono("");
      setPatente("");
      setVehiculoInfo("");
      setColor("");
      return;
    }

    const c = selected.contrato || {};
    const nombreCompleto =
      `${c.cliente_nombre || ""} ${c.cliente_apellido || ""}`.trim() ||
      c.cliente_razon_social ||
      "";
    setClienteNombre(nombreCompleto);
    setDni(String(c.cliente_documento || ""));
    setTelefono(c.cliente_celular || c.cliente_telefono_alternativo || "");

    const mod = String(c.vehiculo_modelo || "").trim();
    setPatente(c.vehiculo_dominio || c.vehiculo_dominio_provisorio || "");
    setVehiculoInfo(mod || "Vehículo Giama");
    setColor(c.vehiculo_color || "");
  };

  // Daños marcados
  const [damages, setDamages] = useState([]);
  const [selectedDamageIndex, setSelectedDamageIndex] = useState(null);

  const handleViewClick = (e, viewName) => {
    if (e.target.closest(`.${styles.damagePin}`)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;

    const newDamage = {
      view: viewName,
      x,
      y,
      type: "Rayón",
      severity: "Leve",
      note: "",
    };

    setDamages((prev) => {
      const updated = [...prev, newDamage];
      setSelectedDamageIndex(updated.length - 1);
      return updated;
    });
  };

  const handleDamageFieldChange = (field, value) => {
    if (selectedDamageIndex === null) return;
    setDamages((prev) => {
      const updated = [...prev];
      updated[selectedDamageIndex] = {
        ...updated[selectedDamageIndex],
        [field]: value,
      };
      return updated;
    });
  };

  const handleRemoveDamage = (index) => {
    setDamages((prev) => prev.filter((_, i) => i !== index));
    if (selectedDamageIndex === index) {
      setSelectedDamageIndex(null);
    } else if (selectedDamageIndex > index) {
      setSelectedDamageIndex(selectedDamageIndex - 1);
    }
  };

  // Checklist
  const [checks, setChecks] = useState({
    Documentación: "Correcto",
    "Kit de seguridad": "Correcto",
    "Rueda de auxilio": "Correcto",
    "Estado de neumáticos": "Correcto",
    "Estado de cristales": "Correcto",
  });
  const [selectedTires, setSelectedTires] = useState([]);
  const [selectedGlass, setSelectedGlass] = useState([]);
  const [observaciones, setObservaciones] = useState("");

  const handleCheckChange = (checkName, value) => {
    setChecks((prev) => ({ ...prev, [checkName]: value }));
  };

  const toggleTire = (tire) => {
    setSelectedTires((prev) =>
      prev.includes(tire) ? prev.filter((t) => t !== tire) : [...prev, tire]
    );
  };

  const toggleGlass = (glass) => {
    setSelectedGlass((prev) =>
      prev.includes(glass) ? prev.filter((g) => g !== glass) : [...prev, glass]
    );
  };

  // Fotos Guiadas
  const [photos, setPhotos] = useState(Array(8).fill(null));
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [extraPhotos, setExtraPhotos] = useState([]);
  const guidedPhotoInputRef = useRef(null);
  const extraPhotoInputRef = useRef(null);

  // Kilometraje & OCR
  const [km, setKm] = useState("");
  const [manualKm, setManualKm] = useState(true);
  const [ocrStatus, setOcrStatus] = useState("Ingresá el kilometraje o cargá la foto.");

  const handleGuidedPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const src = await compressImageFile(file, 1280, 0.7);
      setPhotos((prev) => {
        const nextPhotos = [...prev];
        nextPhotos[activePhotoIndex] = src;
        return nextPhotos;
      });

      // Si es la foto de kilometraje (índice 7)
      if (activePhotoIndex === 7) {
        setOcrStatus("Foto capturada. Confirmá o ingresá el kilometraje.");
      }

      // Avanzar al siguiente paso pendiente
      const nextPending = photos.findIndex((p, i) => !p && i > activePhotoIndex);
      if (nextPending !== -1) {
        setActivePhotoIndex(nextPending);
      }
    } catch (err) {
      console.error("Error al procesar foto:", err);
    }
    e.target.value = "";
  };

  const openGuidedPhotoInput = (index) => {
    setActivePhotoIndex(index);
    guidedPhotoInputRef.current?.click();
  };

  const handleExtraPhotosChange = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      try {
        const src = await compressImageFile(file, 1280, 0.7);
        setExtraPhotos((prev) => [...prev, src]);
      } catch (err) {
        console.error("Error al procesar foto extra:", err);
      }
    }
    e.target.value = "";
  };

  // Firmas Canvas
  const clientCanvasRef = useRef(null);
  const staffCanvasRef = useRef(null);
  const [clientSignName, setClientSignName] = useState("");
  const [staffSignName, setStaffSignName] = useState("");
  const [clientSigned, setClientSigned] = useState(false);
  const [staffSigned, setStaffSigned] = useState(false);

  const setupCanvas = (canvas, setSigned) => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let drawing = false;

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    const start = (e) => {
      drawing = true;
      setSigned(true);
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#17283d";
      e.preventDefault();
    };

    const move = (e) => {
      if (!drawing) return;
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      e.preventDefault();
    };

    const end = () => {
      drawing = false;
    };

    canvas.addEventListener("pointerdown", start);
    canvas.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);

    return () => {
      canvas.removeEventListener("pointerdown", start);
      canvas.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
    };
  };

  useEffect(() => {
    const cleanupClient = setupCanvas(clientCanvasRef.current, setClientSigned);
    const cleanupStaff = setupCanvas(staffCanvasRef.current, setStaffSigned);
    return () => {
      cleanupClient?.();
      cleanupStaff?.();
    };
  }, []);

  const clearCanvas = (canvasRef, setSigned) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setSigned(false);
  };

  // Progreso general
  const progressPct = useMemo(() => {
    let completed = 0;
    const total = 14;
    if (selectedContratoOption) completed += 2;
    if (fecha) completed += 1;
    if (verificador) completed += 1;
    if (clienteNombre) completed += 1;
    if (patente) completed += 1;
    if (km) completed += 1;
    completed += photos.filter(Boolean).length / 2; // hasta 4 pts
    if (clientSigned) completed += 1.5;
    if (staffSigned) completed += 1.5;
    return Math.min(100, Math.round((completed / total) * 100));
  }, [selectedContratoOption, fecha, verificador, clienteNombre, patente, km, photos, clientSigned, staffSigned]);

  // Acciones
  const handleLimpiarActa = () => {
    Swal.fire({
      title: "¿Borrar todos los datos del acta?",
      text: "Se reseteará el formulario y los croquis marcados.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d9364f",
      confirmButtonText: "Sí, reiniciar",
      cancelButtonText: "Cancelar",
    }).then((res) => {
      if (res.isConfirmed) {
        setSelectedContratoOption(null);
        setClienteNombre("");
        setDni("");
        setTelefono("");
        setPatente("");
        setVehiculoInfo("");
        setColor("");
        setDamages([]);
        setSelectedDamageIndex(null);
        setPhotos(Array(8).fill(null));
        setExtraPhotos([]);
        setKm("");
        setManualKm(true);
        clearCanvas(clientCanvasRef, setClientSigned);
        clearCanvas(staffCanvasRef, setStaffSigned);
        setClientSignName("");
        setStaffSignName("");
        Swal.fire("Acta limpia", "Podés comenzar una nueva inspección.", "info");
      }
    });
  };

  const handleGuardarActa = async (imprimir = false) => {
    if (!selectedContratoOption) {
      Swal.fire("Atención", "El N.º de Contrato es obligatorio.", "warning");
      return;
    }
    if (!patente || !clienteNombre) {
      Swal.fire("Atención", "Completá los datos del cliente y vehículo.", "warning");
      return;
    }

    const missingPhotos = PHOTO_STEPS.filter(
      (_, idx) => !photos[idx] || (typeof photos[idx] === "string" && !photos[idx].trim())
    );

    if (missingPhotos.length > 0) {
      Swal.fire({
        title: "Fotos obligatorias incompletas",
        html: `Debés cargar las 8 fotos guiadas de la unidad.<br/><br/><b>Faltan ${missingPhotos.length} foto(s):</b><ul style="text-align: left; margin-top: 8px;">${missingPhotos.map((item) => `<li>${item}</li>`).join("")}</ul>`,
        icon: "warning",
      });
      return;
    }

    const { contrato } = selectedContratoOption;

    const payload = {
      id_contrato: contrato.id,
      id_vehiculo: contrato.id_vehiculo,
      id_cliente: contrato.id_cliente,
      tipo,
      fecha_hora: fecha,
      verificador,
      nivel_combustible: nivelCombustible,
      segundo_juego_llaves: segundoJuegoLlaves,
      kilometraje: Number(km) || 0,
      kilometraje_manual: manualKm,
      danos: damages,
      control_general: {
        checks,
        selectedTires,
        selectedGlass,
      },
      observaciones,
      fotos_guiadas: photos,
      fotos_adicionales: extraPhotos,
      firma_cliente: clientSigned && clientCanvasRef.current ? clientCanvasRef.current.toDataURL() : null,
      aclaracion_cliente: clientSignName,
      firma_verificador: staffSigned && staffCanvasRef.current ? staffCanvasRef.current.toDataURL() : null,
      aclaracion_verificador: staffSignName,
      usuario_alta: username,
      crear_movimiento: tipo === "Devolución" || tipo === "Entrega",
    };

    setIsSaving(true);
    try {
      let res;
      if (id) {
        payload.estado = imprimir ? "Finalizada" : "Pendiente";
        res = await siniestrosService.updateSiniestro(id, payload);
      } else {
        payload.estado = imprimir ? "Finalizada" : "Pendiente";
        res = await siniestrosService.postSiniestro(payload);
      }
      setIsSaving(false);
      if (res && res.status) {
        if (imprimir) {
          // Imprimir el acta sin interferencia de modales en pantalla
          setTimeout(() => {
            window.print();
            Swal.fire({
              title: "Inspección finalizada",
              text: res.message || "Inspección guardada correctamente.",
              icon: "success",
              showCancelButton: true,
              confirmButtonText: "Ir al listado",
              cancelButtonText: "Seguir en el acta",
            }).then((result) => {
              if (result.isConfirmed) {
                navigate("/vehiculos/siniestros");
              }
            });
          }, 300);
        } else {
          Swal.fire({
            title: "Éxito",
            text: res.message || "Inspección guardada correctamente",
            icon: "success",
            showCancelButton: true,
            confirmButtonText: "Ir al listado",
            cancelButtonText: "Seguir editando",
          }).then((result) => {
            if (result.isConfirmed) {
              navigate("/vehiculos/siniestros");
            }
          });
        }
      } else {
        Swal.fire("Error", res?.message || "No se pudo guardar la inspección", "error");
      }
    } catch (err) {
      setIsSaving(false);
      Swal.fire("Error", err.message || "Error al conectar con el servidor", "error");
    }
  };

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.backButton}
        onClick={() => navigate("/vehiculos/siniestros")}
      >
        ← Volver al listado
      </button>

      {/* Header / Intro */}
      <div className={styles.intro}>
        <div>
          <p className={styles.eyebrow}>
            {id ? `ACTA DIGITAL #${id} — EDICIÓN` : "ACTA DIGITAL DE SINIESTROS E INSPECCIÓN"}
          </p>
          <h1 className={styles.introTitle}>
            {id ? `Acta de inspección #${id}` : "Inspección vehicular y registro de daños"}
          </h1>
          <p className={styles.introSubtitle}>
            Completá el estado de la unidad, daños en croquis, control general y registro fotográfico.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {id && (
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => window.print()}
              title="Imprimir o guardar PDF del acta"
            >
              Imprimir PDF
            </button>
          )}
          <div className={styles.stepPill}>
            <b>{progressPct}%</b>
            <span>completado</span>
          </div>
        </div>
      </div>

      <form onSubmit={(e) => e.preventDefault()}>
        {/* 01 Operación */}
        <section className={styles.card}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionNumber}>01</span>
            <div>
              <h2>Operación</h2>
              <p>Tipo, fecha, contrato y responsables</p>
            </div>
          </div>

          <div className={styles.segmented} role="group" aria-label="Tipo de inspección">
            {["Entrega", "Devolución"].map((t) => (
              <label key={t}>
                <input
                  type="radio"
                  name="tipo"
                  value={t}
                  checked={tipo === t}
                  onChange={(e) => setTipo(e.target.value)}
                />
                <span>{t}</span>
              </label>
            ))}
          </div>

          <div className={styles.gridThree}>
            <label className={styles.fieldLabel}>
              Fecha y hora
              <input
                type="datetime-local"
                className={styles.input}
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
              />
            </label>

            <label className={styles.fieldLabel}>
              <span>N.º de contrato <strong style={{ color: "#d9364f" }}>* (Obligatorio)</strong></span>
              <AsyncSelect
                cacheOptions
                defaultOptions
                filterOption={() => true}
                loadOptions={loadContratosOptions}
                value={selectedContratoOption}
                onChange={handleSelectContrato}
                placeholder="Buscar por N.º de contrato (ID), patente o cliente..."
                isClearable
                noOptionsMessage={() => "No se encontraron contratos coincidentes"}
                loadingMessage={() => "Buscando contratos..."}
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: 10,
                    borderColor: "#cfd8e2",
                    padding: 2,
                    fontSize: 14,
                  }),
                }}
              />
            </label>

            <label className={styles.fieldLabel}>
              Verificador
              <input
                className={styles.input}
                placeholder="Nombre y apellido"
                value={verificador}
                onChange={(e) => setVerificador(e.target.value)}
                required
              />
            </label>
          </div>
        </section>

        {/* 02 Cliente y Vehículo */}
        <section className={styles.card}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionNumber}>02</span>
            <div>
              <h2>Cliente y vehículo</h2>
              <p>Datos principales cargados desde el contrato seleccionado</p>
            </div>
          </div>

          <div className={styles.gridThree}>
            <label className={styles.fieldLabel}>
              Cliente / conductor
              <input
                className={styles.input}
                placeholder="Nombre y apellido"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                required
              />
            </label>

            <label className={styles.fieldLabel}>
              DNI / CUIT
              <input
                className={styles.input}
                placeholder="00.000.000"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
              />
            </label>

            <label className={styles.fieldLabel}>
              Teléfono
              <input
                className={styles.input}
                placeholder="11 0000-0000"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </label>

            <label className={styles.fieldLabel}>
              Patente
              <input
                className={`${styles.input} ${styles.uppercase}`}
                placeholder="AA 123 BB"
                value={patente}
                onChange={(e) => setPatente(e.target.value)}
                required
              />
            </label>

            <label className={styles.fieldLabel}>
              Marca y modelo
              <input
                className={styles.input}
                placeholder="Ej. Toyota Corolla"
                value={vehiculoInfo}
                onChange={(e) => setVehiculoInfo(e.target.value)}
                required
              />
            </label>

            <label className={styles.fieldLabel}>
              Color
              <input
                className={styles.input}
                placeholder="Ej. Blanco"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </label>

            <label className={styles.fieldLabel}>
              Nivel de combustible / batería
              <select
                className={styles.select}
                value={nivelCombustible}
                onChange={(e) => setNivelCombustible(e.target.value)}
              >
                <option value="">Seleccionar</option>
                <option value="100%">100%</option>
                <option value="75%">75%</option>
                <option value="50%">50%</option>
                <option value="25%">25%</option>
                <option value="Reserva / 10%">Reserva / 10%</option>
              </select>
            </label>

            <label className={styles.fieldLabel}>
              Segundo juego de llaves
              <select
                className={styles.select}
                value={segundoJuegoLlaves}
                onChange={(e) => setSegundoJuegoLlaves(e.target.value)}
              >
                <option value="Sí">Sí</option>
                <option value="No">No</option>
                <option value="No corresponde">No corresponde</option>
              </select>
            </label>
          </div>
        </section>

        {/* 03 Estado exterior y daños */}
        <section className={styles.card}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionNumber}>03</span>
            <div>
              <h2>Estado exterior y daños</h2>
              <p>Tocá sobre la imagen del vehículo para marcar la ubicación exacta del daño</p>
            </div>
            <div className={styles.countBadge}>
              <b>{damages.length}</b>
              <small>daños marcados</small>
            </div>
          </div>

          <div className={styles.multiViewWorkspace}>
            {/* 4 Croquis interactivos */}
            <div className={styles.separatedDiagrams}>
              {[
                { view: "Frente", label: "FRENTE", cropClass: styles.cropFront },
                { view: "Trasera", label: "TRASERA", cropClass: styles.cropRear },
                { view: "Lateral izquierdo", label: "LATERAL IZQUIERDO", cropClass: styles.cropLeft },
                { view: "Lateral derecho", label: "LATERAL DERECHO", cropClass: styles.cropRight },
              ].map(({ view, label, cropClass }) => (
                <div
                  key={view}
                  className={`${styles.croppedView} ${cropClass}`}
                  onClick={(e) => handleViewClick(e, view)}
                  title={`Hacé clic para marcar un daño en: ${label}`}
                >
                  <strong className={styles.viewTitle}>{label}</strong>
                  <div className={styles.cropImage}>
                    <img src="/vehicle-inspection-diagram.png" alt={label} />
                  </div>
                  <div className={styles.viewPins}>
                    {damages.map((d, index) => {
                      if (d.view !== view) return null;
                      const isActive = index === selectedDamageIndex;
                      return (
                        <button
                          key={index}
                          type="button"
                          className={`${styles.damagePin} ${isActive ? styles.damagePinActive : ""}`}
                          style={{ left: `${d.x}%`, top: `${d.y}%` }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDamageIndex(index);
                          }}
                          title={`${d.type} (${d.severity})`}
                        >
                          {index + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Panel de edición de daño */}
            <aside className={styles.damagePanel}>
              <h3>Daño seleccionado</h3>
              {selectedDamageIndex === null ? (
                <p className={styles.damageHint}>
                  Marcá una zona en el croquis del vehículo o tocá un punto ya marcado para editarlo.
                </p>
              ) : (
                <div>
                  <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#1976d2" }}>
                    Editando daño #{selectedDamageIndex + 1} ({damages[selectedDamageIndex]?.view})
                  </p>

                  <label className={styles.fieldLabel} style={{ marginBottom: 10 }}>
                    Tipo de daño
                    <select
                      className={styles.select}
                      value={damages[selectedDamageIndex]?.type || "Rayón"}
                      onChange={(e) => handleDamageFieldChange("type", e.target.value)}
                    >
                      <option value="Rayón">Rayón</option>
                      <option value="Abolladura">Abolladura</option>
                      <option value="Rotura">Rotura</option>
                      <option value="Faltante">Faltante</option>
                      <option value="Mancha">Mancha</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </label>

                  <label className={styles.fieldLabel} style={{ marginBottom: 10 }}>
                    Gravedad
                    <select
                      className={styles.select}
                      value={damages[selectedDamageIndex]?.severity || "Leve"}
                      onChange={(e) => handleDamageFieldChange("severity", e.target.value)}
                    >
                      <option value="Leve">Leve</option>
                      <option value="Moderado">Moderado</option>
                      <option value="Grave">Grave</option>
                    </select>
                  </label>

                  <label className={styles.fieldLabel} style={{ marginBottom: 10 }}>
                    Detalle
                    <textarea
                      className={styles.textarea}
                      rows={3}
                      placeholder="Describí brevemente el daño..."
                      value={damages[selectedDamageIndex]?.note || ""}
                      onChange={(e) => handleDamageFieldChange("note", e.target.value)}
                    />
                  </label>

                  <button
                    type="button"
                    className={styles.dangerLink}
                    onClick={() => handleRemoveDamage(selectedDamageIndex)}
                  >
                    <TrashIcon size={14} />
                    <span>Eliminar este daño</span>
                  </button>
                  <p className={styles.editorHelp}>Los cambios se aplican automáticamente.</p>
                </div>
              )}

              {/* Lista resumen de daños */}
              <div className={styles.damageSummary}>
                {damages.map((d, i) => (
                  <div key={i} className={styles.damageSummaryItem}>
                    <div>
                      <b>
                        #{i + 1}. {d.view}: {d.type}
                      </b>{" "}
                      · {d.severity}
                      {d.note && <div style={{ color: "#555" }}>{d.note}</div>}
                    </div>
                    <div className={styles.damageSummaryActions}>
                      <button
                        type="button"
                        className={styles.editDamageBtn}
                        onClick={() => setSelectedDamageIndex(i)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className={styles.removeDamageBtn}
                        onClick={() => handleRemoveDamage(i)}
                        title="Eliminar marca"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        {/* 04 Control general */}
        <section className={styles.card}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionNumber}>04</span>
            <div>
              <h2>Control general</h2>
              <p>Estado de elementos reglamentarios y documentación</p>
            </div>
          </div>

          <div className={styles.checkGrid}>
            {CHECK_ITEMS.map((item) => {
              const isTires = item === "Estado de neumáticos";
              const isGlass = item === "Estado de cristales";
              const val = checks[item] || "Correcto";

              return (
                <div key={item} className={`${styles.checkRow} ${isTires ? styles.tireCheck : ""}`}>
                  <div className={styles.checkMain}>
                    <span>{item}</span>
                    <select
                      className={styles.select}
                      value={val}
                      onChange={(e) => handleCheckChange(item, e.target.value)}
                    >
                      {isGlass ? (
                        <>
                          <option value="Correcto">Correcto</option>
                          <option value="Rayado">Rayado</option>
                          <option value="Trizado">Trizado</option>
                          <option value="Roto">Roto</option>
                          <option value="Observado">Observado</option>
                          <option value="No aplica">No aplica</option>
                        </>
                      ) : (
                        <>
                          <option value="Correcto">Correcto</option>
                          <option value="Faltante">Faltante</option>
                          <option value="Mal estado">Mal estado</option>
                          <option value="Observado">Observado</option>
                          <option value="No aplica">No aplica</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Selector detallado de neumáticos */}
                  {isTires && !["Correcto", "No aplica"].includes(val) && (
                    <div className={styles.detailSelector}>
                      <small>Indicá qué rueda está afectada:</small>
                      <div>
                        {TIRES_OPTIONS.map((t) => (
                          <label key={t}>
                            <input
                              type="checkbox"
                              checked={selectedTires.includes(t)}
                              onChange={() => toggleTire(t)}
                            />
                            {t}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Selector detallado de cristales */}
                  {isGlass && !["Correcto", "No aplica"].includes(val) && (
                    <div className={`${styles.detailSelector} ${styles.glassSelector}`}>
                      <small>Indicá qué cristal está afectado:</small>
                      <div>
                        {GLASS_OPTIONS.map((g) => (
                          <label key={g}>
                            <input
                              type="checkbox"
                              checked={selectedGlass.includes(g)}
                              onChange={() => toggleGlass(g)}
                            />
                            {g}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <label className={styles.fieldLabel}>
            Observaciones generales
            <textarea
              className={styles.textarea}
              rows={3}
              placeholder="Indicá cualquier detalle o novedad relevante del vehículo..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </label>
        </section>

        {/* 05 Registro fotográfico guiado */}
        <section className={styles.card}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionNumber}>05</span>
            <div>
              <h2>Registro fotográfico guiado</h2>
              <p>Completá las 8 tomas para documentar toda la unidad</p>
            </div>
            <div className={styles.countBadge}>
              <b style={{ color: "#1976d2" }}>{photos.filter(Boolean).length}/8</b>
              <small>fotos tomadas</small>
            </div>
          </div>

          <input
            ref={guidedPhotoInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleGuidedPhotoChange}
          />

          <div className={styles.guidedPhotos}>
            {PHOTO_STEPS.map((stepLabel, idx) => {
              const src = photos[idx];
              const isNext = !src && idx === photos.findIndex((p) => !p);

              return (
                <div
                  key={stepLabel}
                  className={`${styles.photoStep} ${src ? styles.photoStepDone : ""} ${isNext ? styles.photoStepNext : ""}`}
                >
                  <div className={styles.photoStepHead}>
                    <span className={styles.photoStepNumber}>{src ? "✓" : idx + 1}</span>
                    <span>{stepLabel}</span>
                  </div>

                  <button
                    type="button"
                    className={styles.photoStepPreview}
                    onClick={() => openGuidedPhotoInput(idx)}
                  >
                    {src ? (
                      <img src={src} alt={stepLabel} />
                    ) : (
                      <span className={styles.photoStepEmpty}>
                        <CameraIcon size={22} />
                        <span>Tomar o subir foto</span>
                      </span>
                    )}
                  </button>

                  {src && (
                    <div className={styles.photoStepActions}>
                      <button type="button" onClick={() => openGuidedPhotoInput(idx)}>
                        Repetir
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPhotos((prev) => {
                            const updated = [...prev];
                            updated[idx] = null;
                            return updated;
                          });
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Kilometraje */}
          <div className={styles.kilometerResult}>
            <div className={styles.kilometerHeading}>
              <div>
                <h3>Kilometraje</h3>
                <p>{ocrStatus}</p>
              </div>
              <span
                className={`${styles.ocrBadge} ${
                  manualKm ? styles.ocrBadgeManual : km ? styles.ocrBadgeSuccess : ""
                }`}
              >
                {manualKm ? "Carga manual" : km ? "Confirmado" : "Pendiente"}
              </span>
            </div>

            <div className={styles.kilometerFields}>
              <label className={styles.fieldLabel}>
                Kilómetros actuales
                <input
                  type="number"
                  min="0"
                  className={styles.input}
                  placeholder="Ej. 45200"
                  value={km}
                  onChange={(e) => setKm(e.target.value)}
                  disabled={!manualKm && photos[7] === null}
                  required
                />
              </label>

              <label className={styles.manualToggle}>
                <input
                  type="checkbox"
                  checked={manualKm}
                  onChange={(e) => setManualKm(e.target.checked)}
                />
                <span>✓</span> Cargar o corregir kilometraje manualmente
              </label>
            </div>
          </div>

          {/* Fotos Adicionales */}
          <div className={styles.extraPhotoSection}>
            <div>
              <h3>Fotos adicionales</h3>
              <p>Agregá cualquier detalle adicional que necesites documentar.</p>
            </div>
            <label className={styles.extraPhotoButton}>
              <input
                ref={extraPhotoInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleExtraPhotosChange}
              />
              ＋ Agregar fotos adicionales
            </label>
          </div>

          {extraPhotos.length > 0 && (
            <div className={styles.photoGrid}>
              {extraPhotos.map((src, i) => (
                <div key={i} className={styles.photoItem}>
                  <img src={src} alt={`Foto adicional ${i + 1}`} />
                  <button
                    type="button"
                    onClick={() => setExtraPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                    title="Eliminar foto"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 06 Conformidad y firmas */}
        <section className={styles.card}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionNumber}>06</span>
            <div>
              <h2>Conformidad y firmas</h2>
              <p>Firma digital del cliente / conductor y del verificador</p>
            </div>
          </div>

          <p className={styles.legal}>
            Las partes dejan constancia del estado del vehículo, su kilometraje, accesorios y daños
            visibles detallados en la presente acta digital de Giama Renting.
          </p>

          <div className={styles.signatureGrid}>
            <div className={styles.signatureBox}>
              <label>Firma del cliente / conductor</label>
              <canvas
                ref={clientCanvasRef}
                className={styles.signatureCanvas}
                width={500}
                height={160}
              />
              <button
                type="button"
                className={styles.clearSign}
                onClick={() => clearCanvas(clientCanvasRef, setClientSigned)}
              >
                Borrar firma
              </button>
              <input
                className={styles.input}
                style={{ marginTop: 8 }}
                placeholder="Aclaración del cliente"
                value={clientSignName}
                onChange={(e) => setClientSignName(e.target.value)}
              />
            </div>

            <div className={styles.signatureBox}>
              <label>Firma del verificador</label>
              <canvas
                ref={staffCanvasRef}
                className={styles.signatureCanvas}
                width={500}
                height={160}
              />
              <button
                type="button"
                className={styles.clearSign}
                onClick={() => clearCanvas(staffCanvasRef, setStaffSigned)}
              >
                Borrar firma
              </button>
              <input
                className={styles.input}
                style={{ marginTop: 8 }}
                placeholder="Aclaración del verificador"
                value={staffSignName}
                onChange={(e) => setStaffSignName(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Barra inferior de acciones */}
        <div className={styles.actions}>
          <button type="button" className={styles.secondaryBtn} onClick={handleLimpiarActa} disabled={isSaving}>
            Limpiar acta
          </button>
          {/* 
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => handleGuardarActa(false)}
            disabled={isSaving}
          >
            {isSaving ? (
              "Guardando..."
            ) : (
              <>
                <SaveIcon size={16} />
                <span>Guardar inspección</span>
              </>
            )}
          </button>
          */}
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => handleGuardarActa(true)}
            disabled={isSaving}
          >
            {isSaving ? "Guardando..." : "Finalizar y generar PDF"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SiniestrosInspeccion;
