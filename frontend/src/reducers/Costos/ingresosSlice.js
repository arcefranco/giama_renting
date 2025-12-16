import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import costosService from "./costosService.js";
import { handleAsyncThunk, responses } from "../../helpers/handleAsyncThunk.js";

const initialState = {
  nro_recibo_ingreso: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

export const postCostos_Ingresos = createAsyncThunk(
  "postCostos_Ingresos",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => costosService.postCostos_Ingresos(data),
      responses.successObject,
      rejectWithValue
    )
);

export const postCostos_Ingresos_2 = createAsyncThunk(
  "postCostos_Ingresos_2",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => costosService.postCostos_Ingresos_2(data),
      responses.successObject,
      rejectWithValue
    )
);

export const ingresosSlice = createSlice({
  name: "ingresos",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
    reset_nro_recibo_ingreso: (state) => {
      state.nro_recibo_ingreso = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(postCostos_Ingresos.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(postCostos_Ingresos.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.nro_recibo_ingreso = action.payload.nro_recibo_ingreso ? action.payload.nro_recibo_ingreso : null;
      state.message = action.payload.message;
    });
    builder.addCase(postCostos_Ingresos.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(postCostos_Ingresos_2.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(postCostos_Ingresos_2.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.nro_recibo_ingreso = action.payload.nro_recibo_ingreso ? action.payload.nro_recibo_ingreso : null;
      state.message = action.payload.message;
    });
    builder.addCase(postCostos_Ingresos_2.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
  },
});
export const { reset, reset_nro_recibo_ingreso } = ingresosSlice.actions;
export default ingresosSlice.reducer;
