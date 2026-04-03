import { useMemo, useState } from "react";
import { ArrowRight, Search, Share2 } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const questionTopics = [
  {
    id: "q1",
    title: "Automata and Complexity Theory",
    description: "Finite automata, formal languages, and computational complexity.",
    completed: 0,
    total: 29
  },
  {
    id: "q2",
    title: "Compiler Design",
    description: "Lexical analysis, parsing, semantic analysis, and code generation.",
    completed: 0,
    total: 30
  },
  {
    id: "q3",
    title: "Computer and Network Security",
    description: "Security principles, cryptography basics, and network protection.",
    completed: 0,
    total: 30
  },
  {
    id: "q4",
    title: "Computer Organization and Architecture",
    description: "CPU design, memory hierarchy, instruction sets, and hardware basics.",
    completed: 0,
    total: 30
  },
  {
    id: "q5",
    title: "Data Communication and Networking",
    description: "Networking fundamentals, protocols, OSI model, and data transmission.",
    completed: 0,
    total: 95
  },
  {
    id: "q6",
    title: "Data Structure & Algorithm",
    description: "Efficient data structures, algorithms, and performance analysis.",
    completed: 0,
    total: 75
  },
  {
    id: "q7",
    title: "Database Management Systems",
    description: "Fundamental and advanced database concepts including SQL, normalization, and distributed systems.",
    completed: 0,
    total: 60
  },
  {
    id: "q8",
    title: "Internet Programming",
    description: "Web development fundamentals including HTML, CSS, JavaScript, and basic web architectures.",
    completed: 0,
    total: 45
  },
  {
    id: "q9",
    title: "Introduction to Algorithms",
    description: "Algorithm design techniques and basic time-space complexity analysis.",
    completed: 0,
    total: 21
  },
  {
    id: "q10",
    title: "Introduction to Artificial Intelligence",
    description: "Search techniques, basic machine learning, and intelligent agents.",
    completed: 0,
    total: 30
  },
  {
    id: "q11",
    title: "Network and System Administration",
    description: "System setup, user management, monitoring, and maintenance.",
    completed: 0,
    total: 151
  },
  {
    id: "q12",
    title: "Object Oriented Programming",
    description: "Advanced OOP concepts, Java, Inheritance, Polymorphism, and Threads.",
    completed: 0,
    total: 23
  },
  {
    id: "q13",
    title: "Operating System",
    description: "Processes, memory management, file systems, and concurrency.",
    completed: 0,
    total: 54
  },
  {
    id: "q14",
    title: "Programming Fundamentals",
    description: "Basic programming concepts, C++, OOP (C++), and file handling.",
    completed: 0,
    total: 37
  },
  {
    id: "q15",
    title: "Software Engineering",
    description: "Software development life cycle, design, testing, and maintenance.",
    completed: 0,
    total: 30
  }
];

function PracticeQuestionsPage() {
  const { isDark } = useTheme();
  const [search, setSearch] = useState("");

  const filteredTopics = useMemo(
    () =>
      questionTopics.filter(
        (topic) =>
          topic.title.toLowerCase().includes(search.toLowerCase()) ||
          topic.description.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  );

  const palette = isDark
    ? {
        title: "text-white",
        description: "text-slate-400",
        divider: "border-white/10",
        searchInput:
          "border-white/10 bg-white/5 text-slate-200 placeholder:text-slate-500 focus:border-white/25",
        listWrap: "border-white/10 bg-[#0d1326]",
        rowDivider: "border-white/10",
        dotInactive: "bg-slate-600",
        dotActive: "bg-blue-500",
        topicTitle: "text-slate-50",
        topicDescription: "text-slate-400",
        shareButton:
          "border-white/10 bg-white/5 text-slate-300 group-hover:border-white/20 group-hover:bg-white/10",
        ratio: "text-slate-400",
        arrowButton: "border-white/10 text-slate-500",
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
        dotInactive: "bg-slate-300",
        dotActive: "bg-sky-500",
        topicTitle: "text-slate-900",
        topicDescription: "text-slate-500",
        shareButton:
          "border-slate-300 bg-slate-50 text-slate-600 group-hover:border-slate-400 group-hover:bg-slate-100",
        ratio: "text-slate-600",
        arrowButton: "border-slate-300 text-slate-500",
        emptyText: "text-slate-500"
      };

  return (
    <section className="space-y-6">
      <div className={`flex flex-wrap items-start justify-between gap-4 border-b pb-6 ${palette.divider}`}>
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${palette.title}`}>Questions</h1>
          <p className={`mt-1 text-sm sm:text-base ${palette.description}`}>
            Practice with real national exit exam questions to verify and increase your subject mastery.
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

      <div className={`overflow-hidden rounded-2xl border ${palette.listWrap}`}>
        {filteredTopics.map((topic, index) => (
          <div
            key={topic.id}
            className={`group flex flex-wrap items-center gap-3 border-b px-4 py-4 sm:px-5 sm:py-5 last:border-b-0 ${palette.rowDivider}`}
          >
            <div
              className={[
                "h-2.5 w-2.5 shrink-0 rounded-full",
                index === 2 ? palette.dotActive : palette.dotInactive
              ].join(" ")}
            />

            <div className="min-w-0 flex-1 basis-full sm:basis-auto">
              <p className={`truncate text-lg sm:text-xl font-semibold tracking-tight ${palette.topicTitle}`}>{topic.title}</p>
              <p className={`mt-1 truncate text-sm sm:text-base ${palette.topicDescription}`}>{topic.description}</p>
            </div>

            <button
              type="button"
              className={`grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl border transition ${palette.shareButton}`}
            >
              <Share2 size={16} />
            </button>

            <p className={`w-16 sm:w-20 text-center text-base sm:text-lg font-medium ${palette.ratio}`}>
              {topic.completed}/{topic.total}
            </p>

            <button
              type="button"
              className={`rounded-full border p-2 ${palette.arrowButton}`}
              aria-label={`Open ${topic.title}`}
            >
              <ArrowRight size={16} />
            </button>
          </div>
        ))}
      </div>

      {filteredTopics.length === 0 ? <p className={`text-sm ${palette.emptyText}`}>No questions matched your search.</p> : null}
    </section>
  );
}

export default PracticeQuestionsPage;
