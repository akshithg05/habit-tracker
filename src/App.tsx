import { useState } from "react";
import type { Habit, HabitType, DayStatus } from "./types";
import Calendar from "./components/Calendar";
import AnalyticsPanel from "./components/AnalyticsPanel";
import YearHeatmap from "./components/YearHeatmap";
import CreateHabitModal from "./components/CreateHabitModal";
import AuthScreen from "./components/auth/AuthScreen";
import { useAuth } from "./context/AuthContext";
import { useHabits } from "./hooks/useHabits";

type ModalMode = { type: "create" } | { type: "edit"; habit: Habit } | null;

export default function App() {
  const { user, loading, logout } = useAuth();
  const {
    habits,
    habitsLoading,
    addHabit,
    updateHabit,
    deleteHabit,
    updateDayStatus,
    clearStatuses,
  } = useHabits(user?.uid ?? null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalMode>(null);
  const [view, setView] = useState<"calendar" | "heatmap">("calendar");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deleteConfirmHabit, setDeleteConfirmHabit] = useState<Habit | null>(
    null,
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Auth gate ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  const selectedHabit = habits.find((h) => h.id === selectedId) ?? null;

  // ── Create ──────────────────────────────────────────────────────────────
  async function handleCreateHabit(name: string, type: HabitType) {
    const id = await addHabit(name, type);
    setSelectedId(id);
    setModal(null);
  }

  // ── Edit ─────────────────────────────────────────────────────────────────
  async function handleEditHabit(name: string, type: HabitType) {
    if (modal?.type !== "edit") return;
    await updateHabit(modal.habit.id, name, type);
    setModal(null);
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  async function handleDeleteHabit(id: string) {
    await deleteHabit(id);
    if (selectedId === id) setSelectedId(null);
  }

  // ── Clear all statuses ──────────────────────────────────────────────────
  async function handleClearAll() {
    if (!selectedId) return;
    await clearStatuses(selectedId);
    setShowClearConfirm(false);
  }

  // ── Day click ────────────────────────────────────────────────────────────
  async function handleDayClick(dateKey: string, nextStatus: DayStatus) {
    if (!selectedId) return;
    await updateDayStatus(selectedId, dateKey, nextStatus);
  }

  return (
    <div className="flex flex-col md:flex-row h-dvh bg-gray-900 text-white overflow-hidden">
      {/* ── Mobile top bar ── */}
      <div className="flex md:hidden items-center px-4 py-3 bg-gray-800 border-b border-gray-700 shrink-0">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-300 transition-colors shrink-0"
          title="Open menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <h1 className="flex-1 text-base font-bold tracking-tight text-center">
          🗓 Habit Tracker
        </h1>
        <button
          onClick={() => setModal({ type: "create" })}
          title="New habit"
          className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500
                     text-white transition-colors shrink-0 flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* ── Sidebar backdrop (mobile) ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed md:relative inset-y-0 left-0 z-50
          w-72 md:w-64 shrink-0
          bg-gray-800 flex flex-col border-r border-gray-700
          transform transition-transform duration-200 ease-in-out
          md:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo + user info */}
        <div className="px-5 py-4 border-b border-gray-700 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold tracking-tight">
              🗓 Habit Tracker
            </h1>
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              {user.displayName ?? user.email}
            </p>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 transition-colors shrink-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Habit list */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {habits.length === 0 && (
            <p className="text-xs text-gray-500 text-center mt-6 px-2">
              No habits yet. Create one!
            </p>
          )}
          {habits.map((habit) => (
            <div
              key={habit.id}
              className={`group flex items-center gap-1 rounded-lg transition-colors
                ${
                  habit.id === selectedId
                    ? "bg-indigo-600"
                    : "hover:bg-gray-700"
                }`}
            >
              {/* Select button */}
              <button
                onClick={() => {
                  setSelectedId(habit.id);
                  setSidebarOpen(false);
                }}
                className="flex-1 text-left px-3 py-2.5 text-sm flex items-center gap-2.5 min-w-0"
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    habit.type === "good" ? "bg-green-400" : "bg-red-400"
                  }`}
                />
                <span className="truncate">{habit.name}</span>
                <span className="ml-auto text-xs opacity-60 shrink-0">
                  {habit.type === "good" ? "Good" : "Bad"}
                </span>
              </button>

              {/* Edit & Delete buttons — always visible on touch, hover on desktop */}
              <div
                className={`flex items-center gap-0.5 pr-2 shrink-0 transition-opacity
                  ${habit.id === selectedId ? "opacity-100" : "opacity-100 md:opacity-0 md:group-hover:opacity-100"}`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setModal({ type: "edit", habit });
                  }}
                  title="Edit habit"
                  className="p-1 rounded hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                >
                  {/* Pencil icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3.5 h-3.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirmHabit(habit);
                  }}
                  title="Delete habit"
                  className="p-1 rounded hover:bg-red-500/20 text-gray-300 hover:text-red-400 transition-colors"
                >
                  {/* Trash icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3.5 h-3.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </nav>

        {/* New habit button + logout */}
        <div className="p-3 border-t border-gray-700 flex flex-col gap-2">
          <button
            onClick={() => setModal({ type: "create" })}
            className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500
                       text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            <span className="text-base leading-none">+</span>
            New Habit
          </button>
          <button
            onClick={logout}
            className="w-full py-2 rounded-lg bg-gray-700 hover:bg-gray-600
                       text-sm font-medium text-gray-300 hover:text-white
                       transition-colors flex items-center justify-center gap-1.5"
          >
            {/* Logout icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h7a1 1 0 100-2H4V5h6a1 1 0 100-2H3zm11.707 4.293a1 1 0 010 1.414L13.414 10l1.293 1.293a1 1 0 01-1.414 1.414l-2-2a1 1 0 010-1.414l2-2a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
              <path d="M13 10a1 1 0 011-1h3a1 1 0 110 2h-3a1 1 0 01-1-1z" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col items-center px-4 py-5 md:p-8 overflow-y-auto">
        {habitsLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        ) : selectedHabit ? (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="text-center mb-2 relative w-full flex flex-col items-center">
              <h2 className="text-xl md:text-2xl font-bold pr-20">
                {selectedHabit.name}
              </h2>
              <span
                className={`inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${
                  selectedHabit.type === "good"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {selectedHabit.type === "good"
                  ? "🟢 Good Habit"
                  : "🔴 Bad Habit"}
              </span>
              <button
                onClick={() => setShowClearConfirm(true)}
                className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5
                           px-2 md:px-3 py-1.5 rounded-lg text-xs font-medium
                           bg-gray-700 hover:bg-red-500/20 text-gray-400 hover:text-red-400
                           transition-colors border border-gray-600 hover:border-red-500/40"
                title="Clear all logged dates"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3.5 h-3.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="hidden sm:inline">Clear All</span>
              </button>
            </div>

            {/* ── View toggle ── */}
            <div className="flex items-center gap-1 bg-gray-800 rounded-xl p-1">
              <button
                onClick={() => setView("calendar")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  view === "calendar"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Calendar
              </button>
              <button
                onClick={() => setView("heatmap")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  view === "heatmap"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Year Heatmap
              </button>
            </div>

            {view === "calendar" ? (
              <Calendar
                habitType={selectedHabit.type}
                statuses={selectedHabit.statuses}
                onDayClick={handleDayClick}
              />
            ) : (
              <YearHeatmap
                habitType={selectedHabit.type}
                statuses={selectedHabit.statuses}
              />
            )}
            <AnalyticsPanel
              habitType={selectedHabit.type}
              statuses={selectedHabit.statuses}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-lg font-medium text-gray-400">
              {habits.length === 0
                ? "Create your first habit to get started"
                : "Select a habit from the sidebar"}
            </p>
          </div>
        )}
      </main>

      {/* Modals */}
      {modal?.type === "create" && (
        <CreateHabitModal
          onConfirm={handleCreateHabit}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.type === "edit" && (
        <CreateHabitModal
          initialName={modal.habit.name}
          initialType={modal.habit.type}
          onConfirm={handleEditHabit}
          onCancel={() => setModal(null)}
        />
      )}

      {/* ── Clear All confirmation modal ── */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/15 mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white text-center">
              Clear All Dates?
            </h3>
            <p className="text-sm text-gray-400 text-center mt-2">
              This will permanently remove all logged dates for{" "}
              <span className="text-white font-medium">
                {selectedHabit?.name}
              </span>
              . This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600
                           text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500
                           text-sm font-medium text-white transition-colors"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete habit confirmation modal ── */}
      {deleteConfirmHabit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/15 mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white text-center">
              Delete Habit?
            </h3>
            <p className="text-sm text-gray-400 text-center mt-2">
              <span className="text-white font-medium">
                {deleteConfirmHabit.name}
              </span>{" "}
              and all its logged data will be permanently deleted. This cannot
              be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirmHabit(null)}
                className="flex-1 py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600
                           text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDeleteHabit(deleteConfirmHabit.id);
                  setDeleteConfirmHabit(null);
                }}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500
                           text-sm font-medium text-white transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
