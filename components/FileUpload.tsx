// components/FileUpload.tsx
"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

export type ParsedSheets = Record<string, any[]>;

interface FileUploadProps {
  onDataParsed: (data: ParsedSheets | null) => void;
}

export const FileUpload = ({ onDataParsed }: FileUploadProps) => {
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError("");

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buf = e.target?.result as ArrayBuffer;
        const wb = XLSX.read(new Uint8Array(buf), { type: "array" });

        // Tüm sheet'leri oku
        const all: Record<string, any[]> = {};
        for (const sheetName of wb.SheetNames) {
          const ws = wb.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(ws, { defval: null, raw: true }) as any[];
          all[sheetName] = json;
        }

        onDataParsed(all);
      } catch (err) {
        console.error("Error parsing Excel/CSV:", err);
        setError("Error parsing file. Please ensure it's a valid Excel/CSV with sheets.");
        onDataParsed(null);
      }
    };
    reader.onerror = () => {
      setError("Failed to read the file.");
      onDataParsed(null);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
      <label htmlFor="file-upload" className="cursor-pointer text-blue-600 font-semibold">
        Select an Excel/CSV file
        <input
          id="file-upload"
          name="file-upload"
          type="file"
          className="sr-only"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
        />
      </label>
      {fileName && <p className="text-sm text-gray-500 mt-2">{fileName}</p>}
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  );
};
