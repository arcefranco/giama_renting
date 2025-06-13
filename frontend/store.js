import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "@reduxjs/toolkit";
import loginReducer from "./src/reducers/Login/loginSlice";
import generalesReducer from "./src/reducers/Generales/generalesSlice";
import vehiculosReducer from "./src/reducers/Vehiculos/vehiculosSlice";
import clientesReducer from "./src/reducers/Clientes/clientesSlice";
import costosReducer from "./src/reducers/Costos/costosSlice";
import alquileresReducer from "./src/reducers/Alquileres/alquileresSlice";
import usuariosReducer from "./src/reducers/Usuarios/usuariosSlice";

const reducer = combineReducers({
  loginReducer,
  generalesReducer,
  vehiculosReducer,
  clientesReducer,
  costosReducer,
  alquileresReducer,
  usuariosReducer,
});
export const store = configureStore({
  reducer: reducer,
});
