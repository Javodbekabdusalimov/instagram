import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  maxWidth?: string;
  showClose?: boolean;
}

export default function Modal({ isOpen, onClose, children, title, maxWidth = 'max-w-lg', showClose = true }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-neutral-900 rounded-xl w-full ${maxWidth} mx-4 border border-neutral-800 shadow-2xl z-10 overflow-hidden`}>
        {(title || showClose) && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
            {title && <h2 className="text-white font-semibold text-sm">{title}</h2>}
            {showClose && (
              <button onClick={onClose} className="ml-auto text-white hover:text-neutral-400 transition-colors">
                <X size={20} />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
