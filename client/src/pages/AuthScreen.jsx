import { useState } from "react";
import { ArrowRight, GraduationCap, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { NavLink, Navigate, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function defaultRouteForRole(role) {
  return role === "admin" ? "/app/admin" : "/app/study-notes";
}

function roleCopy(role) {
  if (role === "admin") {
    return {
      title: "Admin access",
      description: "Create content, manage resources, and keep the exam workspace current."
    };
  }

  return {
    title: "Student access",
    description: "Study course materials, practice questions, and progress insights in one place."
  };
}

function AuthScreen({ mode }) {
  const isSignIn = mode === "signin";
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, signIn, user } = useAuth();
  const [role, setRole] = useState("student");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const finishAuth = (payload) => {
    signIn(payload);
    const requestedRoute = location.state?.from || defaultRouteForRole(payload.user.role);
    navigate(requestedRoute, { replace: true });
  };

  const submitForm = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const endpoint = isSignIn ? "/auth/login" : "/auth/register";
      const body = isSignIn
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password, role };

      const response = await api.post(endpoint, body);
      finishAuth(response.data);
    } catch (error) {
      setStatus(error.response?.data?.message || "Unable to complete authentication.");
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to={defaultRouteForRole(user?.role)} replace />;
  }

  const activeRole = roleCopy(role);

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_38%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef4fb_55%,#f4f7fb_100%)]" />
        <div className="absolute left-[-8rem] top-24 -z-10 h-72 w-72 rounded-full bg-sky-300/30 blur-3xl" />
        <div className="absolute right-[-6rem] top-48 -z-10 h-80 w-80 rounded-full bg-violet-300/20 blur-3xl" />

        <header className="sticky top-0 z-20 border-b border-white/70 bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <NavLink to="/" className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-sky-700 shadow-sm">
                <GraduationCap size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">ExitPrep+</p>
                <p className="text-lg font-semibold text-slate-900">Ethiopian exam prep</p>
              </div>
            </NavLink>

            <div className="flex items-center gap-3">
              <NavLink
                to="/"
                className="hidden rounded-full px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 sm:inline-flex"
              >
                Home
              </NavLink>
              <NavLink
                to={isSignIn ? "/signup" : "/signin"}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                {isSignIn ? "Sign Up" : "Sign In"}
              </NavLink>
            </div>
          </div>
        </header>

        <main className="mx-auto grid min-h-[calc(100vh-73px)] w-full max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-16">
          <section className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700 shadow-sm">
              <Sparkles size={14} />
              Role-aware access
            </div>

            <h1 className="mt-6 max-w-2xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              {isSignIn ? "Welcome back to ExitPrep+" : "Create your ExitPrep+ account"}
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              {isSignIn
                ? "Sign in to continue with your study materials, practice questions, and AI guidance."
                : "Join ExitPrep+ and choose your role to access the right study workspace."}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <article className="rounded-[1.75rem] border border-white/80 bg-white/75 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <UserRound size={20} />
                </div>
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">{activeRole.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{activeRole.description}</p>
              </article>

              <article className="rounded-[1.75rem] border border-white/80 bg-white/75 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <ShieldCheck size={20} />
                </div>
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Security first</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Access is stored locally, and the server receives the role back in the authentication payload.
                </p>
              </article>
            </div>
          </section>

          <section className="flex items-center justify-center">
            <div className="w-full max-w-lg rounded-[2rem] border border-white/80 bg-white/75 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8">
              <div className="mb-8 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">ExitPrep+</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">{isSignIn ? "Sign in" : "Sign up"}</h2>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                  {isSignIn ? "Login" : "Register"}
                </div>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
                <NavLink
                  to="/signin"
                  className={({ isActive }) =>
                    [
                      "rounded-xl px-4 py-3 text-center text-sm font-semibold transition",
                      isActive ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:bg-white"
                    ].join(" ")
                  }
                >
                  Sign in
                </NavLink>
                <NavLink
                  to="/signup"
                  className={({ isActive }) =>
                    [
                      "rounded-xl px-4 py-3 text-center text-sm font-semibold transition",
                      isActive ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:bg-white"
                    ].join(" ")
                  }
                >
                  Sign up
                </NavLink>
              </div>

              <form onSubmit={submitForm} className="space-y-4">
                {!isSignIn ? (
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">Full name</span>
                    <input
                      value={form.name}
                      onChange={(event) => updateField("name", event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
                      placeholder="Enter your name"
                      required
                    />
                  </label>
                ) : null}

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Email</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
                    placeholder="name@school.edu"
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Password</span>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) => updateField("password", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
                    placeholder="••••••••"
                    required
                  />
                </label>

                {!isSignIn ? (
                  <div className="space-y-2">
                    <span className="text-sm font-semibold text-slate-700">Account type</span>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: "student", label: "Student", description: "Study resources" },
                        { value: "admin", label: "Admin", description: "Upload content" }
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setRole(option.value)}
                          className={[
                            "rounded-2xl border px-4 py-4 text-left transition",
                            role === option.value
                              ? "border-sky-300 bg-sky-50 text-slate-950 shadow-sm"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          ].join(" ")}
                        >
                          <span className="block text-sm font-semibold">{option.label}</span>
                          <span className="mt-1 block text-xs text-slate-500">{option.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                    Sign in with your account and you will be routed to the correct workspace automatically.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Please wait..." : isSignIn ? "Sign in" : "Create account"}
                  {!loading ? <ArrowRight size={16} /> : null}
                </button>

                {status ? <p className="text-sm leading-6 text-rose-600">{status}</p> : null}
              </form>

              <div className="mt-6 flex items-center justify-between gap-4 text-sm text-slate-500">
                <p>{isSignIn ? "Need a new account?" : "Already have an account?"}</p>
                <NavLink to={isSignIn ? "/signup" : "/signin"} className="font-semibold text-sky-700 transition hover:text-sky-800">
                  {isSignIn ? "Go to sign up" : "Go to sign in"}
                </NavLink>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default AuthScreen;
