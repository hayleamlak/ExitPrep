import { useEffect, useState } from "react";
import { Download, ExternalLink, FileText, Search, Star } from "lucide-react";
import api from "../services/api";

const fallbackTopics = [
  {
    id: "t1",
    title: "Automata and Complexity Theory",
    description: "Finite automata, formal languages, and computational complexity.",
    completed: 0,
    total: 0
  },
  {
    id: "t2",
    title: "Compiler Design",
    description: "Lexical analysis, parsing, semantic analysis, and code generation.",
    completed: 0,
    total: 0
  },
  {
    id: "t3",
    title: "Computer and Network Security",
    description: "Security principles, cryptography basics, and network protection.",
    completed: 4,
    total: 7
  },
  {
    id: "t4",
    title: "Computer Organization and Architecture",
    description: "CPU design, memory hierarchy, instruction sets, and hardware basics.",
    completed: 0,
    total: 0
  },
  {
    id: "t5",
    title: "Data Communication and Networking",
    description: "Networking fundamentals, protocols, OSI model, and data transmission.",
    completed: 0,
    total: 6
  },
  {
    id: "t6",
    title: "Data Structure & Algorithm",
    description: "Efficient data structures, algorithms, and performance analysis.",
    completed: 1,
    total: 8
  },
  {
    id: "t7",
    title: "Database Management Systems",
    description: "Fundamental and advanced database concepts including SQL, normalization, and distributed systems.",
    completed: 0,
    total: 9
  },
  {
    id: "t8",
    title: "Internet Programming",
    description: "Web development fundamentals including HTML, CSS, JavaScript, and basic web architectures.",
    completed: 4,
    total: 7
  },
  {
    id: "t9",
    title: "Introduction to Algorithms",
    description: "Algorithm design techniques and basic time-space complexity analysis.",
    completed: 0,
    total: 6
  },
  {
    id: "t10",
    title: "Introduction to Artificial Intelligence",
    description: "Search techniques, basic machine learning, and intelligent agents.",
    completed: 0,
    total: 8
  },
  {
    id: "t11",
    title: "Network and System Administration",
    description: "System setup, user management, monitoring, and maintenance.",
    completed: 0,
    total: 5
  },
  {
    id: "t12",
    title: "Object Oriented Programming",
    description: "Advanced OOP concepts, Java, Inheritance, Polymorphism, and Threads.",
    completed: 0,
    total: 5
  },
  {
    id: "t13",
    title: "Operating System",
    description: "Processes, memory management, file systems, and concurrency.",
    completed: 0,
    total: 5
  },
  {
    id: "t14",
    title: "Programming Fundamentals",
    description: "Basic programming concepts, C++, OOP (C++), and file handling.",
    completed: 0,
    total: 9
  },
  {
    id: "t15",
    title: "Software Engineering",
    description: "Software development life cycle, design, testing, and maintenance.",
    completed: 2,
    total: 6
  }
];

function StudyNotesPage() {
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

  const mappedTopics =
    resources.length > 0
      ? resources.map((resource) => ({
          id: resource._id,
          title: resource.title,
          year: resource.year,
          description: `${resource.course} | ${resource.department} | Year ${resource.year}`,
          fileUrl: resource.fileUrl,
          rating: typeof resource.rating === "number" ? resource.rating : 4.6,
          downloads: typeof resource.downloads === "number" ? resource.downloads : 0,
          isUploaded: true
        }))
      : fallbackTopics;

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
    if (!topic.fileUrl || !topic.isUploaded) {
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

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Notes</h1>
          <p className="mt-1 text-sm sm:text-base text-slate-400">
            Study subject-specific notes and chapters tailored for the national exit exam.
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
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-white/25"
          />
        </label>
      </div>

      {loading ? <p className="text-sm text-slate-500">Loading notes...</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredTopics.map((topic) => (
          <article key={topic.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="grid h-18 w-18 place-items-center rounded-2xl bg-blue-500/20 text-blue-300">
                <FileText size={32} />
              </div>
              <span className="rounded-lg bg-emerald-500/20 px-3 py-1 text-sm font-semibold text-emerald-300">
                Notes
              </span>
            </div>

            <h3 className="mt-6 min-h-16 text-2xl font-semibold tracking-tight text-white">{topic.title}</h3>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-300">
              <p className="text-lg">Year: {topic.year || "-"}</p>
              <p className="inline-flex items-center gap-1 text-lg">
                <Star size={18} className="fill-yellow-400 text-yellow-400" />
                {topic.rating ? topic.rating.toFixed(1) : "4.6"}
              </p>
            </div>

            <p className="mt-5 text-lg text-slate-400">{topic.downloads || 0} downloads</p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => topic.fileUrl && openInNewTab(topic.fileUrl)}
                disabled={!topic.fileUrl}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ExternalLink size={16} />
                Open
              </button>

              <button
                type="button"
                onClick={() => startDownload(topic)}
                disabled={!topic.fileUrl || busyResourceId === topic.id || !topic.isUploaded}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download size={16} />
                {busyResourceId === topic.id ? "Saving..." : "Download"}
              </button>
            </div>

            <p className="mt-4 text-sm text-slate-500">{topic.description}</p>
          </article>
        ))}
      </div>

      {!loading && filteredTopics.length === 0 ? <p className="text-sm text-slate-500">No notes matched your search.</p> : null}
    </section>
  );
}

export default StudyNotesPage;
