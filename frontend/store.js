import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";
import { persistStore, persistReducer } from "redux-persist";
import loginReducer from "./src/reducers/Login/loginSlice";
import generalesReducer from "./src/reducers/Generales/generalesSlice";
import vehiculosReducer from "./src/reducers/Vehiculos/vehiculosSlice";
import clientesReducer from "./src/reducers/Clientes/clientesSlice";
import costosReducer from "./src/reducers/Costos/costosSlice";
import alquileresReducer from "./src/reducers/Alquileres/alquileresSlice";
import usuariosReducer from "./src/reducers/Usuarios/usuariosSlice";
import recibosReducer from "./src/reducers/Recibos/recibosSlice";
import ingresosReducer from "./src/reducers/Costos/ingresosSlice";
import egresosReducer from "./src/reducers/Costos/egresosSlice";
const loginPersistConfig = {
  key: "login",
  storage,
  whitelist: ["username", "roles", "nombre"], // campos que querés guardar
};
const reducer = combineReducers({
  loginReducer: persistReducer(loginPersistConfig, loginReducer),
  generalesReducer,
  vehiculosReducer,
  ingresosReducer,
  egresosReducer,
  clientesReducer,
  costosReducer,
  alquileresReducer,
  usuariosReducer,
  recibosReducer,
});
export const store = configureStore({
  reducer: reducer,
});
export const persistor = persistStore(store);
