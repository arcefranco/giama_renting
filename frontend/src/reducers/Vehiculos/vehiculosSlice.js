import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import vehiculosService from "./vehiculosService.js";
import { handleAsyncThunk, responses } from "../../helpers/handleAsyncThunk.js";
import axios from "axios";
const initialState = {
  vehiculos: [],
  imagenes: [],
  situacionFlota: {},
  fichas: [],
  fichaByIdVehiculo: [],
  fichaCostos: {},
  fichaAlquileres: null,
  fichaAllCostos: null,
  fichaAllAlquileres: null,
  fichaAllAmortizaciones: null,
  amortizacion: null,
  amortizacion_todos_movimientos: null,
  costo_neto_vehiculo: null,
  vehiculo: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

export const getVehiculos = createAsyncThunk(
  "getVehiculos",
  async (_, { rejectWithValue }) =>
    handleAsyncThunk(
      () => vehiculosService.getVehiculos(),
      responses.array,
      rejectWithValue
    )
);

export const getVehiculosById = createAsyncThunk(
  "getVehiculosById",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => vehiculosService.getVehiculosById(data),
      responses.array,
      rejectWithValue
    )
);

export const postVehiculo = createAsyncThunk(
  "postVehiculo",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => vehiculosService.postVehiculo(data),
      responses.successObject,
      rejectWithValue
    )
);

export const updateVehiculo = createAsyncThunk(
  "updateVehiculo",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => vehiculosService.updateVehiculo(data),
      responses.successObject,
      rejectWithValue
    )
);

export const getImagenesVehiculos = createAsyncThunk(
  "getImagenesVehiculos",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => vehiculosService.getImagenesVehiculos(data),
      responses.array,
      rejectWithValue
    )
);

export const eliminarImagenes = createAsyncThunk(
  "eliminarImagenes",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => vehiculosService.eliminarImagenes(data),
      responses.successObject,
      rejectWithValue
    )
);

export const postImagenesVehiculo = createAsyncThunk(
  "postImagenesVehiculo",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => vehiculosService.postImagenesVehiculo(data),
      responses.successObject,
      rejectWithValue
    )
);

export const postVehiculosMasivos = createAsyncThunk(
  "vehiculos/postVehiculosMasivos",
  async (file, { rejectWithValue }) =>
    handleAsyncThunk(
      () => vehiculosService.postVehiculosMasivos(file),
      responses.successObject,
      rejectWithValue
    )
);

export const getCostosPeriodo = createAsyncThunk(
  "getCostosPeriodo",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => vehiculosService.getCostosPeriodo(data),
      responses.object,
      rejectWithValue
    )
);

export const getCostoNetoVehiculo = createAsyncThunk(
  "getCostoNetoVehiculo",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => vehiculosService.getCostoNetoVehiculo(data),
      responses.object,
      rejectWithValue
    )
);

export const getSituacionFlota = createAsyncThunk(
  "getSituacionFlota",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => vehiculosService.getSituacionFlota(data),
      responses.object,
      rejectWithValue
    )
);

export const getAlquileresPeriodo = createAsyncThunk(
  "getAlquileresPeriodo",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => vehiculosService.getAlquileresPeriodo(data),
      responses.array,
      rejectWithValue
    )
);

/* export const getAllCostosPeriodo = createAsyncThunk(
  "getAllCostosPeriodo",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => vehiculosService.getAllCostosPeriodo(data),
      responses.array,
      rejectWithValue
    )
);

export const getAllAlquileresPeriodo = createAsyncThunk(
  "getAllAlquileresPeriodo",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => vehiculosService.getAllAlquileresPeriodo(data),
      responses.array,
      rejectWithValue
    )
); */

export const getAmortizacion = createAsyncThunk(
  "getAmortizacion",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => vehiculosService.getAmortizacion(data),
      responses.object,
      rejectWithValue
    )
);

/* export const getAllAmortizaciones = createAsyncThunk(
  "getAllAmortizaciones",
  async (_, { rejectWithValue }) =>
    handleAsyncThunk(
      () => vehiculosService.getAllAmortizaciones(data),
      responses.array,
      rejectWithValue
    )
); */

export const getFichas = createAsyncThunk(
  "getFichas",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => vehiculosService.getFichas(data),
      responses.array,
      rejectWithValue
    )
);

export const vehiculosSlice = createSlice({
  name: "vehiculos",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
    resetVehiculo: (state) => {
      state.vehiculo = [];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getVehiculos.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getVehiculos.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.vehiculos = action.payload;
    });
    builder.addCase(getVehiculos.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getVehiculosById.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getVehiculosById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.vehiculo = action.payload;
    });
    builder.addCase(getVehiculosById.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(postVehiculo.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(postVehiculo.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
    });
    builder.addCase(postVehiculo.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(postVehiculosMasivos.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(postVehiculosMasivos.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
    });
    builder.addCase(postVehiculosMasivos.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(updateVehiculo.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(updateVehiculo.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
    });
    builder.addCase(updateVehiculo.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getImagenesVehiculos.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getImagenesVehiculos.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.imagenes = action.payload;
    });
    builder.addCase(getImagenesVehiculos.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(eliminarImagenes.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(eliminarImagenes.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
    });
    builder.addCase(eliminarImagenes.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(postImagenesVehiculo.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(postImagenesVehiculo.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
    });
    builder.addCase(postImagenesVehiculo.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getCostosPeriodo.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getCostosPeriodo.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.fichaCostos = action.payload;
    });
    builder.addCase(getCostosPeriodo.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getFichas.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getFichas.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.fichas = action.payload;
    });
    builder.addCase(getFichas.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getCostoNetoVehiculo.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getCostoNetoVehiculo.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.costo_neto_vehiculo = action.payload.costo_neto_total;
    });
    builder.addCase(getCostoNetoVehiculo.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getSituacionFlota.pending, (state) => {
      state.isLoading = true;
      state.isSuccess = false;
      state.isError = false;
    });
    builder.addCase(getSituacionFlota.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.situacionFlota = action.payload;
    });
    builder.addCase(getSituacionFlota.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getAlquileresPeriodo.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getAlquileresPeriodo.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.fichaAlquileres = action.payload;
    });
    builder.addCase(getAlquileresPeriodo.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getAmortizacion.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getAmortizacion.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = action.payload.status;
      state.message = action.payload.message;
      state.amortizacion = action.payload.amortizacion;
      state.amortizacion_todos_movimientos =
        action.payload.amortizacion_todos_movimientos;
    });
    builder.addCase(getAmortizacion.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = action.payload.status;
      state.message = action.payload.message;
      state.amortizacion = null;
    });
  },
});
export const { reset, resetVehiculo } = vehiculosSlice.actions;
export default vehiculosSlice.reducer;
