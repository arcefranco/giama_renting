import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataGrid, {
  Column, Scrolling, Export, SearchPanel,
  FilterRow, HeaderFilter, Paging
} from "devextreme-react/data-grid"
import { getUsuarios, toggleAcceso, reset } from '../../reducers/Usuarios/usuariosSlice';
import { locale } from 'devextreme/localization';
import 'devextreme/dist/css/dx.carmine.css';
import { ClipLoader } from "react-spinners";
import { useToastFeedback } from '../../customHooks/useToastFeedback';
import { ToastContainer } from 'react-toastify';


const ReporteUsuarios = () => {
  const dispatch = useDispatch();
  const { usuarios, isLoading, isSuccess, isError, message } = useSelector((state) => state.usuariosReducer);

  useEffect(() => {
    dispatch(getUsuarios());
    return () => {
      dispatch(reset());
    };
  }, [dispatch]);

  useToastFeedback(isLoading, isSuccess, isError, message, () => {
    dispatch(reset());
  });

  const onToggleAcceso = (id) => {
    dispatch(toggleAcceso(id)).then(() => {
      dispatch(getUsuarios()); // Refresh table after toggle
    });
  };

  const accionCellRender = (data) => {
    const user = data.data;
    const isBlocked = user.puede_acceder === 0;

    return (
      <button
        style={{
          padding: '5px 10px',
          backgroundColor: isBlocked ? '#4caf50' : '#f44336',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
        onClick={() => onToggleAcceso(user.id)}
      >
        {isBlocked ? 'Desbloquear' : 'Bloquear'}
      </button>
    );
  };

  const estadoCellRender = (data) => {
    const puedeAcceder = data.data.puede_acceder;
    return (
      <span style={{ 
        fontWeight: 'bold', 
        color: puedeAcceder === 1 ? 'green' : 'red' 
      }}>
        {puedeAcceder === 1 ? 'Activo' : 'Bloqueado'}
      </span>
    );
  };

  if (isLoading && usuarios.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
        <ClipLoader color="#36d7b7" />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <ToastContainer />
      <h2>Listado de Usuarios</h2>
      <DataGrid
        dataSource={usuarios}
        showBorders={true}
        keyExpr="id"
        hoverStateEnabled={true}
      >
        <FilterRow visible={true} />
        <SearchPanel visible={true} placeholder="Buscar..." />
        <HeaderFilter visible={true} />
        <Scrolling mode="virtual" />
        <Paging defaultPageSize={20} />
        <Export enabled={true} />

        <Column dataField="id" caption="ID" width={80} />
        <Column dataField="nombre" caption="Nombre" />
        <Column dataField="email" caption="Email" />
        <Column dataField="roles" caption="Roles" />
        <Column 
          dataField="puede_acceder" 
          caption="Estado" 
          cellRender={estadoCellRender} 
          width={120} 
          alignment="center"
        />
        <Column 
          caption="Acción" 
          cellRender={accionCellRender} 
          width={150} 
          alignment="center"
        />
      </DataGrid>
    </div>
  );
};

export default ReporteUsuarios;
