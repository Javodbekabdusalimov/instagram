import React, { useState, useRef, useCallback } from 'react';
import { Image, Video, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import Modal from '../common/Modal';
import Spinner from '../common/Spinner';
import { createPost } from '../../api/posts';

interface CreatePostProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

type Step = 'select' | 'preview' | 'caption';

export default function CreatePost({ isOpen, onClose, onCreated }: CreatePostProps) {
  const [step, setStep] = useState<Step>('select');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('select');
    setFiles([]);
    setPreviews([]);
    setPreviewIdx(0);
    setCaption('');
    setLocation('');
  };

  const handleClose = () => { reset(); onClose(); };

  const processFiles = (selected: File[]) => {
    const valid = selected.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/')).slice(0, 10);
    if (!valid.length) return;
    setFiles(valid);
    setPreviews(valid.map(f => URL.createObjectURL(f)));
    setStep('preview');
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(Array.from(e.target.files));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) processFiles(Array.from(e.dataTransfer.files));
  }, []);

  const handleSubmit = async () => {
    if (!files.length) return;
    setLoading(true);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('media', f));
      if (caption) fd.append('caption', caption);
      if (location) fd.append('location', location);
      await createPost(fd);
      onCreated?.();
      handleClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const title = step === 'select' ? 'Create new post' : step === 'preview' ? 'Crop' : 'Create new post';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-2xl" title={title}>
      {step === 'select' && (
        <div
          className={`flex flex-col items-center justify-center py-20 px-8 transition-colors ${dragging ? 'bg-blue-900/20' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <div className="flex gap-2 mb-6 text-white opacity-70">
            <Image size={52} strokeWidth={1} />
            <Video size={52} strokeWidth={1} />
          </div>
          <p className="text-white text-2xl font-light mb-8">Drag photos and videos here</p>
          <button
            onClick={() => fileRef.current?.click()}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#5548b8')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0095f6')}
            style={{ backgroundColor: '#0095f6', color: '#fff', padding: '10px 24px', borderRadius: 8, fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' }}
          >
            Select From Computer
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileInput}
          />
        </div>
      )}

      {step === 'preview' && (
        <div>
          {/* Preview header actions */}
          <div className="flex justify-between items-center px-4 py-2 border-b border-neutral-800">
            <button onClick={() => { setStep('select'); setFiles([]); setPreviews([]); }} className="text-white">
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setStep('caption')}
              className="text-blue-400 font-semibold text-sm"
            >
              Next
            </button>
          </div>

          <div className="relative bg-black" style={{ aspectRatio: '1' }}>
            {files[previewIdx]?.type.startsWith('video/') ? (
              <video src={previews[previewIdx]} className="w-full h-full object-cover" controls />
            ) : (
              <img src={previews[previewIdx]} alt="preview" className="w-full h-full object-cover" />
            )}

            {previews.length > 1 && (
              <>
                {previewIdx > 0 && (
                  <button
                    onClick={() => setPreviewIdx(i => i - 1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-2"
                  >
                    <ChevronLeft size={18} className="text-white" />
                  </button>
                )}
                {previewIdx < previews.length - 1 && (
                  <button
                    onClick={() => setPreviewIdx(i => i + 1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-2"
                  >
                    <ChevronRight size={18} className="text-white" />
                  </button>
                )}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {previews.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPreviewIdx(i)}
                      className={`rounded-full ${i === previewIdx ? 'w-2.5 h-2.5 bg-blue-400' : 'w-2 h-2 bg-white/60'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {step === 'caption' && (
        <div>
          <div className="flex justify-between items-center px-4 py-2 border-b border-neutral-800">
            <button onClick={() => setStep('preview')} className="text-white">
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="text-blue-400 font-semibold text-sm disabled:opacity-40 flex items-center gap-2"
            >
              {loading ? <Spinner size="sm" /> : 'Share'}
            </button>
          </div>

          <div className="flex gap-4 p-4 border-b border-neutral-800">
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              {files[0]?.type.startsWith('video/') ? (
                <video src={previews[0]} className="w-full h-full object-cover" />
              ) : (
                <img src={previews[0]} alt="preview" className="w-full h-full object-cover" />
              )}
            </div>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Write a caption..."
              maxLength={2200}
              rows={5}
              className="flex-1 bg-transparent text-white text-sm placeholder-neutral-600 focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800">
            <MapPin size={18} className="text-neutral-400" />
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Add location"
              className="flex-1 bg-transparent text-white text-sm placeholder-neutral-500 focus:outline-none"
            />
          </div>

          <div className="px-4 py-2">
            <p className="text-neutral-500 text-xs text-right">{caption.length}/2,200</p>
          </div>
        </div>
      )}
    </Modal>
  );
}
