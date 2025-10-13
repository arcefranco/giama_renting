export const responses = {
  array: "array",
  object: "object",
  successObject: "successObject",
};

export const handleAsyncThunk = async (promiseFn, type, rejectWithValue) => {
  const result = await promiseFn();
  if (!result.status) {
    return rejectWithValue(result); // {status:false,message}
  }

  // Manejo según el tipo esperado
  switch (type) {
    case "array":
      return result.data; // getFunction, postArrayFunction
    case "object":
      return result.data; // postObjectFunction
    case "successObject":
      return result; // postFunction
    default:
      return result;
  }
};
