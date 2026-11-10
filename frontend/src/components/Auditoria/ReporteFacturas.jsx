import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataGrid, {
  Column, Export, SearchPanel,
  FilterRow, HeaderFilter, Paging, Pager,
  Scrolling, Summary, TotalItem, Button as GridButton
} from "devextreme-react/data-grid";
import { Popup } from 'devextreme-react/popup';
import { getFacturas, getFacturaItems, reset, clearFacturaItems } from '../../reducers/Auditoria/auditoriaSlice';
import 'devextreme/dist/css/dx.carmine.css';
import { ClipLoader } from "react-spinners";
import { useToastFeedback } from '../../customHooks/useToastFeedback';
import { ToastContainer } from 'react-toastify';
import styles from './Auditoria.module.css';

const formatCurrency = (val) => {
  const num = parseFloat(val || 0);
  return num.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });
};

const formatDate = (val, includeTime = false) => {
  if (!val) return '-';
  const date = new Date(val);
  if (isNaN(date.getTime())) return val;
  return includeTime ? date.toLocaleString('es-AR') : date.toLocaleDateString('es-AR');
};

const tipoResponsableMap = {
  1: 'IVA Responsable Inscripto',
  2: 'IVA Sujeto Exento',
  3: 'Consumidor Final',
  4: 'Responsable Monotributo',
  5: 'Sujeto No Categorizado',
  6: 'Proveedor del Exterior',
};

