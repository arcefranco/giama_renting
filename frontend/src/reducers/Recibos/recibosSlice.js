import { handleAsyncThunk, responses } from "../../helpers/handleAsyncThunk.js";
import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import recibosService from "./recibosService.js";

const initialState = {
  html_recibo_alquiler: null,
  html_recibo_deposito: null,
  html_recibo_ingreso: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

export const getReciboAlquilerById = createAsyncThunk(
  "getReciboAlquilerById",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => recibosService.getReciboById(data),
      responses.object,
      rejectWithValue
    )
);

export const getReciboDepositoById = createAsyncThunk(
  "getReciboDepositoById",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => recibosService.getReciboById(data),
      responses.object,
      rejectWithValue
    )
);

export const getReciboIngresoById = createAsyncThunk(
  "getReciboIngresoById",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => recibosService.getReciboById(data),
      responses.object,
      rejectWithValue
    )
);

export const recibosSlice = createSlice({
  name: "recibos",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
    resetDeposito: (state) => {
      state.html_recibo_deposito = null;
    },
    resetAlquiler: (state) => {
      state.html_recibo_alquiler = null;
    },
    resetIngreso: (state) => {
      state.html_recibo_ingreso = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getReciboAlquilerById.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getReciboAlquilerById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.html_recibo_alquiler = action.payload.data.html;
    });
    builder.addCase(getReciboAlquilerById.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getReciboDepositoById.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getReciboDepositoById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.html_recibo_deposito = action.payload.data.html;
    });
    builder.addCase(getReciboDepositoById.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getReciboIngresoById.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getReciboIngresoById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.html_recibo_ingreso = action.payload.data.html;
    });
    builder.addCase(getReciboIngresoById.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
  },
});
export const { reset, resetAlquiler, resetDeposito, resetIngreso } =
  recibosSlice.actions;
export default recibosSlice.reducer;
