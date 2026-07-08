import React from "react";
import { Database, FileText } from "lucide-react";

interface SignInProps {
  onSignIn: () => void;
  isLoading: boolean;
  error: string | null;
}

export default function SignIn({ onSignIn, isLoading, error }: SignInProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 sm:px-6 lg:px-8 relative overflow-hidden" id="signin-container">
      {/* Subtle Grid Background */}
      <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30"></div>
      
      <div className="max-w-md w-full space-y-7 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 relative z-10" id="signin-card">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-indigo-600 text-white mb-4 shadow-sm" id="logo-badge">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 font-sans leading-snug">
            Transformer Inspection System
          </h2>
          <p className="mt-2 text-xs text-slate-400 font-sans leading-relaxed">
            ระบบจัดเก็บรายงานผลการตรวจสอบหม้อแปลงไฟฟ้าลง Google Sheets และจัดเก็บบันทึกภาพถ่ายหน้างานจริงลงบน Google Drive
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-700 font-sans leading-relaxed space-y-2" id="signin-error">
            <div>
              <span className="font-bold">เกิดข้อผิดพลาดในการลงชื่อเข้าใช้:</span>
              <p className="mt-1 font-mono text-[10px] text-rose-600 bg-rose-100/40 p-1.5 rounded">{error}</p>
            </div>
            {error.includes("popup-closed-by-user") && (
              <div className="text-[11px] text-slate-600 border-t border-rose-200/60 pt-2 mt-2 space-y-1">
                <p className="font-bold text-rose-800">💡 วิธีแก้ไขเบื้องต้น:</p>
                <ul className="list-disc list-inside space-y-1 text-[10.5px]">
                  <li>กรุณาปล่อยให้หน้าต่างป๊อปอัปของ Google โหลดจนเสร็จสมบูรณ์ และอย่าเพิ่งปิดหน้าต่างนั้น</li>
                  <li>หากเปิดในหน้าต่างตัวอย่าง (Preview iFrame) ของ AI Studio แนะนำให้คลิกปุ่ม <span className="font-bold text-indigo-600">"เปิดในแท็บใหม่" (Open in new tab)</span> ที่แถบเมนูด้านบนของเบราว์เซอร์ เพื่อแก้ไขข้อจำกัดของระบบความปลอดภัย iFrame</li>
                  <li>ตรวจสอบว่าเบราว์เซอร์ของคุณไม่ได้เปิดบล็อกป๊อปอัป (Pop-up Blocker) ไว้</li>
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="space-y-6">
          <div className="flex flex-col gap-4 border-y border-slate-100 py-5 my-5 text-xs text-slate-500" id="scope-info">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-indigo-50 text-indigo-600 rounded-md shrink-0 mt-0.5">
                <Database className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold text-slate-700 font-sans">บันทึกข้อมูลแบบ Real-time</p>
                <p className="font-sans text-[11px] text-slate-400 mt-0.5">เชื่อมต่อไปยัง Google Sheets (ID: ...N7w) อัปเดตข้อมูลการรายงานทันที</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-1 bg-indigo-50 text-indigo-600 rounded-md shrink-0 mt-0.5">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold text-slate-700 font-sans">จัดเก็บหลักฐานภาพถ่ายหน้างาน</p>
                <p className="font-sans text-[11px] text-slate-400 mt-0.5">บันทึกไฟล์ภาพถ่ายความละเอียดสูงตรงไปที่ Google Drive (ID: ...lltI) อัตโนมัติ</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center" id="gsi-button-wrapper">
            <button
              onClick={onSignIn}
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all shadow-sm cursor-pointer disabled:opacity-65 disabled:cursor-not-allowed"
              id="google-signin-btn"
            >
              <div className="flex items-center gap-2.5">
                {isLoading ? (
                  <svg className="animate-spin h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 shrink-0">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                )}
                <span className="font-bold font-sans uppercase tracking-wider">{isLoading ? "Signing in..." : "Sign in with Google"}</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
