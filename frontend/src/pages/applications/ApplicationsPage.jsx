import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Spinner, EmptyState } from '../../components/ui/Feedback';
import { listMyApplications } from '../../api/applications';
import { APPLICATION_STATUS_LABELS, formatDate } from '../../utils/constants';

const STATUS_BADGE = {
  pending: 'badge-neutral',
  accepted: 'badge-success',
  rejected: 'badge-danger',
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listMyApplications()
      .then(setApplications)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner page />;
  if (error) return <EmptyState icon="alertTriangle" title="Couldn't load your applications" description={error} />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My applications</h1>
          <p className="text-muted">Track the status of every role you've applied to.</p>
        </div>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          icon="file"
          title="You haven't applied anywhere yet"
          description="Head to Discover to find a project that needs your skills."
          action={
            <Link to="/discover" className="btn btn-primary btn-sm">
              Discover projects
            </Link>
          }
        />
      ) : (
        <div className="application-list">
          {applications.map((app) => (
            <Link key={app.id} to={`/projects/${app.projectId}`} className="card application-entry">
              <div>
                <strong>{app.project?.title || 'Project'}</strong>
                {app.role?.name && <span className="text-muted" style={{ fontSize: 13, display: 'block' }}>{app.role.name}</span>}
                {app.status === 'rejected' && app.rejectionReason && (
                  <p className="text-muted" style={{ fontSize: 13, marginTop: 6 }}>Reason: {app.rejectionReason}</p>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="text-muted" style={{ fontSize: 12 }}>{formatDate(app.createdAt)}</span>
                <span className={`badge ${STATUS_BADGE[app.status]}`}>{APPLICATION_STATUS_LABELS[app.status]}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
