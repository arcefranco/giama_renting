import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import usuariosService from "./usuariosService.js";

const initialState = {
  usuarios: [],
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

export const getUsuarios = createAsyncThunk(
  "getUsuarios",
  async (_, { rejectWithValue }) => {
    const result = await usuariosService.getUsuarios();
    if (result.hasOwnProperty("status") && result.status) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const toggleAcceso = createAsyncThunk(
  "toggleAcceso",
  async (id, { rejectWithValue }) => {
    const result = await usuariosService.toggleAcceso(id);
    if (result.hasOwnProperty("status") && result.status) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const updateRoles = createAsyncThunk(
  "updateRoles",
  async (data, { rejectWithValue }) => {
    const result = await usuariosService.updateRoles(data);
    if (result.hasOwnProperty("status") && result.status) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const deleteUsuario = createAsyncThunk(
  "deleteUsuario",
  async (id, { rejectWithValue }) => {
    const result = await usuariosService.deleteUsuario(id);
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
    builder.addCase(getUsuarios.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getUsuarios.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.usuarios = action.payload.data;
    });
    builder.addCase(getUsuarios.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.message = action.payload.message;
    });
    builder.addCase(toggleAcceso.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(toggleAcceso.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.message = action.payload.message;
    });
    builder.addCase(toggleAcceso.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.message = action.payload.message;
    });
    builder.addCase(updateRoles.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(updateRoles.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.message = action.payload.message;
    });
    builder.addCase(updateRoles.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.message = action.payload.message;
    });
    builder.addCase(deleteUsuario.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(deleteUsuario.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.message = action.payload.message;
    });
    builder.addCase(deleteUsuario.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.message = action.payload.message;
    });
  },
});
export const { reset } = usuariosSlice.actions;
export default usuariosSlice.reducer;
