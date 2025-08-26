import { useState } from 'react'
import { Routes, Route } from "react-router-dom";
import VehiculosForm from './components/Vehiculos/VehiculosForm';
import Login from './components/Login/Login'
import MainLayout from './layouts/MainLayout';
import Home from './components/Home/Home';
import ProtectedRoute from './ProtectedRoute';
import ReporteVehiculos from './components/Vehiculos/ReporteVehiculos';
import ImagenesVehiculo from './components/Vehiculos/ImagenesVehiculo';
import UpdateVehiculo from './components/Vehiculos/UpdateVehiculo/UpdateVehiculo';
import './App.css'
import ClientesForm from './components/Clientes/ClientesForm';
import ReporteClientes from './components/Clientes/ReporteClientes';
import ImagenesClientes from './components/Clientes/ImagenesClientes';
import UpdateCliente from './components/Clientes/UpdateCliente';
import AltaCostos from './components/Costos/AltaCostos';
import UpdateConcepto from './components/Costos/UpdateConcepto';
import IngresosEgresos from './components/Costos/IngresosEgresos';
import FormasDeCobro from './components/Alquileres/FormasDeCobro/FormasDeCobro';
import AlquileresForm from './components/Alquileres/AlquileresForm/AlquileresForm';
import ProrrateoIE from './components/Costos/ProrrateoIE';
import FichaVehiculo from './components/Vehiculos/FichaVehiculo/FichaVehiculo';
import ReporteFichasVehiculos from './components/Vehiculos/FichaVehiculo/ReporteFichasVehiculos';
import ReporteAlquileres from './components/Alquileres/ReporteAlquileres/ReporteAlquileres';
/* import UpdateAlquiler from './components/Alquileres/UpdateAlquiler/UpdateAlquiler'; */
import AltaUsuario from './components/Usuarios/AltaUsuario/AltaUsuario';
import AltaPassword from './components/Usuarios/Password/AltaPassword';
import RecoveryPass from './components/Usuarios/Password/RecoveryPass';
import ContratoAlquiler from './components/Alquileres/ContratoAlquiler/ContratoAlquiler';
import ReporteContratos from './components/Alquileres/ReporteContratos/ReporteContratos';
import SituacionFlota from './components/Vehiculos/SituacionFlota/SituacionFlota';
import ImportacionMasiva from './components/Vehiculos/ImportacionMasiva';
function App() {


  return (
    <Routes>
      {/* Rutas sin header */}
      <Route path="/" element={<Login />} />
      <Route path="/password/:token" element={<AltaPassword />} />  
      <Route path="/recovery" element={<RecoveryPass />} />    
      {/* Rutas con header y protección */}
      
  <Route element={<ProtectedRoute />}>
    <Route element={<MainLayout />}>
    <Route path="/home" element={<Home />} />
    <Route path='/usuarios/alta' element={<AltaUsuario/>}/>
    <Route path="/vehiculos" element={<VehiculosForm />} />
    <Route path="/vehiculosReporte" element={<ReporteVehiculos />} />
    <Route path='/vehiculos/imagenes/:id' element={<ImagenesVehiculo/>}/>
    <Route path='/vehiculos/actualizar/:id' element={<UpdateVehiculo/>}/>
    <Route path='/vehiculos/ficha/:id' element={<FichaVehiculo/>}/>
    <Route path='/vehiculos/ficha/:id/:anio/:mes' element={<FichaVehiculo/>}/>
    <Route path='/vehiculos/ficha/reporte' element={<ReporteFichasVehiculos/>}/>
    <Route path="/vehiculos/situacionFlota" element={<SituacionFlota/>}/>
    <Route path="/vehiculos/importacionMasiva" element={<ImportacionMasiva/>}/>
    <Route path="/clientes" element={<ClientesForm/>}/>
    <Route path='/clientesReporte' element={<ReporteClientes/>}/>
    <Route path='/clientes/imagenes/:id' element={<ImagenesClientes/>}/>
    <Route path='/clientes/actualizar/:id' element={<UpdateCliente/>}/>
    <Route path='/costos/alta' element={<AltaCostos/>}/>
    <Route path='/costos/conceptos/:id' element={<UpdateConcepto/>}/>
    <Route path='/costos/ingresos_egresos/:id' element={<IngresosEgresos/>}/>
    <Route path='/costos/ingresos_egresos' element={<IngresosEgresos/>}/>
    <Route path='/costos/prorrateoIE' element={<ProrrateoIE/>}/>
    <Route path='/alquileres/contrato' element={<ContratoAlquiler/>}/>   
    <Route path='/contrato/actualizar/:id' element={<ContratoAlquiler/>}/>
    <Route path='/alquileres/:idContrato'element={<AlquileresForm key={location.pathname}/>}/>
    <Route path='/alquileres/formasDeCobro' element={<FormasDeCobro/>}/>
    <Route path='/alquileres/reporte' element={<ReporteAlquileres/>}/>
    <Route path='/alquileres/contrato/reporte' element={<ReporteContratos/>}/>
    </Route>
  </Route>
    </Routes>
  );
}

export default App
