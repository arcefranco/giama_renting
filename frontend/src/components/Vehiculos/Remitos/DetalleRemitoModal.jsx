import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getRemitoById } from "../../../reducers/Vehiculos/vehiculosSlice.js";
import { format, parseISO } from "date-fns";
import html2pdf from "html2pdf.js";

const DetalleRemitoModal = ({ idRemito, isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { remitoDetalle, isLoading } = useSelector((state) => state.vehiculosReducer);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (isOpen && idRemito) {
      dispatch(getRemitoById({ id: idRemito }));
    }
  }, [isOpen, idRemito, dispatch]);

  if (!isOpen) return null;

  const remito = remitoDetalle?.remito;
  const detalles = remitoDetalle?.detalles || [];

  const nroFormatted = remito
    ? `${String(remito.punto_venta).padStart(4, "0")}-${String(remito.numero).padStart(8, "0")}`
    : "";

  const getObservacionesLimpias = (obs) => {
    if (!obs) return "-";
    const cleaned = obs
      .replace(/^Contrato\s*#\d+(\s*\([^)]*\))?\s*(-|\s)\s*/i, "")
      .trim();
    if (/^Contrato\s*#\d+(\s*\([^)]*\))?$/i.test(obs.trim())) {
      return "-";
    }
    return cleaned || "-";
  };

  const colgroupHtml = `
    <colgroup>
      <col style="width: 5%;">
      <col style="width: 16%;">
      <col style="width: 21%;">
      <col style="width: 14%;">
      <col style="width: 15%;">
      <col style="width: 14%;">
      <col style="width: 15%;">
    </colgroup>
  `;

  const handlePrint = () => {
    const element = document.createElement("div");
    element.style.width = "190mm";
    element.style.margin = "0 auto";

    const autorizoNombre = detalles[0]?.autorizo || remito?.usuario_alta || "";
    const retiraNombre = detalles[0]?.retira || "";

    const generateRemitoPage = (tipoCopia) => `
      <div style="font-family: Arial, sans-serif; padding: 8px 12px; color: #333; width: 100%; max-width: 190mm; box-sizing: border-box; height: 265mm; display: flex; flex-direction: column; justify-content: space-between;">
        <!-- CONTENIDO SUPERIOR -->
        <div>
          <div style="text-align: center; margin-bottom: 6px; font-weight: bold; font-size: 13px; letter-spacing: 2px;">
            ${tipoCopia}
          </div>
          <div style="border: 1px solid #000; margin-bottom: 12px; display: flex; position: relative;">
            <!-- Central separator line -->
            <div style="position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background-color: #000;"></div>
            
            <!-- Central Box (Letter R) -->
            <div style="position: absolute; left: 50%; top: 0; width: 44px; margin-left: -23px; background: white; border: 1px solid #000; border-top: none; padding: 4px 0; text-align: center; font-weight: bold; font-size: 22px; box-sizing: border-box;">
              R
              <div style="font-size: 8px; font-weight: normal; margin-top: 1px;">CÓD. 091</div>
            </div>

            <!-- Left Side -->
            <div style="flex: 1; padding: 12px 16px; box-sizing: border-box;">
              <h1 style="margin: 0 0 2px 0; font-size: 24px; font-weight: 900; color: #800020; letter-spacing: 2px; line-height: 1;">GIAMA</h1>
              <span style="font-size: 10px; color: #555; font-weight: bold; letter-spacing: 1.5px; display: block; margin-bottom: 12px;">RENTING</span>
              
              <p style="margin: 0; font-size: 10px; line-height: 1.3;"><strong>Razón Social:</strong> GIAMA RENTING S.A.</p>
              <p style="margin: 2px 0 0 0; font-size: 10px; line-height: 1.3;"><strong>Domicilio Comercial:</strong> De Los Incas Av. 5150 Piso:8</p>
              <p style="margin: 2px 0 0 0; font-size: 10px; line-height: 1.3;">Capital Federal, Ciudad de Buenos Aires</p>
              <p style="margin: 2px 0 0 0; font-size: 10px; line-height: 1.3;"><strong>Condición frente al IVA:</strong> IVA Responsable Inscripto</p>
            </div>

            <!-- Right Side -->
            <div style="flex: 1; padding: 25px 16px 12px 45px; box-sizing: border-box;">
              <h2 style="margin: 0 0 4px 0; font-size: 20px; color: #333;">REMITO</h2>
              <p style="margin: 0; font-size: 13px; font-weight: bold;">N° ${nroFormatted}</p>
              <p style="margin: 4px 0 10px 0; font-size: 11px; color: #444;"><strong>Fecha de Emisión:</strong> ${
                remito?.fecha_emision
                  ? format(parseISO(remito.fecha_emision), "dd/MM/yyyy")
                  : ""
              }</p>
              
              <p style="margin: 0; font-size: 10px;"><strong>CUIT:</strong> 30718651200</p>
            </div>
          </div>

          <div style="margin-bottom: 12px; font-size: 11px;">
            <p style="margin: 0;"><strong>Observaciones:</strong> ${getObservacionesLimpias(remito?.observaciones)}</p>
          </div>

          <h3 style="font-size: 13px; margin: 0 0 6px 0; color: #1e293b;">Detalle de Unidades (${detalles.length})</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; table-layout: fixed;">
            ${colgroupHtml}
            <thead>
              <tr>
                <th style="border: 1px solid #ccc; padding: 5px; text-align: left; background-color: #f2f2f2;">N°</th>
                <th style="border: 1px solid #ccc; padding: 5px; text-align: left; background-color: #f2f2f2;">Dominio</th>
                <th style="border: 1px solid #ccc; padding: 5px; text-align: left; background-color: #f2f2f2;">Modelo</th>
                <th style="border: 1px solid #ccc; padding: 5px; text-align: left; background-color: #f2f2f2;">Movimiento</th>
                <th style="border: 1px solid #ccc; padding: 5px; text-align: left; background-color: #f2f2f2;">Motivo</th>
                <th style="border: 1px solid #ccc; padding: 5px; text-align: left; background-color: #f2f2f2;">Retira</th>
                <th style="border: 1px solid #ccc; padding: 5px; text-align: left; background-color: #f2f2f2;">Autorizó</th>
              </tr>
            </thead>
            <tbody>
              ${detalles
                .map(
                  (d, i) => `
                <tr>
                  <td style="border: 1px solid #ccc; padding: 5px; word-break: break-word;">${i + 1}</td>
                  <td style="border: 1px solid #ccc; padding: 5px; word-break: break-word; font-weight: bold;">${d.dominio || d.dominio_provisorio || "-"}</td>
                  <td style="border: 1px solid #ccc; padding: 5px; word-break: break-word;">${d.modelo_nombre || "-"}</td>
                  <td style="border: 1px solid #ccc; padding: 5px; word-break: break-word;">${d.tipo ? d.tipo.toUpperCase() : "-"}</td>
                  <td style="border: 1px solid #ccc; padding: 5px; word-break: break-word;">${d.motivo || d.destino || "-"}</td>
                  <td style="border: 1px solid #ccc; padding: 5px; word-break: break-word;">${d.retira || "-"}</td>
                  <td style="border: 1px solid #ccc; padding: 5px; word-break: break-word;">${d.autorizo || "-"}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <!-- PIE DE PÁGINA (FIRMAS Y ACLARACIÓN SIEMPRE AL FONDO) -->
        <div style="margin-top: auto; padding-top: 15px;">
          <div style="display: flex; justify-content: space-around; padding: 0 20px 15px 20px;">
            <div style="width: 220px; text-align: center;">
              <div style="height: 40px;"></div>
              <div style="border-top: 1px solid #000; padding-top: 4px; font-size: 12px; font-weight: bold;">Firma Entregó</div>
              <div style="margin-top: 8px; font-size: 11px;">
                <span style="color: #666;">Aclaración:</span> <strong>${autorizoNombre}</strong>
              </div>
            </div>
            <div style="width: 220px; text-align: center;">
              <div style="height: 40px;"></div>
              <div style="border-top: 1px solid #000; padding-top: 4px; font-size: 12px; font-weight: bold;">Firma Recibió</div>
              <div style="margin-top: 8px; font-size: 11px;">
                <span style="color: #666;">Aclaración:</span> <strong>${retiraNombre}</strong>
              </div>
            </div>
          </div>
          <div style="text-align: center; font-weight: bold; font-size: 10px; color: #666; padding-bottom: 2px;">
            DOCUMENTO NO VÁLIDO COMO FACTURA
          </div>
        </div>
      </div>
    `;

    element.innerHTML = `
      ${generateRemitoPage("ORIGINAL")}
      <div class="html2pdf__page-break"></div>
      ${generateRemitoPage("DUPLICADO")}
    `;

    const opt = {
      margin:       [10, 10, 10, 10], // 10mm de margen (alto imprimible: 277mm)
      filename:     `Remito_${nroFormatted}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: 'css', before: '.html2pdf__page-break' }
    };

    setIsDownloading(true);
    try {
      html2pdf()
        .set(opt)
        .from(element)
        .toPdf()
        .get("pdf")
        .then(function (pdf) {
          const totalPages = pdf.internal.getNumberOfPages();
          for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(9);
            pdf.setTextColor(100);

            // Pág X de Y
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const text = `Pág ${i} de ${totalPages}`;

            // Add to bottom right
            pdf.text(text, pageWidth - 10, pageHeight - 5, { align: "right" });
          }
        })
        .save()
        .then(() => {
          setIsDownloading(false);
        })
        .catch((err) => {
          console.error("Error al generar PDF:", err);
          setIsDownloading(false);
        });
    } catch (error) {
      console.error("Error al preparar descarga de remito:", error);
      setIsDownloading(false);
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
        zIndex: 20000,
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
            Detalle del Remito N° {nroFormatted}
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

        {isLoading ? (
          <p style={{ textAlign: "center", padding: "20px" }}>Cargando detalles...</p>
        ) : remito ? (
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "12px",
                backgroundColor: "#f8fafc",
                padding: "16px",
                borderRadius: "6px",
                marginBottom: "16px",
              }}
            >
              <div>
                <strong>N° Remito:</strong> {nroFormatted}
              </div>
              <div>
                <strong>Fecha Emisión:</strong>{" "}
                {remito.fecha_emision
                  ? format(parseISO(remito.fecha_emision), "dd/MM/yyyy HH:mm")
                  : "-"}
              </div>
              <div>
                <strong>Estado:</strong>{" "}
                <span
                  style={{
                    fontWeight: "bold",
                    color: remito.estado === "ANULADO" ? "#dc2626" : "#16a34a",
                  }}
                >
                  {remito.estado}
                </span>
              </div>
              {remito.id_contrato && (
                <div>
                  <strong>Contrato Asociado:</strong> #{remito.id_contrato}
                </div>
              )}
              {(remito.cliente_nombre || remito.cliente_razon_social) && (
                <div>
                  <strong>Cliente:</strong>{" "}
                  {remito.cliente_nombre
                    ? `${remito.cliente_nombre} ${remito.cliente_apellido || ""}`.trim()
                    : remito.cliente_razon_social}
                  {remito.cliente_documento ? ` (Doc: ${remito.cliente_documento})` : ""}
                </div>
              )}
              {remito.observaciones && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <strong>Observaciones:</strong> {getObservacionesLimpias(remito.observaciones)}
                </div>
              )}
            </div>

            <h4 style={{ margin: "0 0 12px 0", fontSize: "1rem", color: "#334155" }}>
              Unidades Incluidas ({detalles.length})
            </h4>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f1f5f9", textAlign: "left" }}>
                    <th style={{ padding: "8px", borderBottom: "2px solid #cbd5e1" }}>Dominio</th>
                    <th style={{ padding: "8px", borderBottom: "2px solid #cbd5e1" }}>Modelo</th>
                    <th style={{ padding: "8px", borderBottom: "2px solid #cbd5e1" }}>Movimiento</th>
                    <th style={{ padding: "8px", borderBottom: "2px solid #cbd5e1" }}>Motivo</th>
                    <th style={{ padding: "8px", borderBottom: "2px solid #cbd5e1" }}>Retira</th>
                    <th style={{ padding: "8px", borderBottom: "2px solid #cbd5e1" }}>Autorizó</th>
                  </tr>
                </thead>
                <tbody>
                  {detalles.map((d) => (
                    <tr key={d.id_detalle} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "8px", fontWeight: "bold" }}>
                        {d.dominio || d.dominio_provisorio || "-"}
                      </td>
                      <td style={{ padding: "8px" }}>{d.modelo_nombre || "-"}</td>
                      <td style={{ padding: "8px" }}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            backgroundColor: d.tipo === "egreso" ? "#fee2e2" : "#dcfce7",
                            color: d.tipo === "egreso" ? "#991b1b" : "#166534",
                          }}
                        >
                          {d.tipo ? d.tipo.toUpperCase() : "-"}
                        </span>
                      </td>
                      <td style={{ padding: "8px" }}>{d.motivo || d.destino || "-"}</td>
                      <td style={{ padding: "8px" }}>{d.retira || "-"}</td>
                      <td style={{ padding: "8px" }}>{d.autorizo || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "24px",
              }}
            >
              <button
                onClick={handlePrint}
                disabled={isDownloading}
                style={{
                  backgroundColor: isDownloading ? "#94a3b8" : "#0284c7",
                  color: "#fff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  fontWeight: "bold",
                  cursor: isDownloading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <i className="fa-solid fa-print"></i>{" "}
                {isDownloading ? "Generando PDF..." : "Descargar / Imprimir"}
              </button>

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
        ) : (
          <p>No se encontraron datos del remito.</p>
        )}
      </div>
    </div>
  );
};

export default DetalleRemitoModal;
