import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataGrid, {
  Column, Export, SearchPanel,
  FilterRow, HeaderFilter, Paging, Pager, Button as GridButton
} from "devextreme-react/data-grid";
import { Popup } from 'devextreme-react/popup';
import { getAsientos, getAsientoLineas, reset } from '../../reducers/Auditoria/auditoriaSlice';
import { locale } from 'devextreme/localization';
import 'devextreme/dist/css/dx.carmine.css';
import { ClipLoader } from "react-spinners";
import { useToastFeedback } from '../../customHooks/useToastFeedback';
import { ToastContainer } from 'react-toastify';

const ReporteAsientos = () => {
  const dispatch = useDispatch();
  const { asientos, asientoLineas, isLoading, isSuccess, isError, message } = useSelector((state) => state.auditoriaReducer);
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
    dispatch(getAsientoLineas(rowData.NroAsiento));
    setModalVisible(true);
  };

  return (
    <div style={{ padding: '20px' }}>
      <ToastContainer style={{ zIndex: 99999 }} />
      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px', marginBottom: '20px' }}>
          <ClipLoader size={60} color="#36d7b7" loading={true} />
        </div>
      )}
      <h2>Reporte de Asientos Contables</h2>
      <DataGrid
        dataSource={asientos}
        showBorders={true}
        allowColumnResizing={true}
        columnAutoWidth={true}
        rowAlternationEnabled={true}
        hoverStateEnabled={true}
      >
        <FilterRow visible={true} />
        <HeaderFilter visible={true} />
        <SearchPanel visible={true} width={240} placeholder="Buscar..." />
        <Paging defaultPageSize={20} />
        <Pager
          showPageSizeSelector={true}
          allowedPageSizes={[10, 20, 50]}
          showInfo={true}
        />
        <Export enabled={true} />

        <Column dataField="Fecha" caption="Fecha" dataType="date" format="dd/MM/yyyy" />
        <Column dataField="NroAsiento" caption="N° Asiento" />
        <Column dataField="TipoComprobante" caption="Tipo Comp." />
        <Column dataField="NroComprobante" caption="N° Comprobante" />
        <Column dataField="Concepto" caption="Concepto" />
        <Column dataField="UsuarioAltaRegistro" caption="Usuario" />
        <Column dataField="Total" caption="Importe Total" format="currency" />
        
        <Column type="buttons" caption="Acciones" width={100}>
          <GridButton 
            hint="Ver Detalle del Asiento" 
            icon="textdocument" 
            onClick={onVerAsientoClick} 
          />
        </Column>
      </DataGrid>

      <Popup
        visible={modalVisible}
        onHiding={() => setModalVisible(false)}
        dragEnabled={true}
        hideOnOutsideClick={true}
        showTitle={true}
        title={selectedAsiento ? `Detalle de Asiento N° ${selectedAsiento.NroAsiento}` : "Detalle"}
        width={900}
        height={500}
      >
        <div style={{ marginBottom: '15px' }}>
          <strong>Concepto:</strong> {selectedAsiento?.Concepto} <br/>
          <strong>Comprobante:</strong> {selectedAsiento?.TipoComprobante} {selectedAsiento?.NroComprobante} <br/>
        </div>
        <DataGrid
          dataSource={asientoLineas}
          showBorders={true}
          allowColumnResizing={true}
          columnAutoWidth={true}
          rowAlternationEnabled={true}
        >
          <Column dataField="Cuenta" caption="Cta" width={80} />
          <Column dataField="NombreCuenta" caption="Nombre Cuenta" />
          <Column dataField="Concepto" caption="Detalle / Observación" />
          <Column dataField="DH" caption="D/H" width={60} />
          <Column dataField="Importe" caption="Importe" format="currency" />
        </DataGrid>
      </Popup>
    </div>
  );
};

export default ReporteAsientos;
