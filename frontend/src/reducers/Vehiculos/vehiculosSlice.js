import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import vehiculosService from "./vehiculosService.js";

const initialState = {
  vehiculos: [],
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
  },
});
export const { reset } = vehiculosSlice.actions;
export default vehiculosSlice.reducer;
