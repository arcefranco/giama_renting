import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataGrid, {
  Column, Export, SearchPanel,
  FilterRow, HeaderFilter, Paging, Pager, Button as GridButton
} from "devextreme-react/data-grid";
import { Popup } from 'devextreme-react/popup';
import { getFacturas, getFacturaItems, reset } from '../../reducers/Auditoria/auditoriaSlice';
import { locale } from 'devextreme/localization';
import 'devextreme/dist/css/dx.carmine.css';
import { ClipLoader } from "react-spinners";
import { useToastFeedback } from '../../customHooks/useToastFeedback';
import { ToastContainer } from 'react-toastify';

const ReporteFacturas = () => {
  const dispatch = useDispatch();
  const { facturas, facturaItems, isLoading, isSuccess, isError, message } = useSelector((state) => state.auditoriaReducer);
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

  return (
    <div style={{ padding: '20px' }}>
      <ToastContainer style={{ zIndex: 99999 }} />
      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px', marginBottom: '20px' }}>
          <ClipLoader size={60} color="#36d7b7" loading={true} />
        </div>
      )}
      <h2>Reporte de Facturas (Auditoría)</h2>
      <DataGrid
        dataSource={facturas}
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

        <Column dataField="ID" caption="ID" width={80} />
        <Column dataField="Fecha" caption="Fecha" dataType="date" format="dd/MM/yyyy HH:mm" />
        <Column dataField="NroAsiento" caption="N° Asiento" />
        <Column dataField="TipoComprobante" caption="Tipo Comp." />
        <Column dataField="NroComprobante" caption="N° Comprobante" />
        <Column dataField="Importe" caption="Importe" format="currency" />
        <Column dataField="UsuarioAltaRegistro" caption="Usuario" />
        
        <Column type="buttons" caption="Acciones" width={100}>
          <GridButton 
            hint="Ver Detalle de Factura" 
            icon="textdocument" 
            onClick={onVerFacturaClick} 
          />
        </Column>
      </DataGrid>

      <Popup
        visible={modalVisible}
        onHiding={() => setModalVisible(false)}
        dragEnabled={true}
        hideOnOutsideClick={true}
        showTitle={true}
        title={selectedFactura ? `Detalle de Factura ${selectedFactura.TipoComprobante} N° ${selectedFactura.NroComprobante}` : "Detalle"}
        width={900}
        height={500}
      >
        <div style={{ marginBottom: '15px' }}>
          <strong>Cliente:</strong> {selectedFactura?.NombreCliente} (Cód: {selectedFactura?.CodigoCliente}) <br/>
          <strong>Neto:</strong> $ {selectedFactura?.Neto} | <strong>IVA:</strong> $ {selectedFactura?.Iva} | <strong>Total:</strong> $ {selectedFactura?.Importe} <br/>
        </div>
        <DataGrid
          dataSource={facturaItems}
          showBorders={true}
          allowColumnResizing={true}
          columnAutoWidth={true}
          rowAlternationEnabled={true}
        >
          <Column dataField="Cantidad" caption="Cant." width={70} />
          <Column dataField="Descripcion" caption="Descripción" />
          <Column dataField="PrecioUnitario" caption="Precio Unit." format="currency" width={100} />
          <Column dataField="Porcentaje" caption="% IVA" width={70} />
          <Column dataField="Subtotal" caption="Subtotal" format="currency" width={100} />
        </DataGrid>
      </Popup>
    </div>
  );
};

export default ReporteFacturas;
