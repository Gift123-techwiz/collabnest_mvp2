import { useState } from 'react';
import Modal from '../ui/Modal';
import { Field } from '../ui/Form';
import { Spinner } from '../ui/Feedback';
import StarRatingInput from '../ui/StarRating';
import { createRating } from '../../api/misc';
import { useToast } from '../../context/ToastContext';

export default function RateUserModal({ open, onClose, projectId, ratee, onRated }) {
  const toast = useToast();
  const [stars, setStars] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (stars < 1) {
      setError('Please select a star rating.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await createRating(projectId, { rateeId: ratee.id, stars, feedback: feedback.trim() || undefined });
      toast.success(`Rating submitted for ${ratee.fullName}.`);
      onRated?.();
      setStars(0);
      setFeedback('');
    } catch (err) {
      if (err.status === 409) {
        toast.info(`You've already rated ${ratee.fullName} for this project.`);
        onRated?.();
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Rate ${ratee?.fullName || 'teammate'}`}>
      {error && <div className="auth-error-banner">{error}</div>}
      <form onSubmit={handleSubmit}>
        <Field label="Rating">
          <StarRatingInput value={stars} onChange={setStars} />
        </Field>
        <Field label="Feedback" optional htmlFor="rating-feedback">
          <textarea
            id="rating-feedback"
            className="textarea"
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What was it like working with them?"
          />
        </Field>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <Spinner /> : 'Submit rating'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
