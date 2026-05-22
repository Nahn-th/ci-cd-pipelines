const raw = process.env.REACT_APP_API_URL || "http://localhost:5001";

/** Base URL with no trailing slash; use `${API_BASE_URL}/users/...` in requests. */
export const API_BASE_URL = raw.replace(/\/+$/, "");
