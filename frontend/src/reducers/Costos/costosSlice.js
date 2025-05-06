import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import costosService from "./costosService.js";

const initialState = {
  cuentasContables: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

export const getCuentasContables = createAsyncThunk(
  "getCuentasContables",
  async (data, { rejectWithValue }) => {
    const result = await costosService.getCuentasContables();
    if (Array.isArray(result)) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const postConceptoCostos = createAsyncThunk(
  "postConceptoCostos",
  async (data, { rejectWithValue }) => {
    const result = await costosService.postConceptoCostos(data);
    if (result.hasOwnProperty("status") && result.status) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const costosSlice = createSlice({
  name: "costos",
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
    builder.addCase(getCuentasContables.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getCuentasContables.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = action.payload.status;
      state.message = action.payload.message;
      state.cuentasContables = action.payload;
    });
    builder.addCase(getCuentasContables.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = action.payload.status;
      state.message = action.payload.message;
    });
    builder.addCase(postConceptoCostos.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(postConceptoCostos.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = action.payload.status;
      state.message = action.payload.message;
    });
    builder.addCase(postConceptoCostos.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
  },
});
export const { reset } = costosSlice.actions;
export default costosSlice.reducer;
