import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import clientesService from "./clientesService";

const initialState = {
  clientes: [],
  cliente: [],
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

export const getClientes = createAsyncThunk(
  "getClientes",
  async (data, { rejectWithValue }) => {
    const result = await clientesService.getClientes();
    if (Array.isArray(result)) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const getClientessById = createAsyncThunk(
  "getClientessById",
  async (data, { rejectWithValue }) => {
    const result = await clientesService.getClientesById(data);
    if (Array.isArray(result)) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);
export const eliminarImagenes = createAsyncThunk(
  "eliminarImagenes",
  async (data, { rejectWithValue }) => {
    const result = await clientesService.eliminarImagenes(data);
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
    builder.addCase(getClientes.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getClientes.fulfilled, (state, action) => {
      state.isLoading = false;
      state.clientes = action.payload;
    });
    builder.addCase(getClientes.rejected, (state, action) => {
      state.isLoading = false;
      state.clientes = [];
    });
    builder.addCase(getClientessById.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getClientessById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = action.payload.status;
      state.message = action.payload.message;
      state.cliente = action.payload;
    });
    builder.addCase(getClientessById.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = action.payload.status;
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
  },
});
export const { reset } = clientesSlice.actions;
export default clientesSlice.reducer;
