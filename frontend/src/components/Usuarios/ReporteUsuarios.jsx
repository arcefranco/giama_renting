import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataGrid, {
  Column, Export, SearchPanel,
  FilterRow, HeaderFilter, Paging, Pager
} from "devextreme-react/data-grid"
import { getUsuarios, toggleAcceso, reset, updateRoles, deleteUsuario } from '../../reducers/Usuarios/usuariosSlice';
import { getRoles } from '../../reducers/Generales/generalesSlice';
import Select from "react-select";
import { locale } from 'devextreme/localization';
import 'devextreme/dist/css/dx.carmine.css';
import { ClipLoader } from "react-spinners";
import { useToastFeedback } from '../../customHooks/useToastFeedback';
import { ToastContainer } from 'react-toastify';

const EstadoCell = ({ user, onToggleAcceso }) => {
  const [isHovered, setIsHovered] = useState(false);
  const puedeAcceder = user.puede_acceder;
  
  const userRoles = user.roles ? user.roles.toString().split(",") : [];
  const isAdmin = userRoles.includes("1");

  if (isAdmin) {
    return null;
  }

  const backgroundColor = puedeAcceder === 1 
    ? (isHovered ? '#f44336' : '#4caf50')
    : (isHovered ? '#4caf50' : '#f44336');

  const tooltipText = puedeAcceder === 1 ? 'Bloquear' : 'Desbloquear';

  return (
    <div
      style={{
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        backgroundColor: backgroundColor,
        cursor: 'pointer',
        margin: '0 auto',
        transition: 'background-color 0.3s'
      }}
      title={tooltipText}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onToggleAcceso(user.id)}
    />
  );
};

