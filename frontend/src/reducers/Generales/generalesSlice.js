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
  plan_cuentas: [],
  proveedores: [],
  proveedores_vehiculo: [],
  AMRT: null,
};

export const getModelos = createAsyncThunk(
  "getModelos",
  async (_, { rejectWithValue }) => {
    const result = await generalesService.getModelos();
    return result.status ? result.data : rejectWithValue(result);
  }
);

export const getProveedoresGPS = createAsyncThunk(
  "getProveedoresGPS",
  async (_, { rejectWithValue }) => {
    const result = await generalesService.getProveedoresGPS();
    return result.status ? result.data : rejectWithValue(result);
  }
);

export const getProvincias = createAsyncThunk(
  "getProvincias",
  async (_, { rejectWithValue }) => {
    const result = await generalesService.getProvincias();
    return result.status ? result.data : rejectWithValue(result);
  }
);

export const getTiposDocumento = createAsyncThunk(
  "getTiposDocumento",
  async (_, { rejectWithValue }) => {
    const result = await generalesService.getTiposDocumento();
    return result.status ? result.data : rejectWithValue(result);
  }
);

export const getTiposResponsable = createAsyncThunk(
  "getTiposResponsable",
  async (_, { rejectWithValue }) => {
    const result = await generalesService.getTiposResponsable();
    return result.status ? result.data : rejectWithValue(result);
  }
);

export const getTiposSexo = createAsyncThunk(
  "getTiposSexo",
  async (_, { rejectWithValue }) => {
    const result = await generalesService.getTiposSexo();
    return result.status ? result.data : rejectWithValue(result);
  }
);

export const getSucursales = createAsyncThunk(
  "getSucursales",
  async (_, { rejectWithValue }) => {
    const result = await generalesService.getSucursales();
    return result.status ? result.data : rejectWithValue(result);
  }
);

export const getPreciosModelos = createAsyncThunk(
  "getPreciosModelos",
  async (_, { rejectWithValue }) => {
    const result = await generalesService.getPreciosModelos();
    return result.status ? result.data : rejectWithValue(result);
  }
);

export const getEstados = createAsyncThunk(
  "getEstados",
  async (_, { rejectWithValue }) => {
    const result = await generalesService.getEstados();
    return result.status ? result.data : rejectWithValue(result);
  }
);

export const getPlanCuentas = createAsyncThunk(
  "getPlanCuentas",
  async (_, { rejectWithValue }) => {
    const result = await generalesService.getPlanCuentas();
    return result.status ? result.data : rejectWithValue(result);
  }
);

export const getProveedores = createAsyncThunk(
  "getProveedores",
  async (_, { rejectWithValue }) => {
    const result = await generalesService.getProveedores();
    return result.status ? result.data : rejectWithValue(result);
  }
);

export const getProveedoresVehiculo = createAsyncThunk(
  "getProveedoresVehiculo",
  async (_, { rejectWithValue }) => {
    const result = await generalesService.getProveedoresVehiculo();
    return result.status ? result.data : rejectWithValue(result);
  }
);

export const getParametroAMRT = createAsyncThunk(
  "getParametroAMRT",
  async (_, { rejectWithValue }) => {
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
      state.isError = false;
      state.message = "";
      state.modelos = action.payload;
    });
    builder.addCase(getModelos.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getProveedoresGPS.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getProveedoresGPS.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.proveedoresGPS = action.payload;
    });
    builder.addCase(getProveedoresGPS.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getProvincias.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getProvincias.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.provincias = action.payload;
    });
    builder.addCase(getProvincias.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getTiposDocumento.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getTiposDocumento.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.tipos_documento = action.payload;
    });
    builder.addCase(getTiposDocumento.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getTiposResponsable.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getTiposResponsable.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.tipos_responsable = action.payload;
    });
    builder.addCase(getTiposResponsable.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getTiposSexo.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getTiposSexo.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.tipos_sexo = action.payload;
    });
    builder.addCase(getTiposSexo.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getSucursales.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getSucursales.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.sucursales = action.payload;
    });
    builder.addCase(getSucursales.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getPreciosModelos.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getPreciosModelos.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.preciosModelos = action.payload;
    });
    builder.addCase(getPreciosModelos.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getEstados.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getEstados.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.estados = action.payload;
    });
    builder.addCase(getEstados.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getPlanCuentas.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getPlanCuentas.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.plan_cuentas = action.payload;
    });
    builder.addCase(getPlanCuentas.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getProveedores.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getProveedores.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.proveedores = action.payload;
    });
    builder.addCase(getProveedores.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getProveedoresVehiculo.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getProveedoresVehiculo.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.proveedores_vehiculo = action.payload;
    });
    builder.addCase(getProveedoresVehiculo.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
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
