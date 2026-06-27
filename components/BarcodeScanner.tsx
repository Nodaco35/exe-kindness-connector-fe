"use client";

import React, { useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera } from "lucide-react";

interface BarcodeScannerProps {
  onResult: (code: string) => void;
  onError?: (message: string) => void;
  className?: string;
}

export default function BarcodeScanner({ onResult, onError, className }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);

    try {
      // html5-qrcode requires a container element with an ID to instantiate,
      // even if we only use scanFile(). We create a temporary div if needed, 
      // but scanFile actually works if we pass a valid element ID, so we render a hidden div.
      const html5QrCode = new Html5Qrcode("hidden-barcode-reader");
      
      const decodedText = await html5QrCode.scanFile(file, true);
      onResult(decodedText);
      
      // Clear the input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      console.error("Lỗi quét mã vạch:", err);
      if (onError) {
        onError("Không thể quét mã vạch từ ảnh này. Vui lòng thử ảnh khác chụp rõ nét hơn.");
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={className} style={{ display: 'inline-flex', alignItems: 'center' }}>
      {/* Hidden div required by Html5Qrcode constructor */}
      <div id="hidden-barcode-reader" style={{ display: "none" }}></div>
      
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={isScanning}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          padding: "0 1rem",
          backgroundColor: "var(--primary-light-bg)",
          color: "var(--primary)",
          border: "1px solid var(--primary-light)",
          borderRadius: "0.75rem",
          fontWeight: 600,
          cursor: isScanning ? "not-allowed" : "pointer",
          height: "100%",
          minHeight: "42px",
          whiteSpace: "nowrap"
        }}
        title="Quét mã vạch từ ảnh"
      >
        {isScanning ? (
          <div style={{ width: "16px", height: "16px", border: "2px solid var(--primary)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        ) : (
          <><Camera size={18} /> Quét ảnh</>
        )}
      </button>
    </div>
  );
}
