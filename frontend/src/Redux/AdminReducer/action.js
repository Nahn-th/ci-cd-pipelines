import axios from "axios";
import { API_BASE_URL } from "../../config/api";
import {
  ADD_PRODUCT_SUCCESS,
  ADD_User_SUCCESS,
  ADD_Video_SUCCESS,
  GET_PRODUCT_SUCCESS,
  GET_User_SUCCESS,
  GET_Video_SUCCESS,
  PATCH_PRODUCT_SUCCESS,
  PATCH_User_SUCCESS,
  PRODUCT_FAILURE,
  PRODUCT_REQUEST,
} from "./actionType";

function getAuthToken() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return "";
    return JSON.parse(raw)?.token || "";
  } catch {
    return "";
  }
}

export const addProduct = (data) => (dispatch) => {
  dispatch({ type: PRODUCT_REQUEST });
  const token = getAuthToken();
  fetch(`${API_BASE_URL}/courses/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
    .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
    .then(({ ok, body }) => {
      console.log(body);
      if (ok && body?.data) {
        dispatch({ type: ADD_PRODUCT_SUCCESS, payload: body.data });
      } else {
        dispatch({ type: PRODUCT_FAILURE });
      }
    })
    .catch((e) => {
      console.log(e);
      dispatch({ type: PRODUCT_FAILURE });
    });
};

export const addUser = (data) => (dispatch) => {
  dispatch({ type: PRODUCT_REQUEST });
  const token = getAuthToken();
  fetch(`${API_BASE_URL}/users/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
    .then((res) => res.json())
    .then((res) => {
      console.log("userData", res);
      if (res?.data) {
        dispatch({ type: ADD_User_SUCCESS, payload: res.data });
      }
    })
    .catch((e) => console.log(e));
};

export const addVideo = (data, courseId) => (dispatch) => {
  dispatch({ type: PRODUCT_REQUEST });
  const token = getAuthToken();
  const payload = { ...data };
  delete payload.courseId;
  fetch(`${API_BASE_URL}/videos/add/${courseId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
    .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
    .then(({ ok, body }) => {
      console.log("addVideo", body);
      if (ok && body?.video) {
        dispatch({ type: ADD_Video_SUCCESS, payload: body.video });
      } else {
        dispatch({ type: PRODUCT_FAILURE });
      }
    })
    .catch((e) => {
      console.log(e);
      dispatch({ type: PRODUCT_FAILURE });
    });
};

export const getProduct = (page, limit, search, order) => (dispatch) => {
  dispatch({ type: PRODUCT_REQUEST });
  const token = getAuthToken();
  axios
    .get(
      `${API_BASE_URL}/courses?page=${page}&limit=${limit}&q=${search}&sortBy=price&sortOrder=${order}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    .then((res) => {
      console.log("getProduct", res);
      const list = res.data?.course;
      dispatch({
        type: GET_PRODUCT_SUCCESS,
        payload: Array.isArray(list) ? list.filter(Boolean) : [],
      });
    })
    .catch((e) => dispatch({ type: PRODUCT_FAILURE }));
};

export const getUser = (page, limit, search, order) => (dispatch) => {
  dispatch({ type: PRODUCT_REQUEST });
  const token = getAuthToken();
  axios
    .get(`${API_BASE_URL}/users?page=${page}&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => {
      console.log("getUsers", res);
      dispatch({ type: GET_User_SUCCESS, payload: res.data.users });
    })
    .catch((e) => dispatch({ type: PRODUCT_FAILURE }));
};

export const getvideo = (page, limit, user) => (dispatch) => {
  dispatch({ type: PRODUCT_REQUEST });
  const token = getAuthToken();
  axios
    .get(`${API_BASE_URL}/videos?page=${page}&limit=${limit}&user=${user}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => {
      console.log("getVideos", res.data);
      dispatch({ type: GET_Video_SUCCESS, payload: res.data });
    })
    .catch((e) => dispatch({ type: PRODUCT_FAILURE }));
};

export const patchProduct = (id, data) => (dispatch) => {
  dispatch({ type: PRODUCT_REQUEST });
  const token = getAuthToken();
  fetch(`${API_BASE_URL}/courses/update/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
    .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
    .then(({ ok, body }) => {
      console.log("patch data is", body?.course);
      if (ok && body?.course) {
        dispatch({ type: PATCH_PRODUCT_SUCCESS, payload: body.course });
      } else {
        dispatch({ type: PRODUCT_FAILURE });
      }
    })
    .catch((e) => console.log(e));
};

export const patchUser = (id, data) => (dispatch) => {
  dispatch({ type: PRODUCT_REQUEST });
  const token = getAuthToken();
  fetch(`${API_BASE_URL}/users/update/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
    .then((res) => res.json())
    .then((res) => {
      console.log("patch data is", res);
      dispatch({ type: PATCH_User_SUCCESS, payload: res });
    })
    .catch((e) => console.log(e));
};

export const approveCourse = (id) => (dispatch) => {
  dispatch({ type: PRODUCT_REQUEST });
  const token = getAuthToken();
  fetch(`${API_BASE_URL}/courses/approve/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => res.json())
    .then((res) => {
      console.log("approve", res);
      if (res?.course) {
        dispatch({ type: PATCH_PRODUCT_SUCCESS, payload: res.course });
      }
      dispatch(getProduct(4, 3));
    })
    .catch((e) => dispatch({ type: PRODUCT_FAILURE }));
};

export const rejectCourse = (id) => (dispatch) => {
  dispatch({ type: PRODUCT_REQUEST });
  const token = getAuthToken();
  fetch(`${API_BASE_URL}/courses/reject/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => res.json())
    .then((res) => {
      console.log("reject", res);
      dispatch(getProduct(4, 3));
    })
    .catch((e) => dispatch({ type: PRODUCT_FAILURE }));
};

export const deleteProduct = (id) => (dispatch) => {
  dispatch({ type: PRODUCT_REQUEST });
  const token = getAuthToken();
  axios
    .delete(`${API_BASE_URL}/courses/delete/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => {
      console.log(res, "deleted");
      dispatch(getProduct(4, 3));
    })
    .catch((e) => dispatch({ type: PRODUCT_FAILURE }));
};

export const deleteUsers = (id) => (dispatch) => {
  dispatch({ type: PRODUCT_REQUEST });
  const token = getAuthToken();
  axios
    .delete(`${API_BASE_URL}/users/delete/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => {
      console.log(res, "deleted");
      dispatch(getUser(4, 3));
    })
    .catch((e) => dispatch({ type: PRODUCT_FAILURE }));
};

export default function convertDateFormat(dateString) {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear().toString().slice(-2);

  const formattedDate = `${day}/${month}/${year}`;

  if (isNaN(day)) {
    return "No Date Found";
  }

  return formattedDate;
}
