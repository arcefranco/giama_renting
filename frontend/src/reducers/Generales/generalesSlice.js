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
  sucursales: [],
  preciosModelos: [],
  estados: [],
  AMRT: null,
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

export const getSucursales = createAsyncThunk(
  "getSucursales",
  async (data, { rejectWithValue }) => {
    const result = await generalesService.getSucursales();
    if (Array.isArray(result)) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const getPreciosModelos = createAsyncThunk(
  "getPreciosModelos",
  async (data, { rejectWithValue }) => {
    const result = await generalesService.getPreciosModelos();
    if (Array.isArray(result)) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const getEstados = createAsyncThunk(
  "getEstados",
  async (data, { rejectWithValue }) => {
    const result = await generalesService.getEstados();
    if (Array.isArray(result)) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const getParametroAMRT = createAsyncThunk(
  "getParametroAMRT",
  async (data, { rejectWithValue }) => {
    const result = await generalesService.getParametroAMRT();
    console.log(result);
    if (result.hasOwnProperty("AMRT")) {
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
    builder.addCase(getSucursales.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getSucursales.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.sucursales = action.payload;
    });
    builder.addCase(getSucursales.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.message = action.payload;
      state.sucursales = null;
    });
    builder.addCase(getPreciosModelos.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getPreciosModelos.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.preciosModelos = action.payload;
    });
    builder.addCase(getPreciosModelos.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.message = action.payload;
      state.preciosModelos = null;
    });
    builder.addCase(getEstados.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getEstados.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.estados = action.payload;
    });
    builder.addCase(getEstados.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.message = action.payload;
      state.estados = null;
    });
    builder.addCase(getParametroAMRT.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getParametroAMRT.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.AMRT = action.payload.AMRT;
    });
    builder.addCase(getParametroAMRT.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.message = action.payload;
      state.AMRT = null;
    });
  },
});
export const { resetGenerales } = generalesSlice.actions;
export default generalesSlice.reducer;
