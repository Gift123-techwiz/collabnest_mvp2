import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import Avatar from '../../components/ui/Avatar';
import { Spinner, EmptyState, ConfirmDialog } from '../../components/ui/Feedback';
import Modal from '../../components/ui/Modal';
import { Field } from '../../components/ui/Form';
import RateUserModal from '../../components/project/RateUserModal';
import { useToast } from '../../context/ToastContext';
import {
  getProject,
  updateProject,
  pauseProject,
  resumeProject,
  closeRecruitment,
  reopenRecruitment,
  archiveProject,
  completeProject,
  createRole,
  updateRole,
  deleteRole,
  createRoleTask,
} from '../../api/projects';
import {
  listProjectMembers,
  listProjectTasks,
  approveTask,
  rejectTask,
  setWorkspaceLink,
  getBillingStatus,
  initiatePayment,
  listSkills,
} from '../../api/misc';
import { listApplicationsForProject, acceptApplication, rejectApplication } from '../../api/applications';
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_BADGE,
  TASK_STATUS_LABELS,
  TASK_STATUS_BADGE,
  APPLICATION_STATUS_LABELS,
  PLAN_LABELS,
  PLAN_PRICING,
  formatNaira,
  formatDate,
} from '../../utils/constants';
import './ProjectManagePage.scss';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'applications', label: 'Applications' },
  { key: 'team', label: 'Team' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'billing', label: 'Billing' },
];

