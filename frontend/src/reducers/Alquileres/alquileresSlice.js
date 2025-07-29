import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import alquileresService from "./alquileresService.js";
import { handleAsyncThunk, responses } from "../../helpers/handleAsyncThunk.js";

const initialState = {
  formasDeCobro: [],
  alquileresVehiculo: [],
  alquileres: [],
  contratos: [],
  alquilerByIdContrato: [],
  contratoById: [],
  contratosVehiculo: [],
  anulaciones: [],
  nro_recibo_alquiler: null,
  nro_recibo_deposito: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

export const postFormaCobro = createAsyncThunk(
  "postFormaCobro",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => alquileresService.postFormaCobro(data),
      responses.successObject,
      rejectWithValue
    )
);
export const postAlquiler = createAsyncThunk(
  "postAlquiler",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => alquileresService.postAlquiler(data),
      responses.successObject,
      rejectWithValue
    )
);

export const postContratoAlquiler = createAsyncThunk(
  "postContratoAlquiler",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => alquileresService.postContratoAlquiler(data),
      responses.successObject,
      rejectWithValue
    )
);

export const anulacionAlquiler = createAsyncThunk(
  "anulacionAlquiler",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => alquileresService.anulacionAlquiler(data),
      responses.successObject,
      rejectWithValue
    )
);

export const anulacionContrato = createAsyncThunk(
  "anulacionContrato",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => alquileresService.anulacionContrato(data),
      responses.successObject,
      rejectWithValue
    )
);

export const getFormasDeCobro = createAsyncThunk(
  "getFormasDeCobro",
  async (_, { rejectWithValue }) =>
    handleAsyncThunk(
      () => alquileresService.getFormasDeCobro(),
      responses.array,
      rejectWithValue
    )
);
export const getAlquileresByIdVehiculo = createAsyncThunk(
  "getAlquileresByIdVehiculo",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => alquileresService.getAlquileresByIdVehiculo(data),
      responses.array,
      rejectWithValue
    )
);

export const getContratosByIdVehiculo = createAsyncThunk(
  "getContratosByIdVehiculo",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => alquileresService.getContratosByIdVehiculo(data),
      responses.array,
      rejectWithValue
    )
);

export const getAlquilerByIdContrato = createAsyncThunk(
  "getAlquilerByIdContrato",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => alquileresService.getAlquilerByIdContrato(data),
      responses.array,
      rejectWithValue
    )
);

export const getContratoById = createAsyncThunk(
  "getContratoById",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => alquileresService.getContratoById(data),
      responses.array,
      rejectWithValue
    )
);

export const getAlquileres = createAsyncThunk(
  "getAlquileres",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => alquileresService.getAlquileres(data),
      responses.array,
      rejectWithValue
    )
);

export const getContratos = createAsyncThunk(
  "getContratos",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => alquileresService.getContratos(data),
      responses.array,
      rejectWithValue
    )
);

export const getAnulaciones = createAsyncThunk(
  "getAnulaciones",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => alquileresService.getAnulaciones(data),
      responses.array,
      rejectWithValue
    )
);
export const alquileresSlice = createSlice({
  name: "alquileres",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder.addCase(postAlquiler.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(postAlquiler.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
    });
    builder.addCase(postAlquiler.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(postContratoAlquiler.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(postContratoAlquiler.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.nro_recibo_alquiler = action.payload.nro_recibo_alquiler;
      state.nro_recibo_deposito = action.payload.nro_recibo_deposito;
      state.message = action.payload.message;
    });
    builder.addCase(postContratoAlquiler.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(anulacionAlquiler.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(anulacionAlquiler.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
    });
    builder.addCase(anulacionAlquiler.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(anulacionContrato.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(anulacionContrato.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
    });
    builder.addCase(anulacionContrato.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(postFormaCobro.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(postFormaCobro.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
    });
    builder.addCase(postFormaCobro.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getFormasDeCobro.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getFormasDeCobro.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.formasDeCobro = action.payload;
    });
    builder.addCase(getFormasDeCobro.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getAlquileresByIdVehiculo.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getAlquileresByIdVehiculo.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.alquileresVehiculo = action.payload;
    });
    builder.addCase(getAlquileresByIdVehiculo.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getContratosByIdVehiculo.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getContratosByIdVehiculo.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.contratosVehiculo = action.payload;
    });
    builder.addCase(getContratosByIdVehiculo.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getAlquilerByIdContrato.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getAlquilerByIdContrato.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.alquilerByIdContrato = action.payload;
    });
    builder.addCase(getAlquilerByIdContrato.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getContratoById.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getContratoById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.contratoById = action.payload;
    });
    builder.addCase(getContratoById.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getAlquileres.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getAlquileres.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.alquileres = action.payload;
    });
    builder.addCase(getAlquileres.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getContratos.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getContratos.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.contratos = action.payload;
    });
    builder.addCase(getContratos.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getAnulaciones.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getAnulaciones.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.anulaciones = action.payload;
    });
    builder.addCase(getAnulaciones.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
  },
});
export const { reset } = alquileresSlice.actions;
export default alquileresSlice.reducer;
