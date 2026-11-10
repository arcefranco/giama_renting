import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import auditoriaService from "./auditoriaService.js";

const initialState = {
    asientos: [],
    facturas: [],
    asientoLineas: [],
    facturaItems: [],
    isError: false,
    isSuccess: false,
    isLoading: false,
    isLoadingDetail: false,
    message: "",
};

export const getAsientos = createAsyncThunk(
    "auditoria/getAsientos",
    async (token, thunkAPI) => {
        try {
            return await auditoriaService.getAsientos(token);
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const getFacturas = createAsyncThunk(
    "auditoria/getFacturas",
    async (token, thunkAPI) => {
        try {
            return await auditoriaService.getFacturas(token);
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const getAsientoLineas = createAsyncThunk(
    "auditoria/getAsientoLineas",
    async (nroAsiento, thunkAPI) => {
        try {
            return await auditoriaService.getAsientoLineas(nroAsiento);
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const getFacturaItems = createAsyncThunk(
    "auditoria/getFacturaItems",
    async (idFactura, thunkAPI) => {
        try {
            return await auditoriaService.getFacturaItems(idFactura);
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const auditoriaSlice = createSlice({
    name: "auditoria",
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isLoadingDetail = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = "";
        },
        clearAsientoLineas: (state) => {
            state.asientoLineas = [];
        },
        clearFacturaItems: (state) => {
            state.facturaItems = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getAsientos.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getAsientos.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.asientos = action.payload;
            })
            .addCase(getAsientos.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
                state.asientos = [];
            })
            .addCase(getFacturas.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getFacturas.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.facturas = action.payload;
            })
            .addCase(getFacturas.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
                state.facturas = [];
            })
            .addCase(getAsientoLineas.pending, (state) => {
                state.isLoadingDetail = true;
                state.asientoLineas = [];
            })
            .addCase(getAsientoLineas.fulfilled, (state, action) => {
                state.isLoadingDetail = false;
                state.asientoLineas = action.payload;
            })
            .addCase(getAsientoLineas.rejected, (state, action) => {
                state.isLoadingDetail = false;
                state.isError = true;
                state.message = action.payload;
                state.asientoLineas = [];
            })
            .addCase(getFacturaItems.pending, (state) => {
                state.isLoadingDetail = true;
                state.facturaItems = [];
            })
            .addCase(getFacturaItems.fulfilled, (state, action) => {
                state.isLoadingDetail = false;
                state.facturaItems = action.payload;
            })
            .addCase(getFacturaItems.rejected, (state, action) => {
                state.isLoadingDetail = false;
                state.isError = true;
                state.message = action.payload;
                state.facturaItems = [];
            });
    },
});

export const { reset, clearAsientoLineas, clearFacturaItems } = auditoriaSlice.actions;
export default auditoriaSlice.reducer;
