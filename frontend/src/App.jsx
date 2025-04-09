import { useState } from 'react'
import { Routes, Route } from "react-router-dom";
import VehiculosForm from './components/Vehiculos/VehiculosForm';
import Login from './components/Login/Login'
import MainLayout from './layouts/MainLayout';
import Home from './components/Home/Home';
import './App.css'

function App() {


  return (
    <Routes>
      {/* Rutas sin header */}
      <Route path="/" element={<Login />} />

      {/* Rutas con header */}
      <Route element={<MainLayout />}>
        <Route path='/home' element={<Home/>}/>
        <Route path="/vehiculos" element={<VehiculosForm />} />
        {/* Podés agregar más rutas aquí */}
      </Route>
    </Routes>
  );
}

export default App
