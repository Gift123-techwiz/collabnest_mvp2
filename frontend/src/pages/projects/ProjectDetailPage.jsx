import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import Avatar from '../../components/ui/Avatar';
import { Spinner, EmptyState } from '../../components/ui/Feedback';
import ApplyToRoleModal from '../../components/project/ApplyToRoleModal';
import LeaveProjectModal from '../../components/project/LeaveProjectModal';
import RateUserModal from '../../components/project/RateUserModal';
import { getProject } from '../../api/projects';
import { listProjectMembers, listProjectTasks, submitTask } from '../../api/misc';
import { listMyApplications } from '../../api/applications';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_BADGE, TASK_STATUS_LABELS, TASK_STATUS_BADGE, APPLICATION_STATUS_LABELS } from '../../utils/constants';
import './ProjectDetailPage.scss';

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [myMembership, setMyMembership] = useState(null);
  const [myApplicationsForProject, setMyApplicationsForProject] = useState([]);
  const [myTasks, setMyTasks] = useState([]);

  const [applyRole, setApplyRole] = useState(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [rateOwnerOpen, setRateOwnerOpen] = useState(false);

  const isOwner = user && project && project.ownerId === user.id;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const p = await getProject(projectId);
      setProject(p);

      if (user && p.ownerId !== user.id) {
        const [members, applications] = await Promise.allSettled([
          listProjectMembers(projectId),
          listMyApplications(),
        ]);
        if (members.status === 'fulfilled') {
          const mine = members.value.find((m) => m.userId === user.id);
          setMyMembership(mine || null);
          if (mine) {
            const tasks = await listProjectTasks(projectId).catch(() => []);
            setMyTasks(tasks.filter((t) => t.assignedMemberId === mine.id));
          }
        }
        if (applications.status === 'fulfilled') {
          setMyApplicationsForProject(applications.value.filter((a) => a.projectId === projectId));
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, user]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmitTask(taskId) {
    try {
      await submitTask(taskId);
      toast.success('Task submitted for review.');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (loading) return <Spinner page />;
  if (error) {
    return <EmptyState icon="alertTriangle" title="Couldn't load this project" description={error} />;
  }
  if (!project) return null;

  if (isOwner) {
    // Owners manage their project from a dedicated workspace.
    navigate(`/my-projects/${project.id}`, { replace: true });
    return <Spinner page />;
  }

  const isLocked = project.status === 'payment_required';
  const applicationForRole = (roleId) =>
    myApplicationsForProject.find((a) => a.roleId === roleId && a.status !== 'rejected');

  return (
    <div className="project-detail-page">
      <Link to="/discover" className="link-btn" style={{ fontSize: 13, marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <Icon name="chevronLeft" size={14} /> Back to Discover
      </Link>

      <div className="detail-header">
        <div>
          <div className="project-card-top" style={{ marginBottom: 12 }}>
            <span className={`badge ${PROJECT_STATUS_BADGE[project.status] || 'badge-neutral'}`}>
              {PROJECT_STATUS_LABELS[project.status] || project.status}
            </span>
            {project.category?.name && <span className="badge badge-neutral">{project.category.name}</span>}
          </div>
          <h1>{project.title}</h1>
          <div className="detail-owner-row">
            <Avatar src={project.owner?.profilePictureUrl} name={project.owner?.fullName} size="sm" />
            <span>
              by{' '}
              <Link to={`/profile/${project.owner?.id}`} className="link-btn">
                {project.owner?.fullName}
              </Link>
            </span>
            {project.country && (
              <span className="detail-meta-item">
                <Icon name="mapPin" size={13} /> {project.country}
              </span>
            )}
            {project.expectedDuration && (
              <span className="detail-meta-item">
                <Icon name="clock" size={13} /> {project.expectedDuration}
              </span>
            )}
          </div>
        </div>
      </div>

      {isLocked && (
        <div className="locked-banner">
          <Icon name="lock" size={18} />
          This project is temporarily locked while the owner's subscription is renewed. You can still view
          it, but new applications and updates are paused.
        </div>
      )}

      <div className="detail-layout">
        <div className="detail-main">
          <section className="card" style={{ marginBottom: 24 }}>
            <h4 style={{ marginBottom: 12 }}>About this project</h4>
            <p className="detail-body-text">{project.description}</p>
            {project.problemStatement && (
              <>
                <h4 style={{ margin: '20px 0 12px' }}>Problem statement</h4>
                <p className="detail-body-text">{project.problemStatement}</p>
              </>
            )}
            {project.technologies?.length > 0 && (
              <>
                <h4 style={{ margin: '20px 0 12px' }}>Technologies</h4>
                <div className="skill-picker">
                  {project.technologies.map((t) => (
                    <span key={t.id} className="skill-chip">
                      {t.name}
                    </span>
                  ))}
                </div>
              </>
            )}
          </section>

          <section>
            <h4 style={{ marginBottom: 16 }}>Open roles</h4>
            {(!project.roles || project.roles.length === 0) && (
              <EmptyState icon="briefcase" title="No roles posted yet" description="The owner hasn't added any roles to this project." />
            )}
            <div className="role-list">
              {project.roles?.map((role) => {
                const existingApplication = applicationForRole(role.id);
                const isFull = role.remainingOpenings <= 0 || role.status !== 'open';
                return (
                  <div key={role.id} className="role-list-item card">
                    <div className="role-list-item-main">
                      <div className="role-list-item-head">
                        <strong>{role.name}</strong>
                        <span className="badge badge-neutral">
                          {role.remainingOpenings} of {role.openings} open
                        </span>
                      </div>
                      {role.description && <p className="detail-body-text">{role.description}</p>}
                      {role.requiredSkills?.length > 0 && (
                        <div className="skill-picker" style={{ marginTop: 8 }}>
                          {role.requiredSkills.map((s) => (
                            <span key={s.id} className="skill-chip">
                              {s.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="role-list-item-action">
                      {myMembership ? (
                        myMembership.roleId === role.id && <span className="badge badge-success">Your role</span>
                      ) : existingApplication ? (
                        <span className="badge badge-primary">
                          {APPLICATION_STATUS_LABELS[existingApplication.status]}
                        </span>
                      ) : !user ? (
                        <button className="btn btn-primary btn-sm" onClick={() => navigate('/signin')}>
                          Sign in to apply
                        </button>
                      ) : isLocked ? (
                        <span className="badge badge-danger">Locked</span>
                      ) : isFull ? (
                        <span className="badge badge-neutral">Full</span>
                      ) : (
                        <button className="btn btn-primary btn-sm" onClick={() => setApplyRole(role)}>
                          Apply
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="sticky-side">
          {myMembership && (
            <div className="card">
              <h4 style={{ marginBottom: 12 }}>Your workspace</h4>
              {myMembership.workspaceLink ? (
                <a href={myMembership.workspaceLink} target="_blank" rel="noreferrer" className="btn btn-secondary btn-block" style={{ marginBottom: 12 }}>
                  <Icon name="externalLink" size={15} />
                  Open workspace
                </a>
              ) : (
                <p className="text-muted" style={{ fontSize: 13, marginBottom: 12, lineHeight: 1.6 }}>
                  The owner hasn't shared a workspace link yet. Check your{' '}
                  <Link to="/profile" className="link-btn">
                    profile's contact info
                  </Link>{' '}
                  is up to date — they'll reach out directly.
                </p>
              )}

              {myTasks.length > 0 && (
                <>
                  <h5 style={{ margin: '16px 0 10px', fontSize: 13 }}>Your tasks</h5>
                  <div className="my-task-list">
                    {myTasks.map((task) => (
                      <div key={task.id} className="my-task-item">
                        <div>
                          <strong>{task.title}</strong>
                          <span className={`badge ${TASK_STATUS_BADGE[task.status]}`} style={{ marginLeft: 8 }}>
                            {TASK_STATUS_LABELS[task.status]}
                          </span>
                        </div>
                        {(task.status === 'assigned' || task.status === 'rejected') && (
                          <button className="btn btn-secondary btn-sm" onClick={() => handleSubmitTask(task.id)}>
                            Submit for review
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {project.status === 'completed' ? (
                <button className="btn btn-secondary btn-block" style={{ marginTop: 16 }} onClick={() => setRateOwnerOpen(true)}>
                  <Icon name="star" size={15} />
                  Rate the project owner
                </button>
              ) : (
                <button className="btn btn-danger btn-block" style={{ marginTop: 16 }} onClick={() => setLeaveOpen(true)}>
                  Leave project
                </button>
              )}
            </div>
          )}

          <div className="card">
            <h4 style={{ marginBottom: 10 }}>Project owner</h4>
            <Link to={`/profile/${project.owner?.id}`} className="owner-card-link">
              <Avatar src={project.owner?.profilePictureUrl} name={project.owner?.fullName} size="md" />
              <div>
                <strong>{project.owner?.fullName}</strong>
                <span className="text-muted" style={{ fontSize: 12, display: 'block' }}>
                  View profile
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <ApplyToRoleModal
        open={!!applyRole}
        role={applyRole}
        projectId={project.id}
        onClose={() => setApplyRole(null)}
        onApplied={() => {
          toast.success('Application submitted!');
          setApplyRole(null);
          load();
        }}
      />

      {myMembership && (
        <LeaveProjectModal
          open={leaveOpen}
          membershipId={myMembership.id}
          onClose={() => setLeaveOpen(false)}
          onLeft={() => {
            toast.success("You've left the project.");
            setLeaveOpen(false);
            load();
          }}
        />
      )}

      {project.owner && (
        <RateUserModal
          open={rateOwnerOpen}
          onClose={() => setRateOwnerOpen(false)}
          projectId={project.id}
          ratee={project.owner}
          onRated={() => setRateOwnerOpen(false)}
        />
      )}
    </div>
  );
}
