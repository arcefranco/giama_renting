import { useState } from 'react'
import { Routes, Route } from "react-router-dom";
import VehiculosForm from '../components/Vehiculos/VehiculosForm';
import './App.css'

function App() {


  return (
    <>
    <Routes>
      <Route path="/vehiculos" element={<VehiculosForm />} />
    </Routes>

    </>
    
  )
}

export default App
