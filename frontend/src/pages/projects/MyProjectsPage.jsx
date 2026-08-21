import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import { Spinner, EmptyState } from '../../components/ui/Feedback';
import ProjectCard from '../../components/project/ProjectCard';
import { getDashboardOverview } from '../../api/misc';

export default function MyProjectsPage() {
  const [tab, setTab] = useState('owned');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboardOverview()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner page />;
  if (error) return <EmptyState icon="alertTriangle" title="Couldn't load your projects" description={error} />;

  const owned = data.myProjects || [];
  const joined = data.joinedProjects || [];
  const items = tab === 'owned' ? owned : joined;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My projects</h1>
          <p className="text-muted">Projects you own and projects you're part of.</p>
        </div>
        <Link to="/projects/new" className="btn btn-primary">
          <Icon name="plus" size={16} />
          New project
        </Link>
      </div>

      <div className="tabs" style={{ marginBottom: 28 }}>
        <button className={`tab-btn ${tab === 'owned' ? 'active' : ''}`} onClick={() => setTab('owned')}>
          Owned ({owned.length})
        </button>
        <button className={`tab-btn ${tab === 'joined' ? 'active' : ''}`} onClick={() => setTab('joined')}>
          Joined ({joined.length})
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon="briefcase"
          title={tab === 'owned' ? "You haven't created a project yet" : "You haven't joined a project yet"}
          description={
            tab === 'owned'
              ? 'Start a project and recruit teammates with the skills you need.'
              : 'Apply to open roles on Discover to join a team.'
          }
          action={
            tab === 'owned' ? (
              <Link to="/projects/new" className="btn btn-primary btn-sm">
                Create project
              </Link>
            ) : (
              <Link to="/discover" className="btn btn-primary btn-sm">
                Discover projects
              </Link>
            )
          }
        />
      ) : (
        <div className="project-grid">
          {items.map((p) => (
            <ProjectCard key={p.id} project={p} to={tab === 'owned' ? `/my-projects/${p.id}` : `/projects/${p.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
