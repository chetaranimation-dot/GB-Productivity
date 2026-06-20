import React, { useState } from "react";
import { UserConfig, HabitGroup } from "../types";
import { saveUserConfig, auth, signOut } from "../lib/firebase";
import { 
  Sliders, 
  CheckSquare, 
  Sun, 
  Moon, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  UserCircle2, 
  Save, 
  Sparkles, 
  FolderEdit,
  ArrowUp,
  ArrowDown,
  Palette,
  Eye,
  EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SettingsViewProps {
  userId: string;
  config: UserConfig;
  onConfigUpdated: (newConfig: UserConfig) => void;
  onLogout: () => void;
}

export default function SettingsView({
  userId,
  config,
  onConfigUpdated,
  onLogout
}: SettingsViewProps) {
  const isDark = config.theme === "dark";

  // Threshold States
  const [vBad, setVBad] = useState<number>(config.thresholdVeryBad);
  const [bad, setBad] = useState<number>(config.thresholdBad);
  const [fair, setFair] = useState<number>(config.thresholdFair);

  // New Habit Group form
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  // New Item states per group (mapped as groupId: text)
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});
  const [newItemDescriptions, setNewItemDescriptions] = useState<Record<string, string>>({});

  // Editing category states
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [editingGroupDesc, setEditingGroupDesc] = useState("");

  // Editing habit item states
  const [editingItemUID, setEditingItemUID] = useState<string | null>(null); // "groupId::itemId"
  const [editingItemName, setEditingItemName] = useState("");
  const [editingItemDesc, setEditingItemDesc] = useState("");

  // Error/Success visual signals
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Sign out user logic
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onLogout();
    } catch (err) {
      console.error("Gagal keluar:", err);
    }
  };

  // Save the custom productive thresholds
  const handleSaveThresholds = async () => {
    if (vBad >= bad) {
      setStatusMsg({ type: "error", text: "Batas 'Sangat Jelek' harus lebih rendah dari 'Jelek'." });
      return;
    }
    if (bad >= fair) {
      setStatusMsg({ type: "error", text: "Batas 'Jelek' harus lebih rendah dari 'Cukup'." });
      return;
    }

    setSavingSettings(true);
    setStatusMsg(null);

    const updatedConfig: Partial<UserConfig> = {
      thresholdVeryBad: Number(vBad),
      thresholdBad: Number(bad),
      thresholdFair: Number(fair)
    };

    try {
      await saveUserConfig(userId, updatedConfig);
      onConfigUpdated({ ...config, ...updatedConfig });
      setStatusMsg({ type: "success", text: "Batas indikator jam produktif berhasil disimpan!" });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      setStatusMsg({ type: "error", text: "Gagal menyimpan konfigurasi ke cloud." });
    } finally {
      setSavingSettings(false);
    }
  };

  // Toggle Theme between Light and Dark
  const handleToggleTheme = async (mode: "light" | "dark") => {
    try {
      await saveUserConfig(userId, { theme: mode });
      onConfigUpdated({ ...config, theme: mode });
    } catch (err) {
      console.error("Gagal memperbarui tema:", err);
    }
  };

  // Create a new Habit Group Panel
  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const newGroup: HabitGroup = {
      id: "g" + Date.now(),
      name: newGroupName.trim(),
      description: newGroupDesc.trim(),
      items: []
    };

    const newHabitsConfig = [...config.habitsConfig, newGroup];
    try {
      await saveUserConfig(userId, { habitsConfig: newHabitsConfig });
      onConfigUpdated({ ...config, habitsConfig: newHabitsConfig });
      setNewGroupName("");
      setNewGroupDesc("");
      setStatusMsg({ type: "success", text: `Panel habits "${newGroup.name}" berhasil ditambahkan!` });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      setStatusMsg({ type: "error", text: "Gagal menambahkan panel habits baru." });
    }
  };

  // Delete an entire Habit Group
  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    const isConfirmed = window.confirm(`Apakah Anda yakin ingin menghapus panel habits "${groupName}" beserta semua to-do list di dalamnya?`);
    if (!isConfirmed) return;

    const newHabitsConfig = config.habitsConfig.filter(g => g.id !== groupId);
    try {
      await saveUserConfig(userId, { habitsConfig: newHabitsConfig });
      onConfigUpdated({ ...config, habitsConfig: newHabitsConfig });
      setStatusMsg({ type: "success", text: "Panel habits berhasil dihapus." });
      setTimeout(() => setStatusMsg(null), 3050);
    } catch (err) {
      setStatusMsg({ type: "error", text: "Gagal menghapus panel habits." });
    }
  };

  // Add a task item to a specific Habit Group Panel
  const handleAddTaskItem = async (groupId: string) => {
    const textToAdd = newItemTexts[groupId]?.trim();
    if (!textToAdd) return;
    const descToAdd = newItemDescriptions[groupId]?.trim() || "";

    const updatedHabits = config.habitsConfig.map((group) => {
      if (group.id === groupId) {
        // Prevent duplicate items
        const rawItems = group.items || [];
        const alreadyExists = rawItems.some(it => {
          const name = typeof it === "string" ? it : it.name;
          return name.toLowerCase() === textToAdd.toLowerCase();
        });
        if (alreadyExists) return group;

        const newItem = {
          id: "item_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
          name: textToAdd,
          description: descToAdd,
          enabled: true
        };

        return {
          ...group,
          items: [...rawItems, newItem]
        };
      }
      return group;
    });

    try {
      await saveUserConfig(userId, { habitsConfig: updatedHabits });
      onConfigUpdated({ ...config, habitsConfig: updatedHabits });

      // Clear inputs
      setNewItemTexts(prev => ({ ...prev, [groupId]: "" }));
      setNewItemDescriptions(prev => ({ ...prev, [groupId]: "" }));
    } catch (err) {
      console.error("Gagal menambahkan item:", err);
    }
  };

  // Delete a specific task item from a Habit Group Panel
  const handleDeleteTaskItem = async (groupId: string, itemKeyOrId: string) => {
    const updatedHabits = config.habitsConfig.map((group) => {
      if (group.id === groupId) {
        return {
          ...group,
          items: group.items.filter(item => {
            if (typeof item === "string") {
              return item !== itemKeyOrId;
            }
            return item.id !== itemKeyOrId && item.name !== itemKeyOrId;
          })
        };
      }
      return group;
    });

    try {
      await saveUserConfig(userId, { habitsConfig: updatedHabits });
      onConfigUpdated({ ...config, habitsConfig: updatedHabits });
    } catch (err) {
      console.error("Gagal menghapus item:", err);
    }
  };

  // Toggle Entire Category (Group) Enabled / Disabled
  const handleToggleGroupEnabled = async (groupId: string, currentVal: boolean) => {
    const updated = config.habitsConfig.map(g => {
      if (g.id === groupId) {
        return { ...g, enabled: !currentVal };
      }
      return g;
    });
    try {
      await saveUserConfig(userId, { habitsConfig: updated });
      onConfigUpdated({ ...config, habitsConfig: updated });
    } catch (err) {
      console.error("Gagal mengubah status kategori:", err);
    }
  };

  // Change Category (Group) Color Identity
  const handleChangeGroupColor = async (groupId: string, color: string) => {
    const updated = config.habitsConfig.map(g => {
      if (g.id === groupId) {
        return { ...g, color };
      }
      return g;
    });
    try {
      await saveUserConfig(userId, { habitsConfig: updated });
      onConfigUpdated({ ...config, habitsConfig: updated });
    } catch (err) {
      console.error("Gagal mengubah warna kategori:", err);
    }
  };

  // Update Category Name and Description
  const handleUpdateGroupDetails = async (groupId: string, newName: string, newDesc: string) => {
    if (!newName.trim()) return;
    const updated = config.habitsConfig.map(g => {
      if (g.id === groupId) {
        return { ...g, name: newName.trim(), description: newDesc.trim() };
      }
      return g;
    });
    try {
      await saveUserConfig(userId, { habitsConfig: updated });
      onConfigUpdated({ ...config, habitsConfig: updated });
      setEditingGroupId(null);
    } catch (err) {
      console.error("Gagal mengubah rincian kategori:", err);
    }
  };

  // Reorder Item (UP / DOWN)
  const handleMoveItem = async (groupId: string, itemIdx: number, direction: "up" | "down") => {
    const updated = config.habitsConfig.map(g => {
      if (g.id === groupId) {
        const list = [...g.items];
        const targetIdx = direction === "up" ? itemIdx - 1 : itemIdx + 1;
        if (targetIdx >= 0 && targetIdx < list.length) {
          const temp = list[itemIdx];
          list[itemIdx] = list[targetIdx];
          list[targetIdx] = temp;
        }
        return { ...g, items: list };
      }
      return g;
    });
    try {
      await saveUserConfig(userId, { habitsConfig: updated });
      onConfigUpdated({ ...config, habitsConfig: updated });
    } catch (err) {
      console.error("Gagal menggeser item:", err);
    }
  };

  // Toggle Individual Item Enabled / Disabled State
  const handleToggleItemEnabled = async (groupId: string, itemId: string, currentVal: boolean) => {
    const updated = config.habitsConfig.map(g => {
      if (g.id === groupId) {
        const list = g.items.map((item, index) => {
          const resolved = typeof item === "string"
            ? { id: "item_" + index + "_" + encodeURIComponent(item), name: item, description: "", enabled: true }
            : { ...item };
          
          if (resolved.id === itemId || (typeof item === "string" && item === itemId)) {
            resolved.enabled = !currentVal;
          }
          return resolved;
        });
        return { ...g, items: list };
      }
      return g;
    });
    try {
      await saveUserConfig(userId, { habitsConfig: updated });
      onConfigUpdated({ ...config, habitsConfig: updated });
    } catch (err) {
      console.error("Gagal mengubah status item:", err);
    }
  };

  // Save Inline Item Name & Description
  const handleSaveItemEdit = async (groupId: string, itemId: string, newName: string, newDesc: string) => {
    if (!newName.trim()) return;
    const updated = config.habitsConfig.map(g => {
      if (g.id === groupId) {
        const list = g.items.map((item, index) => {
          const resolved = typeof item === "string"
            ? { id: "item_" + index + "_" + encodeURIComponent(item), name: item, description: "", enabled: true }
            : { ...item };
          
          if (resolved.id === itemId) {
            resolved.name = newName.trim();
            resolved.description = newDesc.trim();
          }
          return resolved;
        });
        return { ...g, items: list };
      }
      return g;
    });
    try {
      await saveUserConfig(userId, { habitsConfig: updated });
      onConfigUpdated({ ...config, habitsConfig: updated });
      setEditingItemUID(null);
    } catch (err) {
      console.error("Gagal menyimpan suntingan item:", err);
    }
  };

  const userEmail = auth.currentUser?.email || "Pengguna Google";
  const userDisplayName = auth.currentUser?.displayName || "Tanpa Nama";
  const userPhotoUrl = auth.currentUser?.photoURL;

  return (
    <div className="space-y-6" id="settings-view">
      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold border flex gap-3 items-center ${
            statusMsg.type === "success"
              ? "bg-teal-50 border-teal-100 text-teal-800"
              : "bg-rose-50 border-rose-100 text-brand-wine"
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Grid: Indicators Configuration & Theme */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bounds management card */}
        <div className={`p-5 rounded-2xl border shadow-sm space-y-4 ${isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-100 text-slate-800"}`}>
          <div className={`flex items-center gap-2 pb-3 border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
            <Sliders className="w-5 h-5 text-brand-teal" />
            <div>
              <h3 className={`font-bold text-sm ${isDark ? "text-slate-100" : "text-slate-800"}`}>Batas Indikator Jam Produktif</h3>
              <p className="text-[10px] text-slate-400">Sesuaikan rentang waktu per hari</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className={`text-xs font-bold flex justify-between ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                <span>Batas Sangat Jelek (maksimal jam):</span>
                <span className="text-brand-wine font-extrabold">{vBad} Jam</span>
              </label>
              <input
                type="range"
                min="0"
                max="12"
                step="0.5"
                value={vBad}
                onChange={(e) => setVBad(parseFloat(e.target.value))}
                className="w-full accent-brand-wine h-1.5 bg-slate-150 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">&#8804; {vBad} Jam adalah "Sangat Jelek"</span>
            </div>

            <div className="space-y-2">
              <label className={`text-xs font-bold flex justify-between ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                <span>Batas Jelek (maksimal jam):</span>
                <span className="text-amber-600 font-extrabold">{bad} Jam</span>
              </label>
              <input
                type="range"
                min="1"
                max="16"
                step="0.5"
                value={bad}
                onChange={(e) => setBad(parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-slate-150 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">{vBad + 0.1}-{bad} Jam adalah "Jelek"</span>
            </div>

            <div className="space-y-2">
              <label className={`text-xs font-bold flex justify-between ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                <span>Batas Cukup (maksimal jam):</span>
                <span className="text-brand-teal font-extrabold">{fair} Jam</span>
              </label>
              <input
                type="range"
                min="2"
                max="24"
                step="0.5"
                value={fair}
                onChange={(e) => setFair(parseFloat(e.target.value))}
                className="w-full accent-brand-teal h-1.5 bg-slate-150 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">{bad + 0.1}-{fair} Jam adalah "Cukup" (&gt; {fair} Jam adalah "Bagus")</span>
            </div>

            <button
              onClick={handleSaveThresholds}
              disabled={savingSettings}
              className="w-full py-2.5 px-4 bg-brand-teal hover:bg-brand-teal/90 text-white font-semibold rounded-xl text-xs flex justify-center items-center gap-2 transition outline-none shadow-sm disabled:opacity-75 cursor-pointer"
              id="save-bounds-btn"
            >
              <Save className="w-4 h-4" />
              <span>{savingSettings ? "Menyimpan..." : "Simpan Batas Indikator"}</span>
            </button>
          </div>
        </div>

        {/* Theme Settings & Account Card */}
        <div className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between gap-6 ${isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-100 text-slate-800"}`}>
          <div className="space-y-4">
            <div className={`flex items-center gap-2 pb-3 border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
              <Sun className="w-5 h-5 text-brand-wine" />
              <div>
                <h3 className={`font-bold text-sm ${isDark ? "text-slate-100" : "text-slate-800"}`}>Gaya Tampilan Utama</h3>
                <p className="text-[10px] text-slate-400">Atur skema warna mode gelap / terang</p>
              </div>
            </div>

            {/* Light and dark toggle option blocks */}
            <div className="grid grid-cols-2 gap-3" id="theme-selector">
              <button
                onClick={() => handleToggleTheme("light")}
                className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition outline-none ${
                  config.theme === "light"
                    ? "border-brand-teal bg-brand-teal/5 text-brand-teal font-bold ring-1 ring-brand-teal/30"
                    : "border-slate-200 text-slate-450 hover:border-slate-300"
                }`}
                id="theme-light-btn"
              >
                <Sun className="w-5 h-5" />
                <span className="text-xs">Terang (Standard)</span>
              </button>

              <button
                onClick={() => handleToggleTheme("dark")}
                className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition outline-none ${
                  config.theme === "dark"
                    ? "border-brand-wine bg-brand-wine/5 text-brand-wine font-bold ring-1 ring-brand-wine/30"
                    : "border-slate-200 text-slate-450 hover:border-slate-300"
                }`}
                id="theme-dark-btn"
              >
                <Moon className="w-5 h-5" />
                <span className="text-xs">Gelap (Dark Mode)</span>
              </button>
            </div>
          </div>

          {/* User Account block */}
          <div className={`p-4 border rounded-xl flex items-center justify-between ${isDark ? "bg-slate-950/40 border-slate-800/85 text-slate-100" : "bg-slate-50/70 border-slate-100 text-slate-800"}`} id="account-card">
            <div className="flex items-center gap-3">
              {userPhotoUrl ? (
                <img
                  src={userPhotoUrl}
                  alt={userDisplayName}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-ice"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <UserCircle2 className="w-10 h-10 text-slate-400" />
              )}
              <div className="min-w-0">
                <h4 className={`text-xs font-bold truncate ${isDark ? "text-slate-100" : "text-slate-800"}`}>{userDisplayName}</h4>
                <p className="text-[10px] text-slate-400 truncate">{userEmail}</p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className={`p-2 border rounded-lg transition cursor-pointer ${isDark ? "border-rose-950 hover:border-rose-800 hover:bg-rose-950/20 text-rose-450" : "border-rose-200 hover:border-rose-300 hover:bg-rose-50 text-rose-600"}`}
              title="Keluar dari Akun"
              id="logout-btn"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Habit Manager Section */}
      <div className={`p-5 rounded-2xl border shadow-sm space-y-5 ${isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-100 text-slate-800"}`} id="habit-panels-manager">
        <div className={`flex items-center gap-2 pb-3 border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
          <CheckSquare className="w-5 h-5 text-brand-wine" />
          <div>
            <h3 className={`font-bold text-sm ${isDark ? "text-slate-100" : "text-slate-800"}`}>Kelola Panel Habits & To-Do List</h3>
            <p className="text-[10px] text-slate-400">Atur kelompok habits, identitas warna, deskripsi, urutan, serta aktif/nonaktifkan di sini.</p>
          </div>
        </div>

        {/* Add new Group form */}
        <form onSubmit={handleAddGroup} className="space-y-2 max-w-lg bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/80">
          <div className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider mb-2">Tambah Kategori/Panel Baru</div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Nama kategori (misal: Olahraga)"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="flex-1 py-1.5 px-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-xs focus:border-brand-teal outline-none text-slate-800 dark:text-slate-100"
            />
            <input
              type="text"
              placeholder="Deskripsi kategori (opsional)"
              value={newGroupDesc}
              onChange={(e) => setNewGroupDesc(e.target.value)}
              className="flex-1 py-1.5 px-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-xs focus:border-brand-teal outline-none text-slate-800 dark:text-slate-100"
            />
            <button
              type="submit"
              className="py-1.5 px-3.5 bg-brand-teal hover:bg-brand-teal/90 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
          </div>
        </form>

        {/* Colors Palette helper map */}
        {(() => {
          const AVAILABLE_COLORS = [
            { id: "teal", label: "Teal", colorClass: "bg-teal-500", borderClass: "border-teal-500" },
            { id: "emerald", label: "Emerald", colorClass: "bg-emerald-500", borderClass: "border-emerald-500" },
            { id: "indigo", label: "Indigo", colorClass: "bg-indigo-500", borderClass: "border-indigo-500" },
            { id: "rose", label: "Rose", colorClass: "bg-rose-500", borderClass: "border-rose-500" },
            { id: "amber", label: "Amber", colorClass: "bg-amber-500", borderClass: "border-amber-500" },
            { id: "purple", label: "Purple", colorClass: "bg-purple-500", borderClass: "border-purple-500" },
            { id: "slate", label: "Slate", colorClass: "bg-slate-500", borderClass: "border-slate-500" },
          ];

          return (
            <div className="grid grid-cols-1 gap-5">
              {config.habitsConfig.map((group) => {
                const isGroupEnabled = group.enabled !== false;
                const groupColor = group.color || "teal"; // fallback to teal
                const isEditingGroup = editingGroupId === group.id;

                return (
                  <div 
                    key={group.id} 
                    className={`border rounded-2xl p-5 transition duration-150 relative ${
                      isGroupEnabled 
                        ? isDark 
                          ? "bg-slate-950/40 border-slate-800" 
                          : "bg-slate-50/55 border-slate-200/80" 
                        : isDark
                          ? "bg-slate-900/10 border-slate-900 opacity-60"
                          : "bg-slate-100/50 border-slate-200 opacity-70"
                    }`}
                  >
                    {/* Group Header Area */}
                    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b mb-4 ${isDark ? "border-slate-800" : "border-slate-200/60"}`}>
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        {/* Enabled / Disabled Category Checkbox */}
                        <input
                          type="checkbox"
                          checked={isGroupEnabled}
                          onChange={() => handleToggleGroupEnabled(group.id, isGroupEnabled)}
                          className="w-4 h-4 mt-0.5 rounded text-brand-teal focus:ring-brand-teal cursor-pointer"
                          title="Aktifkan / nonaktifkan seluruh kategori ini di Habits"
                        />
                        
                        {isEditingGroup ? (
                          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                            <input
                              type="text"
                              value={editingGroupName}
                              onChange={(e) => setEditingGroupName(e.target.value)}
                              placeholder="Nama Kategori..."
                              className="py-1 px-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:border-brand-teal"
                            />
                            <input
                              type="text"
                              value={editingGroupDesc}
                              onChange={(e) => setEditingGroupDesc(e.target.value)}
                              placeholder="Deskripsi Kategori (opsional)..."
                              className="py-1 px-2.5 text-[10px] text-slate-650 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-brand-teal"
                            />
                            <div className="flex items-center gap-1.5 mt-1">
                              <button
                                onClick={() => handleUpdateGroupDetails(group.id, editingGroupName, editingGroupDesc)}
                                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition text-[10px] font-bold flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                <span>Simpan</span>
                              </button>
                              <button
                                onClick={() => setEditingGroupId(null)}
                                className="px-2.5 py-1 bg-slate-400 hover:bg-slate-500 text-white rounded-lg transition text-[10px] font-bold flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3 rotate-45" />
                                <span>Batal</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col justify-start min-w-0 flex-1">
                            <span className={`text-xs font-extrabold flex items-center gap-1.5 ${isDark ? "text-slate-105" : "text-slate-800"}`}>
                              <span 
                                className={`w-3 h-3 rounded-full inline-block shrink-0 ${groupColor.startsWith('#') ? '' : `bg-${groupColor}-500`}`}
                                style={groupColor.startsWith('#') ? { backgroundColor: groupColor } : undefined} 
                              />
                              <span className="truncate">{group.name}</span>
                              {!isGroupEnabled && <span className="text-[10px] text-slate-400 font-normal italic shrink-0">(Dinonaktifkan)</span>}
                            </span>
                            {group.description && (
                              <p className="text-[10pt] text-slate-500 dark:text-slate-400 font-medium pl-4.5 mt-0.5 leading-relaxed">
                                {group.description}
                              </p>
                            )}
                          </div>
                        )}

                        {!isEditingGroup && (
                          <button
                            onClick={() => {
                              setEditingGroupId(group.id);
                              setEditingGroupName(group.name);
                              setEditingGroupDesc(group.description || "");
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                            title="Ubah rincian kategori"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
 
                      {/* Color Picker & Delete Button */}
                      <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                        <div className={`flex items-center gap-1 p-1 rounded-lg border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                          <Palette className="w-3 h-3 text-slate-400 ml-1 mr-0.5" />
                          {AVAILABLE_COLORS.map((col) => (
                            <button
                              key={col.id}
                              type="button"
                              onClick={() => handleChangeGroupColor(group.id, col.id)}
                              className={`w-3.5 h-3.5 rounded-full ${col.colorClass} transition transform hover:scale-110 cursor-pointer ${
                                groupColor === col.id ? "ring-2 ring-offset-1 ring-slate-800 font-extrabold" : ""
                              }`}
                              title={`Warna ${col.label}`}
                            />
                          ))}
                          
                          {/* Custom Color Input via Input Type Color */}
                          <div 
                            className="relative w-4 h-4 rounded-full overflow-hidden border border-slate-300 dark:border-slate-600 flex items-center justify-center cursor-pointer hover:scale-115 transition" 
                            title="Warna kustom (Color Picker)"
                          >
                            <input 
                              type="color" 
                              value={groupColor.startsWith("#") ? groupColor : "#0d9488"} 
                              onChange={(e) => handleChangeGroupColor(group.id, e.target.value)}
                              className="absolute scale-200 cursor-pointer opacity-100 border-none outline-none p-0 w-full h-full"
                            />
                          </div>
                        </div>
 
                        <button
                          onClick={() => handleDeleteGroup(group.id, group.name)}
                          className="p-1.5 text-slate-350 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition"
                          title="Hapus Kategori"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* To-Do Items inside this Group Panel */}
                    <div className="space-y-2 mb-4">
                      {group.items.length === 0 ? (
                        <p className="text-[10px] text-slate-450 italic py-1 pl-1">Belum ada daftar tugas dalam kelompok ini.</p>
                      ) : (
                        group.items.map((item, idx) => {
                          const resolved = typeof item === "string"
                            ? { id: "item_legacy_" + idx + "_" + encodeURIComponent(item), name: item, description: "", enabled: true }
                            : { 
                                id: item.id || "item_" + idx, 
                                name: item.name || "", 
                                description: item.description || "", 
                                enabled: item.enabled !== false 
                              };

                          const isEditingItem = editingItemUID === `${group.id}::${resolved.id}`;

                          return (
                            <div 
                              key={resolved.id}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border shadow-xs transition duration-150 ${
                                isDark 
                                  ? resolved.enabled 
                                    ? "bg-slate-900 border-slate-800 text-slate-100" 
                                    : "bg-slate-950/20 border-slate-900 opacity-60 text-slate-400"
                                  : resolved.enabled 
                                    ? "bg-white border-slate-200/60 text-slate-800" 
                                    : "bg-slate-50/50 border-slate-200 opacity-60 text-slate-450"
                              }`}
                            >
                              {/* Left column: Checkbox and Details OR edit fields */}
                              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                {/* Enabled Status checkbox for item */}
                                <input
                                  type="checkbox"
                                  checked={resolved.enabled}
                                  onChange={() => handleToggleItemEnabled(group.id, resolved.id, resolved.enabled)}
                                  className="w-3.5 h-3.5 rounded text-brand-teal focus:ring-brand-teal mt-1 cursor-pointer"
                                  title="Aktifkan / nonaktifkan to-do list ini sendiri"
                                />

                                {isEditingItem ? (
                                  <div className="flex flex-col gap-1.5 flex-1">
                                    <input
                                      type="text"
                                      value={editingItemName}
                                      onChange={(e) => setEditingItemName(e.target.value)}
                                      placeholder="Nama Tugas..."
                                      className="py-0.5 px-2 text-xs text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:bg-white dark:focus:bg-slate-900"
                                    />
                                    <textarea
                                      value={editingItemDesc}
                                      onChange={(e) => setEditingItemDesc(e.target.value)}
                                      placeholder="Deskripsi..."
                                      rows={1}
                                      className="py-0.5 px-2 text-[10px] text-slate-650 dark:text-slate-305 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-brand-teal"
                                    />
                                  </div>
                                ) : (
                                  <div className="min-w-0">
                                    <p className={`text-xs font-bold truncate ${resolved.enabled ? (isDark ? "text-slate-100" : "text-slate-800") : "line-through text-slate-450 dark:text-slate-500"}`}>
                                      {resolved.name}
                                    </p>
                                    {resolved.description ? (
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5">
                                        {resolved.description}
                                      </p>
                                    ) : (
                                      <p className="text-[9px] text-slate-400 dark:text-slate-550 italic">Tidak ada deskripsi</p>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Right column: Position controller (UP/DOWN/EDIT/DELETE) */}
                              <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                                {isEditingItem ? (
                                  <>
                                    <button
                                      onClick={() => handleSaveItemEdit(group.id, resolved.id, editingItemName, editingItemDesc)}
                                      className="p-1 bg-brand-teal hover:bg-brand-teal/90 text-white rounded-lg transition shrink-0 cursor-pointer"
                                      title="Simpan perubahan"
                                    >
                                      <Save className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => setEditingItemUID(null)}
                                      className="p-1 bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-400 rounded-lg transition shrink-0 cursor-pointer"
                                      title="Batal"
                                    >
                                      <Plus className="w-3 h-3 rotate-45" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    {/* Reorder Up */}
                                    <button
                                      disabled={idx === 0}
                                      onClick={() => handleMoveItem(group.id, idx, "up")}
                                      className={`p-1.5 rounded-lg border transition shrink-0 cursor-pointer ${
                                        idx === 0 
                                          ? "text-slate-300 dark:text-slate-700 border-transparent bg-slate-50/50 dark:bg-slate-900/40" 
                                          : `text-slate-500 dark:text-slate-400 border-slate-150 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800`
                                      }`}
                                      title="Geser Ke Atas"
                                    >
                                      <ArrowUp className="w-3 h-3" />
                                    </button>

                                    {/* Reorder Down */}
                                    <button
                                      disabled={idx === group.items.length - 1}
                                      onClick={() => handleMoveItem(group.id, idx, "down")}
                                      className={`p-1.5 rounded-lg border transition shrink-0 cursor-pointer ${
                                        idx === group.items.length - 1 
                                          ? "text-slate-300 dark:text-slate-700 border-transparent bg-slate-50/50 dark:bg-slate-900/40" 
                                          : `text-slate-500 dark:text-slate-400 border-slate-150 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800`
                                      }`}
                                      title="Geser Ke Bawah"
                                    >
                                      <ArrowDown className="w-3 h-3" />
                                    </button>

                                    {/* Edit */}
                                    <button
                                      onClick={() => {
                                        setEditingItemUID(`${group.id}::${resolved.id}`);
                                        setEditingItemName(resolved.name);
                                        setEditingItemDesc(resolved.description);
                                      }}
                                      className="p-1.5 text-slate-400 dark:text-slate-400 hover:text-brand-teal dark:hover:text-brand-teal rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0 cursor-pointer"
                                      title="Ubah Nama & Deskripsi"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>

                                    {/* Delete */}
                                    <button
                                      onClick={() => handleDeleteTaskItem(group.id, resolved.id)}
                                      className="p-1.5 text-slate-300 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition shrink-0 cursor-pointer"
                                      title="Hapus"
                                    >
                                      <Plus className="w-3.5 h-3.5 rotate-45 stroke-[2.5]" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Form for adding a new To-Do list item with Description! */}
                    <div className={`p-3.5 rounded-xl border space-y-2 mt-3 ${isDark ? "bg-slate-950/40 border-slate-800" : "bg-slate-100/60 border-slate-200/50"}`}>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">Tambah To-Do baru</label>
                        <input
                          type="text"
                          placeholder="Nama tugas (misal: Push up 20x)..."
                          value={newItemTexts[group.id] || ""}
                          onChange={(e) =>
                            setNewItemTexts((prev) => ({ ...prev, [group.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddTaskItem(group.id);
                            }
                          }}
                          className="w-full py-1.5 px-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg text-[11px] outline-none focus:border-brand-teal"
                        />
                      </div>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Deskripsi tugas (opsional)..."
                          value={newItemDescriptions[group.id] || ""}
                          onChange={(e) =>
                            setNewItemDescriptions((prev) => ({ ...prev, [group.id]: e.target.value }))
                          }
                          className="flex-1 py-1 px-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg text-[10px] outline-none focus:border-brand-teal"
                        />
                        <button
                          onClick={() => handleAddTaskItem(group.id)}
                          className="py-1 px-3 bg-brand-teal hover:bg-brand-teal/90 text-white rounded-lg text-[11px] font-bold shrink-0 transition cursor-pointer"
                        >
                          Tambahkan
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
