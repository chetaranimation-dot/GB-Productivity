export interface HabitGroup {
  id: string;
  name: string;
  description?: string;
  items: any[];
  enabled?: boolean;
  color?: string; // Standard color string (teal, emerald, etc.) or a hex code like #ae44dd
}

export interface UserConfig {
  theme: "light" | "dark";
  thresholdVeryBad: number;
  thresholdBad: number;
  thresholdFair: number;
  habitsConfig: HabitGroup[];
}

export interface DailyRecord {
  hours: number;
  completedHabits: string[]; // Concatenated references: "habitGroupId::itemIndex"
}

export interface MonthlyData {
  [dateStr: string]: DailyRecord;
}
