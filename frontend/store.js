import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "@reduxjs/toolkit";
import loginReducer from "./src/reducers/Login/loginSlice";
import generalesReducer from "./src/reducers/Generales/generalesSlice";
import vehiculosReducer from "./src/reducers/Vehiculos/vehiculosSlice";
import clientesReducer from "./src/reducers/Clientes/clientesSlice";
import costosReducer from "./src/reducers/Costos/costosSlice";
import alquileresReducer from "./src/reducers/Alquileres/alquileresSlice";

const reducer = combineReducers({
  loginReducer,
  generalesReducer,
  vehiculosReducer,
  clientesReducer,
  costosReducer,
  alquileresReducer,
});
export const store = configureStore({
  reducer: reducer,
});
