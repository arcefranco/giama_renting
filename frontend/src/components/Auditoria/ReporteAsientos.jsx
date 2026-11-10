import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataGrid, {
  Column, Export, SearchPanel,
  FilterRow, HeaderFilter, Paging, Pager,
  Scrolling, Summary, TotalItem, Button as GridButton
} from "devextreme-react/data-grid";
import { Popup } from 'devextreme-react/popup';
import { getAsientos, getAsientoLineas, reset, clearAsientoLineas } from '../../reducers/Auditoria/auditoriaSlice';
import 'devextreme/dist/css/dx.carmine.css';
import { ClipLoader } from "react-spinners";
import { useToastFeedback } from '../../customHooks/useToastFeedback';
import { ToastContainer } from 'react-toastify';
import styles from './Auditoria.module.css';

const formatCurrency = (val) => {
  const num = parseFloat(val || 0);
  return num.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });
};

const formatDate = (val) => {
  if (!val) return '-';
  const date = new Date(val);
  if (isNaN(date.getTime())) return val;
  return date.toLocaleDateString('es-AR');
};

const ReporteAsientos = () => {
  const dispatch = useDispatch();
  const { asientos, asientoLineas, isLoading, isLoadingDetail, isSuccess, isError, message } = useSelector((state) => state.auditoriaReducer);
  const { token } = useSelector((state) => state.loginReducer);

  const [modalVisible, setModalVisible] = React.useState(false);
  const [selectedAsiento, setSelectedAsiento] = React.useState(null);

  useEffect(() => {
    dispatch(getAsientos(token));
    return () => {
      dispatch(reset());
    };
  }, [dispatch, token]);

  useToastFeedback(isLoading, isSuccess, isError, message, () => {
    dispatch(reset());
  });

  const onVerAsientoClick = (e) => {
    const rowData = e.row.data;
    setSelectedAsiento(rowData);
    dispatch(getAsientoLineas({ nroAsiento: rowData.NroAsiento, fecha: rowData.FechaStr }));
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    dispatch(clearAsientoLineas());
  };

  const renderDiferenciaCell = (cellData) => {
    const diff = parseFloat(cellData.value || 0);
    if (Math.abs(diff) < 0.01) {
      return <span className={styles.badgeOk}>Balanceado</span>;
    }
    return <span className={styles.badgeWarn}>Dif: {formatCurrency(diff)}</span>;
  };

  const renderRowStyle = (e) => {
    if (e.rowType === 'data') {
      const esIva =
        e.data?.CodigoEspecial === 'IVDF' ||
        e.data?.CodigoEspecial === 'IVCF' ||
        (e.data?.NombreCuenta && e.data.NombreCuenta.toUpperCase().includes('IVA'));
      if (esIva) {
        e.rowElement.style.backgroundColor = '#fffbeb';
        e.rowElement.style.fontWeight = '600';
      }
    }
  };

  return (
    <div className={styles.container}>
      <ToastContainer style={{ zIndex: 99999 }} />
      {isLoading && (
        <div className={styles.spinnerOverlay}>
          <ClipLoader size={60} color="#800020" loading={true} />
          <span className={styles.loadingText}>Cargando asientos...</span>
        </div>
      )}
      <h2>Reporte de Asientos Contables</h2>
      <DataGrid
        dataSource={asientos}
        keyExpr="AsientoKey"
        showBorders={true}
        allowColumnResizing={true}
        columnAutoWidth={true}
        wordWrapEnabled={true}
        rowAlternationEnabled={true}
        hoverStateEnabled={true}
      >
        <FilterRow visible={true} />
        <HeaderFilter visible={true} />
        <SearchPanel visible={true} width={260} placeholder="Buscar asiento, comprobante, concepto..." />
        <Paging defaultPageSize={20} />
        <Pager
          showPageSizeSelector={true}
          allowedPageSizes={[10, 20, 50, 100]}
          showInfo={true}
        />
        <Export enabled={true} />

        <Column dataField="Fecha" caption="Fecha" dataType="date" format="dd/MM/yyyy" width={105} />
        <Column dataField="NroAsiento" caption="N° Asiento" width={105} alignment="center" />
        <Column dataField="TipoComprobante" caption="Tipo Comp." width={95} alignment="center" />
        <Column dataField="NroComprobante" caption="N° Comprobante" width={150} />
        <Column dataField="Concepto" caption="Concepto" minWidth={260} />
        <Column dataField="TotalIva" caption="IVA en Asiento" dataType="number" format="$ #,##0.00" width={135} />
        <Column dataField="TotalDebe" caption="Total Debe" dataType="number" format="$ #,##0.00" width={140} />
        <Column dataField="TotalHaber" caption="Total Haber" dataType="number" format="$ #,##0.00" width={140} />
        <Column dataField="UsuarioAltaRegistro" caption="Usuario" width={140} />

        <Column type="buttons" caption="Acciones" width={90}>
          <GridButton
            hint="Ver Detalle del Asiento"
            icon="textdocument"
            onClick={onVerAsientoClick}
          />
        </Column>

        <Summary>
          <TotalItem column="NroAsiento" summaryType="count" displayFormat="{0} asientos" />
          <TotalItem column="TotalIva" summaryType="sum" valueFormat="$ #,##0.00" displayFormat="IVA: {0}" />
          <TotalItem column="TotalDebe" summaryType="sum" valueFormat="$ #,##0.00" displayFormat="Debe: {0}" />
          <TotalItem column="TotalHaber" summaryType="sum" valueFormat="$ #,##0.00" displayFormat="Haber: {0}" />
        </Summary>
      </DataGrid>

      <Popup
        visible={modalVisible}
        onHiding={handleCloseModal}
        dragEnabled={true}
        hideOnOutsideClick={true}
        showTitle={true}
        title={
          selectedAsiento
            ? `Detalle de Asiento Contable N° ${selectedAsiento.NroAsiento}${selectedAsiento.AsientoSecundario ? ` (Asiento Sec. N° ${selectedAsiento.AsientoSecundario})` : ''}`
            : "Detalle de Asiento"
        }
        width="92%"
        maxWidth={1450}
        minWidth={1050}
        height="85vh"
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className={styles.modalHeaderGrid}>
            <div className={styles.modalHeaderItem}>
              <span className={styles.modalHeaderLabel}>Fecha</span>
              <span className={styles.modalHeaderValue}>{formatDate(selectedAsiento?.Fecha)}</span>
            </div>
            <div className={styles.modalHeaderItem}>
              <span className={styles.modalHeaderLabel}>Comprobante</span>
              <span className={styles.modalHeaderValue}>
                {selectedAsiento?.TipoComprobante || '-'} {selectedAsiento?.NroComprobante || ''}
              </span>
            </div>
            <div className={styles.modalHeaderItem}>
              <span className={styles.modalHeaderLabel}>N° Asiento Principal / Secundario</span>
              <span className={styles.modalHeaderValue}>
                {selectedAsiento?.NroAsiento} / {selectedAsiento?.AsientoSecundario || '-'}
              </span>
            </div>
            <div className={styles.modalHeaderItem}>
              <span className={styles.modalHeaderLabel}>Usuario Alta</span>
              <span className={styles.modalHeaderValue}>{selectedAsiento?.UsuarioAltaRegistro || '-'}</span>
            </div>
            <div className={styles.modalHeaderItem} style={{ gridColumn: '1 / -1' }}>
              <span className={styles.modalHeaderLabel}>Concepto Principal</span>
              <span className={styles.modalHeaderValue}>{selectedAsiento?.Concepto || '-'}</span>
            </div>
          </div>

          <div className={styles.modalTotalsBar}>
            <div className={styles.modalTotalBadge}>
              <span className={styles.modalHeaderLabel}>Total Debe</span>
              <span className={styles.modalHeaderValue}>{formatCurrency(selectedAsiento?.TotalDebe)}</span>
            </div>
            <div className={styles.modalTotalBadge}>
              <span className={styles.modalHeaderLabel}>Total Haber</span>
              <span className={styles.modalHeaderValue}>{formatCurrency(selectedAsiento?.TotalHaber)}</span>
            </div>
            <div className={styles.modalTotalBadge}>
              <span className={styles.modalHeaderLabel}>IVA en Asiento</span>
              <span className={styles.modalHeaderValue}>{formatCurrency(selectedAsiento?.TotalIva)}</span>
            </div>

          </div>

          {isLoadingDetail ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
              <ClipLoader size={45} color="#800020" loading={true} />
              <span className={styles.loadingText} style={{ marginLeft: 12, marginTop: 0 }}>
                Cargando líneas del asiento...
              </span>
            </div>
          ) : (
            <div style={{ flex: 1, minHeight: 0 }}>
              <DataGrid
                dataSource={asientoLineas}
                keyExpr="ID"
                height="100%"
                showBorders={true}
                allowColumnResizing={true}
                columnAutoWidth={true}
                wordWrapEnabled={true}
                rowAlternationEnabled={true}
                onRowPrepared={renderRowStyle}
              >
                <Scrolling mode="standard" />
                <Paging enabled={false} />
                <SearchPanel visible={true} width={240} placeholder="Filtrar cuenta o detalle..." />

                <Column dataField="Cuenta" caption="Cuenta" width={95} alignment="center" />
                <Column dataField="CuentaSecundaria" caption="Cta. Sec." width={90} alignment="center" />
                <Column dataField="Rubro" caption="Rubro" width={75} alignment="center" />
                <Column dataField="NombreCuenta" caption="Nombre Cuenta" minWidth={200} />
                <Column dataField="CodigoEspecial" caption="Cód. Esp." width={85} alignment="center" />
                <Column dataField="TipoComprobante" caption="Tipo" width={70} alignment="center" />
                <Column dataField="NroComprobante" caption="Comprobante" width={130} />
                <Column dataField="Concepto" caption="Detalle / Observación" minWidth={280} />
                <Column dataField="DH" caption="D/H" width={60} alignment="center" />
                <Column dataField="Debe" caption="Debe" dataType="number" format="$ #,##0.00" width={140} alignment="right" />
                <Column dataField="Haber" caption="Haber" dataType="number" format="$ #,##0.00" width={140} alignment="right" />

                <Summary>
                  <TotalItem column="Cuenta" summaryType="count" displayFormat="{0} líneas" />
                  <TotalItem column="Debe" summaryType="sum" valueFormat="$ #,##0.00" displayFormat="{0}" />
                  <TotalItem column="Haber" summaryType="sum" valueFormat="$ #,##0.00" displayFormat="{0}" />
                </Summary>
              </DataGrid>
            </div>
          )}
        </div>
      </Popup>
    </div>
  );
};

export default ReporteAsientos;
