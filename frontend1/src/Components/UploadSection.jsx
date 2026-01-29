import React, { useState, useRef } from "react";
import { Upload, FileText, X, Cloud, CheckCircle } from "lucide-react";

const UploadSection = ({ onFileUpload, uploadedFile: externalFile }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(externalFile);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = (file) => {
    if (file.type === "application/pdf" || file.type.includes("image/")) {
      if (file.size <= 50 * 1024 * 1024) {
        const fileData = {
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
          type: file.type,
          file: file,
        };
        setUploadedFile(fileData);
        if (onFileUpload) {
          onFileUpload(fileData);
        }
      } else {
        alert("File size exceeds 50MB limit");
      }
    } else {
      alert("Please upload PDF or image files only");
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (onFileUpload) {
      onFileUpload(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full lg:flex-1 bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-md border border-slate-200 h-max">
      <h2 className="text-xl sm:text-2xl md:text-2xl font-bold text-slate-800 mb-4 sm:mb-5 md:mb-6">
        Upload Your Document
      </h2>

      <div
        className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 min-h-[250px] transition-colors duration-300 ease-in-out
          ${
            isDragging
              ? "border-blue-500 bg-blue-50/80"
              : uploadedFile
              ? "border-green-400 bg-green-50/80"
              : "border-slate-300 hover:border-blue-400 hover:bg-slate-50/50"
          }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept=".pdf,image/*"
          className="hidden"
        />

        {uploadedFile ? (
          <div className="text-center w-full flex flex-col items-center justify-center gap-4">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <p className="font-semibold text-slate-800 text-lg">
              Upload Successful!
            </p>
            <div className="w-full max-w-sm mx-auto bg-white border border-slate-200 rounded-lg p-3 sm:p-4 flex items-center gap-3 sm:gap-4 shadow-sm">
              <div className="flex-shrink-0">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {uploadedFile.name}
                </p>
                <p className="text-xs text-slate-500">{uploadedFile.size}</p>
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  className="p-1.5 rounded-full text-slate-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                  aria-label="Remove file"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="text-center flex flex-col items-center gap-4 cursor-pointer"
            onClick={handleClickUpload}
          >
            <div
              className={`p-4 rounded-full transition-colors ${
                isDragging ? "bg-blue-100" : "bg-slate-100"
              }`}
            >
              {isDragging ? (
                <Cloud className="w-8 h-8 md:w-10 md:h-10 text-blue-500" />
              ) : (
                <Upload className="w-8 h-8 md:w-10 md:h-10 text-blue-600" />
              )}
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-700 mb-1">
                <span className="text-blue-600">Click to upload</span> or drag
                and drop
              </p>
              <p className="text-sm text-slate-500">
                PDF, JPG, PNG (Max. 50MB)
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200/80">
        <h3 className="text-base font-semibold text-slate-800 mb-3">
          Upload Guidelines
        </h3>
        <ul className="text-sm text-slate-600 space-y-2">
          <li className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
            <span>
              <strong>Supported formats:</strong> PDF, JPG, PNG
            </span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
            <span>
              <strong>Maximum file size:</strong> 50MB
            </span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
            <span>
              Ensure documents are <strong>clear and readable</strong> for the
              best print quality.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
            <span>
              Please remove any password protection from PDF files before
              uploading.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default UploadSection;
