import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

export default function PrivateRoutes({ children }) {
  const userStore = useSelector((store) => store.UserReducer);
  const location = useLocation();

  if (!userStore.isAuth) {
    const next = `${location.pathname}${location.search || ""}`;
    const qs = next && next !== "/login" ? `?next=${encodeURIComponent(next)}` : "";
    return <Navigate to={`/login${qs}`} replace />;
  }

  return <>{children}</>;
}
