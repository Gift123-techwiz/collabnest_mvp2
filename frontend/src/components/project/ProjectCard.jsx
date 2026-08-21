import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_BADGE } from '../../utils/constants';
import './ProjectCard.scss';

export default function ProjectCard({ project, to, footer }) {
  const link = to || `/projects/${project.id}`;
  const techList = project.technologies || [];

  return (
    <Link to={link} className="project-card">
      <div className="project-card-top">
        <span className={`badge ${PROJECT_STATUS_BADGE[project.status] || 'badge-neutral'}`}>
          {PROJECT_STATUS_LABELS[project.status] || project.status}
        </span>
        {project.category?.name && <span className="badge badge-neutral">{project.category.name}</span>}
      </div>

      <h3 className="project-card-title">{project.title}</h3>

      {project.description && <p className="project-card-desc">{project.description}</p>}

      {techList.length > 0 && (
        <div className="project-card-tech">
          {techList.slice(0, 4).map((t) => (
            <span key={t.id || t.name} className="skill-chip">
              {t.name}
            </span>
          ))}
          {techList.length > 4 && <span className="skill-chip">+{techList.length - 4}</span>}
        </div>
      )}

      <div className="project-card-meta">
        <span>
          <Icon name="users" size={14} />
          {project.teamCount ?? '—'} on team
        </span>
        {project.openRoles !== undefined && (
          <span>
            <Icon name="briefcase" size={14} />
            {project.openRoles} open role{project.openRoles === 1 ? '' : 's'}
          </span>
        )}
        {project.country && (
          <span>
            <Icon name="mapPin" size={14} />
            {project.country}
          </span>
        )}
      </div>

      {footer}
    </Link>
  );
}
