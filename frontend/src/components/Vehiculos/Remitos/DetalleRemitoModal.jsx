import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getRemitoById } from "../../../reducers/Vehiculos/vehiculosSlice.js";
import { format, parseISO } from "date-fns";
import html2pdf from "html2pdf.js";

const DetalleRemitoModal = ({ idRemito, isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { remitoDetalle, isLoading } = useSelector((state) => state.vehiculosReducer);

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

  const firstDetalles = detalles.length > 2 ? detalles.slice(0, -2) : [];
  const lastDetalles = detalles.length > 2 ? detalles.slice(-2) : detalles;

  const colgroupHtml = `
    <colgroup>
      <col style="width: 5%;">
      <col style="width: 15%;">
      <col style="width: 20%;">
      <col style="width: 15%;">
      <col style="width: 15%;">
      <col style="width: 15%;">
      <col style="width: 15%;">
    </colgroup>
  `;

  const handlePrint = () => {
    const element = document.createElement("div");
    const generateRemitoPage = (tipoCopia) => `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 800px; margin: 0 auto; box-sizing: border-box; display: flex; flex-direction: column;">
        <div style="text-align: center; margin-bottom: 5px; font-weight: bold; font-size: 14px; letter-spacing: 2px;">
          ${tipoCopia}
        </div>
        <div style="flex-grow: 1;">
        <div style="border: 1px solid #000; margin-bottom: 20px; display: flex; position: relative;">
          <!-- Central separator line -->
          <div style="position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background-color: #000;"></div>
          
          <!-- Central Box (Letter R) -->
          <div style="position: absolute; left: 50%; top: 0; transform: translateX(-50%); background: white; border: 1px solid #000; border-top: none; padding: 5px 12px; text-align: center; font-weight: bold; font-size: 24px;">
            R
            <div style="font-size: 8px; font-weight: normal; margin-top: 2px;">CÓD. 091</div>
          </div>

          <!-- Left Side -->
          <div style="flex: 1; padding: 20px; box-sizing: border-box;">
            <h1 style="margin: 0 0 2px 0; font-size: 28px; font-weight: 900; color: #800020; letter-spacing: 2px; line-height: 1;">GIAMA</h1>
            <span style="font-size: 11px; color: #555; font-weight: bold; letter-spacing: 1.5px; display: block; margin-bottom: 20px;">RENTING</span>
            
            <p style="margin: 0; font-size: 11px;"><strong>Razón Social:</strong> GIAMA RENTING S.A.</p>
            <p style="margin: 4px 0 0 0; font-size: 11px;"><strong>Domicilio Comercial:</strong> De Los Incas Av. 5150 Piso:8</p>
            <p style="margin: 4px 0 0 0; font-size: 11px;">Capital Federal, Ciudad de Buenos Aires</p>
            <p style="margin: 4px 0 0 0; font-size: 11px;"><strong>Condición frente al IVA:</strong> IVA Responsable Inscripto</p>
          </div>

          <!-- Right Side -->
          <div style="flex: 1; padding: 40px 20px 20px 60px; box-sizing: border-box;">
            <h2 style="margin: 0 0 5px 0; font-size: 22px; color: #333;">REMITO</h2>
            <p style="margin: 0; font-size: 14px; font-weight: bold;">N° ${nroFormatted}</p>
            <p style="margin: 5px 0 20px 0; font-size: 12px; color: #444;"><strong>Fecha de Emisión:</strong> ${
              remito?.fecha_emision
                ? format(parseISO(remito.fecha_emision), "dd/MM/yyyy ")
                : ""
            }</p>
            
            <p style="margin: 0; font-size: 11px;"><strong>CUIT:</strong> 30718651200</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; font-size: 14px;">
          <p style="margin: 0;"><strong>Estado:</strong> ${remito?.estado}</p>
          <p style="margin: 0;"><strong>Observaciones:</strong> ${remito?.observaciones || "-"}</p>
        </div>
        <h3 style="font-size: 16px;">Detalle de Unidades</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; table-layout: fixed;">
          ${colgroupHtml}
          <thead>
            <tr>
              <th style="border: 1px solid #ccc; padding: 6px; text-align: left; background-color: #f2f2f2;">N°</th>
              <th style="border: 1px solid #ccc; padding: 6px; text-align: left; background-color: #f2f2f2;">Dominio / Patente</th>
              <th style="border: 1px solid #ccc; padding: 6px; text-align: left; background-color: #f2f2f2;">Modelo</th>
              <th style="border: 1px solid #ccc; padding: 6px; text-align: left; background-color: #f2f2f2;">Tipo Movimiento</th>
              <th style="border: 1px solid #ccc; padding: 6px; text-align: left; background-color: #f2f2f2;">Motivo</th>
              <th style="border: 1px solid #ccc; padding: 6px; text-align: left; background-color: #f2f2f2;">Persona que Retira</th>
              <th style="border: 1px solid #ccc; padding: 6px; text-align: left; background-color: #f2f2f2;">Autorizó</th>
            </tr>
          </thead>
          <tbody>
            ${firstDetalles
              .map(
                (d, i) => `
              <tr>
                <td style="border: 1px solid #ccc; padding: 6px; word-break: break-word;">${i + 1}</td>
                <td style="border: 1px solid #ccc; padding: 6px; word-break: break-word;">${d.dominio || d.dominio_provisorio || "-"}</td>
                <td style="border: 1px solid #ccc; padding: 6px; word-break: break-word;">${d.modelo_nombre || "-"}</td>
                <td style="border: 1px solid #ccc; padding: 6px; word-break: break-word;">${d.tipo ? d.tipo.toUpperCase() : "-"}</td>
                <td style="border: 1px solid #ccc; padding: 6px; word-break: break-word;">${d.destino || "-"}</td>
                <td style="border: 1px solid #ccc; padding: 6px; word-break: break-word;">${d.retira || "-"}</td>
                <td style="border: 1px solid #ccc; padding: 6px; word-break: break-word;">${d.autorizo || "-"}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        </div> <!-- End flex-grow wrapper -->
        <div style="page-break-inside: avoid;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed;">
            ${colgroupHtml}
            <tbody>
              ${lastDetalles
                .map(
                  (d, i) => `
                <tr>
                  <td style="border: 1px solid #ccc; padding: 6px; word-break: break-word;">${firstDetalles.length + i + 1}</td>
                  <td style="border: 1px solid #ccc; padding: 6px; word-break: break-word;">${d.dominio || d.dominio_provisorio || "-"}</td>
                  <td style="border: 1px solid #ccc; padding: 6px; word-break: break-word;">${d.modelo_nombre || "-"}</td>
                  <td style="border: 1px solid #ccc; padding: 6px; word-break: break-word;">${d.tipo ? d.tipo.toUpperCase() : "-"}</td>
                  <td style="border: 1px solid #ccc; padding: 6px; word-break: break-word;">${d.destino || "-"}</td>
                  <td style="border: 1px solid #ccc; padding: 6px; word-break: break-word;">${d.retira || "-"}</td>
                  <td style="border: 1px solid #ccc; padding: 6px; word-break: break-word;">${d.autorizo || "-"}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <div style="margin-top: 60px; position: relative;">
          <div style="display: flex; justify-content: space-between; padding: 0 30px; padding-bottom: 40px;">
            <div style="display: flex; flex-direction: column; gap: 40px;">
              <div style="border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 5px; font-size: 13px;">Firma Entregó</div>
              <div style="width: 200px; text-align: center; font-size: 13px;">
                <div style="min-height: 20px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 2px;">
                  <strong>${detalles[0]?.autorizo || ""}</strong>
                </div>
                <div style="border-top: 1px solid #000; padding-top: 5px;">Aclaración Autorizó</div>
              </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 40px;">
              <div style="border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 5px; font-size: 13px;">Firma Recibió</div>
              <div style="width: 200px; text-align: center; font-size: 13px;">
                <div style="min-height: 20px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 2px;">
                  <strong>${detalles[0]?.retira || ""}</strong>
                </div>
                <div style="border-top: 1px solid #000; padding-top: 5px;">Aclaración Retiró</div>
              </div>
            </div>
          </div>
          <div style="margin-top: 20px; text-align: center; font-weight: bold; font-size: 11px; color: #555;">
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
      margin:       [10, 10, 20, 10], // top, right, bottom, left (increased bottom margin for page numbers)
      filename:     `Remito_${nroFormatted}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: 'css', before: '.html2pdf__page-break' }
    };

    html2pdf().set(opt).from(element).toPdf().get('pdf').then(function (pdf) {
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
        pdf.text(text, pageWidth - 10, pageHeight - 10, { align: 'right' });
      }
    }).save();
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
              {remito.observaciones && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <strong>Observaciones:</strong> {remito.observaciones}
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
                      <td style={{ padding: "8px" }}>{d.destino || "-"}</td>
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
                style={{
                  backgroundColor: "#0284c7",
                  color: "#fff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <i className="fa-solid fa-print"></i> Descargar / Imprimir
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
