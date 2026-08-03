import { giama_renting } from './helpers/connection.js';

async function run() {
  try {
    const res = await giama_renting.query(`
      SELECT v.Dominio, c.id as cliente_id, c.razon_social 
      FROM vehiculos v 
      JOIN contratos_alquiler ca ON v.ID = ca.id_vehiculo 
      JOIN clientes c ON ca.id_cliente = c.id 
      WHERE ca.fecha_hasta IS NULL OR ca.fecha_hasta > NOW()
      LIMIT 100
    `, { type: giama_renting.QueryTypes.SELECT });
    
    const particular = res.find(r => !r.razon_social);
    const empresa = res.find(r => r.razon_social);
    
    console.log("Particular:", particular);
    console.log("Empresa:", empresa);
  } catch(e) {
    console.error(e);
  }
  process.exit();
}
run();
