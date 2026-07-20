import React, { useState } from 'react';
import Select from 'react-select';

const SelectorFlota = ({ opcionesVehiculos, vehiculosFlota, setVehiculosFlota }) => {
  const [selectedOpt, setSelectedOpt] = useState(null);

  const handleAdd = () => {
    if (!selectedOpt) return;
    if (!vehiculosFlota.includes(selectedOpt.value)) {
      setVehiculosFlota([...vehiculosFlota, selectedOpt.value]);
    }
    setSelectedOpt(null);
  };

  const handleRemove = (id) => {
    setVehiculosFlota(vehiculosFlota.filter(v => v !== id));
  };

  return (
    <div style={{ marginTop: '20px', gridColumn: 'span 2' }}>
      <h4 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '16px', fontWeight: 'bold' }}>Administración de Flota</h4>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
        <div style={{ flex: 1 }}>
          <Select
            options={opcionesVehiculos.filter(opt => !vehiculosFlota.includes(opt.value))} // Ocultar los que ya están en la lista
            value={selectedOpt}
            onChange={(opt) => setSelectedOpt(opt)}
            placeholder="Buscar vehículo por patente o modelo..."
            filterOption={(option, inputValue) =>
              option.data.searchKey ? option.data.searchKey.includes(inputValue.toLowerCase()) : option.label.toLowerCase().includes(inputValue.toLowerCase())
            }
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!selectedOpt}
          style={{
            padding: '8px 15px',
            backgroundColor: '#800020',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: selectedOpt ? 'pointer' : 'not-allowed',
            opacity: selectedOpt ? 1 : 0.6,
            fontWeight: 'bold'
          }}
        >
          + Añadir a la Flota
        </button>
      </div>

      {vehiculosFlota.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', border: '1px solid #dee2e6' }}>
          <thead>
            <tr style={{ backgroundColor: '#e9ecef', textAlign: 'left' }}>
              <th style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>Vehículo Seleccionado (Patente - Modelo)</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #dee2e6', width: '80px', textAlign: 'center' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {vehiculosFlota.map(id => {
              const v = opcionesVehiculos.find(opt => opt.value === id);
              return (
                <tr key={id}>
                  <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>{v ? v.label : `ID: ${id}`}</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleRemove(id)}
                      style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', padding: '5px 10px', fontWeight: 'bold' }}
                      title="Quitar de la flota"
                    >
                      X
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      ) : (
        <p style={{ fontSize: '13px', color: '#6c757d', fontStyle: 'italic', margin: 0 }}>
          No hay vehículos agregados a la flota todavía. Buscá uno arriba y hacé clic en "+ Añadir".
        </p>
      )}
    </div>
  );
};

export default SelectorFlota;
