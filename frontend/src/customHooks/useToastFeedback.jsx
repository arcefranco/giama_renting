import { useEffect } from "react";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";

export const useToastFeedback = ({ isError, isSuccess, message, resetAction, onSuccess }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (isError) {
      toast.error(message, {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
      dispatch(resetAction());
    }

    if (isSuccess && message) {
      toast.success(message, {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
      dispatch(resetAction());
      if (onSuccess) onSuccess();
    }
  }, [isError, isSuccess, message, dispatch, resetAction, onSuccess]);
};