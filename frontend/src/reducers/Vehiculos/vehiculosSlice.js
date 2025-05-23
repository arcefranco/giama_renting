import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import vehiculosService from "./vehiculosService.js";

const initialState = {
  vehiculos: [],
  fichaCostos: null,
  fichaAlquileres: null,
  vehiculo: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

export const getVehiculos = createAsyncThunk(
  "getVehiculos",
  async (data, { rejectWithValue }) => {
    const result = await vehiculosService.getVehiculos();
    if (Array.isArray(result)) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const getVehiculosById = createAsyncThunk(
  "getVehiculosById",
  async (data, { rejectWithValue }) => {
    const result = await vehiculosService.getVehiculosById(data);
    if (Array.isArray(result)) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const postVehiculo = createAsyncThunk(
  "postVehiculo",
  async (data, { rejectWithValue }) => {
    const result = await vehiculosService.postVehiculo(data);
    if (result.hasOwnProperty("status") && result.status) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const updateVehiculo = createAsyncThunk(
  "updateVehiculo",
  async (data, { rejectWithValue }) => {
    const result = await vehiculosService.updateVehiculo(data);
    if (result.hasOwnProperty("status") && result.status) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const eliminarImagenes = createAsyncThunk(
  "eliminarImagenes",
  async (data, { rejectWithValue }) => {
    const result = await vehiculosService.eliminarImagenes(data);
    if (result.hasOwnProperty("status") && result.status) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const getCostosPeriodo = createAsyncThunk(
  "getCostosPeriodo",
  async (data, { rejectWithValue }) => {
    const result = await vehiculosService.getCostosPeriodo(data);
    if (Array.isArray(result)) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const getAlquileresPeriodo = createAsyncThunk(
  "getAlquileresPeriodo",
  async (data, { rejectWithValue }) => {
    const result = await vehiculosService.getAlquileresPeriodo(data);
    if (Array.isArray(result)) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
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
  },
  extraReducers: (builder) => {
    builder.addCase(getVehiculos.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getVehiculos.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = action.payload.status;
      state.message = action.payload.message;
      state.vehiculos = action.payload;
    });
    builder.addCase(getVehiculos.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = action.payload.status;
      state.message = action.payload.message;
    });
    builder.addCase(getVehiculosById.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getVehiculosById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = action.payload.status;
      state.message = action.payload.message;
      state.vehiculo = action.payload;
    });
    builder.addCase(getVehiculosById.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = action.payload.status;
      state.message = action.payload.message;
    });
    builder.addCase(postVehiculo.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(postVehiculo.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = action.payload.status;
      state.message = action.payload.message;
    });
    builder.addCase(postVehiculo.rejected, (state, action) => {
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
      state.isError = false;
      state.isSuccess = action.payload.status;
      state.message = action.payload.message;
    });
    builder.addCase(updateVehiculo.rejected, (state, action) => {
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
      state.isError = false;
      state.isSuccess = action.payload.status;
      state.message = action.payload.message;
    });
    builder.addCase(eliminarImagenes.rejected, (state, action) => {
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
      state.isSuccess = action.payload.status;
      state.message = action.payload.message;
      state.fichaCostos = action.payload;
    });
    builder.addCase(getCostosPeriodo.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = action.payload.status;
      state.message = action.payload.message;
    });
    builder.addCase(getAlquileresPeriodo.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getAlquileresPeriodo.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = action.payload.status;
      state.message = action.payload.message;
      state.fichaAlquileres = action.payload;
    });
    builder.addCase(getAlquileresPeriodo.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = action.payload.status;
      state.message = action.payload.message;
    });
  },
});
export const { reset } = vehiculosSlice.actions;
export default vehiculosSlice.reducer;
