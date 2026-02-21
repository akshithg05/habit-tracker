import { useState } from "react";
import type { HabitType } from "../types";

interface Props {
    // Edit mode: pass initial values; Create mode: leave undefined
    initialName?: string;
    initialType?: HabitType;
    onConfirm: (name: string, type: HabitType) => void;
    onCancel: () => void;
}

export default function CreateHabitModal({
    initialName = "",
    initialType = "good",
    onConfirm,
    onCancel,
}: Props) {
    const [name, setName] = useState(initialName);
    const [type, setType] = useState<HabitType>(initialType);

    const isEditMode = Boolean(initialName);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;
        onConfirm(trimmed, type);
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
                <h2 className="text-lg font-semibold text-white mb-5">
                    {isEditMode ? "Edit Habit" : "Create New Habit"}
                </h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* Name input */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">
                            Habit Name
                        </label>
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Exercise, No Sugar..."
                            className="w-full rounded-lg bg-gray-700 text-white placeholder-gray-500
                         px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Type selector */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">
                            Habit Type
                        </label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setType("good")}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors
                  ${type === "good"
                                        ? "bg-green-500 text-white"
                                        : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                                    }`}
                            >
                                🟢 Good Habit
                            </button>
                            <button
                                type="button"
                                onClick={() => setType("bad")}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors
                  ${type === "bad"
                                        ? "bg-red-500 text-white"
                                        : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                                    }`}
                            >
                                🔴 Bad Habit
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {type === "good"
                                ? "Success = doing it ✅  |  Fail = skipping it ❌"
                                : "Success = avoiding it ✅  |  Fail = giving in ❌"}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 py-2 rounded-lg bg-gray-700 text-gray-300
                         text-sm hover:bg-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="flex-1 py-2 rounded-lg bg-indigo-600 text-white
                         text-sm font-medium hover:bg-indigo-500 transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {isEditMode ? "Save Changes" : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
