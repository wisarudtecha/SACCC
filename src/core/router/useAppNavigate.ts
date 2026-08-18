// src/core/router/useAppNavigate.ts
import { useNavigate, NavigateOptions } from "react-router-dom";
import { ROUTE_PREFIX } from "@/core/router/routePrefix";

export const useAppNavigate = (module?: keyof typeof ROUTE_PREFIX) => {
  const navigate = useNavigate();

  return (to: string, options?: NavigateOptions) => {
    if (!module) {
      navigate(to, options);
      return;
    }

    const prefix = ROUTE_PREFIX[module];
    navigate(`${prefix}${to}`, options);
  };
};
