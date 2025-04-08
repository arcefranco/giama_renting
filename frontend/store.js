import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "@reduxjs/toolkit";
import loginReducer from "./src/reducers/Login/loginSlice";

const reducer = combineReducers({
  loginReducer,
});
export const store = configureStore({
  reducer: reducer,
});
