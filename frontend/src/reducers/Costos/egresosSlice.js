import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import costosService from "./costosService.js";
import { handleAsyncThunk, responses } from "../../helpers/handleAsyncThunk.js";

const initialState = {
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

export const postCostos_Ingresos = createAsyncThunk(
  "postCostos_Ingresos",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => costosService.postCostos_Ingresos(data),
      responses.successObject,
      rejectWithValue
    )
);

export const egresosSlice = createSlice({
  name: "egresos",
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
    builder.addCase(postCostos_Ingresos.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(postCostos_Ingresos.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
    });
    builder.addCase(postCostos_Ingresos.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
  },
});
export const { reset } = egresosSlice.actions;
export default egresosSlice.reducer;
