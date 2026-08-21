import { useState } from 'react';
import Modal from '../ui/Modal';
import { Field } from '../ui/Form';
import { Spinner } from '../ui/Feedback';
import { applyToRole } from '../../api/applications';

export default function ApplyToRoleModal({ open, onClose, projectId, role, onApplied }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await applyToRole(projectId, role.id, { message: message.trim() || undefined });
      onApplied();
      setMessage('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Apply for "${role?.name}"`}>
      {error && <div className="auth-error-banner">{error}</div>}
      <form onSubmit={handleSubmit}>
        <Field
          label="Message to the project owner"
          optional
          htmlFor="apply-message"
          hint={`Tell them why you're a good fit for this role. ${message.length}/300`}
        >
          <textarea
            id="apply-message"
            className="textarea"
            rows={5}
            maxLength={300}
            placeholder="I'd love to help with this — here's what I bring..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </Field>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <Spinner /> : 'Submit application'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
