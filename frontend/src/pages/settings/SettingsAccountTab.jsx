import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field } from '../../components/ui/Form';
import { Spinner } from '../../components/ui/Feedback';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { changePassword, deleteAccount } from '../../api/users';

export default function SettingsAccountTab() {
  const { logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError('');
    if (pwForm.newPassword.length < 8 || !/\d/.test(pwForm.newPassword)) {
      setPwError('New password must be at least 8 characters and include a number.');
      return;
    }
    setPwLoading(true);
    try {
      await changePassword(pwForm);
      toast.success('Password updated.');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwLoading(false);
    }
  }

  async function handleDelete() {
    setDeleteError('');
    if (!deletePassword) {
      setDeleteError('Please enter your password to confirm.');
      return;
    }
    setDeleting(true);
    try {
      await deleteAccount({ password: deletePassword, confirm: true });
      await logout();
      navigate('/signin', { replace: true });
    } catch (err) {
      setDeleteError(err.message);
      setDeleting(false);
    }
  }

  return (
    <div className="detail-layout">
      <div className="detail-main">
        <section className="card" style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 16 }}>Change password</h4>
          {pwError && <div className="auth-error-banner">{pwError}</div>}
          <form onSubmit={handleChangePassword}>
            <Field label="Current password" htmlFor="currentPassword">
              <input
                id="currentPassword"
                type="password"
                className="input"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
              />
            </Field>
            <Field label="New password" htmlFor="newPassword" hint="At least 8 characters, including a number">
              <input
                id="newPassword"
                type="password"
                className="input"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
              />
            </Field>
            <button type="submit" className="btn btn-primary" disabled={pwLoading}>
              {pwLoading ? <Spinner /> : 'Update password'}
            </button>
          </form>
        </section>

        <section className="card danger-zone">
          <h4 style={{ marginBottom: 8, color: '#dc3b2e' }}>Delete account</h4>
          <p className="text-muted" style={{ fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
            This permanently deactivates your account. Your project and rating history is preserved for
            other users' records, but you'll lose access immediately.
          </p>
          <button className="btn btn-danger" onClick={() => setDeleteModalOpen(true)}>
            Delete my account
          </button>
        </section>
      </div>

      <Modal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletePassword('');
          setDeleteError('');
        }}
        title="Delete your account"
      >
        <p style={{ fontSize: 13, color: '#647089', marginBottom: 16, lineHeight: 1.6 }}>
          This cannot be undone. Enter your password to confirm.
        </p>
        {deleteError && <div className="auth-error-banner">{deleteError}</div>}
        <Field label="Password" htmlFor="deletePassword">
          <input
            id="deletePassword"
            type="password"
            className="input"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
          />
        </Field>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            className="btn btn-secondary"
            disabled={deleting}
            onClick={() => {
              setDeleteModalOpen(false);
              setDeletePassword('');
              setDeleteError('');
            }}
          >
            Cancel
          </button>
          <button className="btn btn-danger-solid" disabled={deleting} onClick={handleDelete}>
            {deleting ? <Spinner /> : 'Delete account'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
