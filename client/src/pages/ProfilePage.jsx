import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, LogOut, Mail, Pencil, Search, Sun } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

function PreferenceRow({ icon: Icon, title, subtitle, checked, onToggle, accent = "neutral", palette }) {
  const accentClasses = {
    neutral: palette.iconNeutral,
    warning: palette.iconWarning
  };

  return (
    <div className={`flex items-center gap-3 border-b px-4 py-4 last:border-b-0 sm:px-5 ${palette.rowBorder}`}>
      <div className={`grid h-12 w-12 place-items-center rounded-2xl ${accentClasses[accent]}`}>
        <Icon size={20} />
      </div>

      <div className="min-w-0 flex-1">
        <p className={`text-2xl font-semibold tracking-tight ${palette.rowTitle}`}>{title}</p>
        <p className={`mt-1 text-sm ${palette.rowSub}`}>{subtitle}</p>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className={[
          "relative h-9 w-17 rounded-full p-1 transition",
          checked ? "bg-orange-500" : "bg-slate-200"
        ].join(" ")}
      >
        <span
          className={[
            "block h-7 w-7 rounded-full bg-white shadow transition",
            checked ? "translate-x-8" : "translate-x-0"
          ].join(" ")}
        />
      </button>
    </div>
  );
}

function ProfilePage() {
  const { user, signOut } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const [publicProfile, setPublicProfile] = useState(false);
  const [mistakeReview, setMistakeReview] = useState(true);

  const palette = isDark
    ? {
        title: "text-slate-100",
        section: "text-slate-400",
        panel: "border-white/10 bg-[#12182b]",
        panelShadow: "shadow-[0_12px_30px_rgba(0,0,0,0.28)]",
        rowBorder: "border-white/10",
        rowTitle: "text-slate-100",
        rowSub: "text-slate-400",
        iconNeutral: "bg-white/10 text-slate-300",
        iconWarning: "bg-amber-500/15 text-amber-300",
        editButton: "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10",
        signOutWrap: "hover:bg-white/5"
      }
    : {
        title: "text-slate-900",
        section: "text-slate-400",
        panel: "border-slate-200 bg-white",
        panelShadow: "shadow-[0_8px_30px_rgba(15,23,42,0.06)]",
        rowBorder: "border-slate-200",
        rowTitle: "text-slate-800",
        rowSub: "text-slate-500",
        iconNeutral: "bg-slate-100 text-slate-500",
        iconWarning: "bg-amber-100 text-amber-500",
        editButton: "border-slate-200 bg-white text-slate-500 hover:bg-slate-100",
        signOutWrap: "hover:bg-slate-50"
      };

  const joinedText = useMemo(() => {
    if (!user?.createdAt) {
      return "Joined Feb 2026";
    }

    return `Joined ${new Date(user.createdAt).toLocaleDateString(undefined, {
      month: "short",
      year: "numeric"
    })}`;
  }, [user?.createdAt]);

  return (
    <section className="mx-auto w-full max-w-5xl space-y-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className={`text-4xl font-semibold tracking-tight ${palette.title}`}>Profile</h1>
        </div>
        <button
          type="button"
          className={`grid h-12 w-12 place-items-center rounded-2xl border shadow-sm transition ${palette.editButton}`}
        >
          <Pencil size={18} />
        </button>
      </div>

      <div>
        <p className={`mb-4 text-sm font-semibold uppercase tracking-[0.2em] ${palette.section}`}>Preferences</p>
        <div className={`overflow-hidden rounded-3xl border ${palette.panel} ${palette.panelShadow}`}>
          <PreferenceRow
            icon={Sun}
            title="Appearance"
            subtitle={`${theme === "light" ? "Light" : "Dark"} Mode Active`}
            checked={theme === "dark"}
            onToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
            palette={palette}
          />

          <PreferenceRow
            icon={Search}
            title="Public Profile"
            subtitle={publicProfile ? "Your profile is visible to others" : "Only you can see your profile"}
            checked={publicProfile}
            onToggle={() => setPublicProfile((current) => !current)}
            palette={palette}
          />

          <PreferenceRow
            icon={ArrowUpRight}
            title="Mistake Review Mode"
            subtitle="Always show questions you got wrong first when starting a subject."
            checked={mistakeReview}
            onToggle={() => setMistakeReview((current) => !current)}
            accent="warning"
            palette={palette}
          />
        </div>
      </div>

      <div>
        <p className={`mb-4 text-sm font-semibold uppercase tracking-[0.2em] ${palette.section}`}>Account</p>
        <div className={`overflow-hidden rounded-3xl border ${palette.panel} ${palette.panelShadow}`}>
          <div className={`flex items-center gap-4 border-b px-4 py-5 sm:px-5 ${palette.rowBorder}`}>
            <div className={`grid h-12 w-12 place-items-center rounded-2xl ${palette.iconNeutral}`}>
              <Mail size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-semibold uppercase tracking-[0.18em] ${palette.section}`}>Membership</p>
              <p className={`mt-1 text-4xl font-semibold tracking-tight ${palette.title}`}>{joinedText}</p>
              <p className={`mt-1 truncate text-sm ${palette.rowSub}`}>{user?.email || "No email available"}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={signOut}
            className={`group flex w-full items-center gap-4 px-4 py-5 text-left transition sm:px-5 ${palette.signOutWrap}`}
          >
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-100 text-rose-500">
              <LogOut size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-3xl font-semibold tracking-tight text-rose-500">Sign Out</p>
              <p className="mt-1 text-sm text-rose-400">Securely leave your session</p>
            </div>
            <ArrowRight size={20} className="text-rose-300 transition group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </section>
  );
}

export default ProfilePage;
