import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { useSelector, useDispatch } from 'react-redux';
import { getClientes } from '../../../reducers/Clientes/clientesSlice';

const FacturaVentaModal = ({ isOpen, onClose, onSubmit }) => {
  const dispatch = useDispatch();
  const { clientes } = useSelector(state => state.clientesReducer);
  
  const [esNuevoCliente, setEsNuevoCliente] = useState(false);
  
  const [formData, setFormData] = useState({
    id_cliente: '',
    importe_neto: '',
    importe_iva: '',
    importe_total: '',
    nuevoCliente: false,
    nombre: '',
    apellido: '',
    razon_social: '',
    tipo_documento: 'CUIT',
    nro_documento: '',
    tipo_contribuyente: '',
    direccion: '',
    nro_direccion: '',
    ciudad: '',
    mail: ''
  });

  useEffect(() => {
    if (isOpen) {
      dispatch(getClientes());
      setEsNuevoCliente(false);
      setFormData({
        id_cliente: '',
        importe_neto: '',
        importe_iva: '',
        importe_total: '',
        nuevoCliente: false,
        nombre: '',
        apellido: '',
        razon_social: '',
        tipo_documento: 'CUIT',
        nro_documento: '',
        tipo_contribuyente: '',
        direccion: '',
        nro_direccion: '',
        ciudad: '',
        mail: ''
      });
    }
  }, [isOpen, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto calcular IVA y total si cambia el neto
      if (name === 'importe_neto' && value) {
        const neto = parseFloat(value);
        const iva = (neto * 0.21).toFixed(2);
        const total = (neto + parseFloat(iva)).toFixed(2);
        newData.importe_iva = iva;
        newData.importe_total = total;
      }
      
      return newData;
    });
  };

  const handleClienteChange = (selectedOption) => {
    setFormData(prev => ({
      ...prev,
      id_cliente: selectedOption ? selectedOption.value : ''
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.importe_neto || !formData.importe_total) {
      alert("Por favor complete los importes");
      return;
    }
    
    if (esNuevoCliente) {
        if (!formData.nro_documento || !formData.tipo_contribuyente || !formData.direccion || (!formData.nombre && !formData.razon_social)) {
            alert("Por favor complete los datos obligatorios del nuevo cliente");
            return;
        }
    } else {
        if (!formData.id_cliente) {
            alert("Por favor seleccione un cliente");
            return;
        }
    }
    
    onSubmit({...formData, nuevoCliente: esNuevoCliente});
  };

  const opcionesClientes = clientes?.map((c) => ({
    label: c.razon_social ? c.razon_social : `${c.nombre} ${c.apellido}`,
    value: c.id
  })) || [];

  if (!isOpen) return null;

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.55)",
          backdropFilter: "blur(3px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
      }}
    >
      <div style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          width: "650px",
          maxWidth: "95vw",
          maxHeight: "90vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column"
      }}>
        <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid #f0f0f0",
            backgroundColor: "#800000",
            borderRadius: "12px 12px 0 0"
        }}>
            <h3 style={{ margin: 0, color: "#fff", fontSize: "17px", fontWeight: 600 }}>
                Facturar Venta de Vehículo
            </h3>
            <button
                type="button"
                onClick={onClose}
                style={{
                    background: "rgba(255,255,255,0.2)",
                    border: "none",
                    borderRadius: "50%",
                    width: "32px", height: "32px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                    fontSize: "18px",
                    color: "#fff",
                    lineHeight: 1,
                    transition: "background 0.2s"
                }}
            >
                &times;
            </button>
        </div>

        <div style={{ padding: "20px" }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                    type="checkbox" 
                    id="nuevoCliente" 
                    checked={esNuevoCliente}
                    onChange={(e) => setEsNuevoCliente(e.target.checked)}
                />
                <label htmlFor="nuevoCliente" style={{ fontWeight: 'bold' }}>Cargar nuevo cliente</label>
            </div>

            {!esNuevoCliente ? (
                <div>
                    <label>Cliente / Comprador:</label>
                    <Select
                        options={opcionesClientes}
                        onChange={handleClienteChange}
                        placeholder="Seleccione un cliente..."
                        isClearable
                    />
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label>Nombre:</label>
                        <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label>Apellido:</label>
                        <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', gridColumn: '1 / -1' }}>
                        <label>Razón Social (Opcional):</label>
                        <input type="text" name="razon_social" value={formData.razon_social} onChange={handleChange} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label>CUIT / DNI:</label>
                        <input type="text" name="nro_documento" value={formData.nro_documento} onChange={handleChange} required={esNuevoCliente} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label>Tipo Responsable:</label>
                        <select name="tipo_contribuyente" value={formData.tipo_contribuyente} onChange={handleChange} required={esNuevoCliente} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', height: '35px' }}>
                            <option value="">Seleccionar...</option>
                            <option value="1">Responsable Inscripto</option>
                            <option value="5">Consumidor Final</option>
                            <option value="4">Monotributista</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label>Dirección:</label>
                        <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} required={esNuevoCliente} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label>Nro:</label>
                        <input type="text" name="nro_direccion" value={formData.nro_direccion} onChange={handleChange} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label>Ciudad:</label>
                        <input type="text" name="ciudad" value={formData.ciudad} onChange={handleChange} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label>Email:</label>
                        <input type="email" name="mail" value={formData.mail} onChange={handleChange} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    </div>
                </div>
            )}
            
            <hr style={{ width: '100%', borderColor: '#eee', margin: '5px 0' }} />

            <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                <label>Importe Neto:</label>
                <input 
                    type="number" 
                    name="importe_neto" 
                    value={formData.importe_neto} 
                    onChange={handleChange} 
                    required 
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                <label>Importe IVA (21%):</label>
                <input 
                    type="number" 
                    name="importe_iva" 
                    value={formData.importe_iva} 
                    onChange={handleChange} 
                    required 
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                <label>Importe Total:</label>
                <input 
                    type="number" 
                    name="importe_total" 
                    value={formData.importe_total} 
                    onChange={handleChange} 
                    required 
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" onClick={onClose} style={{ padding: '8px 15px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}>Cancelar</button>
              <button type="submit" style={{ padding: '8px 15px', backgroundColor: '#800020', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>Confirmar y Facturar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FacturaVentaModal;
