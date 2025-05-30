import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Camera } from 'lucide-react';
import { uploadFiles } from '../../utils/apiConfig';

interface FileUploadProps {
  onUploadComplete: (urls: string[]) => void;
  onError?: (error: Error) => void;
  maxFiles?: number;
  acceptedFileTypes?: string[];
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  onError,
  maxFiles = 5,
  acceptedFileTypes = ['image/*', 'video/*'],
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [showCameraButton, setShowCameraButton] = useState(false);

  // Check if device is mobile
  React.useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setShowCameraButton(isMobile);
  }, []);

  // Cleanup preview URLs when component unmounts
  React.useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleCameraCapture = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use the back camera by default
    input.addEventListener('change', async (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        try {
          console.log('Starting camera capture upload...', {
            fileName: file.name,
            fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
            fileType: file.type
          });

          setIsUploading(true);
          
          // Use the centralized upload function
          const urls = await uploadFiles([file]);
          console.log('Camera capture upload successful!', { uploadedUrls: urls });
          
          // Create preview
          const newPreviewUrl = URL.createObjectURL(file);
          setPreviewUrls(prev => [...prev, newPreviewUrl]);
          setUploadedFiles(prev => [...prev, file]);
          onUploadComplete(urls);
        } catch (error) {
          console.error('Camera capture upload failed:', error);
          onError?.(error as Error);
        } finally {
          setIsUploading(false);
        }
      }
    });
    input.click();
  }, [onUploadComplete, onError]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
    
    try {
      console.log('Starting file upload...', {
        fileCount: acceptedFiles.length,
        files: acceptedFiles.map(f => ({
          name: f.name,
          size: `${(f.size / 1024 / 1024).toFixed(2)}MB`,
          type: f.type
        }))
      });

      setIsUploading(true);
      
      // Use the centralized upload function
      const urls = await uploadFiles(acceptedFiles);
      console.log('Upload successful!', { uploadedUrls: urls });
      
      // Create preview URLs
      const newPreviewUrls = acceptedFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
      setUploadedFiles(prev => [...prev, ...acceptedFiles]);
      onUploadComplete(urls);
    } catch (error) {
      console.error('Upload failed:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        files: acceptedFiles.map(f => f.name)
      });
      onError?.(error as Error);
    } finally {
      setIsUploading(false);
      console.log('Upload process completed');
    }
  }, [onUploadComplete, onError]);

  const removeFile = useCallback((index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }, [previewUrls]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    disabled: isUploading,
    multiple: true
  });

  return (
    <div className={className}>
      <div className="flex flex-col space-y-4">
        {showCameraButton && (
          <button
            type="button"
            onClick={handleCameraCapture}
            className="w-full py-3 px-4 bg-blue-500 text-white rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-600 transition-colors"
            disabled={isUploading}
          >
            <Camera size={20} />
            <span>Take Photo with Camera</span>
          </button>
        )}
        
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <div className="space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-600">Uploading files...</p>
            </div>
          ) : isDragActive ? (
            <div className="space-y-2">
              <Upload className="h-8 w-8 text-blue-500 mx-auto" />
              <p className="text-blue-600">Drop files here...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 text-gray-400 mx-auto" />
              <p className="text-gray-600">
                {showCameraButton ? 'Upload from Gallery' : 'Drag and drop files here, or click to select'}
              </p>
              <p className="text-xs text-gray-500">
                Supported formats: JPG, PNG, GIF, MP4, MOV
              </p>
            </div>
          )}
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded files:</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="relative group">
                {file.type.startsWith('image/') ? (
                  <img
                    src={previewUrls[index]}
                    alt={file.name}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-sm text-gray-500 px-2 truncate max-w-full">
                      {file.name}
                    </p>
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
