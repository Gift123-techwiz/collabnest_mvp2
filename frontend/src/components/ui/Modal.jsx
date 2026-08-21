import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';

export default function Modal({ open, onClose, title, children, wide = false, closeOnOverlay = true }) {
  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (closeOnOverlay && e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        {(title || onClose) && (
          <div className="modal-header">
            {title && <h3>{title}</h3>}
            {onClose && (
              <button className="modal-close" onClick={onClose} aria-label="Close">
                <Icon name="x" size={20} />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}
