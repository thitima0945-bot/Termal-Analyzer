import React from "react";
import { InspectionReport } from "../lib/googleApi";
import { 
  MapPin, 
  ExternalLink, 
  Check, 
  X, 
  AlertTriangle, 
  RefreshCw,
  Clock,
  User,
  Image as ImageIcon,
  ChevronRight
} from "lucide-react";

interface ReportHistoryProps {
  reports: InspectionReport[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function ReportHistory({ reports, isLoading, onRefresh }: ReportHistoryProps) {
  const getStatusBadge = (status: InspectionReport["result"]) => {
    switch (status) {
      case "ผ่าน (Pass)":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Check className="w-2.5 h-2.5" />
            ผ่าน (Pass)
          </span>
        );
      case "ต้องบำรุงรักษา (Needs Maintenance)":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-2.5 h-2.5" />
            ต้องบำรุงรักษา
          </span>
        );
      case "ไม่ผ่าน (Fail)":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <X className="w-2.5 h-2.5" />
            ไม่ผ่าน (Fail)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6" id="report-history-container">
      <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-5" id="history-header">
        <div>
          <h3 className="text-base font-bold text-slate-800 font-sans leading-tight">ประวัติการตรวจสอบล่าสุด</h3>
          <p className="text-[11px] text-slate-400 font-sans">ข้อมูลการตรวจล่าสุดดึงแบบเรียลไทม์จากระบบเซิร์ฟเวอร์</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all cursor-pointer border border-slate-200 disabled:opacity-50"
          title="โหลดข้อมูลใหม่"
          id="refresh-history-btn"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
        </button>
      </div>

      {isLoading && reports.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3" id="history-loading-placeholder">
          <RefreshCw className="w-7 h-7 animate-spin text-indigo-600" />
          <p className="text-xs font-bold font-sans">กำลังดึงประวัติการตรวจสอบหม้อแปลง...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="py-12 text-center text-slate-400" id="history-empty-placeholder">
          <ImageIcon className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <p className="text-xs font-bold font-sans">ยังไม่มีรายงานการตรวจสอบที่บันทึกไว้ในระบบ</p>
          <p className="text-[10px] text-slate-400 mt-1 font-sans">เริ่มรายงานผลการตรวจสอบเป็นรายการแรกได้โดยการส่งฟอร์มด้านข้าง</p>
        </div>
      ) : (
        <div className="space-y-4" id="history-content">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto" id="history-table-wrapper">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 font-sans uppercase tracking-wider">
                  <th className="pb-3 pt-1 pl-1">วัน-เวลา</th>
                  <th className="pb-3 pt-1">หมายเลขหม้อแปลง</th>
                  <th className="pb-3 pt-1">ผลตรวจ</th>
                  <th className="pb-3 pt-1">พิกัด</th>
                  <th className="pb-3 pt-1">ภาพหลักฐาน</th>
                  <th className="pb-3 pt-1">ผู้ตรวจ</th>
                  <th className="pb-3 pt-1">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-600 font-sans">
                {reports.slice(0, 15).map((report, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3 pl-1 font-mono text-[11px] text-slate-500 whitespace-nowrap">{report.timestamp}</td>
                    <td className="py-3 font-semibold text-slate-800">{report.transformerId}</td>
                    <td className="py-3">{getStatusBadge(report.result)}</td>
                    <td className="py-3">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        className="inline-flex items-center gap-1 text-indigo-600 hover:underline font-semibold"
                      >
                        <MapPin className="w-3 h-3 text-indigo-600 shrink-0" />
                        <span>{report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</span>
                        <ExternalLink className="w-2 h-2" />
                      </a>
                    </td>
                    <td className="py-3">
                      {report.photoUrl ? (
                        <a
                          href={report.photoUrl}
                          target="_blank"
                          referrerPolicy="no-referrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 hover:text-slate-900 border border-slate-200 transition-colors text-[10px] font-semibold"
                        >
                          <ImageIcon className="w-3 h-3 text-slate-500" />
                          <span>ดูรูปภาพ</span>
                          <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                        </a>
                      ) : (
                        <span className="text-slate-400 font-medium">ไม่มีรูป</span>
                      )}
                    </td>
                    <td className="py-3 text-slate-500 max-w-[100px] truncate" title={report.inspectorEmail}>
                      {report.inspectorEmail.split("@")[0]}
                    </td>
                    <td className="py-3 text-slate-500 max-w-[120px] truncate" title={report.details}>
                      {report.details || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="block lg:hidden space-y-3" id="history-mobile-cards">
            {reports.slice(0, 10).map((report, idx) => (
              <div 
                key={idx} 
                className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col gap-3 text-left hover:border-slate-300 hover:bg-slate-50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 font-sans">{report.transformerId}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{report.timestamp.split(" ")[1]}</span>
                  </div>
                  {getStatusBadge(report.result)}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 font-sans">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{report.timestamp.split(" ")[0]}</span>
                  </div>
                  <div className="flex items-center gap-1 truncate">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{report.inspectorEmail.split("@")[0]}</span>
                  </div>
                </div>

                {report.details && (
                  <p className="text-xs text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200 font-sans">
                    {report.details}
                  </p>
                )}

                <div className="flex items-center gap-3 pt-1 border-t border-slate-200" id="card-links">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 bg-white border border-slate-200 text-[10px] font-bold text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                    <span>ดูบนแผนที่</span>
                    <ExternalLink className="w-2 h-2" />
                  </a>

                  {report.photoUrl && (
                    <a
                      href={report.photoUrl}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 bg-white border border-slate-200 text-[10px] font-bold text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                      <span>ดูรูปถ่าย</span>
                      <ExternalLink className="w-2 h-2" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
