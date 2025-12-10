import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import clientesService from "./clientesService";
import { handleAsyncThunk, responses } from "../../helpers/handleAsyncThunk.js";
const initialState = {
  clientes: [],
  cliente: [],
  datero: [],
  imagenes: [],
  estado_cliente: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

export const postCliente = createAsyncThunk(
  "postCliente",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => clientesService.postCliente(data),
      responses.successObject,
      rejectWithValue
    )
);

export const getClientes = createAsyncThunk(
  "getClientes",
  async (_, { rejectWithValue }) =>
    handleAsyncThunk(
      () => clientesService.getClientes(),
      responses.array,
      rejectWithValue
    )
);

export const getClientesById = createAsyncThunk(
  "getClientessById",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => clientesService.getClientesById(data),
      responses.array,
      rejectWithValue
    )
);

export const getDateroByIdCliente = createAsyncThunk(
  "getDateroByIdCliente",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => clientesService.getDateroByIdCliente(data),
      responses.array,
      rejectWithValue
    )
);

export const postImagenesCliente = createAsyncThunk(
  "postImagenesCliente",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => clientesService.postImagenesCliente(data),
      responses.successObject,
      rejectWithValue
    )
);

export const getImagenesClientes = createAsyncThunk(
  "getImagenesClientes",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => clientesService.getImagenesClientes(data),
      responses.array,
      rejectWithValue
    )
);

export const getEstadoCliente = createAsyncThunk(
  "getEstadoCliente",
  async (data, { rejectWithValue }) => {
    const result = await clientesService.getEstadoCliente(data);
    if (result >= 0) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const eliminarImagenes = createAsyncThunk(
  "eliminarImagenes",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => clientesService.eliminarImagenes(data),
      responses.successObject,
      rejectWithValue
    )
);

export const updateCliente = createAsyncThunk(
  "updateCliente",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => clientesService.updateCliente(data),
      responses.successObject,
      rejectWithValue
    )
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
    resetEstadoCliente: (state) => {
      state.estado_cliente = null;
      state.isError = false;
      state.isSuccess = false;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(postCliente.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(postCliente.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
    });
    builder.addCase(postCliente.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getClientes.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getClientes.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.clientes = action.payload;
    });
    builder.addCase(getClientes.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getClientesById.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getClientesById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.cliente = action.payload;
    });
    builder.addCase(getClientesById.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(postImagenesCliente.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(postImagenesCliente.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
    });
    builder.addCase(postImagenesCliente.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getImagenesClientes.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getImagenesClientes.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.imagenes = action.payload;
    });
    builder.addCase(getImagenesClientes.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getDateroByIdCliente.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getDateroByIdCliente.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.datero = action.payload;
    });
    builder.addCase(getDateroByIdCliente.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getEstadoCliente.pending, (state) => {
      state.isLoading = true;
      state.estado_cliente = null;
    });
    builder.addCase(getEstadoCliente.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.estado_cliente = action.payload;
    });
    builder.addCase(getEstadoCliente.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.estado_cliente = action.payload;
    });
    builder.addCase(eliminarImagenes.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(eliminarImagenes.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
    });
    builder.addCase(eliminarImagenes.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(updateCliente.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(updateCliente.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
    });
    builder.addCase(updateCliente.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
  },
});
export const { reset, resetEstadoCliente } = clientesSlice.actions;
export default clientesSlice.reducer;
