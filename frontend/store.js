import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "@reduxjs/toolkit";
import loginReducer from "./src/reducers/Login/loginSlice";
import generalesReducer from "./src/reducers/Generales/generalesSlice";
import vehiculosReducer from "./src/reducers/Vehiculos/vehiculosSlice";

const reducer = combineReducers({
  loginReducer,
  generalesReducer,
  vehiculosReducer,
});
export const store = configureStore({
  reducer: reducer,
});
