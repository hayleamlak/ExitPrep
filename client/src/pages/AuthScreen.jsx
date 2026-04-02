import { useState } from "react";
import { ArrowRight, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { NavLink, Navigate, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function defaultRouteForRole(role) {
  return role === "admin" ? "/admin" : "/study-notes";
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
    description: "Study notes, practice questions, and progress insights in one place."
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
    <div className="min-h-screen bg-[#070b14] text-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.22),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(96,165,250,0.16),_transparent_32%),linear-gradient(160deg,#0b1222_0%,#090f1c_45%,#060913_100%)] p-8 sm:p-10 lg:border-b-0 lg:border-r lg:p-12">
          <div className="absolute -left-16 top-12 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative flex h-full flex-col justify-between gap-10">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
                <Sparkles size={14} />
                ExitPrep+
              </div>

              <div className="mt-8 max-w-xl space-y-5">
                <p className="font-mono text-xs uppercase tracking-[0.36em] text-cyan-200/70">Role-aware access</p>
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  {isSignIn ? "Sign in to your workspace" : "Create a role-based account"}
                </h1>
                <p className="max-w-lg text-base leading-7 text-slate-300 sm:text-lg">
                  Students get a focused study workspace. Admins get the publishing tools needed to keep content moving.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-200">
                  <UserRound size={20} />
                </div>
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">{activeRole.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{activeRole.description}</p>
              </article>

              <article className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-400/15 text-sky-200">
                  <ShieldCheck size={20} />
                </div>
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Security first</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Access is stored locally, and the server receives the role back in the authentication payload.
                </p>
              </article>
            </div>
          </div>
        </aside>

        <main className="flex items-center justify-center p-5 sm:p-8 lg:p-10">
          <div className="w-full max-w-lg rounded-[30px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur sm:p-8">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">ExitPrep+</p>
                <h2 className="mt-2 text-2xl font-bold text-white">{isSignIn ? "Welcome back" : "Start your account"}</h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                {isSignIn ? "Sign In" : "Sign Up"}
              </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/20 p-1">
              <NavLink
                to="/signin"
                className={({ isActive }) =>
                  [
                    "rounded-xl px-4 py-3 text-center text-sm font-semibold transition",
                    isActive ? "bg-white text-slate-900 shadow-lg" : "text-slate-300 hover:bg-white/5"
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
                    isActive ? "bg-white text-slate-900 shadow-lg" : "text-slate-300 hover:bg-white/5"
                  ].join(" ")
                }
              >
                Sign up
              </NavLink>
            </div>

            <form onSubmit={submitForm} className="space-y-4">
              {!isSignIn ? (
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-300">Full name</span>
                  <input
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#0b1326] px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50"
                    placeholder="Enter your name"
                    required
                  />
                </label>
              ) : null}

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-300">Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#0b1326] px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50"
                  placeholder="name@school.edu"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-300">Password</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#0b1326] px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50"
                  placeholder="••••••••"
                  required
                />
              </label>

              {!isSignIn ? (
                <div className="space-y-2">
                  <span className="text-sm font-semibold text-slate-300">Account type</span>
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
                            ? "border-cyan-300/60 bg-cyan-400/10 text-white shadow-[0_0_0_1px_rgba(103,232,249,0.1)]"
                            : "border-white/10 bg-[#0b1326] text-slate-300 hover:border-white/20 hover:bg-white/5"
                        ].join(" ")}
                      >
                        <span className="block text-sm font-semibold">{option.label}</span>
                        <span className="mt-1 block text-xs text-slate-400">{option.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="rounded-2xl border border-white/10 bg-[#0b1326] px-4 py-3 text-sm leading-6 text-slate-400">
                  Sign in with your account and you will be routed to the correct workspace automatically.
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Please wait..." : isSignIn ? "Sign in" : "Create account"}
                {!loading ? <ArrowRight size={16} /> : null}
              </button>

              {status ? <p className="text-sm leading-6 text-rose-300">{status}</p> : null}
            </form>

            <div className="mt-6 flex items-center justify-between gap-4 text-sm text-slate-400">
              <p>{isSignIn ? "Need a new account?" : "Already have an account?"}</p>
              <NavLink to={isSignIn ? "/signup" : "/signin"} className="font-semibold text-cyan-200 transition hover:text-cyan-100">
                {isSignIn ? "Go to sign up" : "Go to sign in"}
              </NavLink>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AuthScreen;
