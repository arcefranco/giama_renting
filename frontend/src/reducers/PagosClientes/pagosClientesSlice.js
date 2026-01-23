import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import pagosClientesService from "./pagosClientesService.js";
import { handleAsyncThunk, responses } from "../../helpers/handleAsyncThunk.js";

const initialState = {
  ctacteCliente: [],
  ficha: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

export const postPago = createAsyncThunk(
  "postPago",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => pagosClientesService.postPago(data),
      responses.successObject,
      rejectWithValue
    )
);
export const ctacteCliente = createAsyncThunk(
  "ctacteCliente",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => pagosClientesService.ctacteCliente(data),
      responses.array,
      rejectWithValue
    )
);

export const fichaCtaCte = createAsyncThunk(
  "fichaCtaCte",
  async (_, { rejectWithValue }) =>
    handleAsyncThunk(
      () => pagosClientesService.fichaCtaCte(),
      responses.object,
      rejectWithValue
    )
);

export const pagosClientesSlice = createSlice({
  name: "pagosClientes",
  initialState,
  reducers: {
    reset: (state) => ({ 
        isError: false,
        isSuccess: false,
        isLoading: false,
        message: "",
        ctacteCliente: state.ctacteCliente
     }),

  },
  extraReducers: (builder) => {
    builder.addCase(postPago.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(postPago.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
    });
    builder.addCase(postPago.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(ctacteCliente.pending, (state) => {
        state.isLoading = true;
    });
    builder.addCase(ctacteCliente.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
        state.message = "";
        state.ctacteCliente = action.payload;
    });
    builder.addCase(ctacteCliente.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.payload.message;
    });
    builder.addCase(fichaCtaCte.pending, (state) => {
        state.isLoading = true;
    });
    builder.addCase(fichaCtaCte.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
        state.message = "";
        state.ficha = action.payload;
    });
    builder.addCase(fichaCtaCte.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.payload.message;
    });
  },
});
export const { reset } = pagosClientesSlice.actions;
export default pagosClientesSlice.reducer;