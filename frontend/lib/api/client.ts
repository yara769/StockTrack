import axios from "axios";

const client = axios.create({
  baseURL: "/api/v1",
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

// Response interceptor — unwrap data, surface errors
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err?.response?.data?.message ??
      err?.response?.data?.error ??
      err?.message ??
      "Unknown error";
    return Promise.reject(new Error(Array.isArray(message) ? message.join(", ") : message));
  },
);

export default client;
