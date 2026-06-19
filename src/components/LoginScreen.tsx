import React, { useState } from "react";
import { 
  auth, 
  signInWithPopup, 
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "../lib/firebase";
import { 
  LogIn, 
  ShieldAlert, 
  Sparkles, 
  Clock, 
  CheckSquare, 
  Mail, 
  Lock, 
  User, 
  Settings, 
  ChevronLeft, 
  Database,
  Eye,
  EyeOff,
  HelpCircle
} from "lucide-react";
import { motion } from "motion/react";

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"welcome" | "email" | "config">("welcome");
  
  // Email Auth State
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Custom Firebase Config State
  const [customConfigText, setCustomConfigText] = useState(() => {
    return localStorage.getItem("custom_firebase_config") || "";
  });

  const isUsingCustomConfig = localStorage.getItem("custom_firebase_config") !== null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        onLoginSuccess(result.user);
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      if (error.code === "auth/unauthorized-domain") {
        setErrorMessage(
          "Gagal masuk: Domain ini belum diotorisasi di Firebase. Gunakan 'Solusi 1 (Login Email & Password)' atau 'Solusi 2 (Hubungkan Project Sendiri)' di bawah."
        );
      } else {
        setErrorMessage(
          error.message || "Gagal masuk menggunakan Google. Harap coba lagi."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOfflineLogin = () => {
    setLoading(true);
    try {
      const localSession = {
        uid: "local_user",
        displayName: "Pengguna Lokal",
        email: "local@productivity.app",
        photoURL: null
      };
      localStorage.setItem("local_user_session", JSON.stringify(localSession));
      onLoginSuccess(localSession);
    } catch (error: any) {
      console.error("Offline Login Error:", error);
      setErrorMessage("Gagal beralih ke Mode Offline. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Email dan password wajib diisi.");
      return;
    }
    
    setLoading(true);
    setErrorMessage(null);
    
    try {
      if (isRegisterMode) {
        if (!displayName.trim()) {
          setErrorMessage("Nama lengkap wajib diisi untuk mendaftar.");
          setLoading(false);
          return;
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: displayName
        });
        
        onLoginSuccess({
          uid: userCredential.user.uid,
          displayName: displayName,
          email: userCredential.user.email,
          photoURL: null
        });
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onLoginSuccess({
          uid: userCredential.user.uid,
          displayName: userCredential.user.displayName || "Pengguna",
          email: userCredential.user.email,
          photoURL: null
        });
      }
    } catch (error: any) {
      console.error("Email Auth Error:", error);
      let msg = error.message;
      if (error.code === "auth/invalid-credential") {
        msg = "Email atau password salah. Silakan coba lagi.";
      } else if (error.code === "auth/email-already-in-use") {
        msg = "Email sudah terdaftar. Silakan gunakan email lain atau masuk.";
      } else if (error.code === "auth/weak-password") {
        msg = "Kata sandi terlalu lemah. Minimal harus 6 karakter.";
      } else if (error.code === "auth/invalid-email") {
        msg = "Alamat email tidak valid.";
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCustomConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const cleanedText = customConfigText.trim();
    
    if (!cleanedText) {
      setErrorMessage("Silakan tempel konfigurasi JSON terlebih dahulu.");
      return;
    }
    
    try {
      let parsedConfig: any;
      if (cleanedText.includes("const firebaseConfig = {")) {
        const match = cleanedText.match(/const\s+firebaseConfig\s*=\s*(\{[\s\S]*?\});/);
        if (match && match[1]) {
          const jsObjStr = match[1];
          const jsonCompatible = jsObjStr
            .replace(/([a-zA-Z0-9]+)\s*:/g, '"$1":')
            .replace(/'/g, '"')
            .replace(/,\s*}/g, '}');
          parsedConfig = JSON.parse(jsonCompatible);
        } else {
          throw new Error("Unable to parse Javascript object style");
        }
      } else {
        parsedConfig = JSON.parse(cleanedText);
      }
      
      if (!parsedConfig.apiKey || !parsedConfig.projectId || !parsedConfig.authDomain) {
        setErrorMessage("Konfigurasi tidak lengkap. Harus memiliki apiKey, projectId, dan authDomain.");
        return;
      }
      
      localStorage.setItem("custom_firebase_config", JSON.stringify(parsedConfig));
      localStorage.removeItem("local_user_session");
      alert("Konfigurasi Firebase baru terpasang! Aplikasi akan mereload.");
      window.location.reload();
    } catch (e) {
      console.error(e);
      setErrorMessage("Gagal menganalisis teks. Pastikan formatnya adalah JSON valid.");
    }
  };

  const handleResetConfig = () => {
    if (confirm("Apakah Anda ingin menghapus konfigurasi kustom dan kembali ke database bawaan?")) {
      localStorage.removeItem("custom_firebase_config");
      localStorage.removeItem("local_user_session");
      alert("Konfigurasi berhasil dikembalikan ke bawaan! Aplikasi akan mereload.");
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-brand-ice/50 selection:text-brand-wine">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-brand-teal/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-brand-wine/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden relative z-10"
        id="login-card"
      >
        <div className="h-2 bg-gradient-to-r from-brand-teal via-brand-ice to-brand-wine" />

        {/* Tab 1: WELCOME SCREEN */}
        {activeTab === "welcome" && (
          <div className="p-8 flex flex-col items-center">
            {/* Custom DB Status Badge if active */}
            {isUsingCustomConfig && (
              <div className="mb-4 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-semibold rounded-full flex items-center gap-1.5 shadow-sm">
                <Database className="w-3.5 h-3.5" />
                <span>Menggunakan Database Kustom</span>
              </div>
            )}

            <div className="w-16 h-16 bg-brand-teal/10 rounded-2xl flex items-center justify-center text-brand-teal mb-6">
              <Sparkles className="w-8 h-8" />
            </div>

            <h1 className="text-3xl font-bold text-slate-800 tracking-tight text-center mb-2">
              GD - Productivity
            </h1>
            <p className="text-sm text-slate-500 text-center max-w-sm mb-6 leading-relaxed">
              Pencatat waktu produktif harian dan pelacak kebiasaan (habits) yang
              aman di GitHub Pages dan cloud.
            </p>

            {/* Error alerts */}
            {errorMessage && (
              <div className="w-full mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex gap-3 text-rose-700 text-xs items-center leading-normal">
                <ShieldAlert className="w-5 h-5 shrink-0 text-rose-500" />
                <span className="flex-1">{errorMessage}</span>
              </div>
            )}

            {/* Google Sign-In Action */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-brand-teal hover:bg-brand-teal/90 text-white font-medium py-3.5 px-4 rounded-xl transition duration-200 outline-none focus:ring-2 focus:ring-brand-teal/30 active:scale-[0.99] disabled:opacity-75 disabled:pointer-events-none text-sm shadow-sm"
              id="google-signin-btn"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.133 1 1.134 6 1.134 12s4.99 11 11.106 11c6.378 0 10.608-4.483 10.608-10.79 0-.727-.08-1.281-.176-1.925H12.24z"
                    />
                  </svg>
                  <span>Masuk dengan Google</span>
                </>
              )}
            </button>

            <div className="w-full flex items-center gap-3 my-5">
              <div className="h-[1px] bg-slate-200 grow" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Atau Solusi Alternatif</span>
              <div className="h-[1px] bg-slate-200 grow" />
            </div>

            {/* Email login button */}
            <button
              onClick={() => {
                setErrorMessage(null);
                setActiveTab("email");
              }}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl transition duration-200 outline-none text-xs border border-slate-200/50"
            >
              <Mail className="w-4 h-4 text-slate-500" />
              <span>Solusi 1: Masuk dengan Email & Password</span>
            </button>

            <button
              onClick={handleOfflineLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium py-2.5 px-4 rounded-xl transition duration-200 outline-none text-xs border border-dashed border-slate-200 mt-3"
              id="offline-signin-btn"
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Gunakan Tanpa Login (Mode Offline)</span>
            </button>

            <div className="w-full border-t border-slate-100 mt-6 pt-5 flex justify-center">
              <button
                onClick={() => {
                  setErrorMessage(null);
                  setActiveTab("config");
                }}
                className="text-xs text-brand-teal hover:text-brand-teal/80 font-semibold flex items-center gap-1.5 transition active:scale-95"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Solusi 2: Hubungkan Firebase Project Sendiri 🔧</span>
              </button>
            </div>

            <p className="text-[10px] text-slate-400 mt-5 text-center leading-relaxed">
              Melalui Solusi 1, pendaftaran akun bebas pembatasan domain di GitHub Pages dan langsung terkoneksi ke database Cloud.
            </p>
          </div>
        )}

        {/* Tab 2: EMAIL / PASSWORD LOGIN & REGISTER */}
        {activeTab === "email" && (
          <div className="p-8">
            <button
              onClick={() => {
                setErrorMessage(null);
                setActiveTab("welcome");
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-6"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>

            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              {isRegisterMode ? "Daftar Akun Baru" : "Masuk dengan Email"}
            </h2>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              {isRegisterMode
                ? "Daftarkan akun di database Firebase untuk akses penuh bebas hambatan."
                : "Masuk dengan email Anda yang telah terdaftar di database Firebase."}
            </p>

            {errorMessage && (
              <div className="w-full mb-5 p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex gap-2.5 text-rose-700 text-xs items-center leading-normal">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
                <span className="flex-1">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleEmailAuthSubmit} className="space-y-4">
              {isRegisterMode && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Masukkan nama lengkap Anda"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none text-xs transition duration-150"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none text-xs transition duration-150"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={isRegisterMode ? "Minimal 6 karakter" : "Masukkan kata sandi"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none text-xs transition duration-150"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-brand-teal hover:bg-brand-teal/90 text-white font-medium rounded-xl transition duration-200 text-xs outline-none focus:ring-2 focus:ring-brand-teal/20 flex items-center justify-center shadow-sm disabled:opacity-75 mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isRegisterMode ? (
                  "Buat Akun Sekarang"
                ) : (
                  "Masuk ke Aplikasi"
                )}
              </button>
            </form>

            <div className="text-center mt-6">
              <button
                onClick={() => {
                  setErrorMessage(null);
                  setIsRegisterMode(!isRegisterMode);
                }}
                className="text-xs text-slate-500 hover:text-slate-800 transition font-medium underline"
              >
                {isRegisterMode
                  ? "Sudah punya akun? Masuk di sini"
                  : "Belum punya akun? Daftar gratis di sini"}
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: CUSTOM CUSTOM CONFIGURATION */}
        {activeTab === "config" && (
          <div className="p-8">
            <button
              onClick={() => {
                setErrorMessage(null);
                setActiveTab("welcome");
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-6"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>

            <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <Database className="w-6 h-6 text-brand-teal" />
              <span>Firebase Sendiri</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Hubungkan database cloud pribadi agar Anda memiliki hak akses penuh mendaftarkan domain Anda ke whitelist Firebase (Authorized Domains).
            </p>

            {/* Instruction block */}
            <div className="mb-5 bg-slate-50 p-4 rounded-xl border border-slate-100 text-[11px] text-slate-600 leading-relaxed space-y-2">
              <div className="flex items-start gap-1.5 font-bold text-slate-700">
                <HelpCircle className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" />
                <span>Cara mendapatkan konfigurasi:</span>
              </div>
              <ol className="list-decimal pl-4.5 space-y-1">
                <li>Buka console.firebase.google.com</li>
                <li>Buat project baru (atau buka yang sudah ada).</li>
                <li>Buka <b>Settings Project</b> &gt; scroll ke bawah dan buat / pilih <b>Web App</b>.</li>
                <li>Salin cuplikan kode <code className="bg-slate-200/65 px-1 rounded font-mono">firebaseConfig = {"{...}"}</code> dan tempel di bawah.</li>
              </ol>
            </div>

            {errorMessage && (
              <div className="w-full mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex gap-2 text-rose-700 text-xs items-center leading-normal">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
                <span className="flex-1">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveCustomConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Tempel JSON di Sini
                </label>
                <textarea
                  className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[10px] focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none resize-none transition"
                  placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "pro-app.firebaseapp.com",\n  "projectId": "pro-app",\n  "storageBucket": "pro-app.appspot.com",\n  "messagingSenderId": "...",\n  "appId": "..."\n}`}
                  value={customConfigText}
                  onChange={(e) => setCustomConfigText(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-2 pt-1">
                {isUsingCustomConfig && (
                  <button
                    type="button"
                    onClick={handleResetConfig}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs outline-none transition"
                  >
                    Reset Bawaan
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-[2] py-3 bg-brand-teal hover:bg-brand-teal/90 text-white font-medium rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-teal/20 shadow-sm transition"
                >
                  Simpan & Hubungkan
                </button>
              </div>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
}
