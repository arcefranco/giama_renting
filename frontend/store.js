import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "@reduxjs/toolkit";
import loginReducer from "./src/reducers/Login/loginSlice";
import generalesReducer from "./src/reducers/Generales/generalesSlice";
import vehiculosReducer from "./src/reducers/Vehiculos/vehiculosSlice";
import clientesReducer from "./src/reducers/Clientes/clientesSlice";

const reducer = combineReducers({
  loginReducer,
  generalesReducer,
  vehiculosReducer,
  clientesReducer,
});
export const store = configureStore({
  reducer: reducer,
});
