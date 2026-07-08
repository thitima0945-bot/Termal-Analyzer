import React, { useState, useEffect, useRef } from "react";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Upload, 
  Check, 
  AlertTriangle, 
  X, 
  Camera, 
  AlertCircle,
  Loader2,
  FileCheck
} from "lucide-react";

interface ReportFormProps {
  onSubmit: (data: {
    transformerId: string;
    timestamp: string;
    result: "ผ่าน (Pass)" | "ไม่ผ่าน (Fail)" | "ต้องบำรุงรักษา (Needs Maintenance)";
    latitude: number;
    longitude: number;
    photo: File | null;
    details: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export default function ReportForm({ onSubmit, isSubmitting }: ReportFormProps) {
  const [transformerId, setTransformerId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [result, setResult] = useState<"ผ่าน (Pass)" | "ไม่ผ่าน (Fail)" | "ต้องบำรุงรักษา (Needs Maintenance)">("ผ่าน (Pass)");
  
  // Geolocation
  const [latitude, setLatitude] = useState<number | "">("");
  const [longitude, setLongitude] = useState<number | "">("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // File Upload state
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Form confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Validation
  const [validationError, setValidationError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize DateTime to current local time
  useEffect(() => {
    const now = new Date();
    // YYYY-MM-DD format
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    setDate(`${year}-${month}-${day}`);

    // HH:MM format
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    setTime(`${hours}:${minutes}`);

    // Get current location on load
    handleGetLocation();
  }, []);

  const handleGetLocation = () => {
    setGeoLoading(true);
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("เบราว์เซอร์ของคุณไม่รองรับการดึงพิกัดตำแหน่ง (Geolocation)");
      setGeoLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(parseFloat(position.coords.latitude.toFixed(6)));
        setLongitude(parseFloat(position.coords.longitude.toFixed(6)));
        setGeoLoading(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        let msg = "ไม่สามารถดึงพิกัดจริงได้";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "ถูกปฏิเสธสิทธิ์เข้าถึงพิกัด ระบบใช้พิกัดเริ่มต้น (กรุงเทพฯ) แทนชั่วคราว คุณสามารถแก้ไขพิกัดได้เอง";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "ไม่พบข้อมูลตำแหน่งพิกัด ระบบใช้พิกัดเริ่มต้น (กรุงเทพฯ) แทนชั่วคราว";
        } else {
          msg = "ระบบใช้พิกัดเริ่มต้น (กรุงเทพฯ) แทนชั่วคราวเนื่องจากระบุตำแหน่งขัดข้อง";
        }
        setGeoError(msg);
        setGeoLoading(false);
        
        // Safe smart fallback
        setLatitude(13.756331);
        setLongitude(100.501762);
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setValidationError("กรุณาเลือกไฟล์รูปภาพเท่านั้น (.jpg, .jpeg, .png)");
      return;
    }
    setPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setValidationError(null);
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const [details, setDetails] = useState("");

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!transformerId.trim()) {
      setValidationError("กรุณากรอกหมายเลขหม้อแปลง");
      return;
    }
    if (latitude === "" || longitude === "") {
      setValidationError("กรุณากรอกข้อมูลพิกัดละติจูดและลองจิจูด หรือดึงตำแหน่งพิกัดปัจจุบัน");
      return;
    }
    if (!photo) {
      setValidationError("กรุณาแนบรูปถ่ายหน้างานจริงเพื่อเป็นหลักฐานในการตรวจสอบ");
      return;
    }

    setShowConfirmModal(true);
  };

  const handleFinalSubmit = async () => {
    setShowConfirmModal(false);
    
    // Combine date and time
    const timestampFormatted = `${date} ${time}`;

    try {
      await onSubmit({
        transformerId: transformerId.trim(),
        timestamp: timestampFormatted,
        result,
        latitude: Number(latitude),
        longitude: Number(longitude),
        photo,
        details,
      });

      // Reset form on success
      setTransformerId("");
      setDetails("");
      removePhoto();
      // Keep coordinates and reset date/time to now
      const now = new Date();
      setTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
    } catch (err) {
      console.error("Submit form error:", err);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7" id="report-form-container">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-5 mb-6" id="form-header">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg" id="form-header-icon">
          <FileCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800 font-sans leading-tight">ส่งรายงานผลการตรวจสอบ</h3>
          <p className="text-[11px] text-slate-400 font-sans">กรอกข้อมูลให้ครบถ้วนเพื่อส่งผลการตรวจสอบลงฐานระบบ</p>
        </div>
      </div>

      {validationError && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 font-sans" id="validation-error-alert">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      <form onSubmit={handlePreSubmit} className="space-y-5" id="transformer-report-form">
        {/* Row 1: ID, Date, Time */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="form-row-1">
          <div className="space-y-1.5" id="form-field-transformer-id">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block font-sans">
              หมายเลขหม้อแปลง <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="เช่น TX-9042"
              value={transformerId}
              onChange={(e) => setTransformerId(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-sans focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-1.5" id="form-field-date">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block font-sans">
              วันที่ตรวจสอบ <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-sans focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all"
              />
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="space-y-1.5" id="form-field-time">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block font-sans">
              เวลาที่ตรวจสอบ <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-sans focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all"
              />
              <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>

        {/* Row 2: Inspection Result */}
        <div className="space-y-2" id="form-field-result">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block font-sans">
            ผลการตรวจสอบหม้อแปลงไฟฟ้า <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5" id="result-options">
            <button
              type="button"
              onClick={() => setResult("ผ่าน (Pass)")}
              className={`flex items-center justify-center gap-2 p-3 border rounded-xl text-xs font-semibold transition-all cursor-pointer font-sans ${
                result === "ผ่าน (Pass)"
                  ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className={`w-4 h-4 flex items-center justify-center rounded-full border ${
                result === "ผ่าน (Pass)" ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 bg-white"
              }`}>
                <Check className="w-2.5 h-2.5" />
              </span>
              ผ่าน (Pass)
            </button>

            <button
              type="button"
              onClick={() => setResult("ต้องบำรุงรักษา (Needs Maintenance)")}
              className={`flex items-center justify-center gap-2 p-3 border rounded-xl text-xs font-semibold transition-all cursor-pointer font-sans ${
                result === "ต้องบำรุงรักษา (Needs Maintenance)"
                  ? "bg-amber-50 border-amber-500 text-amber-700 shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className={`w-4 h-4 flex items-center justify-center rounded-full border ${
                result === "ต้องบำรุงรักษา (Needs Maintenance)" ? "bg-amber-500 border-amber-500 text-white" : "border-slate-300 bg-white"
              }`}>
                <AlertTriangle className="w-2.5 h-2.5" />
              </span>
              ต้องบำรุงรักษา
            </button>

            <button
              type="button"
              onClick={() => setResult("ไม่ผ่าน (Fail)")}
              className={`flex items-center justify-center gap-2 p-3 border rounded-xl text-xs font-semibold transition-all cursor-pointer font-sans ${
                result === "ไม่ผ่าน (Fail)"
                  ? "bg-rose-50 border-rose-500 text-rose-700 shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className={`w-4 h-4 flex items-center justify-center rounded-full border ${
                result === "ไม่ผ่าน (Fail)" ? "bg-rose-500 border-rose-500 text-white" : "border-slate-300 bg-white"
              }`}>
                <X className="w-2.5 h-2.5" />
              </span>
              ไม่ผ่าน (Fail)
            </button>
          </div>
        </div>

        {/* Row 3: Location Coordinates */}
        <div className="space-y-1.5" id="form-field-coordinates">
          <div className="flex items-center justify-between" id="coordinates-header">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block font-sans">
              พิกัดตำแหน่งหม้อแปลง <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={geoLoading}
              className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700 font-sans font-bold transition-colors cursor-pointer disabled:opacity-60"
            >
              {geoLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <MapPin className="w-3 h-3" />
              )}
              {geoLoading ? "กำลังค้นหาพิกัด..." : "ดึงพิกัดตำแหน่งปัจจุบัน"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="coordinates-inputs">
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-[10px] font-bold text-slate-400 font-sans">LAT:</span>
              <input
                type="number"
                step="0.000001"
                required
                value={latitude}
                onChange={(e) => setLatitude(e.target.value === "" ? "" : parseFloat(e.target.value))}
                placeholder="ละติจูด (เช่น 13.7563)"
                className="w-full pl-11 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-sans focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all placeholder:text-slate-400"
              />
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-[10px] font-bold text-slate-400 font-sans">LNG:</span>
              <input
                type="number"
                step="0.000001"
                required
                value={longitude}
                onChange={(e) => setLongitude(e.target.value === "" ? "" : parseFloat(e.target.value))}
                placeholder="ลองจิจูด (เช่น 100.5018)"
                className="w-full pl-11 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-sans focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {geoError && (
            <p className="text-[10px] text-slate-500 mt-1 font-sans flex items-start gap-1">
              <AlertCircle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
              <span>{geoError}</span>
            </p>
          )}
        </div>

        {/* Row 4: Photo attachment (Drag and Drop + camera) */}
        <div className="space-y-1.5" id="form-field-photo">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block font-sans">
            แนบรูปถ่ายหน้างานจริง <span className="text-rose-500">*</span>
          </label>
          
          {!photoPreview ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer text-center ${
                isDragOver 
                  ? "border-indigo-500 bg-indigo-50/20" 
                  : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
              }`}
              id="drop-zone"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                capture="environment" // Auto open device camera on mobile
                className="hidden"
              />
              <div className="p-2.5 bg-white rounded-full shadow-sm text-slate-400 border border-slate-100">
                <Upload className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700 font-sans">ลากไฟล์รูปภาพมาวาง หรือคลิกเพื่อเลือกไฟล์</p>
                <p className="text-[10px] text-slate-400 mt-1 font-sans">รองรับภาพถ่าย JPG, PNG (สลับใช้กล้องมือถือได้ทันที)</p>
              </div>
            </div>
          ) : (
            <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-2.5 flex items-center justify-between" id="photo-preview-container">
              <div className="flex items-center gap-3">
                <img
                  src={photoPreview}
                  alt="On-site inspection preview"
                  className="w-14 h-14 object-cover rounded-lg border border-slate-200 shadow-sm"
                  id="image-thumbnail"
                />
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-700 truncate max-w-[150px] sm:max-w-[200px] font-sans">
                    {photo?.name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-sans">
                    {photo ? (photo.size / (1024 * 1024)).toFixed(2) : 0} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={removePhoto}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-rose-600 rounded-full transition-colors cursor-pointer"
                id="remove-photo-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Row 5: Additional Details */}
        <div className="space-y-1.5" id="form-field-details">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block font-sans">
            รายละเอียดเพิ่มเติม / หมายเหตุ (ถ้ามี)
          </label>
          <textarea
            placeholder="เช่น ตรวจพบรอยคราบน้ำมันเล็กน้อย, อุปกรณ์ยึดแน่นดี"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={2}
            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-sans focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all resize-none placeholder:text-slate-400"
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-65 disabled:cursor-not-allowed uppercase tracking-wider"
          id="submit-report-btn"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>กำลังบันทึกข้อมูลและอัปโหลดรูปภาพ...</span>
            </>
          ) : (
            <span>บันทึกรายงานผลการตรวจสอบ</span>
          )}
        </button>
      </form>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4" id="confirm-modal">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-200 shadow-xl" id="confirm-modal-box">
            <h4 className="text-sm font-bold text-slate-900 font-sans">ยืนยันการส่งรายงาน?</h4>
            <p className="text-xs text-slate-500 mt-2 font-sans leading-relaxed">
              รายงานนี้จะถูกนำส่งและบันทึกลง Google Sheet และอัปโหลดรูปถ่ายหน้างานจริงตรงไปยัง Google Drive ทันที คุณยืนยันที่จะทำรายการหรือไม่?
            </p>
            <div className="mt-5 flex gap-3" id="confirm-modal-actions">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                ยืนยันการส่ง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
