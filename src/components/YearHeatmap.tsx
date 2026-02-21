import { useState, useRef, useEffect, useMemo } from "react";
import type { DayStatus, HabitType } from "../types";

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

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

const EARLIEST_YEAR = 2000;

// ── Types ─────────────────────────────────────────────────────────────────────

interface DayCell {
  dateKey: string;
  month: number;
  day: number;
  status: DayStatus;
  isFuture: boolean;
  isToday: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildYearOptions(): number[] {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current; y >= EARLIEST_YEAR; y--) years.push(y);
  return years;
}

function toDateKey(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function todayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Builds week columns (each = 7 Sun→Sat slots, null = padding outside the year).
 * Also returns the first column index each month label should sit above.
 */
function buildCalendarGrid(
  year: number,
  statuses: Record<string, DayStatus>,
): {
  weeks: (DayCell | null)[][];
  monthCols: { month: number; col: number }[];
} {
  const today = todayMidnight();
  const jan1 = new Date(year, 0, 1);
  const dec31 = new Date(year, 11, 31);

  // Start grid on the Sunday of Jan 1's week
  const gridStart = new Date(jan1);
  gridStart.setDate(jan1.getDate() - jan1.getDay());

  // End grid on the Saturday of Dec 31's week
  const gridEnd = new Date(dec31);
  gridEnd.setDate(dec31.getDate() + (6 - dec31.getDay()));

  const weeks: (DayCell | null)[][] = [];
  const monthCols: { month: number; col: number }[] = [];
  const seenMonths = new Set<number>();

  const cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    const week: (DayCell | null)[] = [];
    const colIdx = weeks.length;

    for (let dow = 0; dow < 7; dow++) {
      if (cursor.getFullYear() !== year) {
        week.push(null);
      } else {
        const month = cursor.getMonth();
        if (!seenMonths.has(month)) {
          seenMonths.add(month);
          monthCols.push({ month, col: colIdx });
        }
        const key = toDateKey(cursor);
        week.push({
          dateKey: key,
          month,
          day: cursor.getDate(),
          status: statuses[key] ?? "empty",
          isFuture: cursor > today,
          isToday: cursor.getTime() === today.getTime(),
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  return { weeks, monthCols };
}

function dotClass(cell: DayCell): string {
  if (cell.isFuture) return "bg-gray-800 border border-gray-700/40";
  if (cell.status === "success") return "bg-green-500";
  if (cell.status === "fail") return "bg-red-500";
  return "bg-gray-700";
}

function dotTitle(
  cell: DayCell,
  successLabel: string,
  failLabel: string,
): string {
  if (cell.isFuture) return `${cell.dateKey} — future`;
  if (cell.status === "success") return `${cell.dateKey} — ${successLabel}`;
  if (cell.status === "fail") return `${cell.dateKey} — ${failLabel}`;
  return `${cell.dateKey} — empty`;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  habitType: HabitType;
  statuses: Record<string, DayStatus>;
}

export default function YearHeatmap({ habitType, statuses }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const yearPickerRef = useRef<HTMLDivElement>(null);

  const yearOptions = buildYearOptions();
  const successLabel = habitType === "good" ? "Done" : "Avoided";
  const failLabel = habitType === "good" ? "Missed" : "Slipped";

  const { weeks, monthCols } = useMemo(
    () => buildCalendarGrid(year, statuses),
    [year, statuses],
  );

  useEffect(() => {
    if (!showYearPicker) return;
    const onOutside = (e: MouseEvent) => {
      if (!yearPickerRef.current?.contains(e.target as Node))
        setShowYearPicker(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [showYearPicker]);

  // Each cell is 12px wide + 3px gap = 15px per column
  const CELL_SIZE = 15;
  // Extra gap inserted before each new month (except January)
  const MONTH_GAP = 6;

  const monthStartCols = useMemo(
    () => new Set(monthCols.filter((_, i) => i > 0).map((m) => m.col)),
    [monthCols],
  );

  return (
    <div className="w-full max-w-4xl rounded-2xl bg-gray-800 shadow-xl p-4 sm:p-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Year Heatmap
        </h3>

        {/* Year picker */}
        <div className="relative" ref={yearPickerRef}>
          <button
            onClick={() => setShowYearPicker((v) => !v)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg
                       hover:bg-gray-700 text-sm font-semibold text-white transition-colors"
          >
            {year}
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

          {showYearPicker && (
            <div
              className="absolute top-full right-0 mt-1.5 z-50
                         bg-gray-900 border border-gray-700 rounded-xl shadow-2xl
                         w-20 max-h-48 overflow-y-auto flex flex-col
                         [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none" }}
            >
              {yearOptions.map((y) => (
                <button
                  key={y}
                  onClick={() => {
                    setYear(y);
                    setShowYearPicker(false);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium text-center transition-colors
                    ${
                      y === year
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

      {/* ── Heatmap grid ── */}
      <div
        className="overflow-x-auto [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="flex gap-[3px] min-w-max">
          {/* Day-of-week label column */}
          <div className="flex flex-col gap-[3px] mr-0.5 mt-5 shrink-0">
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="w-3 h-3 flex items-center justify-center
                           text-[9px] text-gray-500 leading-none select-none"
              >
                {/* Show only M, W, F to avoid crowding */}
                {i === 1 || i === 3 || i === 5 ? label : ""}
              </div>
            ))}
          </div>

          {/* Columns area: month labels + dot columns */}
          <div className="flex flex-col">
            {/* Month labels — absolutely positioned over a relative container */}
            <div className="relative h-5 mb-1 shrink-0">
              {monthCols.map(({ month, col }, mIdx) => (
                <span
                  key={month}
                  className="absolute text-[10px] text-gray-400 leading-none select-none whitespace-nowrap"
                  style={{ left: col * CELL_SIZE + mIdx * MONTH_GAP }}
                >
                  {MONTH_SHORT[month]}
                </span>
              ))}
            </div>

            {/* Week columns */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wIdx) => (
                <div
                  key={wIdx}
                  className="flex flex-col gap-[3px]"
                  style={
                    monthStartCols.has(wIdx)
                      ? { marginLeft: MONTH_GAP }
                      : undefined
                  }
                >
                  {week.map((cell, dIdx) => {
                    if (cell === null) {
                      return <div key={dIdx} className="w-3 h-3" />;
                    }
                    return (
                      <div
                        key={dIdx}
                        title={dotTitle(cell, successLabel, failLabel)}
                        className={`
                          w-3 h-3 rounded-sm cursor-default
                          hover:opacity-75 transition-opacity duration-100
                          ${dotClass(cell)}
                          ${
                            cell.isToday
                              ? "ring-1 ring-white ring-offset-1 ring-offset-gray-800"
                              : ""
                          }
                        `}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center gap-3 mt-4">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-500">Less</span>
          {(
            [
              "bg-gray-700",
              "bg-green-900",
              "bg-green-700",
              "bg-green-500",
              "bg-green-400",
            ] as const
          ).map((cls, i) => (
            <span key={i} className={`w-3 h-3 rounded-sm ${cls}`} />
          ))}
          <span className="text-[10px] text-gray-500">More</span>
        </div>
        <span className="w-px h-3 bg-gray-700" />
        <span className="flex items-center gap-1 text-[10px] text-gray-500">
          <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />
          {successLabel}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-gray-500">
          <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" />
          {failLabel}
        </span>
      </div>
    </div>
  );
}
