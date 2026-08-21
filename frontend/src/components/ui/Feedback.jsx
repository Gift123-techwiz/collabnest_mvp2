import Icon from './Icon';
import Modal from './Modal';

export function Spinner({ page = false }) {
  if (page) {
    return (
      <div className="spinner-page">
        <div className="spinner" />
      </div>
    );
  }
  return <div className="spinner" />;
}

export function EmptyState({ icon = 'inbox', title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon name={icon} size={26} />
      </div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      {message && <p style={{ color: '#647089', marginBottom: 24, fontSize: 14, lineHeight: 1.6 }}>{message}</p>}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </button>
        <button
          className={`btn ${danger ? 'btn-danger-solid' : 'btn-primary'}`}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? <Spinner /> : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
