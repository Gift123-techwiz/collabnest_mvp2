import { useState } from 'react';
import Modal from '../ui/Modal';
import { Field } from '../ui/Form';
import { Spinner } from '../ui/Feedback';
import Icon from '../ui/Icon';
import { leaveMembership } from '../../api/misc';

export default function LeaveProjectModal({ open, onClose, membershipId, onLeft }) {
  const [exitReason, setExitReason] = useState('');
  const [completedTasksBeforeLeaving, setCompletedTasksBeforeLeaving] = useState(false);
  const [links, setLinks] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function updateLink(idx, value) {
    setLinks((prev) => prev.map((l, i) => (i === idx ? value : l)));
  }

  function addLink() {
    setLinks((prev) => [...prev, '']);
  }

  function removeLink(idx) {
    setLinks((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!exitReason.trim()) {
      setError('Please share a brief reason for leaving.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const deliverableLinks = links.map((l) => l.trim()).filter(Boolean);
      await leaveMembership(membershipId, {
        exitReason: exitReason.trim(),
        completedTasksBeforeLeaving,
        deliverableLinks: deliverableLinks.length > 0 ? deliverableLinks : undefined,
      });
      onLeft();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Leave this project">
      {error && <div className="auth-error-banner">{error}</div>}
      <p style={{ fontSize: 13, color: '#647089', marginBottom: 20, lineHeight: 1.6 }}>
        Leaving reopens your role for new applicants. If you've already delivered work, add links below —
        that way your portfolio reflects what you actually completed, even if the rest of the team hasn't
        finished.
      </p>
      <form onSubmit={handleSubmit}>
        <Field label="Reason for leaving" htmlFor="exitReason">
          <textarea
            id="exitReason"
            className="textarea"
            rows={3}
            value={exitReason}
            onChange={(e) => setExitReason(e.target.value)}
            placeholder="e.g. Schedule conflict, project direction changed, etc."
          />
        </Field>
        <label className="checkbox-row" style={{ marginBottom: 16 }}>
          <input
            type="checkbox"
            checked={completedTasksBeforeLeaving}
            onChange={(e) => setCompletedTasksBeforeLeaving(e.target.checked)}
          />
          I completed my assigned tasks before leaving
        </label>

        <Field label="Deliverable links" optional hint="Links to what you built — repo, design file, doc, etc.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {links.map((link, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  className="input"
                  placeholder="https://..."
                  value={link}
                  onChange={(e) => updateLink(idx, e.target.value)}
                />
                {links.length > 1 && (
                  <button type="button" className="btn btn-icon btn-ghost" onClick={() => removeLink(idx)}>
                    <Icon name="x" size={15} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="link-btn" style={{ fontSize: 13, alignSelf: 'flex-start' }} onClick={addLink}>
              + Add another link
            </button>
          </div>
        </Field>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-danger-solid" disabled={loading}>
            {loading ? <Spinner /> : 'Leave project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