const ReporteUsuarios = () => {
  const dispatch = useDispatch();
  const { usuarios, isLoading, isSuccess, isError, message } = useSelector((state) => state.usuariosReducer);
  const { roles } = useSelector((state) => state.generalesReducer);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    dispatch(getUsuarios());
    dispatch(getRoles());
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

  const handleEditRoles = (user) => {
    setSelectedUser(user);
    const userRolesArr = user.roles ? user.roles.toString().split(",").map(r => r.trim()) : [];
    
    // Map existing user roles to select options
    const options = roles
      .filter(r => userRolesArr.includes(r.id.toString()))
      .map(r => ({ value: r.id, label: r.concepto }));
      
    setSelectedRoles(options);
    setIsModalOpen(true);
  };

  const handleDelete = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!userToDelete) return;
    dispatch(deleteUsuario(userToDelete.id)).then(() => {
      setIsDeleteModalOpen(false);
      dispatch(getUsuarios());
    });
  };

  const saveRoles = () => {
    if (!selectedUser) return;
    const ids = selectedRoles.map(opt => opt.value).join(",");
    dispatch(updateRoles({ id: selectedUser.id, roles: ids })).then(() => {
      setIsModalOpen(false);
      dispatch(getUsuarios());
    });
  };

  const rolesMap = {
    "1": "Admin",
    "2": "Finanzas",
    "3": "Ventas",
    "4": "Administración",
    "5": "General"
  };

  const calculateRolesValue = (rowData) => {
    const userRoles = rowData.roles ? rowData.roles.toString().split(",") : [];
    return userRoles.map(r => rolesMap[r.trim()] || r).join(", ");
  };

  const estadoCellRender = (data) => {
    return <EstadoCell user={data.data} onToggleAcceso={onToggleAcceso} />;
  };

  const accionesCellRender = (data) => {
    const user = data.data;
    const userRoles = user.roles ? user.roles.toString().split(",") : [];
    const isAdmin = userRoles.includes("1");

    return (
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
      
          <button 
            onClick={() => handleEditRoles(user)}
            style={{
              padding: '4px 8px', backgroundColor: '#2196f3', color: 'white',
              border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px'
            }}
            title="Editar Roles"
          >
            <i className="fa-solid fa-pen"></i>
          </button>
        
        {!isAdmin && (
          <button 
            onClick={() => onToggleAcceso(user.id)}
            style={{
              padding: '4px 8px', backgroundColor: user.puede_acceder === 1 ? '#ff9800' : '#4caf50', color: 'white',
              border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px'
            }}
            title={user.puede_acceder === 1 ? 'Bloquear' : 'Desbloquear'}
          >
            <i className={user.puede_acceder === 1 ? "fa-solid fa-lock" : "fa-solid fa-lock-open"}></i>
          </button>
        )}
        {!isAdmin && (
          <button 
            onClick={() => handleDelete(user)}
            style={{
              padding: '4px 8px', backgroundColor: '#f44336', color: 'white',
              border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px'
            }}
            title="Eliminar Usuario"
          >
            <i className="fa-solid fa-trash"></i>
          </button>
        )}
      </div>
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
        <Paging defaultPageSize={15} />
        <Export enabled={true} fileName="Usuarios-giama-renting" />

        <Column dataField="id" caption="ID" width={80} />
        <Column dataField="nombre" caption="Nombre" />
        <Column dataField="email" caption="Email" />
        <Column dataField="roles" caption="Roles" calculateCellValue={calculateRolesValue} />
        <Column
          dataField="puede_acceder"
          caption="Estado"
          cellRender={estadoCellRender}
          width={120}
          alignment="center"
        />
        <Column
          caption="Acciones"
          cellRender={accionesCellRender}
          width={180}
          alignment="center"
        />
      </DataGrid>

      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsModalOpen(false);
        }}>
          <div style={{
            backgroundColor: 'white', padding: '20px', borderRadius: '8px',
            width: '400px', maxWidth: '90%'
          }}>
            <h3 style={{ marginTop: 0 }}>Editar Roles - {selectedUser?.nombre}</h3>
            
            <div style={{ marginBottom: '20px', fontSize: '14px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Roles</label>
              <Select
                isMulti
                options={roles
                  .filter((r) => r.concepto?.trim().toLowerCase() !== "verificador")
                  .map((r) => ({
                  value: r.id,
                  label: r.concepto,
                }))}
                value={selectedRoles}  
                onChange={(selected) => setSelectedRoles(selected)}
              />
            </div>

            {selectedRoles.length > 0 && (
              <div style={{ 
                marginTop: '15px', 
                marginBottom: '20px', 
                backgroundColor: '#f9f9f9', 
                padding: '12px', 
                borderRadius: '6px', 
                border: '1px solid #eee',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#333' }}>Permisos Asignados</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedRoles.map((selectedOpt) => {
                    const roleData = roles.find((r) => r.id === selectedOpt.value);
                    return (
                      <div key={selectedOpt.value} style={{ 
                        backgroundColor: 'white', 
                        padding: '10px', 
                        borderRadius: '4px', 
                        border: '1px solid #e0e0e0' 
                      }}>
                        <span style={{ 
                          display: 'inline-block', 
                          backgroundColor: '#800020', 
                          color: 'white', 
                          padding: '3px 8px', 
                          borderRadius: '12px', 
                          fontSize: '11px', 
                          fontWeight: 'bold', 
                          marginBottom: '5px' 
                        }}>
                          {selectedOpt.label}
                        </span>
                        <p style={{ margin: 0, fontSize: '12px', color: '#555', lineHeight: '1.4' }}>
                          {roleData?.permisos || "Sin permisos detallados especificados."}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{
                  padding: '8px 16px', border: '1px solid #ccc',
                  backgroundColor: '#f5f5f5', borderRadius: '4px', cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button 
                onClick={saveRoles}
                style={{
                  padding: '8px 16px', border: 'none', color: 'white',
                  backgroundColor: '#800020', borderRadius: '4px', cursor: 'pointer'
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsDeleteModalOpen(false);
        }}>
          <div style={{
            backgroundColor: 'white', padding: '20px', borderRadius: '8px',
            width: '400px', maxWidth: '90%', textAlign: 'center'
          }}>
            <h3 style={{ marginTop: 0, color: '#f44336' }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '8px' }}></i>
              Confirmar Eliminación
            </h3>
            
            <p style={{ margin: '20px 0' }}>
              ¿Estás seguro de que deseas eliminar al usuario <strong>{userToDelete?.nombre}</strong>?
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                style={{
                  padding: '8px 20px', border: '1px solid #ccc',
                  backgroundColor: '#f5f5f5', borderRadius: '4px', cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                style={{
                  padding: '8px 20px', border: 'none', color: 'white',
                  backgroundColor: '#f44336', borderRadius: '4px', cursor: 'pointer'
                }}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReporteUsuarios;
