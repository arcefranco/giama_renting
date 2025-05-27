import React from 'react'

const Home = () => {
  const nombre = JSON.parse(localStorage?.getItem("nombre")) ? JSON.parse(localStorage?.getItem("nombre")) : "" // ej: "farce@giama.com.ar"
  return (
    <div>
        <h1>Bienvenido/a {nombre}</h1>
    </div>
  )
}

export default Home