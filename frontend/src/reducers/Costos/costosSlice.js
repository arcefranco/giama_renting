import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import costosService from "./costosService.js";
import { handleAsyncThunk, responses } from "../../helpers/handleAsyncThunk.js";

const initialState = {
  cuentasContables: [],
  conceptos: [],
  concepto: [],
  costos_ingresos_vehiculo: [],
  nro_recibo_ingreso: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

export const getCuentasContables = createAsyncThunk(
  "getCuentasContables",
  async (_, { rejectWithValue }) =>
    handleAsyncThunk(
      () => costosService.getCuentasContables(),
      responses.array,
      rejectWithValue
    )
);

export const postConceptoCostos = createAsyncThunk(
  "postConceptoCostos",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => costosService.postConceptoCostos(data),
      responses.successObject,
      rejectWithValue
    )
);
export const updateConcepto = createAsyncThunk(
  "updateConcepto",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => costosService.updateConcepto(data),
      responses.successObject,
      rejectWithValue
    )
);
export const deleteConcepto = createAsyncThunk(
  "deleteConcepto",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => costosService.deleteConceptosCostos(data),
      responses.successObject,
      rejectWithValue
    )
);
export const getConceptosCostos = createAsyncThunk(
  "getConceptosCostos",
  async (_, { rejectWithValue }) =>
    handleAsyncThunk(
      () => costosService.getConceptosCostos(),
      responses.array,
      rejectWithValue
    )
);

export const getConceptosCostosById = createAsyncThunk(
  "getConceptosCostosById",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => costosService.getConceptosCostosById(data),
      responses.array,
      rejectWithValue
    )
);


export const getCostosIngresosByIdVehiculo = createAsyncThunk(
  "getCostosIngresosByIdVehiculo",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => costosService.getCostosIngresosByIdVehiculo(data),
      responses.array,
      rejectWithValue
    )
);



export const prorrateo = createAsyncThunk(
  "prorrateo",
  async (data, { rejectWithValue }) =>
    handleAsyncThunk(
      () => costosService.prorrateo(data),
      responses.successObject,
      rejectWithValue
    )
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
    resetCostosVehiculo: (state) => {
      state.costos_ingresos_vehiculo = [];
    },
    reset_nro_recibo_ingreso: (state) => {
      state.nro_recibo_ingreso = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getCuentasContables.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getCuentasContables.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.cuentasContables = action.payload;
    });
    builder.addCase(getCuentasContables.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(postConceptoCostos.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(postConceptoCostos.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
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
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.conceptos = action.payload;
    });
    builder.addCase(getConceptosCostos.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(getConceptosCostosById.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getConceptosCostosById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = "";
      state.concepto = action.payload;
    });
    builder.addCase(getConceptosCostosById.rejected, (state, action) => {
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
        state.message = "";
        state.costos_ingresos_vehiculo = action.payload;
      }
    );
    builder.addCase(getCostosIngresosByIdVehiculo.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
    builder.addCase(prorrateo.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(prorrateo.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = action.payload.message;
    });
    builder.addCase(prorrateo.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.isSuccess = false;
      state.message = action.payload.message;
    });
  },
});
export const { reset, resetCostosVehiculo, reset_nro_recibo_ingreso } =
  costosSlice.actions;
export default costosSlice.reducer;
