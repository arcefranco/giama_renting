import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import usuariosService from "./usuariosService.js";

const initialState = {
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

export const createUsuario = createAsyncThunk(
  "createUsuario",
  async (data, { rejectWithValue }) => {
    const result = await usuariosService.createUsuario(data);
    if (result.hasOwnProperty("status") && result.status) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const createPass = createAsyncThunk(
  "createPass",
  async (data, { rejectWithValue }) => {
    const result = await usuariosService.createPass(data);
    if (result.hasOwnProperty("status") && result.status) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const recoveryPass = createAsyncThunk(
  "recoveryPass",
  async (data, { rejectWithValue }) => {
    const result = await usuariosService.recoveryPass(data);
    if (result.hasOwnProperty("status") && result.status) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const usuariosSlice = createSlice({
  name: "usuarios",
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
    builder.addCase(createUsuario.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(createUsuario.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
    });
    builder.addCase(createUsuario.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.message = action.payload.message;
      state.isSuccess = false;
    });

    builder.addCase(createPass.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(createPass.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
    });
    builder.addCase(createPass.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.message = action.payload.message;
      state.isSuccess = false;
    });
    builder.addCase(recoveryPass.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(recoveryPass.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
    });
    builder.addCase(recoveryPass.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.message = action.payload.message;
      state.isSuccess = false;
    });
  },
});
export const { reset } = usuariosSlice.actions;
export default usuariosSlice.reducer;
