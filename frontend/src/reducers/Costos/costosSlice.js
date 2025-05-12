import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import costosService from "./costosService.js";

const initialState = {
  cuentasContables: [],
  conceptos: [],
  concepto: [],
  costos_ingresos_vehiculo: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

export const getCuentasContables = createAsyncThunk(
  "getCuentasContables",
  async (data, { rejectWithValue }) => {
    const result = await costosService.getCuentasContables();
    if (Array.isArray(result)) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const postConceptoCostos = createAsyncThunk(
  "postConceptoCostos",
  async (data, { rejectWithValue }) => {
    const result = await costosService.postConceptoCostos(data);
    if (result.hasOwnProperty("status") && result.status) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);
export const updateConcepto = createAsyncThunk(
  "updateConcepto",
  async (data, { rejectWithValue }) => {
    const result = await costosService.updateConcepto(data);
    if (result.hasOwnProperty("status") && result.status) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);
export const deleteConcepto = createAsyncThunk(
  "deleteConcepto",
  async (data, { rejectWithValue }) => {
    const result = await costosService.deleteConceptosCostos(data);
    /*  {status: true, message: 'Concepto eliminado correctamente'} */
    if (result.hasOwnProperty("status") && result.status) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);
export const getConceptosCostos = createAsyncThunk(
  "getConceptosCostos",
  async (data, { rejectWithValue }) => {
    const result = await costosService.getConceptosCostos();
    if (Array.isArray(result)) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const getConceptosCostosById = createAsyncThunk(
  "getConceptosCostosById",
  async (data, { rejectWithValue }) => {
    const result = await costosService.getConceptosCostosById(data);
    console.log(result);
    if (Array.isArray(result)) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const postCostos_Ingresos = createAsyncThunk(
  "postCostos_Ingresos",
  async (data, { rejectWithValue }) => {
    const result = await costosService.postCostos_Ingresos(data);
    if (result.hasOwnProperty("status") && result.status) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const getCostosIngresosByIdVehiculo = createAsyncThunk(
  "getCostosIngresosByIdVehiculo",
  async (data, { rejectWithValue }) => {
    const result = await costosService.getCostosIngresosByIdVehiculo(data);
    console.log(result);
    if (Array.isArray(result)) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const costosSlice = createSlice({
  name: "costos",
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
    builder.addCase(getCuentasContables.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getCuentasContables.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = action.payload.status;
      state.message = action.payload.message;
      state.cuentasContables = action.payload;
    });
    builder.addCase(getCuentasContables.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = action.payload.status;
      state.message = action.payload.message;
    });
    builder.addCase(postConceptoCostos.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(postConceptoCostos.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = action.payload.status;
      state.message = action.payload.message;
    });
    builder.addCase(postConceptoCostos.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(updateConcepto.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(updateConcepto.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = true;
      state.message = action.payload.message;
    });
    builder.addCase(updateConcepto.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(deleteConcepto.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(deleteConcepto.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = true;
      state.message = action.payload.message;
    });
    builder.addCase(deleteConcepto.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getConceptosCostos.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getConceptosCostos.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = action.payload.status;
      state.message = action.payload.message;
      state.conceptos = action.payload;
    });
    builder.addCase(getConceptosCostos.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = action.payload.status;
      state.message = action.payload.message;
    });
    builder.addCase(getConceptosCostosById.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getConceptosCostosById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
      state.concepto = action.payload;
    });
    builder.addCase(getConceptosCostosById.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
    });
    builder.addCase(postCostos_Ingresos.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(postCostos_Ingresos.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = true;
      state.message = action.payload.message;
    });
    builder.addCase(postCostos_Ingresos.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getCostosIngresosByIdVehiculo.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(
      getCostosIngresosByIdVehiculo.fulfilled,
      (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
        state.message = action.payload.message;
        state.costos_ingresos_vehiculo = action.payload;
      }
    );
    builder.addCase(getCostosIngresosByIdVehiculo.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
    });
  },
});
export const { reset } = costosSlice.actions;
export default costosSlice.reducer;
