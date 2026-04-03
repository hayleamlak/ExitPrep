import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CloudUpload,
  Download,
  FileText,
  FolderInput,
  GraduationCap,
  ListFilter,
  Mail,
  Megaphone,
  PenSquare,
  LogOut,
  Search,
  ShieldCheck,
  Sparkles,
  ToggleLeft,
  Trash2,
  Users
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const emptyUploadForm = {
  course: "",
  topic: ""
};

const emptyBulkQuestionForm = {
  courseName: ""
};

const adminFeatureNav = [
  { id: "users", label: "User Management", icon: Users },
  { id: "resources", label: "Resource Management", icon: BookOpen },
  { id: "exams", label: "Exam & Quiz", icon: GraduationCap },
  { id: "analytics", label: "Dashboard & Analytics", icon: BarChart3 },
  { id: "moderation", label: "Content Moderation", icon: ShieldCheck },
  { id: "notifications", label: "Notifications & Alerts", icon: Mail },
  { id: "settings", label: "System Settings", icon: ToggleLeft }
];

function AdminPanelPage() {
  const { signOut, user } = useAuth();
  const { isDark } = useTheme();
  const [activeSection, setActiveSection] = useState("users");
  const [uploadForm, setUploadForm] = useState(emptyUploadForm);
  const [pdfFile, setPdfFile] = useState(null);
  const [bulkQuestionForm, setBulkQuestionForm] = useState(emptyBulkQuestionForm);
  const [questionFile, setQuestionFile] = useState(null);
  const [questionPreview, setQuestionPreview] = useState([]);
  const [questionUploadProgress, setQuestionUploadProgress] = useState(0);
  const [questionUploadState, setQuestionUploadState] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sectionErrors, setSectionErrors] = useState({ users: "", resources: "", questions: "", exams: "" });
  const [filter, setFilter] = useState("");
  const [users, setUsers] = useState([]);
  const [resources, setResources] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [exams, setExams] = useState([]);
  const [overview, setOverview] = useState(null);
  const questionFileInputRef = useRef(null);

  const palette = isDark
    ? {
        pageTitle: "text-white",
        pageSub: "text-slate-400",
        shell: "border-white/10 bg-[#0b1020]",
        softCardAlt: "border-white/10 bg-[#10182c]",
        heading: "text-white",
        text: "text-slate-300",
        muted: "text-slate-400",
        border: "border-white/10",
        input:
          "border-white/10 bg-[#0e1730] text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/50",
        control: "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10",
        controlActive: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
        tableHead: "text-slate-400",
        row: "border-white/10 hover:bg-white/5",
        badgeSoft: "border-white/10 bg-white/5 text-slate-200",
        badgeAccent: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
        badgeWarn: "border-amber-400/20 bg-amber-400/10 text-amber-200",
        statBg: "bg-white/5",
        statLabel: "text-slate-400",
        statValue: "text-white",
        accent: "text-cyan-300",
        btnPrimary: "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
      }
    : {
        pageTitle: "text-slate-950",
        pageSub: "text-slate-600",
        shell: "border-slate-200 bg-white",
        softCardAlt: "border-slate-200 bg-slate-50",
        heading: "text-slate-950",
        text: "text-slate-600",
        muted: "text-slate-500",
        border: "border-slate-200",
        input:
          "border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-sky-400",
        control: "border-slate-200 bg-white text-slate-600 hover:bg-slate-100",
        controlActive: "border-sky-300 bg-sky-50 text-sky-700",
        tableHead: "text-slate-500",
        row: "border-slate-200 hover:bg-slate-50",
        badgeSoft: "border-slate-200 bg-white text-slate-600",
        badgeAccent: "border-sky-300 bg-sky-50 text-sky-700",
        badgeWarn: "border-amber-300 bg-amber-50 text-amber-700",
        statBg: "bg-slate-50",
        statLabel: "text-slate-500",
        statValue: "text-slate-950",
        accent: "text-sky-600",
        btnPrimary: "bg-slate-950 text-white hover:bg-slate-800"
      };

  const uploadStats = useMemo(
    () => [
      { label: "PDF uploads", value: String(resources.length), icon: FileText },
      { label: "Bulk upload", value: "Ready", icon: FolderInput },
      { label: "Tagging", value: "Enabled", icon: ListFilter },
      { label: "Questions", value: String(questions.length), icon: Download }
    ],
    [questions.length, resources.length]
  );

  const analyticsItems = useMemo(() => {
    const totalUsers = overview?.totalUsers ?? users.length;
    const activeUsers = overview?.activeUsers ?? users.filter((entry) => !entry.isSuspended).length;
    const newSignups = overview?.recentSignups ?? 0;
    const downloads = resources.reduce((sum, item) => sum + (Number(item.downloads) || 0), 0);

    return [
      { label: "Total users", value: String(totalUsers), delta: `${activeUsers} active` },
      { label: "Active users", value: String(activeUsers), delta: `${overview?.suspendedUsers ?? Math.max(totalUsers - activeUsers, 0)} suspended` },
      { label: "New signups", value: String(newSignups), delta: "last 7 days" },
      { label: "Downloads", value: String(downloads), delta: "total resources" }
    ];
  }, [overview, resources, users]);

  const topResource = useMemo(() => {
    if (!resources.length) {
      return "No resources yet";
    }

    const sorted = [...resources].sort((a, b) => (Number(b.downloads) || 0) - (Number(a.downloads) || 0));
    return sorted[0]?.title || "No resources yet";
  }, [resources]);

  const filteredUsers = useMemo(() => {
    const term = filter.toLowerCase();
    return users.filter((entry) => {
      const haystack = `${entry.name} ${entry.email} ${entry.role} ${entry.status || ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [filter, users]);

  const activeSectionTitle = adminFeatureNav.find((entry) => entry.id === activeSection)?.label || "Admin";

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");
      setSectionErrors({ users: "", resources: "", questions: "", exams: "" });

      try {
        const [overviewRes, usersRes, resourcesRes, questionsRes, examsRes] = await Promise.allSettled([
          api.get("/admin/overview"),
          api.get("/admin/users"),
          api.get("/resources"),
          api.get("/questions"),
          api.get("/exams")
        ]);

        if (overviewRes.status === "fulfilled") {
          setOverview(overviewRes.value.data || null);
        }

        if (usersRes.status === "fulfilled") {
          setUsers(Array.isArray(usersRes.value.data) ? usersRes.value.data : []);
        } else {
          setSectionErrors((current) => ({
            ...current,
            users: usersRes.reason?.response?.data?.message || "Users data could not be loaded."
          }));
        }

        if (resourcesRes.status === "fulfilled") {
          setResources(Array.isArray(resourcesRes.value.data) ? resourcesRes.value.data : []);
        } else {
          setSectionErrors((current) => ({
            ...current,
            resources: resourcesRes.reason?.response?.data?.message || "Resources data could not be loaded."
          }));
        }

        if (questionsRes.status === "fulfilled") {
          setQuestions(Array.isArray(questionsRes.value.data) ? questionsRes.value.data : []);
        } else {
          setSectionErrors((current) => ({
            ...current,
            questions: questionsRes.reason?.response?.data?.message || "Questions data could not be loaded."
          }));
        }

        if (examsRes.status === "fulfilled") {
          setExams(Array.isArray(examsRes.value.data) ? examsRes.value.data : []);
        } else {
          setSectionErrors((current) => ({
            ...current,
            exams: examsRes.reason?.response?.data?.message || "Exams data could not be loaded."
          }));
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const updateUploadField = (field, value) => {
    setUploadForm((current) => ({ ...current, [field]: value }));
  };

  const submitResource = async (event) => {
    event.preventDefault();

    if (!pdfFile) {
      setStatus("Please select a PDF file from your device.");
      return;
    }

    setStatus("Uploading...");

    try {
      const payload = new FormData();
      payload.append("course", uploadForm.course);
      payload.append("title", uploadForm.course);
      payload.append("department", "General");
      payload.append("year", "N/A");
      payload.append("rating", "4.6");
      payload.append("file", pdfFile);
      payload.append("tags", uploadForm.topic ? uploadForm.topic : "");

      await api.post("/resources", payload);
      setUploadForm(emptyUploadForm);
      setPdfFile(null);
      const refresh = await api.get("/resources");
      setResources(Array.isArray(refresh.data) ? refresh.data : []);
      setStatus("Resource uploaded successfully.");
    } catch (err) {
      setStatus(err.response?.data?.message || "Upload failed.");
    }
  };

  const parseBulkQuestionFile = async (file) => {
    if (!file) {
      setQuestionFile(null);
      setQuestionPreview([]);
      setQuestionUploadState("");
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const items = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.questions) ? parsed.questions : [];

      if (!items.length) {
        setQuestionFile(null);
        setQuestionPreview([]);
        setQuestionUploadState("The JSON file must contain an array of questions.");
        return;
      }

      setQuestionFile(file);
      setQuestionPreview(items.slice(0, 3));
      setQuestionUploadState(`Loaded ${items.length} questions from file.`);
    } catch (_error) {
      setQuestionFile(null);
      setQuestionPreview([]);
      setQuestionUploadState("Invalid JSON file. Please upload a valid question array.");
    }
  };

  const validateBulkQuestionItems = (items) => {
    return items.map((item, index) => {
      const courseName = typeof item?.courseName === "string" ? item.courseName.trim() : "";
      const questionText = typeof item?.questionText === "string" ? item.questionText.trim() : "";
      const options = Array.isArray(item?.options) ? item.options : [];
      const correctAnswer = typeof item?.correctAnswer === "string" ? item.correctAnswer.trim() : "";
      const explanation = typeof item?.explanation === "string" ? item.explanation.trim() : "";
      const errors = [];

      if (!courseName) errors.push("courseName is required");
      if (!questionText) errors.push("questionText is required");
      if (options.length !== 4) errors.push("options must contain exactly 4 items");
      if (!correctAnswer) errors.push("correctAnswer is required");
      if (!explanation) errors.push("explanation is required");

      return {
        index,
        errors,
        payload: {
          courseName,
          questionText,
          options,
          correctAnswer,
          explanation
        }
      };
    });
  };

  const submitBulkQuestions = async (event) => {
    event.preventDefault();

    if (!questionFile) {
      setQuestionUploadState("Please choose a JSON file first.");
      return;
    }

    setQuestionUploadState("Validating questions...");
    setQuestionUploadProgress(10);

    try {
      const parsed = JSON.parse(await questionFile.text());
      const items = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.questions) ? parsed.questions : [];
      const normalized = validateBulkQuestionItems(items);
      const invalidItems = normalized.filter((item) => item.errors.length > 0);

      if (invalidItems.length > 0) {
        setQuestionUploadProgress(0);
        setQuestionUploadState(
          `Validation failed for ${invalidItems.length} question${invalidItems.length === 1 ? "" : "s"}. Fix the file and try again.`
        );
        return;
      }

      setQuestionUploadState("Uploading questions...");

      const response = await api.post("/questions/bulk", items, {
        onUploadProgress: (event) => {
          if (!event.total) return;
          const ratio = Math.round((event.loaded / event.total) * 100);
          setQuestionUploadProgress(Math.min(95, ratio));
        }
      });

      setQuestionUploadProgress(100);
      setQuestionUploadState(response.data?.message || `Imported ${response.data?.importedCount || items.length} questions.`);
      setQuestionFile(null);
      setQuestionPreview([]);
      setBulkQuestionForm(emptyBulkQuestionForm);
      if (questionFileInputRef.current) {
        questionFileInputRef.current.value = "";
      }

      const refreshedQuestions = await api.get("/questions");
      setQuestions(Array.isArray(refreshedQuestions.data) ? refreshedQuestions.data : []);
    } catch (err) {
      setQuestionUploadProgress(0);
      setQuestionUploadState(err.response?.data?.message || "Question import failed.");
    }
  };

  const updateUserRole = async (userId, nextRole) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: nextRole });
      setUsers((current) => current.map((item) => (item.id === userId ? { ...item, role: nextRole } : item)));
    } catch (err) {
      setStatus(err.response?.data?.message || "Could not update role.");
    }
  };

  const toggleSuspension = async (userId, nextValue) => {
    try {
      await api.patch(`/admin/users/${userId}/suspension`, { isSuspended: nextValue });
      setUsers((current) =>
        current.map((item) =>
          item.id === userId
            ? {
                ...item,
                isSuspended: nextValue,
                status: nextValue ? "Suspended" : "Active"
              }
            : item
        )
      );
    } catch (err) {
      setStatus(err.response?.data?.message || "Could not update suspension.");
    }
  };

  const removeUser = async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((current) => current.filter((item) => item.id !== userId));
    } catch (err) {
      setStatus(err.response?.data?.message || "Could not delete user.");
    }
  };

  const renderSection = () => {
    if (loading) {
      return (
        <section className={`rounded-[2rem] border p-6 ${palette.shell}`}>
          <p className={`text-sm ${palette.text}`}>Loading admin data...</p>
        </section>
      );
    }

    if (error) {
      return (
        <section className={`rounded-[2rem] border p-6 ${palette.shell}`}>
          <p className={`rounded-xl border px-3 py-2 text-sm ${palette.badgeWarn}`}>{error}</p>
        </section>
      );
    }

    const sectionError = sectionErrors[activeSection] || "";

    if (activeSection === "users") {
      return (
        <section className={`rounded-[2rem] border p-6 ${palette.shell}`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${palette.muted}`}>User Management</p>
              <h3 className={`mt-2 text-[clamp(1.1rem,1.6vw,1.35rem)] font-bold ${palette.heading}`}>Users, roles, progress, and account controls</h3>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {analyticsItems.map((item) => (
              <article key={item.label} className={`rounded-2xl border p-4 ${palette.statBg} ${palette.border}`}>
                <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${palette.statLabel}`}>{item.label}</p>
                <p className={`mt-2 text-2xl font-bold ${palette.statValue}`}>{item.value}</p>
                <p className={`mt-1 text-xs font-semibold ${palette.accent}`}>{item.delta}</p>
              </article>
            ))}
          </div>

          <div className={`mt-5 overflow-hidden rounded-2xl border ${palette.border}`}>
            {sectionError ? <p className={`border-b px-4 py-3 text-sm ${palette.badgeWarn}`}>{sectionError}</p> : null}
            <div className={`grid grid-cols-[1.3fr_0.7fr_0.6fr_1fr] gap-3 border-b px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] ${palette.tableHead} ${palette.border}`}>
              <span>User</span>
              <span>Role</span>
              <span>Progress</span>
              <span>Actions</span>
            </div>
            {filteredUsers.map((entry) => (
              <div key={entry.id} className={`grid grid-cols-[1.3fr_0.7fr_0.6fr_1fr] gap-3 border-b px-4 py-4 text-sm last:border-b-0 ${palette.row}`}>
                <div>
                  <p className={`font-semibold ${palette.heading}`}>{entry.name}</p>
                  <p className={`mt-1 text-xs ${palette.muted}`}>{entry.email}</p>
                </div>
                <div>
                  <select
                    value={entry.role}
                    onChange={(event) => updateUserRole(entry.id, event.target.value)}
                    className={`rounded-lg border px-2 py-1 text-xs ${palette.input}`}
                  >
                    <option value="student">student</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
                <div>
                  <p className={`font-semibold ${palette.heading}`}>{entry.progress || "0%"}</p>
                  <p className={`mt-1 text-xs ${palette.muted}`}>{entry.status || (entry.isSuspended ? "Suspended" : "Active")}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSuspension(entry.id, !entry.isSuspended)}
                    className={`rounded-lg border px-2 py-1 text-xs ${palette.control}`}
                  >
                    {entry.isSuspended ? "Unsuspend" : "Suspend"}
                  </button>
                  <button type="button" onClick={() => removeUser(entry.id)} className={`rounded-lg border p-2 ${palette.control}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (activeSection === "resources") {
      return (
        <section className={`rounded-[2rem] border p-6 ${palette.shell}`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${palette.muted}`}>Resource Management</p>
              <h3 className={`mt-2 text-[clamp(1.1rem,1.6vw,1.35rem)] font-bold ${palette.heading}`}>Upload, tag, edit, and track downloads</h3>
            </div>
            <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${palette.badgeAccent}`}>Live upload enabled</div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {uploadStats.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.label} className={`rounded-2xl border p-4 ${palette.softCardAlt}`}>
                  <div className="flex items-center gap-3">
                    <div className={`grid h-10 w-10 place-items-center rounded-xl ${palette.badgeAccent}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${palette.muted}`}>{item.label}</p>
                      <p className={`text-lg font-bold ${palette.heading}`}>{item.value}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <form onSubmit={submitResource} className={`mt-5 space-y-4 rounded-2xl border p-4 sm:p-5 ${palette.softCardAlt}`}>
            <label className="block">
              <span className={`mb-1.5 block text-sm font-semibold ${palette.text}`}>Course Name</span>
              <input
                type="text"
                value={uploadForm.course}
                onChange={(event) => updateUploadField("course", event.target.value)}
                placeholder="Enter course name"
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${palette.input}`}
                required
              />
            </label>

            <label className="block">
              <span className={`mb-1.5 block text-sm font-semibold ${palette.text}`}>Topic/Tags</span>
              <input
                type="text"
                value={uploadForm.topic}
                onChange={(event) => updateUploadField("topic", event.target.value)}
                placeholder="Optional tags, separated by commas"
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${palette.input}`}
              />
            </label>

            <label className="block">
              <span className={`mb-1.5 block text-sm font-semibold ${palette.text}`}>PDF File</span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => setPdfFile(event.target.files?.[0] || null)}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm file:font-semibold ${palette.input} file:bg-cyan-500 file:text-slate-950`}
                required
              />
            </label>

            <button type="submit" className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${palette.btnPrimary}`}>
              <CloudUpload size={16} />
              Upload Resource
            </button>

            {status ? <p className={`text-sm ${palette.text}`}>{status}</p> : null}
          </form>

          <div className={`mt-5 rounded-2xl border p-4 ${palette.softCardAlt}`}>
            <p className={`text-sm font-semibold uppercase tracking-[0.18em] ${palette.muted}`}>Recent resources</p>
            {sectionError ? <p className={`mt-3 rounded-xl border px-3 py-2 text-sm ${palette.badgeWarn}`}>{sectionError}</p> : null}
            <div className="mt-4 space-y-3">
              {resources.slice(0, 6).map((resource) => (
                <div key={resource._id || resource.id} className={`flex items-center justify-between gap-4 rounded-xl border px-3 py-3 ${palette.row}`}>
                  <div className="min-w-0">
                    <p className={`truncate text-sm font-semibold ${palette.heading}`}>{resource.title}</p>
                    <p className={`mt-1 text-xs ${palette.muted}`}>{resource.department} • Year {resource.year}</p>
                  </div>
                  <span className={`text-xs font-semibold ${palette.muted}`}>{resource.downloads || 0} downloads</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (activeSection === "exams") {
      return (
        <section className={`rounded-[2rem] border p-6 ${palette.shell}`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${palette.muted}`}>Exam & Quiz Management</p>
              <h3 className={`mt-2 text-[clamp(1.1rem,1.6vw,1.35rem)] font-bold ${palette.heading}`}>Bulk import questions from JSON</h3>
            </div>
            <PenSquare size={18} className={palette.accent} />
          </div>

          <div className="mt-5 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <form onSubmit={submitBulkQuestions} className={`rounded-2xl border p-4 sm:p-5 ${palette.softCardAlt}`}>
              <div className="space-y-4">
                <div>
                  <p className={`text-sm font-semibold ${palette.heading}`}>Upload format</p>
                  <p className={`mt-1 text-sm ${palette.text}`}>
                    Select a JSON file containing an array of questions. Each item should include course name, question text, 4 options, correct answer, and explanation.
                  </p>
                </div>

                <label className="block">
                  <span className={`mb-1.5 block text-sm font-semibold ${palette.text}`}>Course Name for Preview</span>
                  <input
                    type="text"
                    value={bulkQuestionForm.courseName}
                    onChange={(event) => setBulkQuestionForm({ courseName: event.target.value })}
                    placeholder="e.g. Database Systems"
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${palette.input}`}
                  />
                </label>

                <label className="block">
                  <span className={`mb-1.5 block text-sm font-semibold ${palette.text}`}>JSON File</span>
                  <input
                    ref={questionFileInputRef}
                    type="file"
                    onChange={(event) => parseBulkQuestionFile(event.target.files?.[0] || null)}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm file:font-semibold ${palette.input} file:bg-cyan-500 file:text-slate-950`}
                  />
                  <p className={`mt-1 text-xs ${palette.muted}`}>Choose any file type if needed, then the app will validate that it is valid JSON.</p>
                </label>

                <div className={`rounded-2xl border p-4 ${palette.shell}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className={`text-sm font-semibold ${palette.heading}`}>Import progress</p>
                    <p className={`text-xs font-semibold ${palette.muted}`}>{questionUploadProgress}%</p>
                  </div>
                  <div className={`mt-3 h-2 overflow-hidden rounded-full ${palette.softCardAlt}`}>
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-300"
                      style={{ width: `${questionUploadProgress}%` }}
                    />
                  </div>
                  {questionUploadState ? <p className={`mt-3 text-sm ${palette.text}`}>{questionUploadState}</p> : null}
                </div>

                <button type="submit" className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${palette.btnPrimary}`}>
                  <CloudUpload size={16} />
                  Import Questions
                </button>
              </div>
            </form>

            <div className={`rounded-2xl border p-4 sm:p-5 ${palette.softCardAlt}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className={`text-sm font-semibold ${palette.heading}`}>Preview</p>
                  <p className={`text-xs ${palette.muted}`}>{questionPreview.length ? `${questionPreview.length} sample questions loaded` : "No file loaded yet"}</p>
                </div>
                <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${palette.badgeAccent}`}>{sectionError ? "Check file" : "Ready"}</div>
              </div>

              {sectionError ? <p className={`mt-4 rounded-xl border px-3 py-2 text-sm ${palette.badgeWarn}`}>{sectionError}</p> : null}

              <div className="mt-4 space-y-3">
                {questionPreview.length ? (
                  questionPreview.map((item, index) => (
                    <article key={`${item.questionText || "sample"}-${index}`} className={`rounded-2xl border p-4 ${palette.shell}`}>
                      <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${palette.muted}`}>{item.courseName || bulkQuestionForm.courseName || "Course"}</p>
                      <p className={`mt-2 text-sm font-semibold ${palette.heading}`}>{item.questionText || "Question text"}</p>
                      <p className={`mt-2 text-xs ${palette.text}`}>{Array.isArray(item.options) ? item.options.join(" • ") : "4 options expected"}</p>
                    </article>
                  ))
                ) : (
                  <div className={`rounded-2xl border border-dashed p-6 text-sm ${palette.text}`}>
                    Upload a JSON file to see a preview of the first questions before importing.
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-2xl border p-4">
                <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${palette.muted}`}>Expected JSON item</p>
                <pre className={`mt-3 overflow-x-auto text-xs leading-6 ${palette.text}`}>
{`{
  "courseName": "Database Systems",
  "questionText": "What is a primary key?",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": "A",
  "explanation": "A primary key uniquely identifies each row."
}`}
                </pre>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${palette.muted}`}>Existing quizzes and exams</p>
                <p className={`mt-1 text-sm ${palette.text}`}>This stays as a live reference list from your backend.</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${palette.badgeSoft}`}>{exams.length} items</span>
            </div>

            <div className="space-y-3">
              {sectionError ? <p className={`rounded-xl border px-3 py-2 text-sm ${palette.badgeWarn}`}>{sectionError}</p> : null}
              {exams.map((exam) => (
                <article key={exam._id || exam.id} className={`rounded-2xl border p-4 ${palette.softCardAlt}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={`font-semibold ${palette.heading}`}>{exam.examName}</p>
                      <p className={`mt-1 text-xs ${palette.muted}`}>{Array.isArray(exam.questions) ? exam.questions.length : 0} questions</p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${palette.badgeSoft}`}>{exam.duration} min</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (activeSection === "analytics") {
      return (
        <section className={`rounded-[2rem] border p-6 ${palette.shell}`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${palette.muted}`}>Dashboard & Analytics</p>
              <h3 className={`mt-2 text-[clamp(1.1rem,1.6vw,1.35rem)] font-bold ${palette.heading}`}>Usage trends and weak topics</h3>
            </div>
            <BarChart3 size={18} className={palette.accent} />
          </div>

          <div className="mt-4 space-y-3">
            {sectionError ? <p className={`rounded-xl border px-3 py-2 text-sm ${palette.badgeWarn}`}>{sectionError}</p> : null}
            {[
              `Questions in bank: ${overview?.questionsCount ?? questions.length}`,
              `Most popular resource: ${overview?.topResources?.[0]?.title || topResource}`,
              `Total exams configured: ${overview?.examsCount ?? exams.length}`,
              `Suspended users: ${overview?.suspendedUsers ?? users.filter((entry) => entry.isSuspended).length}`
            ].map((item) => (
              <div key={item} className={`flex items-center gap-3 rounded-2xl border px-3 py-3 ${palette.softCardAlt}`}>
                <div className={`grid h-9 w-9 place-items-center rounded-xl ${palette.badgeAccent}`}>
                  <Sparkles size={15} />
                </div>
                <p className={`text-sm font-semibold ${palette.text}`}>{item}</p>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (activeSection === "moderation") {
      return (
        <section className={`rounded-[2rem] border p-6 ${palette.shell}`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${palette.muted}`}>Content Moderation</p>
              <h3 className={`mt-2 text-[clamp(1.1rem,1.6vw,1.35rem)] font-bold ${palette.heading}`}>Moderation and approval queue</h3>
            </div>
            <ShieldCheck size={18} className={palette.accent} />
          </div>
          <div className="mt-4 space-y-3">
            {sectionError ? <p className={`rounded-xl border px-3 py-2 text-sm ${palette.badgeWarn}`}>{sectionError}</p> : null}
            {resources.slice(0, 6).map((resource) => (
              <div key={resource._id || resource.id} className={`flex items-center justify-between rounded-2xl border px-3 py-3 ${palette.softCardAlt}`}>
                <div>
                  <p className={`font-semibold ${palette.heading}`}>{resource.title}</p>
                  <p className={`text-xs ${palette.muted}`}>{resource.department} • {resource.course}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className={`rounded-lg border px-2 py-1 text-xs ${palette.control}`}>Approve</button>
                  <button type="button" className={`rounded-lg border px-2 py-1 text-xs ${palette.control}`}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (activeSection === "notifications") {
      return (
        <section className={`rounded-[2rem] border p-6 ${palette.shell}`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${palette.muted}`}>Notifications & Alerts</p>
              <h3 className={`mt-2 text-[clamp(1.1rem,1.6vw,1.35rem)] font-bold ${palette.heading}`}>Broadcasts, reminders, and summaries</h3>
            </div>
            <Mail size={18} className={palette.accent} />
          </div>
          <div className="mt-4 space-y-3">
            {sectionError ? <p className={`rounded-xl border px-3 py-2 text-sm ${palette.badgeWarn}`}>{sectionError}</p> : null}
            {[
              "Notify users about new resources",
              "Send exam alerts",
              "Configure daily/weekly summaries",
              "Prepare push controls for PWA"
            ].map((item) => (
              <div key={item} className={`flex items-center gap-3 rounded-2xl border px-3 py-3 ${palette.softCardAlt}`}>
                <div className={`grid h-9 w-9 place-items-center rounded-xl ${palette.badgeAccent}`}>
                  <Megaphone size={15} />
                </div>
                <p className={`text-sm font-semibold ${palette.text}`}>{item}</p>
              </div>
            ))}
          </div>
        </section>
      );
    }

    return (
      <section className={`rounded-[2rem] border p-6 ${palette.shell}`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${palette.muted}`}>System Settings</p>
            <h3 className={`mt-2 text-[clamp(1.1rem,1.6vw,1.35rem)] font-bold ${palette.heading}`}>Theme defaults and platform configuration</h3>
          </div>
          <ToggleLeft size={18} className={palette.accent} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            "Toggle default light/dark mode",
            "Manage departments, courses, topics",
            "Configure AI summary and quiz tools",
            "Backup and restore planning"
          ].map((item) => (
            <div key={item} className={`rounded-2xl border px-3 py-3 ${palette.softCardAlt}`}>
              <p className={`text-sm font-semibold ${palette.text}`}>{item}</p>
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <section className="-mx-4 space-y-6 sm:-mx-6">
      <div className="grid gap-6 xl:grid-cols-[300px_1fr] xl:items-start">
        <aside className={`rounded-none border-x-0 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:rounded-[2rem] sm:border xl:sticky xl:left-0 xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto xl:overscroll-contain xl:self-start ${palette.shell}`}>
          <p className={`px-2 text-[11px] font-semibold uppercase tracking-[0.22em] ${palette.muted}`}>Admin Features</p>
          <nav className="mt-3 space-y-2">
            {adminFeatureNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    isActive ? palette.controlActive : palette.control
                  }`}
                >
                  <Icon size={16} className="transition-transform duration-200 group-hover:scale-110" />
                  <span className="text-[clamp(0.85rem,0.85vw,0.98rem)]">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className={`mt-4 rounded-2xl border p-4 ${palette.softCardAlt}`}>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${palette.muted}`}>Implementation Scope</p>
            <p className={`mt-2 text-[clamp(0.8rem,0.75vw,0.92rem)] leading-6 ${palette.text}`}>
              This sidebar maps to realistic, shippable admin modules you can wire endpoint-by-endpoint.
            </p>
          </div>

          <div className={`mt-4 rounded-2xl border p-4 ${palette.softCardAlt}`}>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${palette.muted}`}>Account</p>
            <div className="mt-2">
              <p className={`text-sm font-semibold ${palette.heading}`}>{user?.name || "Admin"}</p>
              <p className={`text-xs ${palette.muted}`}>{user?.email || "Signed in account"}</p>
            </div>
            <button
              type="button"
              onClick={signOut}
              className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${palette.control}`}
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </aside>

        <div className="min-w-0 space-y-6 xl:pr-6">
          <div className={`rounded-none border-x-0 p-6 sm:rounded-[2rem] sm:border ${palette.shell}`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${palette.muted}`}>Management Overview</p>
                <h2 className={`mt-2 text-[clamp(1.35rem,2.1vw,1.75rem)] font-bold ${palette.heading}`}>{activeSectionTitle}</h2>
              </div>
              <div className="flex items-center gap-3">
                <label className="relative block w-full max-w-sm">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                    placeholder="Search users, resources, exams..."
                    className={`w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm outline-none ${palette.input}`}
                  />
                </label>
              </div>
            </div>
          </div>

          {renderSection()}

          <div className={`rounded-none border-x-0 p-6 sm:rounded-[2rem] sm:border ${palette.shell}`}>
            <div className="flex items-center gap-3">
              <AlertTriangle size={18} className={palette.accent} />
              <p className={`text-sm font-semibold uppercase tracking-[0.18em] ${palette.muted}`}>Integration note</p>
            </div>
            <p className={`mt-3 text-sm leading-7 ${palette.text}`}>
              User management, analytics, moderation, and notification blocks are wired to real backend data where routes exist.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdminPanelPage;