export default function ProjectManagePage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [tab, setTab] = useState('overview');
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    return getProject(projectId)
      .then(setProject)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Spinner page />;
  if (error) return <EmptyState icon="alertTriangle" title="Couldn't load this project" description={error} />;
  if (!project) return null;

  return (
    <div className="manage-page">
      <Link to="/my-projects" className="link-btn" style={{ fontSize: 13, marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <Icon name="chevronLeft" size={14} /> Back to My Projects
      </Link>

      <div className="detail-header">
        <div>
          <div className="project-card-top" style={{ marginBottom: 10 }}>
            <span className={`badge ${PROJECT_STATUS_BADGE[project.status] || 'badge-neutral'}`}>
              {PROJECT_STATUS_LABELS[project.status] || project.status}
            </span>
          </div>
          <h1>{project.title}</h1>
        </div>
        <Link to={`/projects/${project.id}`} className="btn btn-secondary btn-sm" target="_blank">
          <Icon name="eye" size={15} />
          View public page
        </Link>
      </div>

      <div className="tabs" style={{ marginBottom: 28 }}>
        {TABS.map((t) => (
          <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab project={project} onChange={load} toast={toast} navigate={navigate} />}
      {tab === 'applications' && <ApplicationsTab project={project} onChange={load} toast={toast} />}
      {tab === 'team' && <TeamTab project={project} onChange={load} toast={toast} />}
      {tab === 'tasks' && <TasksTab project={project} onChange={load} toast={toast} />}
      {tab === 'billing' && <BillingTab project={project} onChange={load} toast={toast} />}
    </div>
  );
}

// ============================== OVERVIEW ==============================
function OverviewTab({ project, onChange, toast, navigate }) {
  const [confirmAction, setConfirmAction] = useState(null);
  const [busy, setBusy] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [deleteRoleTarget, setDeleteRoleTarget] = useState(null);
  const [editDetailsOpen, setEditDetailsOpen] = useState(false);

  const actions = {
    pause: { fn: pauseProject, label: 'Pause recruiting', confirm: 'Pause recruiting on this project? It will be hidden from Discover until resumed.' },
    resume: { fn: resumeProject, label: 'Resume recruiting', confirm: 'Resume recruiting? The project will reappear on Discover.' },
    closeRecruitment: { fn: closeRecruitment, label: 'Close recruitment & start work', confirm: 'Close recruitment and move to in-progress? Applicants can no longer apply.' },
    reopenRecruitment: { fn: reopenRecruitment, label: 'Reopen recruitment', confirm: 'Reopen recruitment for this project?' },
    complete: { fn: completeProject, label: 'Mark project complete', confirm: 'Mark this project complete? This notifies your whole team and lets everyone rate each other. This cannot be undone.' },
    archive: { fn: archiveProject, label: 'Archive project', confirm: 'Archive this project permanently? It becomes read-only.' },
  };

  async function runAction(key) {
    setBusy(true);
    try {
      await actions[key].fn(project.id);
      toast.success('Done.');
      onChange();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
      setConfirmAction(null);
    }
  }

  async function handleDeleteRole(confirm = false) {
    setBusy(true);
    try {
      const res = await deleteRole(project.id, deleteRoleTarget.id, confirm);
      if (res?.requiresConfirmation) {
        // handled by re-triggering with confirm=true from the dialog
        return res;
      }
      toast.success('Role removed.');
      setDeleteRoleTarget(null);
      onChange();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  const availableActions = [];
  if (project.status === 'recruiting') {
    availableActions.push('pause', 'closeRecruitment');
  } else if (project.status === 'paused') {
    availableActions.push('resume');
  } else if (project.status === 'in_progress') {
    availableActions.push('reopenRecruitment', 'complete');
  }
  if (['recruiting', 'paused', 'in_progress', 'completed'].includes(project.status)) {
    availableActions.push('archive');
  }

  return (
    <div>
      <div className="detail-layout">
        <div className="detail-main">
          <section className="card" style={{ marginBottom: 24 }}>
            <div className="section-header">
              <h4>Description</h4>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditDetailsOpen(true)}>
                <Icon name="edit" size={14} /> Edit
              </button>
            </div>
            <p className="detail-body-text">{project.description}</p>
            {project.problemStatement && (
              <>
                <h4 style={{ margin: '20px 0 12px' }}>Problem statement</h4>
                <p className="detail-body-text">{project.problemStatement}</p>
              </>
            )}
          </section>

          <section>
            <div className="section-header">
              <h4>Roles</h4>
              <button className="btn btn-secondary btn-sm" onClick={() => { setEditingRole(null); setRoleModalOpen(true); }}>
                <Icon name="plus" size={14} /> Add role
              </button>
            </div>
            <div className="role-list">
              {(project.roles || []).map((role) => (
                <div key={role.id} className="role-list-item card">
                  <div className="role-list-item-main">
                    <div className="role-list-item-head">
                      <strong>{role.name}</strong>
                      <span className="badge badge-neutral">
                        {role.filledCount}/{role.openings} filled
                      </span>
                      <span className="badge badge-neutral">{role.status}</span>
                    </div>
                    {role.description && <p className="detail-body-text">{role.description}</p>}
                  </div>
                  <div className="role-list-item-action" style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-icon btn-ghost" onClick={() => { setEditingRole(role); setRoleModalOpen(true); }}>
                      <Icon name="edit" size={15} />
                    </button>
                    <button className="btn btn-icon btn-ghost" onClick={() => setDeleteRoleTarget(role)}>
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="sticky-side">
          <div className="card">
            <h4 style={{ marginBottom: 14 }}>Project actions</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {availableActions.map((key) => (
                <button
                  key={key}
                  className={`btn btn-sm ${key === 'complete' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setConfirmAction(key)}
                >
                  {actions[key].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction ? actions[confirmAction].label : ''}
        message={confirmAction ? actions[confirmAction].confirm : ''}
        loading={busy}
        onConfirm={() => runAction(confirmAction)}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmDialog
        open={!!deleteRoleTarget}
        title="Remove this role?"
        message={`This deletes "${deleteRoleTarget?.name}". If someone is actively assigned to it, they'll be removed from the team and notified.`}
        danger
        loading={busy}
        onConfirm={() => handleDeleteRole(true)}
        onCancel={() => setDeleteRoleTarget(null)}
      />

      <RoleFormModal
        open={roleModalOpen}
        role={editingRole}
        projectId={project.id}
        onClose={() => setRoleModalOpen(false)}
        onSaved={() => {
          setRoleModalOpen(false);
          toast.success('Role saved.');
          onChange();
        }}
      />

      <EditProjectDetailsModal
        open={editDetailsOpen}
        project={project}
        onClose={() => setEditDetailsOpen(false)}
        onSaved={() => {
          setEditDetailsOpen(false);
          toast.success('Project updated.');
          onChange();
        }}
      />
    </div>
  );
}

function EditProjectDetailsModal({ open, project, onClose, onSaved }) {
  const [form, setForm] = useState({ title: '', description: '', problemStatement: '', country: '', expectedDuration: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && project) {
      setForm({
        title: project.title || '',
        description: project.description || '',
        problemStatement: project.problemStatement || '',
        country: project.country || '',
        expectedDuration: project.expectedDuration || '',
      });
      setError('');
    }
  }, [open, project]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || form.description.trim().length < 50) {
      setError('Title is required and description must be at least 50 characters.');
      return;
    }
    setLoading(true);
    try {
      await updateProject(project.id, {
        title: form.title.trim(),
        description: form.description.trim(),
        problemStatement: form.problemStatement.trim() || undefined,
        country: form.country.trim() || undefined,
        expectedDuration: form.expectedDuration.trim() || undefined,
      });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit project details" wide>
      {error && <div className="auth-error-banner">{error}</div>}
      <form onSubmit={handleSubmit}>
        <Field label="Title" htmlFor="edit-title">
          <input id="edit-title" className="input" maxLength={80} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </Field>
        <Field label="Description" htmlFor="edit-description" hint="At least 50 characters">
          <textarea id="edit-description" className="textarea" rows={5} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </Field>
        <Field label="Problem statement" optional htmlFor="edit-problem">
          <textarea id="edit-problem" className="textarea" rows={3} value={form.problemStatement} onChange={(e) => setForm((f) => ({ ...f, problemStatement: e.target.value }))} />
        </Field>
        <div className="form-row-2">
          <Field label="Country" optional htmlFor="edit-country">
            <input id="edit-country" className="input" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
          </Field>
          <Field label="Expected duration" optional htmlFor="edit-duration">
            <input id="edit-duration" className="input" value={form.expectedDuration} onChange={(e) => setForm((f) => ({ ...f, expectedDuration: e.target.value }))} />
          </Field>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <Spinner /> : 'Save changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function RoleFormModal({ open, role, projectId, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', description: '', openings: 1, requiredSkillIds: [] });
  const [skills, setSkills] = useState([]);
  const [tasks, setTasks] = useState([{ title: '', description: '' }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      listSkills().then(setSkills).catch(() => {});
      setForm(
        role
          ? { name: role.name, description: role.description || '', openings: role.openings, requiredSkillIds: (role.requiredSkills || []).map((s) => s.id) }
          : { name: '', description: '', openings: 1, requiredSkillIds: [] }
      );
      setTasks(role ? [] : [{ title: '', description: '' }]);
    }
  }, [open, role]);

  function toggleSkill(id) {
    setForm((f) => ({
      ...f,
      requiredSkillIds: f.requiredSkillIds.includes(id) ? f.requiredSkillIds.filter((i) => i !== id) : [...f.requiredSkillIds, id],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      let createdRole = role;
      if (role) {
        await updateRole(projectId, role.id, {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          openings: Number(form.openings),
          requiredSkillIds: form.requiredSkillIds,
        });
      } else {
        createdRole = await createRole(projectId, {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          openings: Number(form.openings),
          requiredSkillIds: form.requiredSkillIds,
        });
        const validTasks = tasks.filter((t) => t.title.trim());
        for (const task of validTasks) {
          await createRoleTask(projectId, createdRole.id, { title: task.title.trim(), description: task.description.trim() || undefined });
        }
      }
      onSaved();
    } catch (err) {
      // surfaced via toast at call site through thrown error text on next render is tricky;
      // keep it simple with a window alert-free inline message instead
      setLoading(false);
      alert(err.message);
      return;
    }
    setLoading(false);
  }

  return (
    <Modal open={open} onClose={onClose} title={role ? 'Edit role' : 'Add a new role'}>
      <form onSubmit={handleSubmit}>
        <Field label="Role name" htmlFor="rf-name">
          <input id="rf-name" className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </Field>
        <Field label="Description" optional htmlFor="rf-desc">
          <textarea id="rf-desc" className="textarea" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </Field>
        <Field label="Openings" htmlFor="rf-openings">
          <input id="rf-openings" type="number" min={role ? role.filledCount : 1} className="input" value={form.openings} onChange={(e) => setForm((f) => ({ ...f, openings: e.target.value }))} />
        </Field>
        <Field label="Required skills" optional>
          <div className="skill-picker">
            {skills.slice(0, 30).map((s) => (
              <button type="button" key={s.id} className={`skill-chip skill-chip-toggle ${form.requiredSkillIds.includes(s.id) ? 'selected' : ''}`} onClick={() => toggleSkill(s.id)}>
                {s.name}
              </button>
            ))}
          </div>
        </Field>

        {!role && (
          <div className="task-list-editor">
            <span className="field-label">Tasks for this role</span>
            {tasks.map((task, idx) => (
              <div className="task-row" key={idx}>
                <input
                  className="input"
                  placeholder="Task title"
                  value={task.title}
                  onChange={(e) => setTasks((prev) => prev.map((t, i) => (i === idx ? { ...t, title: e.target.value } : t)))}
                />
                {tasks.length > 1 && (
                  <button type="button" className="btn btn-icon btn-ghost" onClick={() => setTasks((prev) => prev.filter((_, i) => i !== idx))}>
                    <Icon name="x" size={15} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="link-btn" style={{ fontSize: 13 }} onClick={() => setTasks((prev) => [...prev, { title: '', description: '' }])}>
              + Add another task
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <Spinner /> : role ? 'Save changes' : 'Add role'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ============================== APPLICATIONS ==============================
function ApplicationsTab({ project, onChange, toast }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptTarget, setAcceptTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    listApplicationsForProject(project.id)
      .then(setApplications)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [project.id, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const pending = applications.filter((a) => a.status === 'pending');
  const decided = applications.filter((a) => a.status !== 'pending');

  if (loading) return <Spinner page />;

  return (
    <div>
      <h4 style={{ marginBottom: 16 }}>Pending applications ({pending.length})</h4>
      {pending.length === 0 ? (
        <EmptyState icon="inbox" title="No pending applications" description="New applicants will show up here for you to review." />
      ) : (
        <div className="application-list">
          {pending.map((app) => (
            <ApplicationRow key={app.id} app={app} onAccept={() => setAcceptTarget(app)} onReject={() => setRejectTarget(app)} />
          ))}
        </div>
      )}

      {decided.length > 0 && (
        <>
          <h4 style={{ margin: '32px 0 16px' }}>Past decisions</h4>
          <div className="application-list">
            {decided.map((app) => (
              <ApplicationRow key={app.id} app={app} decided />
            ))}
          </div>
        </>
      )}

      <AcceptApplicationModal
        app={acceptTarget}
        open={!!acceptTarget}
        onClose={() => setAcceptTarget(null)}
        onDone={() => {
          setAcceptTarget(null);
          load();
          onChange();
        }}
      />
      <RejectApplicationModal
        app={rejectTarget}
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onDone={() => {
          setRejectTarget(null);
          load();
        }}
      />
    </div>
  );
}

function ApplicationRow({ app, decided, onAccept, onReject }) {
  return (
    <div className="card application-row">
      <Link to={`/profile/${app.applicant.id}`} className="application-applicant">
        <Avatar src={app.applicant.profilePictureUrl} name={app.applicant.fullName} size="md" />
        <div>
          <strong>{app.applicant.fullName}</strong>
          <span className="text-muted" style={{ fontSize: 12, display: 'block' }}>
            Applied for role — view full profile
          </span>
        </div>
      </Link>
      {app.message && <p className="detail-body-text application-message">"{app.message}"</p>}
      <div className="application-row-footer">
        <span className={`badge ${decided ? (app.status === 'accepted' ? 'badge-success' : 'badge-danger') : 'badge-neutral'}`}>
          {APPLICATION_STATUS_LABELS[app.status]}
        </span>
        {!decided && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-danger btn-sm" onClick={onReject}>
              Decline
            </button>
            <button className="btn btn-primary btn-sm" onClick={onAccept}>
              Accept
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AcceptApplicationModal({ open, app, onClose, onDone }) {
  const [workspaceLink, setWorkspaceLinkVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [reminder, setReminder] = useState(null);

  useEffect(() => {
    if (open) {
      setWorkspaceLinkVal('');
      setReminder(null);
    }
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await acceptApplication(app.id, { workspaceLink: workspaceLink.trim() || undefined });
      if (res.ownerReminder?.show) {
        setReminder(res.ownerReminder.message);
      } else {
        onDone();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (reminder) {
    return (
      <Modal open={open} onClose={onDone} title="One more thing">
        <div className="reminder-box">
          <Icon name="info" size={20} />
          <p>{reminder}</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-primary" onClick={onDone}>
            Got it
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={`Accept ${app?.applicant?.fullName || 'applicant'}`}>
      <p style={{ fontSize: 13, color: '#647089', marginBottom: 20, lineHeight: 1.6 }}>
        You can optionally share a workspace link (WhatsApp group, ClickUp, Discord, etc.) right now. It's
        completely optional — you can also just contact them from their profile instead, or add a link
        later.
      </p>
      <form onSubmit={handleSubmit}>
        <Field label="Workspace link" optional htmlFor="workspace-link" hint="e.g. https://chat.whatsapp.com/...">
          <input id="workspace-link" className="input" placeholder="https://..." value={workspaceLink} onChange={(e) => setWorkspaceLinkVal(e.target.value)} />
        </Field>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <Spinner /> : 'Accept applicant'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function RejectApplicationModal({ open, app, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await rejectApplication(app.id, { rejectionReason: reason.trim() || undefined });
      onDone();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Decline ${app?.applicant?.fullName || 'applicant'}`}>
      <form onSubmit={handleSubmit}>
        <Field label="Reason (sent to the applicant)" optional htmlFor="reject-reason">
          <textarea id="reject-reason" className="textarea" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Let them know why, so they can improve next time." />
        </Field>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-danger-solid" disabled={loading}>
            {loading ? <Spinner /> : 'Decline application'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ============================== TEAM ==============================
function TeamTab({ project, toast }) {
  const [members, setMembers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [linkTarget, setLinkTarget] = useState(null);
  const [rateTarget, setRateTarget] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.allSettled([listProjectMembers(project.id), listApplicationsForProject(project.id, { status: 'accepted' })])
      .then(([m, a]) => {
        if (m.status === 'fulfilled') setMembers(m.value);
        if (a.status === 'fulfilled') setApplications(a.value);
      })
      .finally(() => setLoading(false));
  }, [project.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Spinner page />;

  const isCompleted = project.status === 'completed';
  // After completion, active-member listing returns empty (memberships flip
  // to 'completed'), so the accepted-applications roster is the reliable
  // source of the team's identity for post-completion actions like rating.
  const roster = isCompleted ? applications.map((a) => a.applicant) : members.map((m) => m.user).filter(Boolean);

  return (
    <div>
      {members.length === 0 && !isCompleted ? (
        <EmptyState icon="users" title="No active team members yet" description="Accept applications to build your team." />
      ) : (
        <div className="member-grid">
          {(isCompleted ? applications : members).map((item) => {
            const isMember = !isCompleted;
            const user = isMember ? item.user : item.applicant;
            const roleName = isMember ? item.role?.name : null;
            return (
              <div key={item.id} className="card member-card">
                <Link to={`/profile/${user.id}`} className="application-applicant">
                  <Avatar src={user.profilePictureUrl} name={user.fullName} size="md" />
                  <div>
                    <strong>{user.fullName}</strong>
                    {roleName && <span className="text-muted" style={{ fontSize: 12, display: 'block' }}>{roleName}</span>}
                  </div>
                </Link>
                {isMember && (
                  <>
                    {item.workspaceLink ? (
                      <a href={item.workspaceLink} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm btn-block" style={{ marginTop: 12 }}>
                        <Icon name="link" size={14} /> Workspace link
                      </a>
                    ) : (
                      <button className="btn btn-secondary btn-sm btn-block" style={{ marginTop: 12 }} onClick={() => setLinkTarget(item)}>
                        <Icon name="plus" size={14} /> Add workspace link
                      </button>
                    )}
                  </>
                )}
                {isCompleted && (
                  <button className="btn btn-secondary btn-sm btn-block" style={{ marginTop: 12 }} onClick={() => setRateTarget(user)}>
                    <Icon name="star" size={14} /> Rate {user.fullName.split(' ')[0]}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <WorkspaceLinkModal
        open={!!linkTarget}
        member={linkTarget}
        onClose={() => setLinkTarget(null)}
        onSaved={() => {
          setLinkTarget(null);
          toast.success('Workspace link saved.');
          load();
        }}
      />

      {rateTarget && (
        <RateUserModal open={!!rateTarget} onClose={() => setRateTarget(null)} projectId={project.id} ratee={rateTarget} onRated={() => setRateTarget(null)} />
      )}
    </div>
  );
}

function WorkspaceLinkModal({ open, member, onClose, onSaved }) {
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [showContactReminder, setShowContactReminder] = useState(false);

  useEffect(() => {
    if (open) {
      setLink(member?.workspaceLink || '');
      setShowContactReminder(false);
    }
  }, [open, member]);

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await setWorkspaceLink(member.id, link.trim());
      if (!link.trim()) {
        setShowContactReminder(true);
        setLoading(false);
        return;
      }
      onSaved();
    } catch (err) {
      alert(err.message);
      setLoading(false);
    }
  }

  if (showContactReminder) {
    return (
      <Modal open={open} onClose={onSaved} title="No workspace link set">
        <div className="reminder-box">
          <Icon name="info" size={20} />
          <p>
            That's fine — {member?.user?.fullName || 'they'} will be notified to check their preferred
            contact info on their profile and expect you to reach out directly to get started.
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-primary" onClick={onSaved}>
            Got it
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Team workspace link">
      <form onSubmit={handleSave}>
        <Field label="Workspace link" optional htmlFor="wl" hint="WhatsApp group, ClickUp board, Discord — whatever your team uses">
          <input id="wl" className="input" placeholder="https://..." value={link} onChange={(e) => setLink(e.target.value)} />
        </Field>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <Spinner /> : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ============================== TASKS ==============================
function TasksTab({ project, toast }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addTaskRole, setAddTaskRole] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    listProjectTasks(project.id)
      .then(setTasks)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [project.id, toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApprove(taskId) {
    try {
      await approveTask(taskId);
      toast.success('Task approved.');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleReject(taskId) {
    try {
      await rejectTask(taskId);
      toast.info('Task sent back for rework.');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (loading) return <Spinner page />;

  const byRole = {};
  for (const task of tasks) {
    const key = task.roleId;
    if (!byRole[key]) byRole[key] = [];
    byRole[key].push(task);
  }

  return (
    <div>
      <div className="section-header">
        <h4>Tasks by role</h4>
      </div>
      {(project.roles || []).map((role) => (
        <div key={role.id} className="card" style={{ marginBottom: 16 }}>
          <div className="role-list-item-head" style={{ marginBottom: 12 }}>
            <strong>{role.name}</strong>
            <button className="btn btn-ghost btn-sm" onClick={() => setAddTaskRole(role)}>
              <Icon name="plus" size={13} /> Add task
            </button>
          </div>
          {(byRole[role.id] || []).length === 0 ? (
            <p className="text-muted" style={{ fontSize: 13 }}>
              No tasks yet for this role.
            </p>
          ) : (
            <div className="task-review-list">
              {byRole[role.id].map((task) => (
                <div key={task.id} className="task-review-row">
                  <div>
                    <strong>{task.title}</strong>
                    {task.description && <p className="text-muted" style={{ fontSize: 13, marginTop: 2 }}>{task.description}</p>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`badge ${TASK_STATUS_BADGE[task.status]}`}>{TASK_STATUS_LABELS[task.status]}</span>
                    {task.status === 'submitted' && (
                      <>
                        <button className="btn btn-danger btn-sm" onClick={() => handleReject(task.id)}>
                          Send back
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={() => handleApprove(task.id)}>
                          Approve
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <AddTaskModal
        open={!!addTaskRole}
        role={addTaskRole}
        projectId={project.id}
        onClose={() => setAddTaskRole(null)}
        onSaved={() => {
          setAddTaskRole(null);
          load();
        }}
      />
    </div>
  );
}

function AddTaskModal({ open, role, projectId, onClose, onSaved }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle('');
      setDescription('');
    }
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await createRoleTask(projectId, role.id, { title: title.trim(), description: description.trim() || undefined });
      onSaved();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Add task to "${role?.name}"`}>
      <form onSubmit={handleSubmit}>
        <Field label="Task title" htmlFor="task-title">
          <input id="task-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Description" optional htmlFor="task-desc">
          <textarea id="task-desc" className="textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <Spinner /> : 'Add task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ============================== BILLING ==============================
function BillingTab({ project, toast }) {
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payingPlan, setPayingPlan] = useState(null);
  const [months, setMonths] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getBillingStatus(project.id)
      .then(setBilling)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [project.id, toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePay(plan, selectedMonths) {
    setSubmitting(true);
    try {
      const res = await initiatePayment(project.id, { plan, months: plan === 'free' ? undefined : selectedMonths });
      window.location.href = res.authorizationUrl;
    } catch (err) {
      toast.error(err.message);
      setSubmitting(false);
    }
  }

  if (loading) return <Spinner page />;
  if (!billing) return null;

  const canExtendFree = billing.currentPlan === 'free' && billing.freePlanUsed && !billing.freeExtensionUsed;
  const freeEnded = billing.currentPlan === 'free' && billing.freePlanUsed && billing.freeExtensionUsed;

  return (
    <div>
      <div className="card billing-status-card">
        <div>
          <span className="stat-label">Current plan</span>
          <div className="stat-value" style={{ fontSize: 22 }}>{PLAN_LABELS[billing.currentPlan]}</div>
        </div>
        <div>
          <span className="stat-label">Team size</span>
          <div className="stat-value" style={{ fontSize: 22 }}>
            {billing.teamSize} / {billing.maxTeamSize}
          </div>
        </div>
        <div>
          <span className="stat-label">Renews / expires</span>
          <div className="stat-value" style={{ fontSize: 16 }}>{formatDate(billing.subscriptionExpiresAt)}</div>
        </div>
      </div>

      {project.status === 'payment_required' && (
        <div className="locked-banner" style={{ marginTop: 20 }}>
          <Icon name="lock" size={18} />
          Your subscription has ended — subscribe again below to restore access for you and your team.
        </div>
      )}

      <h4 style={{ margin: '28px 0 16px' }}>Plans</h4>
      <div className="plan-grid">
        <div className="card plan-card">
          <h5>Free — Test Run</h5>
          <p className="text-muted" style={{ fontSize: 13, margin: '8px 0 16px' }}>Up to 4 members. Months 1–2 free, then a one-time ₦2,500 Month-3 extension.</p>
          {canExtendFree ? (
            <button className="btn btn-primary btn-block" disabled={submitting} onClick={() => handlePay('free')}>
              Pay ₦2,500 for 1 month
            </button>
          ) : freeEnded ? (
            <div className="badge badge-danger">Free plan has ended</div>
          ) : (
            <div className="badge badge-success">{billing.currentPlan === 'free' ? 'Active' : 'Used'}</div>
          )}
        </div>

        {['standard', 'advanced'].map((plan) => {
          const cfg = PLAN_PRICING[plan];
          return (
            <div className="card plan-card" key={plan}>
              <h5>{PLAN_LABELS[plan]}</h5>
              <p className="text-muted" style={{ fontSize: 13, margin: '8px 0 16px' }}>
                Up to {cfg.maxTeamSize} members. {formatNaira(cfg.monthly)}/month.
              </p>
              {payingPlan === plan ? (
                <div>
                  <select className="select" style={{ marginBottom: 10 }} value={months} onChange={(e) => setMonths(Number(e.target.value))}>
                    {[1, 6, 12].map((m) => (
                      <option key={m} value={m}>
                        {m} month{m > 1 ? 's' : ''} — {formatNaira(cfg.monthly * m)}
                      </option>
                    ))}
                  </select>
                  <button className="btn btn-primary btn-block" disabled={submitting} onClick={() => handlePay(plan, months)}>
                    {submitting ? <Spinner /> : `Pay ${formatNaira(cfg.monthly * months)}`}
                  </button>
                </div>
              ) : (
                <button className="btn btn-secondary btn-block" onClick={() => setPayingPlan(plan)}>
                  Choose {PLAN_LABELS[plan].split(' — ')[0]}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {billing.history?.length > 0 && (
        <>
          <h4 style={{ margin: '32px 0 16px' }}>Payment history</h4>
          <div className="card" style={{ padding: 0 }}>
            {billing.history.map((h) => (
              <div key={h.id} className="billing-history-row">
                <span>{PLAN_LABELS[h.plan]}</span>
                <span>{h.months} mo</span>
                <span>{formatNaira(h.amountNaira)}</span>
                <span className={`badge ${h.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>{h.status}</span>
                <span className="text-muted">{formatDate(h.startDate)} – {formatDate(h.endDate)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
