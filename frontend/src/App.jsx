import { useState } from 'react'
import { Routes, Route } from "react-router-dom";
import VehiculosForm from './components/Vehiculos/VehiculosForm';
import Login from './components/Login/Login'
import './App.css'

function App() {


  return (
    <>
    <Routes>
      <Route path='/' element={<Login/>}/>
      <Route path="/vehiculos" element={<VehiculosForm />} />
    </Routes>

    </>
    
  )
}

export default App
