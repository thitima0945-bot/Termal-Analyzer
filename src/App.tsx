import React, { useState, useEffect } from "react";
import SignIn from "./components/SignIn";
import ReportForm from "./components/ReportForm";
import ReportHistory from "./components/ReportHistory";
import { initAuth, googleSignIn, googleSignOut } from "./lib/firebase";
import { 
  uploadPhotoToDrive, 
  appendReportToSheet, 
  fetchReportsFromSheet, 
  InspectionReport 
} from "./lib/googleApi";
import { User } from "firebase/auth";
import { Sparkles, LogOut, Database, FileText, CheckCircle2, AlertCircle } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
  // App States
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Data Loading & Submitting states
  const [reports, setReports] = useState<InspectionReport[]>([]);
  const [isReportsLoading, setIsReportsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // User feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize Auth state listener
  useEffect(() => {
    setIsAuthLoading(true);
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        setNeedsAuth(false);
        setIsAuthLoading(false);
        // Load initial reports list
        loadReports(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setNeedsAuth(true);
        setIsAuthLoading(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setNeedsAuth(false);
        // Load initial reports list
        loadReports(result.accessToken);
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      setAuthError(err.message || "การเข้าสู่ระบบผ่าน Google ล้มเหลว โปรดลองใหม่อีกครั้ง");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await googleSignOut();
      setUser(null);
      setAccessToken(null);
      setNeedsAuth(true);
      setReports([]);
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  const loadReports = async (token: string) => {
    setIsReportsLoading(true);
    try {
      const data = await fetchReportsFromSheet(token);
      setReports(data);
    } catch (err: any) {
      console.error("Failed to load reports:", err);
      setErrorMsg(err.message || "ไม่สามารถดึงข้อมูลรายงานจาก Google Sheets ได้");
    } finally {
      setIsReportsLoading(false);
    }
  };

  const handleFormSubmit = async (formData: {
    transformerId: string;
    timestamp: string;
    result: "ผ่าน (Pass)" | "ไม่ผ่าน (Fail)" | "ต้องบำรุงรักษา (Needs Maintenance)";
    latitude: number;
    longitude: number;
    photo: File | null;
    details: string;
  }) => {
    if (!accessToken || !user) {
      setErrorMsg("เซสชันของคุณหมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่อีกครั้ง");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let photoUrl = "";
      if (formData.photo) {
        // 1. Upload photo to Google Drive
        photoUrl = await uploadPhotoToDrive(accessToken, formData.photo);
      }

      // 2. Format inspection report
      const newReport: InspectionReport = {
        transformerId: formData.transformerId,
        timestamp: formData.timestamp,
        result: formData.result,
        latitude: formData.latitude,
        longitude: formData.longitude,
        photoUrl: photoUrl,
        inspectorEmail: user.email || "anonymous@work",
        details: formData.details,
      };

      // 3. Save report row in Google Sheets
      await appendReportToSheet(accessToken, newReport);

      // 4. Update UI feedback
      setSuccessMsg(`บันทึกรายงานผลการตรวจสอบหม้อแปลงหมายเลข ${formData.transformerId} เรียบร้อยแล้ว!`);
      
      // Auto dismiss success message after 5 seconds
      setTimeout(() => setSuccessMsg(null), 5000);

      // 5. Reload history table
      await loadReports(accessToken);
    } catch (err: any) {
      console.error("Submission failed:", err);
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading && needsAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans" id="loading-screen">
        <div className="text-center space-y-4">
          <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm text-slate-500 font-sans">กำลังเตรียมระบบรายงาน...</p>
        </div>
      </div>
    );
  }

  if (needsAuth) {
    return <SignIn onSignIn={handleSignIn} isLoading={isAuthLoading} error={authError} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900" id="dashboard-layout">
      {/* Navigation Header / Professional Polish Style */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40" id="main-nav">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white" id="nav-logo">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-800 font-sans leading-none">
              Transformer Inspection System
            </h1>
            <span className="text-[10px] text-slate-400 font-sans">ระบบตรวจหม้อแปลงไฟฟ้า</span>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6" id="nav-user-controls">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Connected Sheet</span>
            <span className="text-xs font-mono text-slate-600 font-sans bg-slate-50 px-2 py-0.5 rounded border border-slate-100">...MzbN_N7w</span>
          </div>
          
          <div className="flex items-center gap-3 border-l border-slate-100 pl-4 sm:pl-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 shadow-sm flex items-center justify-center font-bold text-indigo-600 text-sm font-sans">
                {user?.displayName ? user.displayName.substring(0, 2).toUpperCase() : user?.email?.substring(0, 2).toUpperCase() || "US"}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 font-sans">{user?.displayName || "ผู้ตรวจสอบ"}</span>
                <span className="text-[10px] text-slate-400 font-sans max-w-[140px] truncate">{user?.email}</span>
              </div>
            </div>
            
            <button
              onClick={handleSignOut}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-100"
              title="ออกจากระบบ"
              id="signout-btn"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Layout / 3 Column Design (Sidebar, Form, History) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        
        {/* Left Sidebar / Inspector Overview & Cloud Status */}
        <aside className="w-full lg:w-1/4 flex flex-col gap-6 shrink-0" id="sidebar-layout">
          {/* User Overview */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans mb-4">Inspector Overview</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-sans">ผู้ลงชื่อเข้าใช้:</span>
                <span className="font-semibold text-slate-800 font-sans text-right">{user?.displayName || "ผู้ตรวจสอบ"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-sans">อีเมล:</span>
                <span className="font-medium text-slate-600 font-sans truncate max-w-[150px]" title={user?.email || ""}>
                  {user?.email}
                </span>
              </div>
              <div className="h-px bg-slate-100 my-2"></div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-sans">รายงานทั้งหมดในชีต:</span>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-bold font-mono">
                  {reports.length}
                </span>
              </div>
            </div>
          </div>

          {/* Cloud Sync Status */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col justify-between gap-4">
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans mb-4">Cloud Sync Status</h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-slate-600 font-sans font-medium">Google Sheets Active</span>
                </div>
                <p className="font-mono text-[10px] text-slate-400 bg-slate-50 p-2 rounded border border-slate-100 break-all leading-relaxed">
                  Sheet ID: 1-hB1BViuRg92Pj8Q2RiaE3sszdR8BVqqvkjMzbN_N7w
                </p>

                <div className="flex items-center gap-2.5 pt-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-slate-600 font-sans font-medium">Google Drive Active</span>
                </div>
                <p className="font-mono text-[10px] text-slate-400 bg-slate-50 p-2 rounded border border-slate-100 break-all leading-relaxed">
                  Folder ID: 1XJzxo2gIIqoEo2DueFMEHaurc1GUlltI
                </p>
              </div>
            </div>

            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/60 text-[10px] text-indigo-700/80 leading-relaxed font-sans">
              รายงานและรูปภาพหลักฐานจะถูกเชื่อมโยงและบันทึกแบบ Real-time ไปยังคลาวด์ตามพิกัดและเวลาจริงทันที
            </div>
          </div>
        </aside>

        {/* Center / Right Section: Form and History Table */}
        <section className="flex-1 flex flex-col gap-6 overflow-hidden">
          {/* Global Feedback Notifications */}
          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-3 shadow-sm font-sans" id="success-notification">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-3 shadow-sm font-sans" id="error-notification">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="dashboard-bento">
            {/* Form Section (5 cols out of 12) */}
            <div className="xl:col-span-5" id="form-grid-item">
              <ReportForm onSubmit={handleFormSubmit} isSubmitting={isSubmitting} />
            </div>

            {/* History Table Section (7 cols out of 12) */}
            <div className="xl:col-span-7" id="history-grid-item">
              <ReportHistory 
                reports={reports} 
                isLoading={isReportsLoading} 
                onRefresh={() => accessToken && loadReports(accessToken)} 
              />
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Status Bar / Professional Polish style */}
      <footer className="px-6 py-2 bg-slate-800 text-slate-400 text-[9px] sm:text-[10px] flex justify-between shrink-0" id="status-bar">
        <div className="flex gap-4">
          <span className="font-bold tracking-wider text-slate-300">SYSTEM READY</span>
          <span className="border-l border-slate-700 pl-4 hidden sm:inline">DATA COUPLING: ACTIVE</span>
          <span className="border-l border-slate-700 pl-4 hidden sm:inline">ENCRYPTION: SSL/AES-256</span>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="font-sans">AUTOMATED DATA TERMINAL (GWS-101)</span>
        </div>
      </footer>
    </div>
  );
}
