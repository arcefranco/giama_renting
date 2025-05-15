import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import alquileresService from "./alquileresService.js";

const initialState = {
  formasDeCobro: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

export const postFormaCobro = createAsyncThunk(
  "postFormaCobro",
  async (data, { rejectWithValue }) => {
    const result = await alquileresService.postFormaCobro(data);
    if (result.hasOwnProperty("status") && result.status) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);
export const postAlquiler = createAsyncThunk(
  "postAlquiler",
  async (data, { rejectWithValue }) => {
    const result = await alquileresService.postAlquiler(data);
    if (result.hasOwnProperty("status") && result.status) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
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
      state.isSuccess = action.payload.status;
      state.message = action.payload.message;
    });
    builder.addCase(postAlquiler.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = action.payload.status;
      state.message = action.payload.message;
    });
    builder.addCase(postFormaCobro.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(postFormaCobro.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = action.payload.status;
      state.message = action.payload.message;
    });
    builder.addCase(postFormaCobro.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = action.payload.status;
      state.message = action.payload.message;
    });
  },
});
export const { reset } = alquileresSlice.actions;
export default alquileresSlice.reducer;
