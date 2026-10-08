import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const apiBaseUrl =
  import.meta.env.VITE_BASE_API_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");

const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: apiBaseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth?.token;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    "users",
    "deposits",
    "withdraws",
    "uploads",
    "homeControls",
    "promotions",
    "categories",
    "kyc",
    "pages",
    "paymentNumber",
    "paymentMethod",
  ],
  endpoints: () => ({}),
});

export const { useLoginMutation, useRegisterMutation, useFetchProfileQuery } =
  baseApi;
export default baseApi;
