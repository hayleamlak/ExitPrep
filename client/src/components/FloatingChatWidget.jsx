import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";

const starterMessage = {
  role: "assistant",
  content: "Hi, I am your ExitPrep AI assistant. Ask me anything about study strategy, quiz prep, or difficult topics."
};

function FloatingChatWidget() {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([starterMessage]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const palette = isDark
    ? {
        launcher: "border-cyan-300/40 bg-cyan-400 text-slate-950 hover:bg-cyan-300",
        panel: "border-white/10 bg-[#0b1122]",
        heading: "text-white",
        sub: "text-slate-400",
        userBubble: "bg-cyan-400 text-slate-950",
        assistantBubble: "bg-white/10 text-slate-100",
        input: "border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500",
        send: "bg-cyan-400 text-slate-950 hover:bg-cyan-300",
        danger: "text-rose-300"
      }
    : {
        launcher: "border-sky-300 bg-sky-600 text-white hover:bg-sky-500",
        panel: "border-slate-200 bg-white",
        heading: "text-slate-900",
        sub: "text-slate-500",
        userBubble: "bg-sky-600 text-white",
        assistantBubble: "bg-slate-100 text-slate-800",
        input: "border-slate-300 bg-white text-slate-800 placeholder:text-slate-400",
        send: "bg-sky-600 text-white hover:bg-sky-500",
        danger: "text-rose-600"
      };

  const trimmedInput = useMemo(() => input.trim(), [input]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const sendMessage = async () => {
    if (!trimmedInput || loading) {
      return;
    }

    const userMessage = { role: "user", content: trimmedInput };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const history = nextMessages.slice(-10).map((item) => ({ role: item.role, content: item.content }));
      const response = await api.post("/ai/chat", {
        message: trimmedInput,
        history
      });

      const reply = response.data?.data?.reply || "I could not generate a response right now. Please try again.";
      setMessages((current) => [...current, { role: "assistant", content: String(reply) }]);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Chat request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={`fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full border shadow-[0_12px_34px_rgba(15,23,42,0.28)] transition ${palette.launcher}`}
        title="Open AI Chat"
      >
        {isOpen ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {isOpen ? (
        <section className={`fixed bottom-24 right-6 z-50 flex h-[70vh] max-h-[560px] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border shadow-[0_24px_60px_rgba(2,6,23,0.35)] ${palette.panel}`}>
          <header className="border-b border-inherit px-4 py-3">
            <h2 className={`text-sm font-semibold ${palette.heading}`}>AI Chat Assistant</h2>
            <p className={`mt-1 text-xs ${palette.sub}`}>Ask like ChatGPT for study help, explanations, and strategy.</p>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <p
                  className={[
                    "max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                    message.role === "user" ? palette.userBubble : palette.assistantBubble
                  ].join(" ")}
                >
                  {message.content}
                </p>
              </div>
            ))}
            {loading ? <p className={`text-xs ${palette.sub}`}>Assistant is typing...</p> : null}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-inherit px-3 py-3">
            {error ? <p className={`mb-2 text-xs ${palette.danger}`}>{error}</p> : null}
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type your question..."
                className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${palette.input}`}
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={!trimmedInput || loading}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition disabled:cursor-not-allowed disabled:opacity-50 ${palette.send}`}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

export default FloatingChatWidget;
