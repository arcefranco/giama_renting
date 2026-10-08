import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getValoresModelos, postValoresModelos } from '../../../reducers/Alquileres/alquileresSlice';
import { toast } from 'react-toastify';
import ClipLoader from "react-spinners/ClipLoader";

const ValoresModelosModal = ({ visible, onClose }) => {
  const dispatch = useDispatch();
  const { valoresModelos, isLoading } = useSelector((state) => state.alquileresReducer);
  const [modelosEditables, setModelosEditables] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (visible) {
      dispatch(getValoresModelos());
    }
  }, [visible, dispatch]);

  useEffect(() => {
    if (valoresModelos && valoresModelos.length > 0) {
      // Clona para poder editar locales sin mutar redux
      setModelosEditables(valoresModelos.map(m => ({ ...m })));
    }
  }, [valoresModelos]);

  if (!visible) return null;

  const handleInputChange = (id_modelo, value) => {
    setModelosEditables(prev => prev.map(m => 
      m.id_modelo === id_modelo ? { ...m, valor: value } : m
    ));
  };

  const handleSave = async (id_modelo, valor) => {
    if (!valor || isNaN(valor) || valor < 0) {
      toast.warning("Ingrese un valor válido");
      return;
    }

    try {
      const result = await dispatch(postValoresModelos({ id_modelo, valor })).unwrap();
      if (result.status) {
        toast.success("Valor actualizado correctamente");
        dispatch(getValoresModelos()); // Refresca lista
      } else {
        toast.error(result.message || "Error al actualizar valor");
      }
    } catch (error) {
      toast.error(error.message || "Error de red");
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '8px',
        width: '90%', maxWidth: '800px', height: '80vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        position: 'relative'
      }}>
        {isLoading && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 1100,
            display: 'flex', justifyContent: 'center', alignItems: 'center'
          }}>
            <ClipLoader size={50} color="#800020" />
          </div>
        )}
        
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>Configuración de Valores por Modelo</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer', color: '#999' }}>&times;</button>
        </div>

        {/* Buscador */}
        <div style={{ padding: '16px 24px 0 24px' }}>
          <input 
            type="text" 
            placeholder="Buscar modelo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              boxSizing: 'border-box',
              padding: '10px 15px', 
              borderRadius: '6px', 
              border: '1px solid #d9d9d9',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        {/* Tabla */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 10, borderBottom: '2px solid #e8e8e8' }}>
              <tr>
                <th style={{ padding: '12px 8px' }}>Modelo de Vehículo</th>
                <th style={{ padding: '12px 8px', width: '200px' }}>Valor de Alquiler ($)</th>
                <th style={{ padding: '12px 8px', width: '100px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {modelosEditables
                .filter(row => String(row.modelo_nombre || '').toLowerCase().includes(String(searchTerm || '').toLowerCase().trim()))
                .map((row) => (
                <tr key={row.id_modelo} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 8px', fontWeight: '500' }}>
                    {row.modelo_nombre}
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <input
                      type="number"
                      step="0.01"
                      value={row.valor || ""}
                      onChange={(e) => handleInputChange(row.id_modelo, e.target.value)}
                      placeholder="0.00"
                      style={{ 
                        width: '100%', 
                        boxSizing: 'border-box',
                        padding: '6px', 
                        border: '1px solid #d9d9d9', 
                        borderRadius: '4px' 
                      }}
                    />
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleSave(row.id_modelo, row.valor)}
                      style={{
                        backgroundColor: '#800020', color: '#fff', border: 'none',
                        padding: '6px 14px', borderRadius: '4px', cursor: 'pointer',
                        fontSize: '13px', fontWeight: 'bold'
                      }}
                    >
                      Guardar
                    </button>
                  </td>
                </tr>
              ))}
              {modelosEditables.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    No se encontraron modelos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ValoresModelosModal;
