import React from 'react'
import { useSelector } from 'react-redux'
const Home = () => {
  const {roles, nombre, username} = useSelector((state) => state.loginReducer)
  
  return (
    <div>
        <h1>Bienvenido/a {nombre} {"(testing)"}</h1>
    </div>
  )
}

export default Home