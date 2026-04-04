import { useEffect, useState } from "react";
import { Download, ExternalLink, FileText, Search } from "lucide-react";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";

function StudyNotesPage() {
  const { isDark } = useTheme();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busyResourceId, setBusyResourceId] = useState("");

  useEffect(() => {
    async function fetchResources() {
      try {
        const response = await api.get("/resources");
        setResources(response.data || []);
      } catch (_error) {
        setResources([]);
      } finally {
        setLoading(false);
      }
    }

    fetchResources();
  }, []);

  const mappedTopics = resources.map((resource) => ({
    id: resource._id,
    title: resource.title,
    year: resource.year,
    description: `${resource.course} | ${resource.department} | Year ${resource.year}`,
    fileUrl: resource.fileUrl,
    downloads: typeof resource.downloads === "number" ? resource.downloads : 0
  }));

  const filteredTopics = mappedTopics.filter(
    (topic) =>
      topic.title.toLowerCase().includes(search.toLowerCase()) ||
      topic.description.toLowerCase().includes(search.toLowerCase())
  );

  const openInNewTab = (url) => {
    const previewUrl = `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`;
    window.open(previewUrl, "_blank", "noopener,noreferrer");
  };

  const startDownload = async (topic) => {
    if (!topic.fileUrl) {
      return;
    }

    setBusyResourceId(topic.id);

    try {
      const response = await api.post(`/resources/${topic.id}/download`);
      const updatedDownloads = response.data?.downloads;

      if (typeof updatedDownloads === "number") {
        setResources((current) =>
          current.map((resource) =>
            resource._id === topic.id ? { ...resource, downloads: updatedDownloads } : resource
          )
        );
      }

      const anchor = document.createElement("a");
      anchor.href = topic.fileUrl;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.download = `${topic.title}.pdf`;
      anchor.click();
    } catch (_error) {
      openInNewTab(topic.fileUrl);
    } finally {
      setBusyResourceId("");
    }
  };

  const palette = isDark
    ? {
        title: "text-white",
        description: "text-slate-400",
        divider: "border-white/10",
        searchInput:
          "border-white/10 bg-white/5 text-slate-200 placeholder:text-slate-500 focus:border-white/25",
        listWrap: "border-white/10 bg-[#0d1326]",
        rowDivider: "border-white/10",
        noteTitle: "text-slate-50",
        noteMeta: "text-slate-400",
        chip: "border-cyan-400/25 bg-cyan-400/10 text-cyan-200",
        downloadCount: "text-slate-300",
        openButton: "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10",
        downloadButton: "bg-blue-500 text-white hover:bg-blue-400",
        emptyText: "text-slate-500"
      }
    : {
        title: "text-slate-900",
        description: "text-slate-600",
        divider: "border-slate-200",
        searchInput:
          "border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:border-slate-500",
        listWrap: "border-slate-200 bg-white",
        rowDivider: "border-slate-200",
        noteTitle: "text-slate-900",
        noteMeta: "text-slate-500",
        chip: "border-cyan-300 bg-cyan-50 text-cyan-700",
        downloadCount: "text-slate-700",
        openButton: "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
        downloadButton: "bg-blue-600 text-white hover:bg-blue-500",
        emptyText: "text-slate-500"
      };

  return (
    <section className="space-y-6">
      <div className={`flex flex-wrap items-start justify-between gap-4 border-b pb-6 ${palette.divider}`}>
        <div>
          <h1 className={`typo-page-title ${palette.title}`}>Course</h1>
          <p className={`mt-1 typo-page-subtitle ${palette.description}`}>
            Structured PDF course materials uploaded by admins.
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
            placeholder="Search..."
            className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none ${palette.searchInput}`}
          />
        </label>
      </div>

      {loading ? <p className={`text-sm ${palette.emptyText}`}>Loading course...</p> : null}

      <div className={`overflow-hidden rounded-2xl border ${palette.listWrap}`}>
        <div className={`hidden grid-cols-[minmax(220px,1.2fr)_minmax(210px,1fr)_110px_190px] gap-3 border-b px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] md:grid ${palette.rowDivider} ${palette.description}`}>
          <span>PDF Course</span>
          <span>Course Info</span>
          <span>Downloads</span>
          <span>Actions</span>
        </div>

        {filteredTopics.map((topic) => (
          <article
            key={topic.id}
            className={`grid gap-2.5 border-b px-4 py-3.5 last:border-b-0 md:grid-cols-[minmax(220px,1.2fr)_minmax(210px,1fr)_110px_190px] md:items-center md:gap-3 md:px-4 ${palette.rowDivider}`}
          >
            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-500/15 text-blue-400">
                <FileText size={18} />
              </div>
              <div className="min-w-0">
                <h3 className={`truncate text-sm font-semibold sm:text-base ${palette.noteTitle}`}>{topic.title}</h3>
                <p className={`mt-0.5 truncate text-xs ${palette.noteMeta}`}>Year: {topic.year || "-"}</p>
              </div>
            </div>

            <div className="min-w-0">
              <p className={`truncate text-xs ${palette.noteMeta}`}>{topic.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${palette.chip}`}>
                PDF
              </span>
              <span className={`text-xs font-semibold ${palette.downloadCount}`}>{topic.downloads} downloads</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => topic.fileUrl && openInNewTab(topic.fileUrl)}
                disabled={!topic.fileUrl}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${palette.openButton}`}
              >
                <ExternalLink size={13} />
                Open
              </button>

              <button
                type="button"
                onClick={() => startDownload(topic)}
                disabled={!topic.fileUrl || busyResourceId === topic.id}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${palette.downloadButton}`}
              >
                <Download size={13} />
                {busyResourceId === topic.id ? "Saving..." : "Download"}
              </button>
            </div>
          </article>
        ))}

        {!loading && filteredTopics.length === 0 ? (
          <p className={`px-4 py-6 text-sm md:px-5 ${palette.emptyText}`}>
            No admin-uploaded PDF course materials matched your search.
          </p>
        ) : null}
      </div>
    </section>
  );
}

export default StudyNotesPage;
