import axios from "axios";
import {
  FETCH_PROGRESS_REQUEST,
  FETCH_PROGRESS_SUCCESS,
  FETCH_PROGRESS_ERROR,
  MARK_VIDEO_WATCHED_REQUEST,
  MARK_VIDEO_WATCHED_SUCCESS,
  MARK_VIDEO_WATCHED_ERROR,
} from "./actionType";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

// Mark video as watched
export const markVideoWatched = (videoId, courseId, userId, token) => async (dispatch) => {
  dispatch({ type: MARK_VIDEO_WATCHED_REQUEST });
  try {
    const response = await axios.patch(
      `${API_URL}/videos/markWatched/${videoId}`,
      { courseId, userId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    dispatch({
      type: MARK_VIDEO_WATCHED_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (err) {
    dispatch({
      type: MARK_VIDEO_WATCHED_ERROR,
      payload: err.message,
    });
    return null;
  }
};

// Fetch course progress
export const fetchCourseProgress = (courseId, userId, token) => async (dispatch) => {
  dispatch({ type: FETCH_PROGRESS_REQUEST });
  try {
    const response = await axios.get(
      `${API_URL}/videos/progress/${courseId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    dispatch({
      type: FETCH_PROGRESS_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (err) {
    dispatch({
      type: FETCH_PROGRESS_ERROR,
      payload: err.message,
    });
    return null;
  }
};
