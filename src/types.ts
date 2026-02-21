export type HabitType = "good" | "bad";

export type DayStatus = "empty" | "success" | "fail";

export interface Habit {
    id: string;
    name: string;
    type: HabitType;
    statuses: Record<string, DayStatus>; // key = "YYYY-MM-DD"

}
