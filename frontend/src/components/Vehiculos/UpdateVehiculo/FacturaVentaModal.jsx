import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { useSelector, useDispatch } from 'react-redux';
import { getClientes } from '../../../reducers/Clientes/clientesSlice';
import { getProvincias } from '../../../reducers/Generales/generalesSlice';

const FacturaVentaModal = ({ isOpen, onClose, onSubmit }) => {
  const dispatch = useDispatch();
  const { clientes } = useSelector(state => state.clientesReducer);
  const { provincias } = useSelector(state => state.generalesReducer);
  
  const [esNuevoCliente, setEsNuevoCliente] = useState(false);
  
  const [formData, setFormData] = useState({
    id_cliente: '',
    importe_neto: '',
    porcentaje_iva: '21',
    importe_iva: '',
    tipo_percepcion: 'ninguna',
    tasa_percepcion: '',
    importe_percepcion: '',
    importe_total: '',
    estado_cobro: 'cobrado', // Nuevo estado
    nuevoCliente: false,
    nombre: '',
    apellido: '',
    razon_social: '',
    tipo_documento: 'CUIT',
    nro_documento: '',
    tipo_contribuyente: '',
    provincia: '',
    direccion: '',
    nro_direccion: '',
    ciudad: '',
    mail: ''
  });

  useEffect(() => {
    if (isOpen) {
      dispatch(getClientes());
      dispatch(getProvincias());
      setEsNuevoCliente(false);
      setFormData({
        id_cliente: '',
        importe_neto: '',
        porcentaje_iva: '21',
        importe_iva: '',
        tipo_percepcion: 'ninguna',
        tasa_percepcion: '',
        importe_percepcion: '',
        importe_total: '',
        estado_cobro: 'cobrado',
        nuevoCliente: false,
        nombre: '',
        apellido: '',
        razon_social: '',
        tipo_documento: 'CUIT',
        nro_documento: '',
        tipo_contribuyente: '',
        provincia: '',
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
      
      const porcIva = parseFloat(newData.porcentaje_iva || 0) / 100;
      const tasaPerc = parseFloat(newData.tasa_percepcion || 0) / 100;
      
      if (name === 'tipo_percepcion' && value === 'ninguna') {
          newData.tasa_percepcion = '';
          newData.importe_percepcion = '';
      }

      const percAmount = name === 'importe_percepcion' ? parseFloat(value || 0) : 
                        (newData.tasa_percepcion ? parseFloat(newData.importe_neto || 0) * tasaPerc : 0);
                        
      if (name !== 'importe_percepcion') {
          newData.importe_percepcion = percAmount > 0 ? percAmount.toFixed(2) : '';
      }

      const perc = parseFloat(newData.importe_percepcion || 0);

      if (name === 'importe_total' && value) {
        const total = parseFloat(value);
        const neto = (total / (1 + porcIva + tasaPerc)).toFixed(2);
        const iva = (neto * porcIva).toFixed(2);
        const calcPerc = (neto * tasaPerc).toFixed(2);
        newData.importe_neto = neto;
        newData.importe_iva = iva;
        newData.importe_percepcion = calcPerc > 0 ? calcPerc : '';
      } 
      else if ((name === 'importe_neto' || name === 'porcentaje_iva' || name === 'tasa_percepcion' || name === 'importe_percepcion')) {
        const neto = parseFloat(newData.importe_neto || 0);
        const iva = (neto * porcIva).toFixed(2);
        const total = (neto + parseFloat(iva) + perc).toFixed(2);
        if (newData.importe_neto) {
            newData.importe_iva = iva;
            newData.importe_total = total;
        }
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
          width: "700px",
          maxWidth: "95vw",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
      }}>
        <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            backgroundColor: "#800000",
            flexShrink: 0
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flexGrow: 1 }}>
          <div style={{ padding: "20px", overflowY: "auto", overflowX: "hidden", flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
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
                        <label>CUIT/CUIL:</label>
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
                        <label>Provincia:</label>
                        <select name="provincia" value={formData.provincia} onChange={handleChange} required={esNuevoCliente} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', height: '35px' }}>
                            <option value="">Seleccionar...</option>
                            {provincias?.length > 0 && provincias.map(prov => (
                                <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                            ))}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label>Estado de la Venta:</label>
                    <select 
                        name="estado_cobro" 
                        value={formData.estado_cobro} 
                        onChange={handleChange} 
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', height: '35px', backgroundColor: '#eef2f5' }}
                    >
                        <option value="cobrado">Vehículo Cobrado</option>
                        <option value="a_cobrar">A Cobrar</option>
                    </select>
                </div>
            </div>

            <hr style={{ width: '100%', borderColor: '#eee', margin: '5px 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label>Alícuota IVA:</label>
                <select 
                    name="porcentaje_iva" 
                    value={formData.porcentaje_iva} 
                    onChange={handleChange} 
                    required 
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', height: '35px' }}
                >
                    <option value="21">21%</option>
                    <option value="10.5">10.5%</option>
                    <option value="0">Exento (0%)</option>
                </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label>Importe IVA:</label>
                <input 
                    type="number" 
                    name="importe_iva" 
                    value={formData.importe_iva} 
                    onChange={handleChange} 
                    required 
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label>Tipo Percepción:</label>
                <select 
                    name="tipo_percepcion" 
                    value={formData.tipo_percepcion} 
                    onChange={handleChange} 
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', height: '35px', backgroundColor: '#eef2f5' }}
                >
                    <option value="ninguna">Ninguna</option>
                    <option value="iibb">IIBB</option>
                    <option value="iibb_caba">IIBB CABA</option>
                    <option value="iva">IVA</option>
                </select>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label>Tasa Perc. (%):</label>
                <input 
                    type="number" 
                    name="tasa_percepcion" 
                    value={formData.tasa_percepcion} 
                    onChange={handleChange} 
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} 
                    disabled={formData.tipo_percepcion === 'ninguna'}
                />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label>Imp. Percepción:</label>
                <input 
                    type="number" 
                    name="importe_percepcion" 
                    value={formData.importe_percepcion} 
                    onChange={handleChange} 
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} 
                    disabled={formData.tipo_percepcion === 'ninguna'}
                />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
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
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '15px 20px', borderTop: '1px solid #eee', backgroundColor: '#fafafa', flexShrink: 0 }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 15px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', fontWeight: '500' }}>Cancelar</button>
            <button type="submit" style={{ padding: '8px 15px', backgroundColor: '#800020', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: '500' }}>Confirmar y Facturar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FacturaVentaModal;