const ReporteFacturas = () => {
  const dispatch = useDispatch();
  const { facturas, facturaItems, isLoading, isLoadingDetail, isSuccess, isError, message } = useSelector((state) => state.auditoriaReducer);
  const { token } = useSelector((state) => state.loginReducer);

  const [modalVisible, setModalVisible] = React.useState(false);
  const [selectedFactura, setSelectedFactura] = React.useState(null);

  useEffect(() => {
    dispatch(getFacturas(token));
    return () => {
      dispatch(reset());
    };
  }, [dispatch, token]);

  useToastFeedback(isLoading, isSuccess, isError, message, () => {
    dispatch(reset());
  });

  const onVerFacturaClick = (e) => {
    const rowData = e.row.data;
    setSelectedFactura(rowData);
    dispatch(getFacturaItems(rowData.ID));
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    dispatch(clearFacturaItems());
  };

  const renderEstadoAfipCell = (cellData) => {
    const { CAE, Resultado_Afip } = cellData.data || {};
    if (CAE) {
      return <span className={styles.badgeOk}>CAE Emitido</span>;
    }
    if (Resultado_Afip === 'R') {
      return <span className={styles.badgeWarn}>Rechazada</span>;
    }
    return <span className={styles.badgeNeutral}>Pendiente / Interna</span>;
  };

  return (
    <div className={styles.container}>
      <ToastContainer style={{ zIndex: 99999 }} />
      {isLoading && (
        <div className={styles.spinnerOverlay}>
          <ClipLoader size={60} color="#800020" loading={true} />
          <span className={styles.loadingText}>Cargando facturas...</span>
        </div>
      )}
      <h2>Reporte de Facturas PA7</h2>
      <DataGrid
        dataSource={facturas}
        keyExpr="ID"
        showBorders={true}
        allowColumnResizing={true}
        columnAutoWidth={true}
        wordWrapEnabled={true}
        rowAlternationEnabled={true}
        hoverStateEnabled={true}
      >
        <FilterRow visible={true} />
        <HeaderFilter visible={true} />
        <SearchPanel visible={true} width={280} placeholder="Buscar cliente, CUIT, comprobante, asiento..." />
        <Paging defaultPageSize={20} />
        <Pager
          showPageSizeSelector={true}
          allowedPageSizes={[10, 20, 50, 100]}
          showInfo={true}
        />
        <Export enabled={true} />

        <Column dataField="ID" caption="ID" width={75} alignment="center" />
        <Column dataField="FechaComprobante" caption="Fecha Comp." dataType="date" format="dd/MM/yyyy" width={105} />
        <Column dataField="Fecha" caption="Fecha Alta" dataType="date" format="dd/MM/yyyy HH:mm" width={135} />
        <Column dataField="TipoComprobante" caption="Tipo" width={70} alignment="center" />
        <Column dataField="PuntoVenta" caption="PV" width={60} alignment="center" />
        <Column dataField="NroComprobante" caption="N° Comprobante" width={180} />
        <Column dataField="NombreCliente" caption="Cliente / Razón Social" minWidth={200} />
        <Column dataField="CUIT" caption="CUIT / Doc." width={120} />
        <Column dataField="Importe" caption="Total" dataType="number" format="$ #,##0.00" width={140} />
        <Column dataField="NroAsiento" caption="Asiento" width={90} alignment="center" />
        <Column dataField="UsuarioAltaRegistro" caption="Usuario" width={140} />
        
        <Column type="buttons" caption="Acciones" width={90}>
          <GridButton 
            hint="Ver Detalle de Factura" 
            icon="textdocument" 
            onClick={onVerFacturaClick} 
          />
        </Column>

        <Summary>
          <TotalItem column="ID" summaryType="count" displayFormat="{0} comp." />
          <TotalItem column="Neto" summaryType="sum" valueFormat="$ #,##0.00" displayFormat="Neto: {0}" />
          <TotalItem column="Iva" summaryType="sum" valueFormat="$ #,##0.00" displayFormat="IVA: {0}" />
          <TotalItem column="PercepcionIIBB" summaryType="sum" valueFormat="$ #,##0.00" displayFormat="IIBB: {0}" />
          <TotalItem column="Importe" summaryType="sum" valueFormat="$ #,##0.00" displayFormat="Total: {0}" />
        </Summary>
      </DataGrid>

      <Popup
        visible={modalVisible}
        onHiding={handleCloseModal}
        dragEnabled={true}
        hideOnOutsideClick={true}
        showTitle={true}
        title={
          selectedFactura
            ? `Detalle de Comprobante ${selectedFactura.TipoComprobante || ''} — ${selectedFactura.NroComprobante || ''} (ID Interno: ${selectedFactura.ID})`
            : "Detalle de Factura"
        }
        width="92%"
        maxWidth={1450}
        minWidth={1050}
        height="85vh"
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className={styles.modalHeaderGrid}>
            <div className={styles.modalHeaderItem}>
              <span className={styles.modalHeaderLabel}>Cliente / Razón Social</span>
              <span className={styles.modalHeaderValue}>
                {selectedFactura?.NombreCliente || '-'} (Cód. PA7: {selectedFactura?.CodigoCliente || '-'})
              </span>
            </div>
            <div className={styles.modalHeaderItem}>
              <span className={styles.modalHeaderLabel}>CUIT / Condición IVA</span>
              <span className={styles.modalHeaderValue}>
                {selectedFactura?.CUIT || '-'} — {tipoResponsableMap[selectedFactura?.TipoResponsable] || `Resp. Tipo ${selectedFactura?.TipoResponsable || '-'}`}
              </span>
            </div>
            <div className={styles.modalHeaderItem}>
              <span className={styles.modalHeaderLabel}>Fecha Comprobante / Fecha Alta</span>
              <span className={styles.modalHeaderValue}>
                {formatDate(selectedFactura?.FechaComprobante)} / {formatDate(selectedFactura?.Fecha, true)}
              </span>
            </div>
            <div className={styles.modalHeaderItem}>
              <span className={styles.modalHeaderLabel}>Asientos Contables (Ppal / Sec)</span>
              <span className={styles.modalHeaderValue}>
                N° {selectedFactura?.NroAsiento || '-'} / N° {selectedFactura?.NroAsiento2 || '-'}
              </span>
            </div>
            <div className={styles.modalHeaderItem}>
              <span className={styles.modalHeaderLabel}>CAE / Vto. CAE</span>
              <span className={styles.modalHeaderValue}>
                {selectedFactura?.CAE ? `${selectedFactura.CAE} (Vto: ${formatDate(selectedFactura.VtoCAE)})` : 'Sin CAE emitido'}
              </span>
            </div>
            <div className={styles.modalHeaderItem}>
              <span className={styles.modalHeaderLabel}>Comp. Asociado / Origen</span>
              <span className={styles.modalHeaderValue}>
                {selectedFactura?.FacAsoc ? `Asoc: ${selectedFactura.FacAsoc} | ` : ''}Origen: {selectedFactura?.OrigenCbte || '-'}
              </span>
            </div>
            <div className={styles.modalHeaderItem}>
              <span className={styles.modalHeaderLabel}>Usuario Alta</span>
              <span className={styles.modalHeaderValue}>{selectedFactura?.UsuarioAltaRegistro || '-'}</span>
            </div>
            {selectedFactura?.observacion_Afip && (
              <div className={styles.modalHeaderItem}>
                <span className={styles.modalHeaderLabel}>Observación AFIP / ARCA</span>
                <span className={styles.modalHeaderValue}>{selectedFactura.observacion_Afip}</span>
              </div>
            )}
          </div>

          <div className={styles.modalTotalsBar}>
            <div className={styles.modalTotalBadge}>
              <span className={styles.modalHeaderLabel}>Neto Gravado</span>
              <span className={styles.modalHeaderValue}>{formatCurrency(selectedFactura?.Neto)}</span>
            </div>
            <div className={styles.modalTotalBadge}>
              <span className={styles.modalHeaderLabel}>Alícuota IVA Cabecera</span>
              <span className={styles.modalHeaderValue}>{parseFloat(selectedFactura?.PorcentajeIva || 0)}%</span>
            </div>
            <div className={styles.modalTotalBadge}>
              <span className={styles.modalHeaderLabel}>Importe IVA</span>
              <span className={styles.modalHeaderValue}>{formatCurrency(selectedFactura?.Iva)}</span>
            </div>
            <div className={styles.modalTotalBadge}>
              <span className={styles.modalHeaderLabel}>
                Percepción IIBB {selectedFactura?.PorcentajeIIBB ? `(${selectedFactura.PorcentajeIIBB}%)` : ''}
              </span>
              <span className={styles.modalHeaderValue}>{formatCurrency(selectedFactura?.PercepcionIIBB)}</span>
            </div>
            <div className={styles.modalTotalBadge}>
              <span className={styles.modalHeaderLabel}>Total Comprobante</span>
              <span className={styles.modalHeaderValue} style={{ color: '#800020', fontSize: '15px' }}>
                {formatCurrency(selectedFactura?.Importe)}
              </span>
            </div>
          </div>

          {isLoadingDetail ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
              <ClipLoader size={45} color="#800020" loading={true} />
              <span className={styles.loadingText} style={{ marginLeft: 12, marginTop: 0 }}>
                Cargando ítems de la factura...
              </span>
            </div>
          ) : (
            <div style={{ flex: 1, minHeight: 0 }}>
              <DataGrid
                dataSource={facturaItems}
                keyExpr="Id"
                height="100%"
                showBorders={true}
                allowColumnResizing={true}
                columnAutoWidth={true}
                wordWrapEnabled={true}
                rowAlternationEnabled={true}
              >
                <Scrolling mode="standard" />
                <Paging enabled={false} />
                <SearchPanel visible={true} width={240} placeholder="Filtrar concepto o descripción..." />

                <Column dataField="Cantidad" caption="Cant." dataType="number" width={75} alignment="center" />
                <Column dataField="TipoAlicuota" caption="Tipo Alíc." width={85} alignment="center" />
                <Column dataField="Descripcion" caption="Descripción / Concepto Facturado" minWidth={320} />
                <Column dataField="PrecioUnitario" caption="Precio Unit. (Neto)" dataType="number" format="$ #,##0.00" width={150} alignment="right" />
                <Column dataField="ImporteNetoItem" caption="Neto Ítem" dataType="number" format="$ #,##0.00" width={140} alignment="right" />
                <Column dataField="Porcentaje" caption="% IVA" dataType="number" format="#0.## '%'" width={85} alignment="center" />
                <Column dataField="ImporteIvaItem" caption="IVA Ítem ($)" dataType="number" format="$ #,##0.00" width={140} alignment="right" />
                <Column dataField="TotalCalculadoItem" caption="Total c/ IVA" dataType="number" format="$ #,##0.00" width={145} alignment="right" />
                <Column dataField="Subtotal" caption="Subtotal PA7" dataType="number" format="$ #,##0.00" width={140} alignment="right" />

                <Summary>
                  <TotalItem column="Cantidad" summaryType="count" displayFormat="{0} ítems" />
                  <TotalItem column="ImporteNetoItem" summaryType="sum" valueFormat="$ #,##0.00" displayFormat="{0}" />
                  <TotalItem column="ImporteIvaItem" summaryType="sum" valueFormat="$ #,##0.00" displayFormat="{0}" />
                  <TotalItem column="TotalCalculadoItem" summaryType="sum" valueFormat="$ #,##0.00" displayFormat="{0}" />
                  <TotalItem column="Subtotal" summaryType="sum" valueFormat="$ #,##0.00" displayFormat="{0}" />
                </Summary>
              </DataGrid>
            </div>
          )}
        </div>
      </Popup>
    </div>
  );
};

export default ReporteFacturas;
