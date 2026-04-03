import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import AppShell from "./components/AppShell";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import StudyNotesPage from "./pages/StudyNotesPage";
import PracticeQuestionsPage from "./pages/PracticeQuestionsPage";
import AdminPanelPage from "./pages/AdminPanelPage";
import ProfilePage from "./pages/ProfilePage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";

function defaultRouteForRole(role) {
  return role === "admin" ? "/app/admin" : "/app/study-notes";
}

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }

  return children;
}

function RequireRole({ allowedRoles, children }) {
  const { user } = useAuth();

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to={defaultRouteForRole(user?.role)} replace />;
  }

  return children;
}

function LandingRedirect() {
  const { user } = useAuth();

  return <Navigate to={defaultRouteForRole(user?.role)} replace />;
}

function PublicRedirect() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={defaultRouteForRole(user?.role)} replace />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route
            path="/app"
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route index element={<LandingRedirect />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="study-notes" element={<StudyNotesPage />} />
            <Route path="practice-questions" element={<PracticeQuestionsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route
              path="admin"
              element={
                <RequireRole allowedRoles={["admin"]}>
                  <AdminPanelPage />
                </RequireRole>
              }
            />
          </Route>
          <Route path="*" element={<PublicRedirect />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
