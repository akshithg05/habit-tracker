import { useState, useRef, useEffect } from "react";
import type { DayStatus, HabitType } from "../types";

// ── Constants ────────────────────────────────────────────────────────────────

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

const STATUS_CYCLE: DayStatus[] = ["empty", "success", "fail"];

const STATUS_STYLES: Record<DayStatus, string> = {
  empty: "bg-gray-700 hover:bg-gray-600 text-gray-200",
  success: "bg-green-500 hover:bg-green-400 text-white",
  fail: "bg-red-500 hover:bg-red-400 text-white",
};

const EARLIEST_YEAR = 2000;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getLegendLabels(type: HabitType) {
  return type === "good"
    ? { success: "Did it", fail: "Missed" }
    : { success: "Avoided", fail: "Gave in" };
}

/** Returns a "YYYY-MM-DD" key for the given year/month(0-indexed)/day. */
function toDateKey(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

/** Returns today at midnight for stable same-day comparisons. */
function getTodayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Returns true if the given date is strictly after today. */
function isFutureDate(year: number, month: number, day: number): boolean {
  return new Date(year, month, day) > getTodayMidnight();
}

/** Returns true if the given year+month is strictly after the current calendar month. */
function isFutureYearMonth(year: number, month: number): boolean {
  const now = new Date();
  return (
    year > now.getFullYear() ||
    (year === now.getFullYear() && month > now.getMonth())
  );
}

/** Returns true if the given year+month IS the current calendar month. */
function isCurrentYearMonth(year: number, month: number): boolean {
  const now = new Date();
  return year === now.getFullYear() && month === now.getMonth();
}

function getNextStatus(current: DayStatus): DayStatus {
  const idx = STATUS_CYCLE.indexOf(current);
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
}

/** Builds descending list of years from current year back to EARLIEST_YEAR. */
function buildYearOptions(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= EARLIEST_YEAR; y--) {
    years.push(y);
  }
  return years;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  habitType: HabitType;
  statuses: Record<string, DayStatus>;
  onDayClick: (dateKey: string, nextStatus: DayStatus) => void;
}

