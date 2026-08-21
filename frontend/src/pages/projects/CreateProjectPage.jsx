import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import { Field } from '../../components/ui/Form';
import { Spinner } from '../../components/ui/Feedback';
import { createProject, createRole, createRoleTask } from '../../api/projects';
import { listCategories, listSkills } from '../../api/misc';
import { useToast } from '../../context/ToastContext';
import './CreateProjectPage.scss';

function emptyRole() {
  return {
    key: Math.random().toString(36).slice(2),
    name: '',
    description: '',
    openings: 1,
    requiredSkillIds: [],
    tasks: [{ title: '', description: '' }],
  };
}

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);

  const [basics, setBasics] = useState({
    title: '',
    description: '',
    problemStatement: '',
    categoryId: '',
    country: '',
    expectedDuration: '',
    technologySkillIds: [],
  });
  const [basicsErrors, setBasicsErrors] = useState({});

  const [roles, setRoles] = useState([emptyRole()]);
  const [rolesError, setRolesError] = useState('');

  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState('');

  useEffect(() => {
    listCategories().then(setCategories).catch(() => {});
    listSkills().then(setSkills).catch(() => {});
  }, []);

  function validateBasics() {
    const errs = {};
    if (!basics.title.trim()) errs.title = 'Title is required';
    else if (basics.title.length > 80) errs.title = 'Title must be at most 80 characters';
    if (!basics.description.trim()) errs.description = 'Description is required';
    else if (basics.description.length < 50) errs.description = 'Description must be at least 50 characters';
    setBasicsErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateRoles() {
    if (roles.length === 0) {
      setRolesError('Add at least one role so people know what to apply for.');
      return false;
    }
    for (const role of roles) {
      if (!role.name.trim()) {
        setRolesError('Every role needs a name.');
        return false;
      }
      const validTasks = role.tasks.filter((t) => t.title.trim());
      if (validTasks.length === 0) {
        setRolesError(`Add at least one task for the "${role.name}" role — you can edit or add more later.`);
        return false;
      }
    }
    setRolesError('');
    return true;
  }

  function goToStep2() {
    if (validateBasics()) setStep(2);
  }

  function goToStep3() {
    if (validateRoles()) setStep(3);
  }

  function updateRole(key, patch) {
    setRoles((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function addRole() {
    setRoles((prev) => [...prev, emptyRole()]);
  }

  function removeRole(key) {
    setRoles((prev) => prev.filter((r) => r.key !== key));
  }

  function updateTask(roleKey, index, patch) {
    setRoles((prev) =>
      prev.map((r) =>
        r.key === roleKey
          ? { ...r, tasks: r.tasks.map((t, i) => (i === index ? { ...t, ...patch } : t)) }
          : r
      )
    );
  }

  function addTask(roleKey) {
    setRoles((prev) =>
      prev.map((r) => (r.key === roleKey ? { ...r, tasks: [...r.tasks, { title: '', description: '' }] } : r))
    );
  }

  function removeTask(roleKey, index) {
    setRoles((prev) =>
      prev.map((r) => (r.key === roleKey ? { ...r, tasks: r.tasks.filter((_, i) => i !== index) } : r))
    );
  }

  function toggleSkill(skillId) {
    setBasics((b) => ({
      ...b,
      technologySkillIds: b.technologySkillIds.includes(skillId)
        ? b.technologySkillIds.filter((id) => id !== skillId)
        : [...b.technologySkillIds, skillId],
    }));
  }

  function toggleRoleSkill(roleKey, skillId) {
    setRoles((prev) =>
      prev.map((r) => {
        if (r.key !== roleKey) return r;
        const has = r.requiredSkillIds.includes(skillId);
        return { ...r, requiredSkillIds: has ? r.requiredSkillIds.filter((id) => id !== skillId) : [...r.requiredSkillIds, skillId] };
      })
    );
  }

  async function handlePublish() {
    setPublishing(true);
    try {
      setPublishStatus('Creating your project...');
      const project = await createProject({
        title: basics.title.trim(),
        description: basics.description.trim(),
        problemStatement: basics.problemStatement.trim() || undefined,
        categoryId: basics.categoryId || undefined,
        country: basics.country.trim() || undefined,
        expectedDuration: basics.expectedDuration.trim() || undefined,
        technologySkillIds: basics.technologySkillIds,
      });

      for (const role of roles) {
        setPublishStatus(`Adding role "${role.name}"...`);
        const createdRole = await createRole(project.id, {
          name: role.name.trim(),
          description: role.description.trim() || undefined,
          openings: Number(role.openings) || 1,
          requiredSkillIds: role.requiredSkillIds,
        });

        const validTasks = role.tasks.filter((t) => t.title.trim());
        for (const task of validTasks) {
          setPublishStatus(`Adding tasks for "${role.name}"...`);
          await createRoleTask(project.id, createdRole.id, {
            title: task.title.trim(),
            description: task.description.trim() || undefined,
          });
        }
      }

      toast.success('Project published — it\u2019s now live on Discover.');
      navigate(`/my-projects/${project.id}`);
    } catch (err) {
      toast.error(err.message || 'Something went wrong while publishing your project.');
      setPublishing(false);
      setPublishStatus('');
    }
  }

  return (
    <div className="create-project-page">
      <div className="page-header">
        <div>
          <h1>Create a project</h1>
          <p className="text-muted">Months 1–2 are free on every new project — no card required to start.</p>
        </div>
      </div>

      <div className="wizard-steps">
        {['Project basics', 'Roles & tasks', 'Review & publish'].map((label, i) => (
          <div key={label} className={`wizard-step ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}`}>
            <span className="wizard-step-num">{step > i + 1 ? <Icon name="check" size={13} /> : i + 1}</span>
            {label}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="card">
          <Field label="Project title" htmlFor="title" error={basicsErrors.title}>
            <input
              id="title"
              className={`input ${basicsErrors.title ? 'has-error' : ''}`}
              placeholder="e.g. AI-powered study planner for university students"
              value={basics.title}
              maxLength={80}
              onChange={(e) => setBasics((b) => ({ ...b, title: e.target.value }))}
            />
          </Field>
          <Field
            label="Description"
            htmlFor="description"
            hint="At least 50 characters — what are you building, and why?"
            error={basicsErrors.description}
          >
            <textarea
              id="description"
              className={`textarea ${basicsErrors.description ? 'has-error' : ''}`}
              rows={5}
              placeholder="Describe what the project is, who it's for, and what a great outcome looks like."
              value={basics.description}
              onChange={(e) => setBasics((b) => ({ ...b, description: e.target.value }))}
            />
          </Field>
          <Field label="Problem statement" optional htmlFor="problemStatement" hint="What specific problem are you solving?">
            <textarea
              id="problemStatement"
              className="textarea"
              rows={3}
              value={basics.problemStatement}
              onChange={(e) => setBasics((b) => ({ ...b, problemStatement: e.target.value }))}
            />
          </Field>
          <div className="form-row-2">
            <Field label="Category" optional htmlFor="category">
              <select
                id="category"
                className="select"
                value={basics.categoryId}
                onChange={(e) => setBasics((b) => ({ ...b, categoryId: e.target.value }))}
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Country" optional htmlFor="country">
              <input
                id="country"
                className="input"
                placeholder="e.g. Nigeria, Remote"
                value={basics.country}
                onChange={(e) => setBasics((b) => ({ ...b, country: e.target.value }))}
              />
            </Field>
          </div>
          <Field label="Expected duration" optional htmlFor="duration" hint="e.g. 6 weeks, 3 months">
            <input
              id="duration"
              className="input"
              value={basics.expectedDuration}
              onChange={(e) => setBasics((b) => ({ ...b, expectedDuration: e.target.value }))}
            />
          </Field>
          <Field label="Technologies used" optional hint="Helps the right people find your project in Discover">
            <div className="skill-picker">
              {skills.slice(0, 40).map((s) => (
                <button
                  type="button"
                  key={s.id}
                  className={`skill-chip skill-chip-toggle ${basics.technologySkillIds.includes(s.id) ? 'selected' : ''}`}
                  onClick={() => toggleSkill(s.id)}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </Field>

          <div className="wizard-actions">
            <button className="btn btn-primary" onClick={goToStep2}>
              Continue to roles
              <Icon name="chevronRight" size={16} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <p className="text-muted" style={{ marginBottom: 20, fontSize: 13 }}>
            Add each role you need filled, and at least one task for that role so applicants know what
            they'll be working on. You can edit or add more tasks any time after publishing.
          </p>

          {roles.map((role, idx) => (
            <div key={role.key} className="card role-card">
              <div className="role-card-header">
                <h4>Role {idx + 1}</h4>
                {roles.length > 1 && (
                  <button className="btn btn-icon btn-ghost" onClick={() => removeRole(role.key)} aria-label="Remove role">
                    <Icon name="trash" size={16} />
                  </button>
                )}
              </div>
              <div className="form-row-2">
                <Field label="Role name" htmlFor={`role-name-${role.key}`}>
                  <input
                    id={`role-name-${role.key}`}
                    className="input"
                    placeholder="e.g. Frontend Developer"
                    value={role.name}
                    onChange={(e) => updateRole(role.key, { name: e.target.value })}
                  />
                </Field>
                <Field label="Openings" htmlFor={`role-openings-${role.key}`}>
                  <input
                    id={`role-openings-${role.key}`}
                    type="number"
                    min={1}
                    className="input"
                    value={role.openings}
                    onChange={(e) => updateRole(role.key, { openings: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Role description" optional htmlFor={`role-desc-${role.key}`}>
                <textarea
                  id={`role-desc-${role.key}`}
                  className="textarea"
                  rows={2}
                  value={role.description}
                  onChange={(e) => updateRole(role.key, { description: e.target.value })}
                />
              </Field>
              <Field label="Required skills" optional>
                <div className="skill-picker">
                  {skills.slice(0, 30).map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      className={`skill-chip skill-chip-toggle ${role.requiredSkillIds.includes(s.id) ? 'selected' : ''}`}
                      onClick={() => toggleRoleSkill(role.key, s.id)}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="task-list-editor">
                <span className="field-label">Tasks for this role</span>
                {role.tasks.map((task, tIdx) => (
                  <div className="task-row" key={tIdx}>
                    <input
                      className="input"
                      placeholder="Task title (e.g. Build the login screen)"
                      value={task.title}
                      onChange={(e) => updateTask(role.key, tIdx, { title: e.target.value })}
                    />
                    {role.tasks.length > 1 && (
                      <button className="btn btn-icon btn-ghost" onClick={() => removeTask(role.key, tIdx)} aria-label="Remove task">
                        <Icon name="x" size={15} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="link-btn" style={{ fontSize: 13 }} onClick={() => addTask(role.key)}>
                  + Add another task
                </button>
              </div>
            </div>
          ))}

          <button type="button" className="btn btn-secondary" onClick={addRole} style={{ marginBottom: 20 }}>
            <Icon name="plus" size={15} />
            Add another role
          </button>

          {rolesError && <div className="auth-error-banner">{rolesError}</div>}

          <div className="wizard-actions">
            <button className="btn btn-ghost" onClick={() => setStep(1)}>
              <Icon name="chevronLeft" size={16} />
              Back
            </button>
            <button className="btn btn-primary" onClick={goToStep3}>
              Review project
              <Icon name="chevronRight" size={16} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card">
          <h3 style={{ marginBottom: 20 }}>{basics.title}</h3>
          <p style={{ color: '#647089', marginBottom: 20, fontSize: 14, lineHeight: 1.6 }}>{basics.description}</p>

          <div className="review-meta">
            {basics.country && <span className="badge badge-neutral">{basics.country}</span>}
            {basics.expectedDuration && <span className="badge badge-neutral">{basics.expectedDuration}</span>}
          </div>

          <hr className="divider" />

          <h4 style={{ marginBottom: 16 }}>Roles ({roles.length})</h4>
          {roles.map((role) => (
            <div key={role.key} className="review-role">
              <div className="review-role-header">
                <strong>{role.name}</strong>
                <span className="badge badge-primary">{role.openings} opening{role.openings > 1 ? 's' : ''}</span>
              </div>
              <ul className="review-task-list">
                {role.tasks
                  .filter((t) => t.title.trim())
                  .map((t, i) => (
                    <li key={i}>{t.title}</li>
                  ))}
              </ul>
            </div>
          ))}

          <div className="wizard-actions" style={{ marginTop: 32 }}>
            <button className="btn btn-ghost" onClick={() => setStep(2)} disabled={publishing}>
              <Icon name="chevronLeft" size={16} />
              Back
            </button>
            <button className="btn btn-primary btn-lg" onClick={handlePublish} disabled={publishing}>
              {publishing ? (
                <>
                  <Spinner /> {publishStatus}
                </>
              ) : (
                'Publish project'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
