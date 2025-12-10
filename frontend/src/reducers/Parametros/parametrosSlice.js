import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import parametrosService from "./parametrosService.js";
import { handleAsyncThunk, responses } from "../../helpers/handleAsyncThunk.js";

const initialState = {
  modelos: [],
  modeloById: null,
  sucursalById: null,
  proveedorGPSById: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

export const postModelo = createAsyncThunk(
  "postModelo",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => parametrosService.postModelo(data),
      responses.successObject,
      rejectWithValue
    )
);

export const postProveedorGPS = createAsyncThunk(
  "postProveedorGPS",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => parametrosService.postProveedorGPS(data),
      responses.successObject,
      rejectWithValue
    )
);

export const postSucursal = createAsyncThunk(
  "postSucursal",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => parametrosService.postSucursal(data),
      responses.successObject,
      rejectWithValue
    )
);

export const updateModelo = createAsyncThunk(
  "updateModelo",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => parametrosService.updateModelo(data),
      responses.successObject,
      rejectWithValue
    )
);

export const updateProveedorGPS = createAsyncThunk(
  "updateProveedorGPS",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => parametrosService.updateProveedorGPS(data),
      responses.successObject,
      rejectWithValue
    )
);

export const updateSucursal = createAsyncThunk(
  "updateSucursal",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => parametrosService.updateSucursal(data),
      responses.successObject,
      rejectWithValue
    )
);

export const deleteModelo = createAsyncThunk(
  "deleteModelo",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => parametrosService.deleteModelo(data),
      responses.successObject,
      rejectWithValue
    )
);

export const deleteProveedorGPS = createAsyncThunk(
  "deleteProveedorGPS",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => parametrosService.deleteProveedorGPS(data),
      responses.successObject,
      rejectWithValue
    )
);

export const deleteSucursal = createAsyncThunk(
  "deleteSucursal",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => parametrosService.deleteSucursal(data),
      responses.successObject,
      rejectWithValue
    )
);

export const getModelosVehiculos = createAsyncThunk(
  "getModelosVehiculos",
  async (_, { rejectWithValue }) =>
    handleAsyncThunk(
      () => parametrosService.getModelosVehiculos(),
      responses.array,
      rejectWithValue
    )
);

export const getModeloById = createAsyncThunk(
  "getModeloById",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => parametrosService.getModeloById(data),
      responses.array,
      rejectWithValue
    )
);

export const getSucursalById = createAsyncThunk(
  "getSucursalById",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => parametrosService.getSucursalById(data),
      responses.array,
      rejectWithValue
    )
);

export const getProveedorGPSById = createAsyncThunk(
  "getProveedorGPSById",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => parametrosService.getProveedorGPSById(data),
      responses.array,
      rejectWithValue
    )
);

export const parametrosSlice = createSlice({
  name: "parametros",
  initialState,
  reducers: {
    reset: () => ({ ...initialState }),
  },
  extraReducers: (builder) => {
    builder.addCase(postModelo.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(postModelo.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
    });
    builder.addCase(postModelo.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(postSucursal.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(postSucursal.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
    });
    builder.addCase(postSucursal.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(postProveedorGPS.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(postProveedorGPS.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
    });
    builder.addCase(postProveedorGPS.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(updateModelo.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(updateModelo.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
    });
    builder.addCase(updateModelo.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(updateSucursal.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(updateSucursal.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
    });
    builder.addCase(updateSucursal.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(updateProveedorGPS.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(updateProveedorGPS.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
    });
    builder.addCase(updateProveedorGPS.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(deleteModelo.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(deleteModelo.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
    });
    builder.addCase(deleteModelo.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(deleteSucursal.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(deleteSucursal.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
    });
    builder.addCase(deleteSucursal.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(deleteProveedorGPS.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(deleteProveedorGPS.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
    });
    builder.addCase(deleteProveedorGPS.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getModelosVehiculos.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getModelosVehiculos.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.modelos = action.payload;
    });
    builder.addCase(getModelosVehiculos.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getModeloById.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getModeloById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.modeloById = action.payload;
    });
    builder.addCase(getModeloById.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getSucursalById.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getSucursalById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.sucursalById = action.payload;
    });
    builder.addCase(getSucursalById.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getProveedorGPSById.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getProveedorGPSById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.proveedorGPSById = action.payload;
    });
    builder.addCase(getProveedorGPSById.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
  },
});
export const { reset, reset_nro_recibo } = parametrosSlice.actions;
export default parametrosSlice.reducer;
