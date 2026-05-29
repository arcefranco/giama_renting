import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import loginService from "./loginService";
import axios from "axios";
import { handleAsyncThunk, responses } from "../../helpers/handleAsyncThunk.js";
const initialState = {
  status: {},
  username: "",
  nombre: "",
  roles: "",
  alertas: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

export const logIn = createAsyncThunk(
  "logIn",
  async (data, { rejectWithValue }) => {
    const result = await loginService.logIn(data);
    if (result.hasOwnProperty("status") && result.status) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const logOut = createAsyncThunk(
  "logOut",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        import.meta.env.VITE_REACT_APP_HOST + "login/logout",
        {},
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(
        error.response?.data || { message: "Error al cerrar sesión" }
      );
    }
  }
);
export const postAlerta = createAsyncThunk(
  "postAlerta",
  async (data, { rejectWithValue }) => 

     await handleAsyncThunk(
      () => loginService.postAlerta(data),
      responses.successObject,
      rejectWithValue
    )
  
);
export const loginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
      state.status = {};
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logIn.pending, (state) => {
      state.isLoading = true;
      state.status = {};
    });
    builder.addCase(logIn.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.status = true;
      state.roles = action.payload.roles;
      state.nombre = action.payload.nombre;
      state.username = action.payload.username;
      state.alertas = action.payload.alertas;
    });
    builder.addCase(logIn.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.status = false;
      state.message = action.payload.message;
    });
    builder.addCase(logOut.fulfilled, (state) => {
      state.status = false;
      state.username = "";
      state.nombre = "";
      state.roles = "";
      state.isError = false;
      state.isSuccess = false;
      state.isLoading = false;
      state.message = "";
    });
    builder.addCase(postAlerta.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(postAlerta.fulfilled, (state, action) => {
      console.log("ESTO ES PAYLOAD: ", action.payload)
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
    });
    builder.addCase(postAlerta.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
  },
});
export const { reset } = loginSlice.actions;
export default loginSlice.reducer;
