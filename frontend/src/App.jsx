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

function App() {


  return (
    <Routes>
      {/* Rutas sin header */}
      <Route path="/" element={<Login />} />

      {/* Rutas con header y protección */}
      
  <Route element={<ProtectedRoute />}>
    <Route element={<MainLayout />}>
    <Route path="/home" element={<Home />} />
    <Route path="/vehiculos" element={<VehiculosForm />} />
    <Route path="/vehiculosReporte" element={<ReporteVehiculos />} />
    <Route path='/vehiculos/imagenes/:id' element={<ImagenesVehiculo/>}/>
    <Route path='/vehiculos/actualizar/:id' element={<UpdateVehiculo/>}/>
    <Route path="/clientes" element={<ClientesForm/>}/>
    <Route path='/clientesReporte' element={<ReporteClientes/>}/>
    </Route>
  </Route>
    </Routes>
  );
}

export default App
