import { Sequelize } from 'sequelize';

const giama_renting = new Sequelize('giama_renting', 'dev', 'giamaDev!321', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
});

const pa7_giama_renting = new Sequelize('pa7_giama_renting', 'dev', 'giamaDev!321', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
});

async function run() {
  try {
    const result1 = await pa7_giama_renting.query('SELECT * FROM facturas WHERE Id = 10 AND PuntoVenta = 3');
    console.log('Factura PA7:', result1[0]);

    const result2 = await giama_renting.query('SELECT * FROM c_movimientos WHERE nro_asiento = 29971');
    console.log('Asiento:', result2[0]);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
run();
