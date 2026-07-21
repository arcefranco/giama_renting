import axios from 'axios';
axios.post('http://localhost:3001/ctacte/ctaCteCliente', { id_cliente: 179 })
  .then(res => {
    console.log("Keys:", Object.keys(res.data));
    console.log("Data:", res.data.length ? "Array of " + res.data.length : res.data);
  })
  .catch(err => console.log(err.message));
