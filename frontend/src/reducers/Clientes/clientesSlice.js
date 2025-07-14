import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import clientesService from "./clientesService";

const initialState = {
  clientes: [],
  cliente: [],
  datero: [],
  estado_cliente: null,
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

export const getClientesById = createAsyncThunk(
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

export const getDateroByIdCliente = createAsyncThunk(
  "getDateroByIdCliente",
  async (data, { rejectWithValue }) => {
    const result = await clientesService.getDateroByIdCliente(data);
    if (Array.isArray(result)) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
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
  async (data, { rejectWithValue }) => {
    const result = await clientesService.eliminarImagenes(data);
    if (result.hasOwnProperty("status") && result.status) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const updateCliente = createAsyncThunk(
  "updateCliente",
  async (data, { rejectWithValue }) => {
    const result = await clientesService.updateCliente(data);
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
    resetEstadoCliente: () => {
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
      state.isSuccess = false;
      state.isError = true;
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
    builder.addCase(getClientesById.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getClientesById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = action.payload.status;
      state.message = action.payload.message;
      state.cliente = action.payload;
    });
    builder.addCase(getClientesById.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = action.payload.status;
      state.message = action.payload.message;
    });
    builder.addCase(getDateroByIdCliente.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getDateroByIdCliente.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
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
    builder.addCase(updateCliente.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(updateCliente.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = action.payload.status;
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
