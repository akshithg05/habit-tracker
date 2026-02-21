import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  deleteField,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Habit, HabitType, DayStatus } from "../types";

export function useHabits(uid: string | null) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitsLoading, setHabitsLoading] = useState(true);

  // ── Real-time listener ────────────────────────────────────────────────────
  useEffect(() => {
    if (!uid) {
      setHabits([]);
      setHabitsLoading(false);
      return;
    }

    setHabitsLoading(true);

    const col = collection(db, "users", uid, "habits");
    const q = query(col, orderBy("createdAt", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      const loaded: Habit[] = snap.docs.map((d) => ({
        id: d.id,
        name: d.data().name as string,
        type: d.data().type as HabitType,
        statuses: (d.data().statuses ?? {}) as Record<string, DayStatus>,
      }));
      setHabits(loaded);
      setHabitsLoading(false);
    });

    return unsub;
  }, [uid]);

  // ── Create ────────────────────────────────────────────────────────────────
  async function addHabit(name: string, type: HabitType): Promise<string> {
    if (!uid) throw new Error("Not authenticated");
    const ref = await addDoc(collection(db, "users", uid, "habits"), {
      name,
      type,
      statuses: {},
      createdAt: serverTimestamp(),
    });
    return ref.id;
  }

  // ── Update name / type ────────────────────────────────────────────────────
  async function updateHabit(id: string, name: string, type: HabitType) {
    if (!uid) return;
    await updateDoc(doc(db, "users", uid, "habits", id), { name, type });
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function deleteHabit(id: string) {
    if (!uid) return;
    await deleteDoc(doc(db, "users", uid, "habits", id));
  }

  // ── Toggle day status ─────────────────────────────────────────────────────
  async function updateDayStatus(
    id: string,
    dateKey: string,
    status: DayStatus,
  ) {
    if (!uid) return;
    const ref = doc(db, "users", uid, "habits", id);
    // Remove the key entirely when cycling back to "empty" to keep docs clean
    if (status === "empty") {
      await updateDoc(ref, { [`statuses.${dateKey}`]: deleteField() });
    } else {
      await updateDoc(ref, { [`statuses.${dateKey}`]: status });
    }
  }

  // ── Clear all statuses ────────────────────────────────────────────────────
  async function clearStatuses(id: string) {
    if (!uid) return;
    await updateDoc(doc(db, "users", uid, "habits", id), { statuses: {} });
  }

  return {
    habits,
    habitsLoading,
    addHabit,
    updateHabit,
    deleteHabit,
    updateDayStatus,
    clearStatuses,
  };
}
