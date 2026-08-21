import { useEffect, useRef, useState } from 'react';
import Icon from '../../components/ui/Icon';
import Avatar from '../../components/ui/Avatar';
import { Spinner } from '../../components/ui/Feedback';
import { ProgressBar, Field } from '../../components/ui/Form';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  updateMe,
  addSkill,
  removeSkill,
  addPortfolioLink,
  removePortfolioLink,
  uploadProfilePicture,
  getShareLink,
} from '../../api/users';
import { listSkills } from '../../api/misc';
import { EXPERIENCE_LEVELS, AVAILABILITY_OPTIONS, PORTFOLIO_LINK_PLATFORMS } from '../../utils/constants';
import './ProfilePage.scss';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);

  const [allSkills, setAllSkills] = useState([]);
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || '',
        country: user.country || '',
        phoneNumber: user.phoneNumber || '',
        bio: user.bio || '',
        experienceLevel: user.experienceLevel || 'not_specified',
        yearsOfExperience: user.yearsOfExperience ?? '',
        availability: user.availability || '',
      });
    }
  }, [user]);

  useEffect(() => {
    listSkills().then(setAllSkills).catch(() => {});
  }, []);

  if (!user || !form) return <Spinner page />;

  const mySkillIds = new Set((user.skills || []).map((us) => us.skillId));

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMe({
        fullName: form.fullName.trim(),
        country: form.country.trim() || undefined,
        phoneNumber: form.phoneNumber.trim() || undefined,
        bio: form.bio.trim() || undefined,
        experienceLevel: form.experienceLevel,
        yearsOfExperience: form.yearsOfExperience === '' ? undefined : Number(form.yearsOfExperience),
        availability: form.availability || undefined,
      });
      await refreshUser();
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePictureChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPic(true);
    try {
      await uploadProfilePicture(file);
      await refreshUser();
      toast.success('Profile picture updated.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploadingPic(false);
    }
  }

  async function handleToggleSkill(skillId) {
    try {
      if (mySkillIds.has(skillId)) {
        await removeSkill(skillId);
      } else {
        await addSkill(skillId);
      }
      await refreshUser();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleRemovePortfolioLink(id) {
    try {
      await removePortfolioLink(id);
      await refreshUser();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function openShareModal() {
    setLinkModalOpen(true);
    try {
      const res = await getShareLink();
      setShareUrl(res.url);
    } catch (err) {
      toast.error(err.message);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <div>
          <h1>Your profile</h1>
          <p className="text-muted">This is what project owners see when they review your applications.</p>
        </div>
        <button className="btn btn-secondary" onClick={openShareModal}>
          <Icon name="share" size={15} />
          Share profile
        </button>
      </div>

      {!user.profileComplete && (
        <div className="card" style={{ marginBottom: 28 }}>
          <ProgressBar value={user.profileCompletionPercentage} label="Profile completion" />
          <p className="text-muted" style={{ fontSize: 13, marginTop: 10 }}>
            Reach 80% to be marked complete — add a photo, bio, skills, and your availability.
          </p>
        </div>
      )}

      <div className="detail-layout">
        <div className="detail-main">
          <section className="card" style={{ marginBottom: 24 }}>
            <div className="profile-pic-row">
              <Avatar src={user.profilePictureUrl} name={user.fullName} size="xl" />
              <div>
                <button className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingPic}>
                  {uploadingPic ? <Spinner /> : 'Change photo'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" hidden onChange={handlePictureChange} />
                <p className="text-muted" style={{ fontSize: 12, marginTop: 6 }}>JPG or PNG, up to 5MB</p>
              </div>
            </div>

            <form onSubmit={handleSave} style={{ marginTop: 24 }}>
              <Field label="Full name" htmlFor="fullName">
                <input id="fullName" className="input" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
              </Field>
              <Field label="Bio" optional htmlFor="bio" hint={`${form.bio.length}/300`}>
                <textarea id="bio" className="textarea" rows={4} maxLength={300} value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
              </Field>
              <div className="form-row-2">
                <Field label="Country" optional htmlFor="country">
                  <input id="country" className="input" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
                </Field>
                <Field label="Phone number" optional htmlFor="phone" hint="Used by project owners to contact you">
                  <input id="phone" className="input" value={form.phoneNumber} onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))} />
                </Field>
              </div>
              <div className="form-row-2">
                <Field label="Experience level" htmlFor="expLevel">
                  <select id="expLevel" className="select" value={form.experienceLevel} onChange={(e) => setForm((f) => ({ ...f, experienceLevel: e.target.value }))}>
                    {EXPERIENCE_LEVELS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Years of experience" optional htmlFor="years">
                  <input id="years" type="number" min={0} className="input" value={form.yearsOfExperience} onChange={(e) => setForm((f) => ({ ...f, yearsOfExperience: e.target.value }))} />
                </Field>
              </div>
              <Field label="Availability" optional htmlFor="availability">
                <select id="availability" className="select" value={form.availability} onChange={(e) => setForm((f) => ({ ...f, availability: e.target.value }))}>
                  <option value="">Select availability</option>
                  {AVAILABILITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <Spinner /> : 'Save changes'}
              </button>
            </form>
          </section>

          <section className="card" style={{ marginBottom: 24 }}>
            <div className="section-header">
              <h4>Skills</h4>
              <button className="btn btn-secondary btn-sm" onClick={() => setSkillModalOpen(true)}>
                <Icon name="plus" size={14} /> Manage skills
              </button>
            </div>
            {(user.skills || []).length === 0 ? (
              <p className="text-muted" style={{ fontSize: 13 }}>No skills added yet.</p>
            ) : (
              <div className="skill-picker">
                {(user.skills || []).map((us) => (
                  <span key={us.skillId} className="skill-chip">
                    {us.skill?.name}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="card">
            <div className="section-header">
              <h4>Portfolio links</h4>
              <button className="btn btn-secondary btn-sm" onClick={() => setLinkModalOpen('add')}>
                <Icon name="plus" size={14} /> Add link
              </button>
            </div>
            {(user.portfolioLinks || []).length === 0 ? (
              <p className="text-muted" style={{ fontSize: 13 }}>No links added yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(user.portfolioLinks || []).map((link) => (
                  <div key={link.id} className="portfolio-link-row">
                    <a href={link.url} target="_blank" rel="noreferrer">
                      <span className="badge badge-neutral">{link.platform}</span>
                      {link.url}
                    </a>
                    <button className="btn btn-icon btn-ghost" onClick={() => handleRemovePortfolioLink(link.id)}>
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="sticky-side">
          <div className="card">
            <h4 style={{ marginBottom: 4 }}>Account</h4>
            <p className="text-muted" style={{ fontSize: 13 }}>{user.email}</p>
            {user.age !== null && user.age !== undefined && (
              <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>{user.age} years old</p>
            )}
          </div>
        </div>
      </div>

      <SkillManagerModal
        open={skillModalOpen}
        onClose={() => setSkillModalOpen(false)}
        allSkills={allSkills}
        mySkillIds={mySkillIds}
        onToggle={handleToggleSkill}
      />

      <PortfolioLinkModal
        open={!!linkModalOpen && linkModalOpen === 'add'}
        onClose={() => setLinkModalOpen(false)}
        onAdded={async () => {
          setLinkModalOpen(false);
          await refreshUser();
        }}
      />

      <Modal open={linkModalOpen === true} onClose={() => setLinkModalOpen(false)} title="Share your profile">
        <p style={{ fontSize: 13, color: '#647089', marginBottom: 16, lineHeight: 1.6 }}>
          Anyone with this link can view your public CollabNest profile — handy when applying to jobs or
          opportunities elsewhere.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="input" value={shareUrl} readOnly />
          <button className="btn btn-primary" onClick={copyLink}>
            <Icon name="copy" size={15} />
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function SkillManagerModal({ open, onClose, allSkills, mySkillIds, onToggle }) {
  const [query, setQuery] = useState('');
  const filtered = allSkills.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <Modal open={open} onClose={onClose} title="Manage your skills">
      <input className="input" placeholder="Search skills..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ marginBottom: 16 }} />
      <div className="skill-picker" style={{ maxHeight: 320, overflowY: 'auto' }}>
        {filtered.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`skill-chip skill-chip-toggle ${mySkillIds.has(s.id) ? 'selected' : ''}`}
            onClick={() => onToggle(s.id)}
          >
            {s.name}
          </button>
        ))}
      </div>
    </Modal>
  );
}

function PortfolioLinkModal({ open, onClose, onAdded }) {
  const [platform, setPlatform] = useState('github');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!/^https?:\/\/.+/i.test(url)) {
      setError('Please enter a valid URL, starting with http:// or https://');
      return;
    }
    setLoading(true);
    try {
      await addPortfolioLink({ platform, url: url.trim() });
      setUrl('');
      onAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add a portfolio link">
      {error && <div className="auth-error-banner">{error}</div>}
      <form onSubmit={handleSubmit}>
        <Field label="Platform" htmlFor="platform">
          <select id="platform" className="select" value={platform} onChange={(e) => setPlatform(e.target.value)}>
            {PORTFOLIO_LINK_PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </Field>
        <Field label="URL" htmlFor="url">
          <input id="url" className="input" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
        </Field>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <Spinner /> : 'Add link'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
