import { ArrowRight, BookOpen, Brain, GraduationCap, Layers3, ShieldCheck, Sparkles, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const features = [
  {
    title: "Centralized Study Materials",
    description: "Keep past papers, notes, and subject resources in one organized place.",
    icon: BookOpen
  },
  {
    title: "AI-Powered Guidance",
    description: "Get smart study recommendations based on your progress and weak areas.",
    icon: Brain
  },
  {
    title: "Practice & Test Yourself",
    description: "Use quizzes and question banks to check readiness before the exam.",
    icon: Layers3
  }
];

const steps = [
  {
    title: "Sign up and choose your department",
    description: "Create your account and personalize the workspace for your study path.",
    icon: 1
  },
  {
    title: "Access study materials and practice questions",
    description: "Open PDFs, review notes, and attempt practice sets from the dashboard.",
    icon: 2
  },
  {
    title: "Get AI recommendations",
    description: "Receive suggestions that point you toward the subjects that need attention.",
    icon: 3
  }
];

function HomePage() {
  const { isAuthenticated } = useAuth();

  const getStartedHref = isAuthenticated ? "/app/study-notes" : "/signup";
  const browseResourcesHref = isAuthenticated ? "/app/study-notes" : "/signin";

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_38%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef4fb_55%,#f4f7fb_100%)]" />
        <div className="absolute left-[-8rem] top-24 -z-10 h-72 w-72 rounded-full bg-sky-300/30 blur-3xl" />
        <div className="absolute right-[-6rem] top-48 -z-10 h-80 w-80 rounded-full bg-violet-300/20 blur-3xl" />

        <header className="sticky top-0 z-20 border-b border-white/70 bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <Link to="/" className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-sky-700 shadow-sm">
                <GraduationCap size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">ExitPrep+</p>
                <p className="text-lg font-semibold text-slate-900">Ethiopian exam prep</p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                to={isAuthenticated ? "/app/study-notes" : "/signin"}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                Sign In
              </Link>
            </div>
          </div>
        </header>

        <main>
          <section className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
            <div className="flex flex-col justify-center">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700 shadow-sm">
                <Sparkles size={14} />
                Study smarter, not harder
              </div>

              <h1 className="mt-6 max-w-2xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Prepare Smarter for Your Exit Exams
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                Access past papers, practice tests, and AI-powered study guidance, all in one place.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={getStartedHref}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  Get Started
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to={browseResourcesHref}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                >
                  Browse Resources
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 shadow-sm ring-1 ring-slate-200">
                  <ShieldCheck size={15} className="text-sky-600" />
                  Built for Ethiopian university students
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 shadow-sm ring-1 ring-slate-200">
                  <Star size={15} className="text-amber-500" />
                  Fast, focused, and mobile-friendly
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-6 top-10 h-24 w-24 rounded-full bg-sky-200/70 blur-2xl" />
              <div className="absolute right-2 top-24 h-28 w-28 rounded-full bg-violet-200/70 blur-2xl" />

              <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/70 p-4 shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <article className="rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-50 to-white p-5 shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                      <BookOpen size={22} />
                    </div>
                    <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Study Hub</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">All resources in one place</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Notes, tests, and past papers arranged for quick access.</p>
                  </article>

                  <article className="rounded-3xl border border-slate-200 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                      <Brain size={22} />
                    </div>
                    <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">AI Guide</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">Smarter recommendations</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Get suggestions based on what you still need to master.</p>
                  </article>
                </div>

                <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Current focus</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">Practice tests and exam readiness</p>
                    </div>
                    <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Ready for deployment
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-end justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">Features</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  Everything you need to study effectively
                </h2>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <article
                    key={feature.title}
                    className="group rounded-[1.75rem] border border-white/80 bg-white/75 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_65px_rgba(59,130,246,0.12)]"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white transition group-hover:scale-105">
                      <Icon size={22} />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold text-slate-950">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{feature.description}</p>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
            <div className="rounded-[2rem] border border-white/80 bg-white/75 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">How it works</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  A simple path from signup to exam readiness
                </h2>
              </div>

              <div className="mt-8 grid gap-4 lg:grid-cols-3">
                {steps.map((step) => (
                  <article key={step.title} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:-translate-y-1">
                    <div className="flex items-center gap-4">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-lg font-bold text-white">
                        {step.icon}
                      </div>
                      <div className="h-px flex-1 bg-slate-200 lg:hidden" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-slate-950">{step.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{step.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-r from-sky-600 via-blue-600 to-violet-600 px-6 py-10 shadow-[0_24px_70px_rgba(37,99,235,0.22)] sm:px-10 sm:py-12">
              <div className="absolute -right-8 top-0 h-36 w-36 rounded-full bg-white/15 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
              <div className="relative flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
                <div className="max-w-2xl text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/75">Call to action</p>
                  <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                    Start preparing today and improve your chances of passing your exit exam
                  </h2>
                </div>

                <Link
                  to={getStartedHref}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-slate-100"
                >
                  Get Started
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default HomePage;