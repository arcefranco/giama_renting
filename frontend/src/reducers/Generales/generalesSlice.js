import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import generalesService from "./generalesService.js";

const initialState = {
  modelos: [],
  proveedoresGPS: [],
  provincias: [],
  tipos_documento: [],
  tipos_responsable: [],
  tipos_sexo: [],
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

export const getProvincias = createAsyncThunk(
  "getProvincias",
  async (data, { rejectWithValue }) => {
    const result = await generalesService.getProvincias();
    if (Array.isArray(result)) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const getTiposDocumento = createAsyncThunk(
  "getTiposDocumento",
  async (data, { rejectWithValue }) => {
    const result = await generalesService.getTiposDocumento();
    if (Array.isArray(result)) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const getTiposResponsable = createAsyncThunk(
  "getTiposResponsable",
  async (data, { rejectWithValue }) => {
    const result = await generalesService.getTiposResponsable();
    if (Array.isArray(result)) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const getTiposSexo = createAsyncThunk(
  "getTiposSexo",
  async (data, { rejectWithValue }) => {
    const result = await generalesService.getTiposSexo();
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
      state.provincias = [];
      state.tipos_documento = [];
      state.tipos_responsable = [];
      state.tipos_sexo = [];
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
    builder.addCase(getProvincias.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getProvincias.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.provincias = action.payload;
    });
    builder.addCase(getProvincias.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.message = action.payload;
      state.provincias = null;
    });
    builder.addCase(getTiposDocumento.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getTiposDocumento.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.tipos_documento = action.payload;
    });
    builder.addCase(getTiposDocumento.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.message = action.payload;
      state.tipos_documento = null;
    });
    builder.addCase(getTiposResponsable.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getTiposResponsable.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.tipos_responsable = action.payload;
    });
    builder.addCase(getTiposResponsable.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.message = action.payload;
      state.tipos_responsable = null;
    });
    builder.addCase(getTiposSexo.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getTiposSexo.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.tipos_sexo = action.payload;
    });
    builder.addCase(getTiposSexo.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.message = action.payload;
      state.tipos_sexo = null;
    });
  },
});
export const { resetGenerales } = generalesSlice.actions;
export default generalesSlice.reducer;
