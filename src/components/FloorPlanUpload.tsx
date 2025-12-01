import { useState, useRef } from 'react';
import { ArrowLeft, Upload, Image as ImageIcon } from 'lucide-react';
import { useStore } from '../store/useStore';

interface FloorPlanUploadProps {
  projectId: string;
  onBack: () => void;
}

export default function FloorPlanUpload({ projectId, onBack }: FloorPlanUploadProps) {
  const projects = useStore((state) => state.projects);
  const updateProject = useStore((state) => state.updateProject);
  const project = projects.find((p) => p.id === projectId);
  const existingFile = project?.floorPlanImage || null;
  const [preview, setPreview] = useState<string | null>(existingFile);
  const [filename, setFilename] = useState<string | null>(project?.floorPlanFilename || null);
  const [fileType, setFileType] = useState<string>(
    existingFile?.startsWith('data:application/pdf') ? 'pdf' : 'image'
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      alert('PDF files are not fully supported. Please upload an image (PNG or JPG) for the best experience with zoom and measurements.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, JPEG)');
      return;
    }

    setFileType('image');
    setFilename(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileData = event.target?.result as string;
      setPreview(fileData);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (preview) {
      updateProject(projectId, {
        floorPlanImage: preview,
        floorPlanFilename: filename || undefined
      });
    }
    onBack();
  };

  const handleRemove = () => {
    setPreview(null);
    setFilename(null);
    updateProject(projectId, {
      floorPlanImage: undefined,
      floorPlanFilename: undefined
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-goflex-blue/10 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-goflex-blue" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black">Floor Plan</h1>
              <p className="text-gray-600">Upload a floor plan image or PDF</p>
            </div>
          </div>

          <div className="mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            {preview ? (
              <div className="space-y-4">
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                  {fileType === 'pdf' ? (
                    <embed
                      src={preview}
                      type="application/pdf"
                      className="w-full h-96"
                    />
                  ) : (
                    <img
                      src={preview}
                      alt="Floor plan preview"
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Change File
                </button>
                <button
                  onClick={handleRemove}
                  className="w-full px-4 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Remove Floor Plan
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <div className="flex flex-col items-center">
                  <Upload className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-gray-700 font-medium mb-1">Upload Floor Plan</p>
                  <p className="text-gray-500 text-sm">Only supported file types are PNG, JPG</p>
                </div>
              </button>
            )}
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900 font-medium mb-2">No floor plan?</p>
            <p className="text-sm text-blue-700">
              You can still use Survey Mode without a floor plan. The app will use a simple grid
              to track measurement positions.
            </p>
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-goflex-blue text-white rounded-lg py-3 font-medium hover:bg-goflex-blue-dark transition-colors"
          >
            {preview ? 'Save Floor Plan' : 'Continue Without Floor Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}
