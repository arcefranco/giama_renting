import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getRemitoById } from "../../../reducers/Vehiculos/vehiculosSlice.js";
import { format, parseISO } from "date-fns";

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

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const content = `
      <html>
        <head>
          <title>Remito ${nroFormatted}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .header h2 { margin: 0; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .footer { margin-top: 40px; display: flex; justify-content: space-between; }
            .signature { border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>REMITO DE UNIDADES N° ${nroFormatted}</h2>
            <p><strong>Fecha de Emisión:</strong> ${
              remito?.fecha_emision
                ? format(parseISO(remito.fecha_emision), "dd/MM/yyyy HH:mm")
                : ""
            }</p>
          </div>
          <div class="info-grid">
            <p><strong>Estado:</strong> ${remito?.estado}</p>
            <p><strong>Usuario Alta:</strong> ${remito?.usuario_alta || "-"}</p>
            <p><strong>Observaciones:</strong> ${remito?.observaciones || "-"}</p>
          </div>
          <h3>Detalle de Unidades (${detalles.length})</h3>
          <table>
            <thead>
              <tr>
                <th>N°</th>
                <th>Dominio / Patente</th>
                <th>Modelo</th>
                <th>Tipo Movimiento</th>
                <th>Destino</th>
                <th>Persona que Retira</th>
                <th>Autorizó</th>
              </tr>
            </thead>
            <tbody>
              ${detalles
                .map(
                  (d, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${d.dominio || d.dominio_provisorio || "-"}</td>
                  <td>${d.modelo_nombre || "-"}</td>
                  <td>${d.tipo ? d.tipo.toUpperCase() : "-"}</td>
                  <td>${d.destino || "-"}</td>
                  <td>${d.retira || "-"}</td>
                  <td>${d.autorizo || "-"}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <div class="footer">
            <div class="signature">Firma Entregó</div>
            <div class="signature">Firma Recibió</div>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
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
              <div>
                <strong>Usuario Generador:</strong> {remito.usuario_alta || "-"}
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
                    <th style={{ padding: "8px", borderBottom: "2px solid #cbd5e1" }}>Destino</th>
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
                🖨️ Descargar / Imprimir
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
