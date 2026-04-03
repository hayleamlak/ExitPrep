import { BarChart3, BookOpen, ChevronLeft, CircleHelp, LayoutGrid, LogOut, Moon, Network, Rocket, ShieldCheck, Sun, UserRound } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const studentItems = [
  { to: "/app/study-notes", label: "Notes", icon: BookOpen },
  { to: "/app/practice-questions", label: "Questions", icon: LayoutGrid },
  { to: "/app/dashboard", label: "Insights", icon: BarChart3 }
];

const adminItems = [{ to: "/app/admin", label: "Admin Panel", icon: ShieldCheck }];

const guidanceItems = [
  { to: "/app/dashboard", label: "Insights", icon: Rocket },
  { to: "/app/dashboard", label: "Guide", icon: CircleHelp }
];

function NavSection({ title, items, isDark }) {
  return (
    <section className="mt-7">
      <h2 className="px-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">{title}</h2>
      <nav className="mt-3 space-y-1.5">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={`${title}-${item.label}`}
              to={item.to}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                  isActive
                    ? isDark
                      ? "bg-white text-slate-900 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.28)]"
                      : "bg-slate-900 text-white"
                    : isDark
                      ? "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                ].join(" ")
              }
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </section>
  );
}

function AppShell() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const isAdmin = user?.role === "admin";
  const hideSidebar = location.pathname.startsWith("/app/admin");
  const hideTopBar = location.pathname.startsWith("/app/admin");
  const userInitial = (user?.name || user?.email || "U").slice(0, 1).toUpperCase();
  const navigationItems = isAdmin ? [...studentItems, ...adminItems] : studentItems;

  const shellClasses = isDark
    ? {
        page: "bg-[#090c17] text-slate-100",
        sidebar:
          "border-white/10 bg-[radial-gradient(circle_at_0%_0%,#1e263f_0%,#0f1322_42%,#0a0d18_100%)] shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_30px_60px_rgba(0,0,0,0.45)]",
        badge: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
        topBar: "border-white/10 bg-white/[0.03]",
        panel: "border-white/10 bg-[#0b1020]",
        card: "border-white/10 bg-white/5",
        logoWrap: "border-white/20 bg-black/40 text-white",
        heading: "text-white",
        textSoft: "text-slate-300",
        textMain: "text-slate-200",
        button: "border-white/20 bg-white/10 text-slate-200 hover:bg-white/20",
        controlButton: "border-white/20 bg-white/10 text-slate-200"
      }
    : {
        page: "bg-[#f3f5fb] text-slate-700",
        sidebar: "border-slate-200 bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.04),0_24px_50px_rgba(15,23,42,0.08)]",
        badge: "border-sky-300 bg-sky-100 text-sky-700",
        topBar: "border-slate-200 bg-white/90",
        panel: "border-slate-200 bg-white",
        card: "border-slate-200 bg-slate-50",
        logoWrap: "border-slate-300 bg-slate-100 text-slate-700",
        heading: "text-slate-800",
        textSoft: "text-slate-500",
        textMain: "text-slate-700",
        button: "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
        controlButton: "border-slate-300 bg-white text-slate-600"
      };

  return (
    <div className={`min-h-screen ${shellClasses.page}`}>
      <div className="mx-auto w-full max-w-[1700px] p-3 sm:p-4">
        <aside className={`hidden rounded-[28px] border p-5 lg:fixed lg:bottom-4 lg:left-4 lg:top-4 lg:block lg:w-[300px] lg:overflow-y-auto ${hideSidebar ? "lg:hidden" : ""} ${shellClasses.sidebar}`}>
          <div className="flex items-center gap-3">
            <div className={`grid h-10 w-10 place-items-center rounded-full border ${shellClasses.logoWrap}`}>
              <Network size={18} />
            </div>
            <div>
              <p className="font-mono text-xs tracking-[0.25em] text-slate-400">EPREP</p>
              <p className={`text-sm font-semibold ${shellClasses.heading}`}>Exit Exam Portal</p>
            </div>
          </div>

          <NavSection title="Workspace" items={navigationItems} isDark={isDark} />
          <NavSection title="Guidance" items={guidanceItems} isDark={isDark} />

          <div className={`mt-8 flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${shellClasses.textSoft} ${shellClasses.card}`}>
            <span>Theme</span>
            <button type="button" onClick={toggleTheme} className={`rounded-full border p-2 transition ${shellClasses.controlButton}`}>
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>

          <div className={`mt-4 rounded-2xl border p-3 ${shellClasses.card}`}>
            <div className="flex items-center gap-3">
              <div className={`grid h-10 w-10 place-items-center rounded-full text-sm font-bold ${isDark ? "bg-white/10 text-white" : "bg-slate-200 text-slate-700"}`}>
                {userInitial}
              </div>
              <div className="min-w-0">
                <p className={`truncate text-sm font-semibold ${shellClasses.heading}`}>{user?.name || "Signed in user"}</p>
                <p className="truncate text-xs text-slate-400">{user?.email || "No email available"}</p>
              </div>
            </div>
            <div className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${shellClasses.badge}`}>
              {user?.role || "student"}
            </div>
            <NavLink
              to="/app/profile"
              className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${shellClasses.button}`}
            >
              <UserRound size={15} />
              Profile
            </NavLink>
            <button
              type="button"
              onClick={signOut}
              className={`mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${shellClasses.button}`}
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </aside>

        <div className={`min-w-0 ${hideSidebar ? "" : "lg:ml-[320px] lg:pl-4"}`}>
          {!hideTopBar ? (
            <header className={`mb-3 flex items-center gap-3 rounded-2xl border px-3 py-2.5 backdrop-blur sm:px-4 sm:py-3 ${shellClasses.topBar}`}>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-full border border-slate-300 bg-white text-slate-500"
              >
                <ChevronLeft size={16} />
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">ExitPrep+</p>
                <p className={`text-xs font-medium sm:text-sm ${shellClasses.textMain}`}>AI learning workspace</p>
              </div>
              <div className="ml-auto hidden md:block">
                <div className={`rounded-xl border px-3 py-2 text-xs ${isDark ? "border-white/10 bg-white/5 text-slate-400" : "border-slate-200 bg-white text-slate-500"}`}>
                  National Exit Exam Preparation
                </div>
              </div>
            </header>
          ) : null}

          <main className={`rounded-[26px] border p-4 shadow-[0_20px_70px_rgba(15,23,42,0.14)] sm:p-6 ${shellClasses.panel}`}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default AppShell;
