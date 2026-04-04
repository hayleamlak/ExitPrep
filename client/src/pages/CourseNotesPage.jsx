import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, FileText, Search } from "lucide-react";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";

function CourseNotesPage() {
  const { isDark } = useTheme();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedNoteId, setExpandedNoteId] = useState("");

  useEffect(() => {
    async function fetchNotes() {
      try {
        const response = await api.get("/notes");
        setNotes(Array.isArray(response.data) ? response.data : []);
      } catch (_error) {
        setNotes([]);
      } finally {
        setLoading(false);
      }
    }

    fetchNotes();
  }, []);

  const filteredNotes = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return notes;
    }

    return notes.filter((note) => {
      const name = String(note?.name || "").toLowerCase();
      const course = String(note?.course || "").toLowerCase();
      return name.includes(term) || course.includes(term);
    });
  }, [notes, search]);

  const toggleExpanded = (noteId) => {
    setExpandedNoteId((current) => (current === noteId ? "" : noteId));
  };

  const palette = isDark
    ? {
        title: "text-white",
        description: "text-slate-400",
        divider: "border-white/10",
        searchInput:
          "border-white/10 bg-white/5 text-slate-200 placeholder:text-slate-500 focus:border-white/25",
        listWrap: "border-white/10 bg-[#0d1326]",
        card: "border-white/10 bg-white/5",
        name: "text-slate-100",
        meta: "text-slate-400",
        content: "text-slate-300",
        emptyText: "text-slate-500"
      }
    : {
        title: "text-slate-900",
        description: "text-slate-600",
        divider: "border-slate-200",
        searchInput:
          "border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:border-slate-500",
        listWrap: "border-slate-200 bg-white",
        card: "border-slate-200 bg-slate-50",
        name: "text-slate-900",
        meta: "text-slate-500",
        content: "text-slate-700",
        emptyText: "text-slate-500"
      };

  return (
    <section className="space-y-6">
      <div className={`flex flex-wrap items-start justify-between gap-4 border-b pb-6 ${palette.divider}`}>
        <div>
          <h1 className={`typo-page-title ${palette.title}`}>Notes</h1>
          <p className={`mt-1 typo-page-subtitle ${palette.description}`}>
            Click a course name to open its note. Notes are generated automatically after a course upload.
          </p>
        </div>

        <label className="relative block w-full max-w-xs">
          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by course name..."
            className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none ${palette.searchInput}`}
          />
        </label>
      </div>

      {loading ? <p className={`text-sm ${palette.emptyText}`}>Loading notes...</p> : null}

      <div className={`space-y-3 rounded-2xl border p-3 ${palette.listWrap}`}>
        {filteredNotes.map((note) => (
          <article key={note._id} className={`rounded-xl border p-4 ${palette.card}`}>
            <button
              type="button"
              onClick={() => toggleExpanded(note._id)}
              className="flex w-full items-start gap-3 text-left"
            >
              <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-500/15 text-blue-400">
                <FileText size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className={`truncate typo-section-title ${palette.name}`}>{note.name || note.course}</h2>
                <p className={`mt-1 text-xs ${palette.meta}`}>Updated: {new Date(note.updatedAt).toLocaleString()}</p>
              </div>
              <span className={`${palette.meta}`}>
                {expandedNoteId === note._id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </span>
            </button>

            {expandedNoteId === note._id ? (
              <pre className={`mt-3 whitespace-pre-wrap text-sm leading-6 ${palette.content}`}>{note.content}</pre>
            ) : null}
          </article>
        ))}

        {!loading && filteredNotes.length === 0 ? (
          <p className={`px-2 py-4 text-sm ${palette.emptyText}`}>
            No notes found yet. Upload a course PDF from admin to auto-generate notes.
          </p>
        ) : null}
      </div>
    </section>
  );
}

export default CourseNotesPage;
