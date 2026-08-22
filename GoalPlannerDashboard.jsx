import React, { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RTooltip,
} from "recharts";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Pencil,
  Check,
  Calendar,
  Award,
  Target,
  Flame,
  Sparkles,
  X,
  Tag,
} from "lucide-react";

/* -----------------------------------------------------------
   CONFIG — categories, colors, statuses
----------------------------------------------------------- */

const CATEGORIES = [
  { id: "health", label: "Health & Fitness", color: "#34d399", ring: "ring-emerald-400", text: "text-emerald-400", bg: "bg-emerald-400" },
  { id: "career", label: "Career", color: "#22d3ee", ring: "ring-cyan-400", text: "text-cyan-400", bg: "bg-cyan-400" },
  { id: "finance", label: "Finances", color: "#facc15", ring: "ring-yellow-400", text: "text-yellow-400", bg: "bg-yellow-400" },
  { id: "relationships", label: "Relationships", color: "#c084fc", ring: "ring-purple-400", text: "text-purple-400", bg: "bg-purple-400" },
  { id: "growth", label: "Personal Growth", color: "#fb7185", ring: "ring-rose-400", text: "text-rose-400", bg: "bg-rose-400" },
];

const STATUSES = [
  { id: "not_started", label: "Not Started", color: "bg-slate-600 text-slate-200" },
  { id: "in_progress", label: "In Progress", color: "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40" },
  { id: "achieved", label: "Achieved", color: "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40" },
];

const getCategory = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];
const getStatus = (id) => STATUSES.find((s) => s.id === id) || STATUSES[0];

const uid = () => Math.random().toString(36).slice(2, 10);

/* -----------------------------------------------------------
   MOCK DATA — 3 pre-filled goals
----------------------------------------------------------- */

const initialGoals = [
  {
    id: uid(),
    title: "Run a Sub-25-Minute 5K",
    category: "health",
    reward: "New pair of trail shoes",
    deadline: "2026-11-15",
    status: "in_progress",
    reflections: {
      achieve: "Break 25 minutes on a certified 5K course.",
      why: "I want to prove my fitness rebuild is working and feel strong again.",
      measure: "Official race time or a GPS-verified solo run under 25:00.",
    },
    tasks: [
      { id: uid(), text: "Run 3x per week for 4 weeks", done: true },
      { id: uid(), text: "Build up to 8km long run", done: true },
      { id: uid(), text: "Add one interval session weekly", done: true },
      { id: uid(), text: "Test 5K time trial", done: false },
      { id: uid(), text: "Dial in race-day nutrition", done: false },
      { id: uid(), text: "Register for local 5K event", done: false },
    ],
  },
  {
    id: uid(),
    title: "Land a Senior Frontend Role",
    category: "career",
    reward: "Weekend trip to celebrate",
    deadline: "2026-10-01",
    status: "in_progress",
    reflections: {
      achieve: "Sign an offer for a Senior Frontend Engineer position.",
      why: "Ready for more ownership, better pay, and harder problems.",
      measure: "Signed offer letter with title 'Senior' or equivalent scope.",
    },
    tasks: [
      { id: uid(), text: "Update resume & portfolio site", done: true },
      { id: uid(), text: "Rebuild 2 flagship portfolio projects", done: true },
      { id: uid(), text: "Apply to 20 target companies", done: false },
      { id: uid(), text: "Practice system design interviews", done: false },
      { id: uid(), text: "Do 5 mock interviews", done: false },
      { id: uid(), text: "Negotiate & sign offer", done: false },
    ],
  },
  {
    id: uid(),
    title: "Save a 3-Month Emergency Fund",
    category: "finance",
    reward: "No guilt weekend off from budgeting",
    deadline: "2026-09-01",
    status: "achieved",
    reflections: {
      achieve: "Have 3 months of essential expenses saved and untouched.",
      why: "Financial safety net so a surprise expense never becomes a crisis.",
      measure: "Savings account balance ≥ 3x average monthly essential spend.",
    },
    tasks: [
      { id: uid(), text: "Calculate 3-month expense target", done: true },
      { id: uid(), text: "Open dedicated high-yield savings account", done: true },
      { id: uid(), text: "Automate weekly transfer", done: true },
      { id: uid(), text: "Cut two recurring subscriptions", done: true },
    ],
  },
];

/* -----------------------------------------------------------
   HELPERS
----------------------------------------------------------- */

function computeProgress(goal) {
  if (!goal.tasks.length) return 0;
  const done = goal.tasks.filter((t) => t.done).length;
  return Math.round((done / goal.tasks.length) * 100);
}

function daysLeft(dateStr) {
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  return diff;
}

function daysLeftLabel(dateStr) {
  const d = daysLeft(dateStr);
  if (d < 0) return { label: `Overdue ${Math.abs(d)}d`, danger: true };
  if (d === 0) return { label: "Due today", danger: true };
  return { label: `${d}d left`, danger: false };
}

