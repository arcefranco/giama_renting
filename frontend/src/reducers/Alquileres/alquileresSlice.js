import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import alquileresService from "./alquileresService.js";

const initialState = {
  formasDeCobro: [],
  alquileresVehiculo: [],
  alquileres: [],
  alquilerById: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

export const postFormaCobro = createAsyncThunk(
  "postFormaCobro",
  async (data, { rejectWithValue }) => {
    const result = await alquileresService.postFormaCobro(data);
    if (result.hasOwnProperty("status") && result.status) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);
export const postAlquiler = createAsyncThunk(
  "postAlquiler",
  async (data, { rejectWithValue }) => {
    const result = await alquileresService.postAlquiler(data);
    if (result.hasOwnProperty("status") && result.status) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const anulacionAlquiler = createAsyncThunk(
  "anulacionAlquiler",
  async (data, { rejectWithValue }) => {
    const result = await alquileresService.anulacionAlquiler(data);
    if (result.hasOwnProperty("status") && result.status) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);
export const getFormasDeCobro = createAsyncThunk(
  "getFormasDeCobro",
  async (data, { rejectWithValue }) => {
    const result = await alquileresService.getFormasDeCobro();
    console.log(result);
    if (Array.isArray(result)) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);
export const getAlquileresByIdVehiculo = createAsyncThunk(
  "getAlquileresByIdVehiculo",
  async (data, { rejectWithValue }) => {
    const result = await alquileresService.getAlquileresByIdVehiculo(data);
    if (Array.isArray(result)) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const getAlquilerById = createAsyncThunk(
  "getAlquilerById",
  async (data, { rejectWithValue }) => {
    const result = await alquileresService.getAlquilerById(data);
    if (Array.isArray(result)) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const getAlquileres = createAsyncThunk(
  "getAlquileres",
  async (data, { rejectWithValue }) => {
    const result = await alquileresService.getAlquileres(data);
    console.log(result);
    if (Array.isArray(result)) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);
export const alquileresSlice = createSlice({
  name: "alquileres",
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
    builder.addCase(postAlquiler.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(postAlquiler.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = action.payload.status;
      state.message = action.payload.message;
    });
    builder.addCase(postAlquiler.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.message = action.payload.message;
    });
    builder.addCase(anulacionAlquiler.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(anulacionAlquiler.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = action.payload.status;
      state.message = action.payload.message;
    });
    builder.addCase(anulacionAlquiler.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.message = action.payload.message;
    });
    builder.addCase(postFormaCobro.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(postFormaCobro.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.message = action.payload.message;
    });
    builder.addCase(postFormaCobro.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = action.payload.status;
      state.message = action.payload.message;
    });
    builder.addCase(getFormasDeCobro.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getFormasDeCobro.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = false;
      state.formasDeCobro = action.payload;
    });
    builder.addCase(getFormasDeCobro.rejected, (state, action) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.message = action.payload;
    });
    builder.addCase(getAlquileresByIdVehiculo.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getAlquileresByIdVehiculo.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = false;
      state.alquileresVehiculo = action.payload;
    });
    builder.addCase(getAlquileresByIdVehiculo.rejected, (state, action) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.message = action.payload;
    });
    builder.addCase(getAlquilerById.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getAlquilerById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = false;
      state.alquilerById = action.payload;
    });
    builder.addCase(getAlquilerById.rejected, (state, action) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.message = action.payload;
    });
    builder.addCase(getAlquileres.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getAlquileres.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = false;
      state.alquileres = action.payload;
    });
    builder.addCase(getAlquileres.rejected, (state, action) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.message = action.payload;
    });
  },
});
export const { reset } = alquileresSlice.actions;
export default alquileresSlice.reducer;
