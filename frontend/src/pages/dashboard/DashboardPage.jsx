import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import { Spinner, EmptyState } from '../../components/ui/Feedback';
import { ProgressBar } from '../../components/ui/Form';
import ProjectCard from '../../components/project/ProjectCard';
import { getDashboardOverview } from '../../api/misc';
import { useAuth } from '../../context/AuthContext';
import './DashboardPage.scss';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    getDashboardOverview()
      .then((res) => {
        if (active) setData(res);
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <Spinner page />;
  if (error) {
    return <EmptyState icon="alertTriangle" title="Couldn't load your dashboard" description={error} />;
  }

  const combinedActive = data.activeProjects || [];

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Welcome back, {user?.fullName?.split(' ')[0]}</h1>
          <p className="text-muted">Here's what's happening across your projects.</p>
        </div>
        <Link to="/projects/new" className="btn btn-primary">
          <Icon name="plus" size={16} />
          Start a new project
        </Link>
      </div>

      {user && !user.profileComplete && (
        <Link to="/profile" className="profile-nudge-card">
          <div>
            <h4>Finish setting up your profile</h4>
            <p>
              A complete profile helps project owners understand what you bring to the table before they
              accept you onto their team.
            </p>
          </div>
          <div className="profile-nudge-progress">
            <ProgressBar value={user.profileCompletionPercentage} showValue />
            <span className="link-btn">Complete profile →</span>
          </div>
        </Link>
      )}

      <div className="stat-grid">
        <div className="stat-tile">
          <div className="stat-value">{data.projectsCreated}</div>
          <div className="stat-label">Projects created</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">{data.projectsJoined}</div>
          <div className="stat-label">Projects joined</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">{data.applicationsReceived}</div>
          <div className="stat-label">Applications received</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">{data.pendingApplicationsSent}</div>
          <div className="stat-label">Applications pending</div>
        </div>
      </div>

      <section className="dashboard-section">
        <div className="section-header">
          <h2>Active projects</h2>
          <Link to="/my-projects" className="link-btn">
            View all
          </Link>
        </div>
        {combinedActive.length === 0 ? (
          <EmptyState
            icon="briefcase"
            title="No active projects yet"
            description="Create a project or discover one to apply to — your active work will show up here."
            action={
              <div style={{ display: 'flex', gap: 12 }}>
                <Link to="/projects/new" className="btn btn-primary btn-sm">
                  Create project
                </Link>
                <Link to="/discover" className="btn btn-secondary btn-sm">
                  Discover projects
                </Link>
              </div>
            }
          />
        ) : (
          <div className="project-grid">
            {combinedActive.slice(0, 6).map((p) => (
              <ProjectCard key={p.id} project={p} to={p.membershipStatus ? `/projects/${p.id}` : `/my-projects/${p.id}`} />
            ))}
          </div>
        )}
      </section>

      {data.completedProjects?.length > 0 && (
        <section className="dashboard-section">
          <div className="section-header">
            <h2>Completed projects</h2>
          </div>
          <div className="project-grid">
            {data.completedProjects.slice(0, 3).map((p) => (
              <ProjectCard key={p.id} project={p} to={`/projects/${p.id}`} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
