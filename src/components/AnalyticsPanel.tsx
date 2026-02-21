import { useState, useRef, useEffect } from "react";
import type { DayStatus, HabitType } from "../types";
import {
  calcCurrentStreak,
  calcLongestStreak,
  calcMonthStats,
  calcYearStats,
} from "../utils/analytics";

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const EARLIEST_YEAR = 2000;

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildYearOptions(): number[] {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current; y >= EARLIEST_YEAR; y--) years.push(y);
  return years;
}

function isFutureYearMonth(year: number, month: number): boolean {
  const now = new Date();
  return (
    year > now.getFullYear() ||
    (year === now.getFullYear() && month > now.getMonth())
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  unit: string;
  color: string;
}

function StatCard({ label, value, unit, color }: StatCardProps) {
  return (
    <div className="bg-gray-900/60 rounded-xl p-3 border border-gray-700/60">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold leading-none ${color}`}>
        {value}
        <span className="text-xs font-normal text-gray-500 ml-1">{unit}</span>
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  habitType: HabitType;
  statuses: Record<string, DayStatus>;
}

export default function AnalyticsPanel({ habitType, statuses }: Props) {
  const now = new Date();
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState(now.getMonth());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);
  const yearPickerRef = useRef<HTMLDivElement>(null);

  // Yearly section has its own independent year filter
  const [yearlyYear, setYearlyYear] = useState(now.getFullYear());
  const [showYearlyYearPicker, setShowYearlyYearPicker] = useState(false);
  const yearlyYearPickerRef = useRef<HTMLDivElement>(null);

  // ── Calculations ──────────────────────────────────────────────────────────
  const currentStreak = calcCurrentStreak(statuses);
  const longestStreak = calcLongestStreak(statuses);
  const { successes, fails } = calcMonthStats(
    statuses,
    filterYear,
    filterMonth,
  );
  const { successes: yearSuccesses, fails: yearFails } = calcYearStats(
    statuses,
    yearlyYear,
  );

  const successLabel = habitType === "good" ? "Did it" : "Avoided";
  const failLabel = habitType === "good" ? "Missed" : "Gave in";

  const yearOptions = buildYearOptions();

  // ── Outside-click handlers ────────────────────────────────────────────────
  useEffect(() => {
    if (!showMonthPicker) return;
    const onOutside = (e: MouseEvent) => {
      if (!monthPickerRef.current?.contains(e.target as Node))
        setShowMonthPicker(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [showMonthPicker]);

  useEffect(() => {
    if (!showYearPicker) return;
    const onOutside = (e: MouseEvent) => {
      if (!yearPickerRef.current?.contains(e.target as Node))
        setShowYearPicker(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [showYearPicker]);

  useEffect(() => {
    if (!showYearlyYearPicker) return;
    const onOutside = (e: MouseEvent) => {
      if (!yearlyYearPickerRef.current?.contains(e.target as Node))
        setShowYearlyYearPicker(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [showYearlyYearPicker]);

  // ── Event handlers ────────────────────────────────────────────────────────
  function handleMonthSelect(m: number) {
    if (isFutureYearMonth(filterYear, m)) return;
    setFilterMonth(m);
    setShowMonthPicker(false);
  }

  function handleYearSelect(y: number) {
    const clampedMonth =
      y === now.getFullYear() && filterMonth > now.getMonth()
        ? now.getMonth()
        : filterMonth;
    setFilterYear(y);
    setFilterMonth(clampedMonth);
    setShowYearPicker(false);
  }

  function handleYearlyYearSelect(y: number) {
    setYearlyYear(y);
    setShowYearlyYearPicker(false);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-sm rounded-2xl bg-gray-800 shadow-xl p-5">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
        Analytics
      </h3>

      {/* ── Overall streaks ── */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard
          label="Current Streak"
          value={currentStreak}
          unit="days"
          color="text-yellow-400"
        />
        <StatCard
          label="Longest Streak"
          value={longestStreak}
          unit="days"
          color="text-purple-400"
        />
      </div>

      {/* ── Monthly section header ── */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Monthly
        </span>

        {/* Filter pickers */}
        <div className="flex items-center gap-1">
          {/* Month picker */}
          <div className="relative" ref={monthPickerRef}>
            <button
              onClick={() => setShowMonthPicker((v) => !v)}
              className="flex items-center gap-0.5 px-2 py-1 rounded-lg
                         hover:bg-gray-700 text-xs font-semibold text-white transition-colors"
            >
              {MONTH_SHORT[filterMonth]}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-3 h-3 transition-transform duration-150 ${showMonthPicker ? "rotate-180" : ""}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {showMonthPicker && (
              <div
                className="absolute top-full right-0 mt-1.5 z-50
                              bg-gray-900 border border-gray-700 rounded-xl shadow-2xl
                              p-2.5 w-40"
              >
                <div className="grid grid-cols-3 gap-1">
                  {MONTH_SHORT.map((name, m) => {
                    const future = isFutureYearMonth(filterYear, m);
                    const active = m === filterMonth;
                    return (
                      <button
                        key={name}
                        onClick={() => handleMonthSelect(m)}
                        disabled={future}
                        className={`py-1.5 rounded-lg text-xs font-medium transition-colors
                          ${
                            active
                              ? "bg-indigo-600 text-white"
                              : future
                                ? "text-gray-600 cursor-not-allowed"
                                : "text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer"
                          }`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Year picker */}
          <div className="relative" ref={yearPickerRef}>
            <button
              onClick={() => setShowYearPicker((v) => !v)}
              className="flex items-center gap-0.5 px-2 py-1 rounded-lg
                         hover:bg-gray-700 text-xs font-semibold text-white transition-colors"
            >
              {filterYear}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-3 h-3 transition-transform duration-150 ${showYearPicker ? "rotate-180" : ""}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {showYearPicker && (
              <div
                className="absolute top-full right-0 mt-1.5 z-50
                           bg-gray-900 border border-gray-700 rounded-xl shadow-2xl
                           w-20 max-h-40 overflow-y-auto flex flex-col
                           [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: "none" }}
              >
                {yearOptions.map((y) => (
                  <button
                    key={y}
                    onClick={() => handleYearSelect(y)}
                    className={`px-3 py-1.5 text-xs font-medium text-center transition-colors
                      ${
                        y === filterYear
                          ? "bg-indigo-600 text-white"
                          : "text-gray-300 hover:bg-gray-700 hover:text-white"
                      }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Monthly counts ── */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard
          label={successLabel}
          value={successes}
          unit="days"
          color="text-green-400"
        />
        <StatCard
          label={failLabel}
          value={fails}
          unit="days"
          color="text-red-400"
        />
      </div>

      {/* ── Yearly section header ── */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Yearly
        </span>

        {/* Yearly year picker */}
        <div className="relative" ref={yearlyYearPickerRef}>
          <button
            onClick={() => setShowYearlyYearPicker((v) => !v)}
            className="flex items-center gap-0.5 px-2 py-1 rounded-lg
                       hover:bg-gray-700 text-xs font-semibold text-white transition-colors"
          >
            {yearlyYear}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`w-3 h-3 transition-transform duration-150 ${
                showYearlyYearPicker ? "rotate-180" : ""
              }`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {showYearlyYearPicker && (
            <div
              className="absolute top-full right-0 mt-1.5 z-50
                         bg-gray-900 border border-gray-700 rounded-xl shadow-2xl
                         w-20 max-h-40 overflow-y-auto flex flex-col
                         [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none" }}
            >
              {yearOptions.map((y) => (
                <button
                  key={y}
                  onClick={() => handleYearlyYearSelect(y)}
                  className={`px-3 py-1.5 text-xs font-medium text-center transition-colors
                    ${
                      y === yearlyYear
                        ? "bg-indigo-600 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                >
                  {y}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Yearly counts ── */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label={successLabel}
          value={yearSuccesses}
          unit="days"
          color="text-green-400"
        />
        <StatCard
          label={failLabel}
          value={yearFails}
          unit="days"
          color="text-red-400"
        />
      </div>
    </div>
  );
}
