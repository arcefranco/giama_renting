import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import clientesService from "./clientesService";

const initialState = {
  clientes: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

export const postCliente = createAsyncThunk(
  "postCliente",
  async (data, { rejectWithValue }) => {
    const result = await clientesService.postCliente(data);
    if (result.hasOwnProperty("status") && result.status) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const clientesSlice = createSlice({
  name: "clientes",
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
    builder.addCase(postCliente.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(postCliente.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = action.payload.status;
      state.message = action.payload.message;
    });
    builder.addCase(postCliente.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = action.payload.status;
      state.message = action.payload.message;
    });
  },
});
export const { reset } = clientesSlice.actions;
export default clientesSlice.reducer;