export default function Calendar({ habitType, statuses, onDayClick }: Props) {
  const [displayedMonth, setDisplayedMonth] = useState<Date>(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);
  const yearPickerRef = useRef<HTMLDivElement>(null);

  const year = displayedMonth.getFullYear();
  const month = displayedMonth.getMonth(); // 0-indexed

  const nextDisabled = isCurrentYearMonth(year, month);
  const labels = getLegendLabels(habitType);
  const yearOptions = buildYearOptions();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const rawCells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Always pad to 42 cells (6 rows) so the calendar height never changes
  const cells: (number | null)[] = [
    ...rawCells,
    ...Array(Math.max(0, 42 - rawCells.length)).fill(null),
  ];

  // Close month picker on outside click
  useEffect(() => {
    if (!showMonthPicker) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        monthPickerRef.current &&
        !monthPickerRef.current.contains(e.target as Node)
      ) {
        setShowMonthPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMonthPicker]);

  // Close year picker on outside click
  useEffect(() => {
    if (!showYearPicker) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        yearPickerRef.current &&
        !yearPickerRef.current.contains(e.target as Node)
      ) {
        setShowYearPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showYearPicker]);

  function goToPrevMonth() {
    setDisplayedMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    if (!nextDisabled) {
      setDisplayedMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    }
  }

  function handleYearSelect(newYear: number) {
    const now = new Date();
    // Clamp to current month if switching to current year while on a future month
    const clampedMonth =
      newYear === now.getFullYear() && month > now.getMonth()
        ? now.getMonth()
        : month;
    setDisplayedMonth(new Date(newYear, clampedMonth, 1));
    setShowYearPicker(false);
  }

  function handleMonthSelect(m: number) {
    if (isFutureYearMonth(year, m)) return;
    setDisplayedMonth(new Date(year, m, 1));
    setShowMonthPicker(false);
  }

  function handleDayClick(day: number) {
    if (isFutureDate(year, month, day)) return;
    const key = toDateKey(year, month, day);
    onDayClick(key, getNextStatus(statuses[key] ?? "empty"));
  }

  return (
    <div className="w-full max-w-sm rounded-2xl bg-gray-800 shadow-xl p-4 sm:p-6">
      {/* ── Navigation header ── */}
      <div className="flex items-center justify-between mb-4 gap-2">
        {/* Prev button */}
        <button
          onClick={goToPrevMonth}
          className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors shrink-0"
          title="Previous month"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Month picker + Year dropdown */}
        <div className="flex items-center gap-1.5 flex-1 justify-center">
          {/* ── Month trigger button + popover ── */}
          <div className="relative" ref={monthPickerRef}>
            <button
              onClick={() => setShowMonthPicker((v) => !v)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg
                                       hover:bg-gray-700 text-sm font-semibold text-white transition-colors"
              title="Select month"
            >
              {MONTH_SHORT[month]}
              {/* Chevron down */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-3.5 h-3.5 transition-transform duration-150 ${showMonthPicker ? "rotate-180" : ""}`}
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

            {/* Month grid popover */}
            {showMonthPicker && (
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50
                                           bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-3 w-44"
              >
                <div className="grid grid-cols-3 gap-1">
                  {MONTH_SHORT.map((name, m) => {
                    const future = isFutureYearMonth(year, m);
                    const active = m === month;
                    return (
                      <button
                        key={name}
                        onClick={() => handleMonthSelect(m)}
                        disabled={future}
                        className={`
                                                    py-1.5 rounded-lg text-xs font-medium transition-colors
                                                    ${
                                                      active
                                                        ? "bg-indigo-600 text-white"
                                                        : future
                                                          ? "text-gray-600 cursor-not-allowed"
                                                          : "text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer"
                                                    }
                                                `}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Year picker ── */}
          <div className="relative" ref={yearPickerRef}>
            <button
              onClick={() => setShowYearPicker((v) => !v)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg
                                       hover:bg-gray-700 text-sm font-semibold text-white transition-colors"
              title="Select year"
            >
              {year}
              {/* Chevron down */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-3.5 h-3.5 transition-transform duration-150 ${showYearPicker ? "rotate-180" : ""}`}
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

            {/* Year list popover */}
            {showYearPicker && (
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50
                                           bg-gray-900 border border-gray-700 rounded-xl shadow-2xl
                                           w-24 max-h-48 overflow-y-auto flex flex-col
                                           [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: "none" }}
              >
                {yearOptions.map((y) => (
                  <button
                    key={y}
                    onClick={() => handleYearSelect(y)}
                    className={`
                                            px-3 py-1.5 text-sm font-medium text-center transition-colors
                                            ${
                                              y === year
                                                ? "bg-indigo-600 text-white"
                                                : "text-gray-300 hover:bg-gray-700 hover:text-white"
                                            }
                                        `}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Next button */}
        <button
          onClick={goToNextMonth}
          disabled={nextDisabled}
          className={`p-1.5 rounded-lg transition-colors shrink-0
                        ${
                          nextDisabled
                            ? "text-gray-600 cursor-not-allowed"
                            : "hover:bg-gray-700 text-gray-300 hover:text-white"
                        }`}
          title={nextDisabled ? "Already at current month" : "Next month"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* ── Weekday labels ── */}
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-400 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* ── Day cells ── */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null)
            return <div key={`empty-${idx}`} className="aspect-square" />;

          const future = isFutureDate(year, month, day);
          const dateKey = toDateKey(year, month, day);
          const status = statuses[dateKey] ?? "empty";
          const today = getTodayMidnight();
          const isToday =
            dateKey ===
            toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              disabled={future}
              className={`
                                aspect-square rounded-lg text-sm font-medium
                                transition-colors duration-150
                                flex flex-col items-center justify-center gap-0.5
                                ${
                                  future
                                    ? "text-gray-400 cursor-not-allowed bg-gray-800"
                                    : STATUS_STYLES[status] + " cursor-pointer"
                                }
                                ${isToday ? "ring-2 ring-indigo-400 ring-offset-1 ring-offset-gray-800" : ""}
                            `}
              title={future ? "Future date" : `${dateKey}: ${status}`}
            >
              {day}
              {isToday && (
                <span className="w-1 h-1 rounded-full bg-indigo-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Legend ── */}
      <div className="flex justify-center gap-4 mt-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-500 inline-block" />
          {labels.success}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-500 inline-block" />
          {labels.fail}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-gray-700 inline-block" />
          Empty
        </span>
      </div>
    </div>
  );
}
