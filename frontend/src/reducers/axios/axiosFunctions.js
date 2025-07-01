import axios from "axios";
import { ServiceErrorHandler } from "../../helpers/ServiceErrorHandler";

export const getFunction = async (route) => {
  try {
    const response = await axios.get(
      import.meta.env.VITE_REACT_APP_HOST + route
    );
    if (Array.isArray(response.data)) {
      return response.data;
    } else {
      throw response.data;
    }
  } catch (error) {
    return ServiceErrorHandler(error, route);
  }
};

export const postFunction = async (route, form, header = {}) => {
  try {
    const response = await axios.post(
      import.meta.env.VITE_REACT_APP_HOST + route,
      form,
      {
        ...header,
        withCredentials: true,
      }
    );
    if (response.data.hasOwnProperty("status") && response.data.status) {
      return response.data;
    } else {
      console.log("response: ", response);
      throw response.data;
    }
  } catch (error) {
    return ServiceErrorHandler(error, route);
  }
};

export const postArrayFunction = async (route, form, header = {}) => {
  try {
    const response = await axios.post(
      import.meta.env.VITE_REACT_APP_HOST + route,
      form,
      {
        ...header,
        withCredentials: true,
      }
    );
    if (Array.isArray(response.data)) {
      return response.data;
    } else {
      console.log("response: ", response);
      throw response.data;
    }
  } catch (error) {
    return ServiceErrorHandler(error, route);
  }
};