/* -----------------------------------------------------------
   SIDEBAR SUB-COMPONENTS
----------------------------------------------------------- */

function ProgressRing({ percent, achieved, total }) {
  const data = [
    { name: "done", value: percent },
    { name: "left", value: 100 - percent },
  ];
  return (
    <div className="relative w-40 h-40 mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={54}
            outerRadius={68}
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            <Cell fill="#34d399" />
            <Cell fill="#1e293b" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{percent}%</span>
        <span className="text-[11px] text-slate-400 mt-1">
          {achieved}/{total} Achieved
        </span>
      </div>
    </div>
  );
}

function AreasOfLifeTable({ goals }) {
  const rows = CATEGORIES.map((cat) => {
    const inCat = goals.filter((g) => g.category === cat.id);
    const done = inCat.filter((g) => g.status === "achieved").length;
    const pct = inCat.length ? Math.round((done / inCat.length) * 100) : 0;
    return { ...cat, total: inCat.length, done, pct };
  }).filter((r) => r.total > 0);

  if (!rows.length) {
    return <p className="text-xs text-slate-500">No goals yet. Add one to get started.</p>;
  }

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.id}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-slate-300 font-medium">{r.label}</span>
            <span className="text-[11px] text-slate-400 tabular-nums">
              {r.done}/{r.total} {r.pct}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-700/70 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: r.color }}
              initial={{ width: 0 }}
              animate={{ width: `${r.pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function DistributionPie({ goals }) {
  const data = CATEGORIES.map((cat) => ({
    name: cat.label,
    value: goals.filter((g) => g.category === cat.id).length,
    color: cat.color,
  })).filter((d) => d.value > 0);

  if (!data.length) return null;

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={30} outerRadius={55} paddingAngle={3}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} stroke="#0f172a" strokeWidth={2} />
            ))}
          </Pie>
          <RTooltip
            contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#e2e8f0" }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center -mt-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-[10px] text-slate-400">{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopPriorities({ goals }) {
  const priorities = goals
    .filter((g) => g.status !== "achieved")
    .sort((a, b) => daysLeft(a.deadline) - daysLeft(b.deadline))
    .slice(0, 3);

  if (!priorities.length) {
    return <p className="text-xs text-slate-500">All goals achieved. Add a new one!</p>;
  }

  return (
    <div className="space-y-2">
      {priorities.map((g) => {
        const cat = getCategory(g.category);
        const dl = daysLeftLabel(g.deadline);
        return (
          <div
            key={g.id}
            className="flex items-center justify-between gap-2 rounded-lg bg-slate-900/60 border border-slate-700/60 px-3 py-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="text-xs text-slate-200 truncate">{g.title}</span>
            </div>
            <span className={`text-[10px] shrink-0 font-medium ${dl.danger ? "text-red-400" : "text-slate-400"}`}>
              {dl.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* -----------------------------------------------------------
   SIDEBAR
----------------------------------------------------------- */

function Sidebar({ goals, onAddGoal }) {
  const total = goals.length;
  const achieved = goals.filter((g) => g.status === "achieved").length;
  const overallPct = total
    ? Math.round(goals.reduce((sum, g) => sum + computeProgress(g), 0) / total)
    : 0;

  return (
    <aside className="w-full lg:w-[300px] shrink-0 bg-slate-800/60 border-r border-slate-700/60 lg:h-screen lg:sticky lg:top-0 lg:overflow-y-auto px-5 py-6 space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
            <Target className="w-4 h-4 text-slate-900" />
          </div>
          <h1 className="text-sm font-bold tracking-[0.2em] text-white">GOAL PLANNER</h1>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">Your dashboard for the goals that matter.</p>
      </div>

      <button
        onClick={onAddGoal}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 transition-colors text-slate-900 text-sm font-semibold py-2.5"
      >
        <Plus className="w-4 h-4" /> New Goal
      </button>

      <div>
        <ProgressRing percent={overallPct} achieved={achieved} total={total} />
      </div>

      <div>
        <SectionLabel icon={<Flame className="w-3.5 h-3.5" />} text="Areas of Life" />
        <AreasOfLifeTable goals={goals} />
      </div>

      <div>
        <SectionLabel icon={<Sparkles className="w-3.5 h-3.5" />} text="Top Priorities" />
        <TopPriorities goals={goals} />
      </div>

      <div>
        <SectionLabel icon={<Award className="w-3.5 h-3.5" />} text="Goals Distribution" />
        <DistributionPie goals={goals} />
      </div>
    </aside>
  );
}

function SectionLabel({ icon, text }) {
  return (
    <div className="flex items-center gap-1.5 mb-3 text-slate-400">
      {icon}
      <h2 className="text-[11px] font-semibold tracking-wider uppercase">{text}</h2>
    </div>
  );
}

/* -----------------------------------------------------------
   GOAL CARD
----------------------------------------------------------- */

function GoalCard({ goal, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(goal.title);
  const [newTask, setNewTask] = useState("");

  const cat = getCategory(goal.category);
  const progress = computeProgress(goal);
  const dl = daysLeftLabel(goal.deadline);

  const toggleTask = (taskId) => {
    onUpdate({
      ...goal,
      tasks: goal.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
    });
  };

  const removeTask = (taskId) => {
    onUpdate({ ...goal, tasks: goal.tasks.filter((t) => t.id !== taskId) });
  };

  const addTask = () => {
    if (!newTask.trim() || goal.tasks.length >= 10) return;
    onUpdate({ ...goal, tasks: [...goal.tasks, { id: uid(), text: newTask.trim(), done: false }] });
    setNewTask("");
  };

  const saveTitle = () => {
    onUpdate({ ...goal, title: titleDraft.trim() || goal.title });
    setEditingTitle(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl bg-slate-800 border border-slate-700/60 overflow-hidden flex flex-col"
    >
      {/* Motivation banner */}
      <div
        className="h-20 w-full flex items-center px-5"
        style={{ background: `linear-gradient(135deg, ${cat.color}33, transparent)` }}
      >
        <span
          className="text-[10px] font-semibold tracking-wider uppercase px-2 py-1 rounded-full"
          style={{ color: cat.color, backgroundColor: `${cat.color}22` }}
        >
          {cat.label}
        </span>
      </div>

      <div className="px-5 pb-5 flex flex-col gap-4 -mt-2">
        {/* Title + actions */}
        <div className="flex items-start justify-between gap-2">
          {editingTitle ? (
            <div className="flex items-center gap-1 flex-1">
              <input
                autoFocus
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveTitle()}
                className="flex-1 bg-slate-900 border border-slate-600 rounded-md px-2 py-1 text-sm text-white outline-none focus:border-emerald-400"
              />
              <button onClick={saveTitle} className="text-emerald-400 p-1">
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <h3 className="text-base font-semibold text-white leading-snug">{goal.title}</h3>
          )}
          <div className="flex items-center gap-1 shrink-0">
            {!editingTitle && (
              <button
                onClick={() => setEditingTitle(true)}
                className="text-slate-500 hover:text-slate-300 p-1"
                aria-label="Edit goal title"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => onDelete(goal.id)}
              className="text-slate-500 hover:text-red-400 p-1"
              aria-label="Delete goal"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Meta badge strip */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={goal.category}
              onChange={(e) => onUpdate({ ...goal, category: e.target.value })}
              className="appearance-none text-[11px] pl-2.5 pr-6 py-1 rounded-full bg-slate-900 border border-slate-600 text-slate-200 outline-none cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <Tag className="w-3 h-3 absolute right-2 top-1.5 text-slate-500 pointer-events-none" />
          </div>

          <div className="flex items-center gap-1 text-[11px] pl-2.5 pr-2.5 py-1 rounded-full bg-slate-900 border border-slate-600 text-yellow-300">
            <Award className="w-3 h-3" />
            <input
              value={goal.reward}
              onChange={(e) => onUpdate({ ...goal, reward: e.target.value })}
              placeholder="Reward"
              className="bg-transparent outline-none w-24 placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-1 text-[11px] pl-2.5 pr-2.5 py-1 rounded-full bg-slate-900 border border-slate-600 text-slate-300">
            <Calendar className="w-3 h-3" />
            <input
              type="date"
              value={goal.deadline}
              onChange={(e) => onUpdate({ ...goal, deadline: e.target.value })}
              className="bg-transparent outline-none text-slate-300 [color-scheme:dark]"
            />
          </div>

          <span
            className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
              dl.danger ? "bg-red-500/20 text-red-400" : "bg-slate-700 text-slate-300"
            }`}
          >
            {dl.label}
          </span>

          <select
            value={goal.status}
            onChange={(e) => onUpdate({ ...goal, status: e.target.value })}
            className={`text-[11px] px-2.5 py-1 rounded-full outline-none cursor-pointer ${getStatus(goal.status).color}`}
          >
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id} className="bg-slate-800 text-slate-200">
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Progress</span>
            <span className="font-semibold text-white">{progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: cat.color }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Reflection prompts */}
        <div className="rounded-lg border border-slate-700/60 overflow-hidden">
          <button
            onClick={() => setOpen((o) => !o)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-300 bg-slate-900/50 hover:bg-slate-900 transition-colors"
          >
            Reflection Prompts
            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-3 py-3 space-y-3 bg-slate-900/30">
                  <ReflectionField
                    label="What do you want to achieve?"
                    value={goal.reflections.achieve}
                    onChange={(v) => onUpdate({ ...goal, reflections: { ...goal.reflections, achieve: v } })}
                  />
                  <ReflectionField
                    label="Why is this goal important?"
                    value={goal.reflections.why}
                    onChange={(v) => onUpdate({ ...goal, reflections: { ...goal.reflections, why: v } })}
                  />
                  <ReflectionField
                    label="How do you measure success?"
                    value={goal.reflections.measure}
                    onChange={(v) => onUpdate({ ...goal, reflections: { ...goal.reflections, measure: v } })}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Checklist */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
              Action Steps
            </span>
            <span className="text-[10px] text-slate-500">{goal.tasks.length}/10</span>
          </div>
          <div className="space-y-1.5">
            {goal.tasks.map((t) => (
              <div key={t.id} className="flex items-center gap-2 group">
                <button
                  onClick={() => toggleTask(t.id)}
                  className={`w-4 h-4 rounded shrink-0 border flex items-center justify-center transition-colors ${
                    t.done ? "border-transparent" : "border-slate-500"
                  }`}
                  style={{ backgroundColor: t.done ? cat.color : "transparent" }}
                >
                  {t.done && <Check className="w-3 h-3 text-slate-900" />}
                </button>
                <span
                  className={`text-xs flex-1 ${
                    t.done ? "text-slate-500 line-through" : "text-slate-200"
                  }`}
                >
                  {t.text}
                </span>
                <button
                  onClick={() => removeTask(t.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {goal.tasks.length < 10 && (
            <div className="flex items-center gap-2 mt-2">
              <input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
                placeholder="Add a step..."
                className="flex-1 text-xs bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-slate-200 outline-none focus:border-emerald-400 placeholder:text-slate-600"
              />
              <button
                onClick={addTask}
                className="text-slate-400 hover:text-emerald-400 p-1.5 border border-slate-700 rounded-md hover:border-emerald-400/50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ReflectionField({ label, value, onChange }) {
  return (
    <div>
      <label className="text-[11px] text-slate-400 block mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full text-xs bg-slate-900 border border-slate-700 rounded-md px-2.5 py-2 text-slate-200 outline-none focus:border-emerald-400 resize-none placeholder:text-slate-600"
      />
    </div>
  );
}

/* -----------------------------------------------------------
   NEW GOAL MODAL
----------------------------------------------------------- */

function NewGoalModal({ onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  });

  const submit = () => {
    if (!title.trim()) return;
    onCreate({
      id: uid(),
      title: title.trim(),
      category,
      reward: "",
      deadline,
      status: "not_started",
      reflections: { achieve: "", why: "", measure: "" },
      tasks: [],
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-slate-800 border border-slate-700 p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">New Goal</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="text-[11px] text-slate-400 block mb-1">Goal title</label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="e.g. Read 12 books this year"
            className="w-full text-sm bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-white outline-none focus:border-emerald-400 placeholder:text-slate-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-sm bg-slate-900 border border-slate-600 rounded-md px-2 py-2 text-white outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full text-sm bg-slate-900 border border-slate-600 rounded-md px-2 py-2 text-white outline-none [color-scheme:dark]"
            />
          </div>
        </div>

        <button
          onClick={submit}
          className="w-full rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-900 text-sm font-semibold py-2.5 transition-colors"
        >
          Create Goal
        </button>
      </motion.div>
    </motion.div>
  );
}

/* -----------------------------------------------------------
   MAIN APP
----------------------------------------------------------- */

export default function GoalPlannerDashboard({ savedGoals, onGoalsChange }) {
  const [goals, setGoals] = useState(savedGoals || initialGoals);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (onGoalsChange) onGoalsChange(goals);
  }, [goals, onGoalsChange]);

  const updateGoal = useCallback((updated) => {
    setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
  }, []);

  const deleteGoal = useCallback((id) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const createGoal = useCallback((goal) => {
    setGoals((prev) => [goal, ...prev]);
    setShowModal(false);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col lg:flex-row">
      <Sidebar goals={goals} onAddGoal={() => setShowModal(true)} />

      <main className="flex-1 p-5 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Your Goals</h2>
            <p className="text-xs text-slate-500 mt-0.5">{goals.length} active goal{goals.length !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="hidden sm:flex items-center gap-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-emerald-400/50 text-sm text-slate-200 px-3 py-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Goal
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="text-center py-24 text-slate-500 text-sm">
            No goals yet — click "Add Goal" to start planning.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <AnimatePresence>
              {goals.map((g) => (
                <GoalCard key={g.id} goal={g} onUpdate={updateGoal} onDelete={deleteGoal} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <AnimatePresence>
        {showModal && <NewGoalModal onClose={() => setShowModal(false)} onCreate={createGoal} />}
      </AnimatePresence>
    </div>
  );
}
