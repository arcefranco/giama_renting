import { giama_renting } from './backend/helpers/connection.js';
import { QueryTypes } from 'sequelize';
giama_renting.query('SELECT id, deposito_garantia, garantia_devuelta FROM contratos_alquiler WHERE deposito_garantia > 0 LIMIT 10', { type: QueryTypes.SELECT })
  .then(res => { console.log(res); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
