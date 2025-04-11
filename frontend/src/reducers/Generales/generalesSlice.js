import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import generalesService from "./generalesService.js";

const initialState = {
  modelos: [],
  proveedoresGPS: [],
};

export const getModelos = createAsyncThunk(
  "getModelos",
  async (data, { rejectWithValue }) => {
    const result = await generalesService.getModelos();
    if (Array.isArray(result)) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const getProveedoresGPS = createAsyncThunk(
  "getProveedoresGPS",
  async (data, { rejectWithValue }) => {
    const result = await generalesService.getProveedoresGPS();
    if (Array.isArray(result)) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const generalesSlice = createSlice({
  name: "generales",
  initialState,
  reducers: {
    resetGenerales: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
      state.modelos = [];
      state.proveedoresGPS = [];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getModelos.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getModelos.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.modelos = action.payload;
    });
    builder.addCase(getModelos.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.message = action.payload;
      state.modelos = null;
    });
    builder.addCase(getProveedoresGPS.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getProveedoresGPS.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.proveedoresGPS = action.payload;
    });
    builder.addCase(getProveedoresGPS.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.message = action.payload;
      state.proveedoresGPS = null;
    });
  },
});
export const { resetGenerales } = generalesSlice.actions;
export default generalesSlice.reducer;
