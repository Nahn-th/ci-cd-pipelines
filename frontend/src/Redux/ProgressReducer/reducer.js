import {
  FETCH_PROGRESS_REQUEST,
  FETCH_PROGRESS_SUCCESS,
  FETCH_PROGRESS_ERROR,
  MARK_VIDEO_WATCHED_REQUEST,
  MARK_VIDEO_WATCHED_SUCCESS,
  MARK_VIDEO_WATCHED_ERROR,
} from "./actionType";

const initialState = {
  progress: null,
  loading: false,
  error: null,
};

export const ProgressReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_PROGRESS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case FETCH_PROGRESS_SUCCESS:
      return {
        ...state,
        progress: action.payload,
        loading: false,
      };
    case FETCH_PROGRESS_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case MARK_VIDEO_WATCHED_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case MARK_VIDEO_WATCHED_SUCCESS:
      return {
        ...state,
        progress: action.payload,
        loading: false,
      };
    case MARK_VIDEO_WATCHED_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    default:
      return state;
  }
};
