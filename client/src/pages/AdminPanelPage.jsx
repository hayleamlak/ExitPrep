import { useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const emptyForm = {
  title: "",
  course: "",
  department: "",
  year: "",
  rating: ""
};

function AdminPanelPage() {
  const [form, setForm] = useState(emptyForm);
  const [pdfFile, setPdfFile] = useState(null);
  const [status, setStatus] = useState("");
  const { user } = useAuth();

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
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
      payload.append("title", form.title);
      payload.append("course", form.course);
      payload.append("department", form.department);
      payload.append("year", form.year);
      if (form.rating) {
        payload.append("rating", form.rating);
      }
      payload.append("file", pdfFile);

      await api.post("/resources", payload);
      setForm(emptyForm);
      setPdfFile(null);
      setStatus("Resource uploaded successfully.");
    } catch (err) {
      setStatus(err.response?.data?.message || "Upload failed.");
    }
  };

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-white">Admin Panel</h2>
        <p className="mt-2 text-slate-300">Upload study PDFs by course, department, and year.</p>
        <p className="mt-2 text-sm text-slate-400">Signed in as {user?.name || "an admin"}.</p>
      </div>

      <form onSubmit={submitResource} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        {Object.keys(emptyForm).map((field) => (
          <label key={field} className="block">
            <span className="mb-1 block text-sm font-semibold capitalize text-slate-300">{field}</span>
            <input
              type={field === "rating" ? "number" : "text"}
              min={field === "rating" ? "0" : undefined}
              max={field === "rating" ? "5" : undefined}
              step={field === "rating" ? "0.1" : undefined}
              value={form[field]}
              onChange={(event) => updateField(field, event.target.value)}
              className="w-full rounded-lg border border-white/15 bg-[#0e1730] px-3 py-2 text-slate-100"
              placeholder={`Enter ${field}`}
              required={field !== "rating"}
            />
          </label>
        ))}

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-slate-300">PDF File</span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) => setPdfFile(event.target.files?.[0] || null)}
            className="w-full rounded-lg border border-white/15 bg-[#0e1730] px-3 py-2 text-slate-100 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-500 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-950"
            required
          />
          <p className="mt-1 text-xs text-slate-400">
            Only PDF files are allowed.
          </p>
        </label>

        <button type="submit" className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-900">
          Upload Resource
        </button>

        {status ? <p className="text-sm text-slate-300">{status}</p> : null}
      </form>
    </section>
  );
}

export default AdminPanelPage;
