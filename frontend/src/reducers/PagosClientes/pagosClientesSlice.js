import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import pagosClientesService from "./pagosClientesService.js";
import { handleAsyncThunk, responses } from "../../helpers/handleAsyncThunk.js";

const initialState = {
  ctacteCliente: [],
  nro_recibo: null,
  ficha: null,
  codigo: null,
  tipo_factura: null,
  cliente_factura: null,
  id_registro: null,
  id_factura: null,
  tipo_deuda: null,
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

export const getEstadoDeuda = createAsyncThunk(
  "getEstadoDeuda",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => pagosClientesService.getEstadoDeuda(data),
      responses.successObject,
      rejectWithValue
    )
);

export const anulacionFactura = createAsyncThunk(
  "anulacionFactura",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => pagosClientesService.anulacionFactura(data),
      responses.successObject,
      rejectWithValue
    )
);

export const anulacionRecibo = createAsyncThunk(
  "anulacionRecibo",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => pagosClientesService.anulacionRecibo(data),
      responses.successObject,
      rejectWithValue
    )
);

export const anulacionDeuda = createAsyncThunk(
  "anulacionDeuda",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => pagosClientesService.anulacionDeuda(data),
      responses.successObject,
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
        ctacteCliente: state.ctacteCliente,
        nro_recibo: null,
        tipo_factura: null,
        cliente_factura: null,
        codigo: null,
        id_registro: null,
        id_factura: null,
        tipo_deuda: null,
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
      state.nro_recibo = action.payload.data;
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
    builder.addCase(getEstadoDeuda.pending, (state) => {
        state.isLoading = true;
    });
    builder.addCase(getEstadoDeuda.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
        state.codigo = action.payload.codigo;
        state.message = action.payload.message;
        state.cliente_factura = action.payload.cliente;
        state.tipo_factura = action.payload.tipo;
        state.id_registro = action.payload.id_registro;
        state.id_factura = action.payload.id_factura;
        state.tipo_deuda = action.payload.tipo_deuda
    });
    builder.addCase(getEstadoDeuda.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.payload.message;
    });
    builder.addCase(anulacionFactura.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(anulacionFactura.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
      state.nro_recibo = action.payload.data;
    });
    builder.addCase(anulacionFactura.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(anulacionRecibo.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(anulacionRecibo.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
      state.nro_recibo = action.payload.data;
    });
    builder.addCase(anulacionRecibo.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(anulacionDeuda.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(anulacionDeuda.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
      state.nro_recibo = action.payload.data;
    });
    builder.addCase(anulacionDeuda.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
  },
});
export const { reset } = pagosClientesSlice.actions;
export default pagosClientesSlice.reducer;