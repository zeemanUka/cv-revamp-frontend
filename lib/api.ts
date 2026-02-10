const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  ? trimTrailingSlash(process.env.NEXT_PUBLIC_BACKEND_URL)
  : null;

const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  ? trimTrailingSlash(process.env.NEXT_PUBLIC_API_BASE_URL)
  : null;

const defaultApiBaseUrl = "http://127.0.0.1:8000/api";

export const API_BASE_URL =
  backendBaseUrl !== null
    ? `${backendBaseUrl}/api`
    : configuredApiBaseUrl || defaultApiBaseUrl;

export const FILE_BASE_URL = backendBaseUrl
  ? backendBaseUrl
  : process.env.NEXT_PUBLIC_FILE_BASE_URL
    ? trimTrailingSlash(process.env.NEXT_PUBLIC_FILE_BASE_URL)
    : API_BASE_URL.replace(/\/api\/?$/, "");
