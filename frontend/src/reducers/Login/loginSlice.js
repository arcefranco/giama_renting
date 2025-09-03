import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import loginService from "./loginService";

const username =
  localStorage.getItem("username") &&
  JSON.parse(localStorage.getItem("username"));
const initialState = {
  status: {},
  username: username ? username : null,
  roles: "",
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

export const logIn = createAsyncThunk(
  "logIn",
  async (data, { rejectWithValue }) => {
    const result = await loginService.logIn(data);
    if (result.hasOwnProperty("status") && result.status) {
      return result;
    } else {
      return rejectWithValue(result);
    }
  }
);

export const loginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
      state.status = {};
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logIn.pending, (state) => {
      state.isLoading = true;
      state.status = {};
    });
    builder.addCase(logIn.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.status = action.payload;
      state.roles = action.payload.roles;
    });
    builder.addCase(logIn.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.status = action.payload;
    });
  },
});
export const { reset } = loginSlice.actions;
export default loginSlice.reducer;
