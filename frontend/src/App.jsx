import { useState } from 'react'
import { Routes, Route } from "react-router-dom";
import VehiculosForm from './components/Vehiculos/VehiculosForm';
import Login from './components/Login/Login'
import MainLayout from './layouts/MainLayout';
import Home from './components/Home/Home';
import ProtectedRoute from './ProtectedRoute';
import './App.css'

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
    </Route>
  </Route>
    </Routes>
  );
}

export default App
