import { useEffect, useState, useCallback } from 'react';
import Icon from '../../components/ui/Icon';
import { Spinner, EmptyState } from '../../components/ui/Feedback';
import Pagination from '../../components/ui/Pagination';
import ProjectCard from '../../components/project/ProjectCard';
import { searchProjects } from '../../api/projects';
import { listCategories, listSkills } from '../../api/misc';

export default function DiscoverPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [technologyId, setTechnologyId] = useState('');
  const [page, setPage] = useState(1);

  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listCategories().then(setCategories).catch(() => {});
    listSkills().then(setSkills).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, categoryId, technologyId]);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    searchProjects({
      q: debouncedQuery || undefined,
      categoryId: categoryId || undefined,
      technologyIds: technologyId || undefined,
      page,
      pageSize: 12,
    })
      .then(setResult)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [debouncedQuery, categoryId, technologyId, page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Discover projects</h1>
          <p className="text-muted">Find a team that needs exactly what you bring.</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <Icon name="search" size={16} />
          <input
            className="input"
            placeholder="Search by title, description, category, or technology..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className="select" style={{ maxWidth: 220 }} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select className="select" style={{ maxWidth: 220 }} value={technologyId} onChange={(e) => setTechnologyId(e.target.value)}>
          <option value="">All technologies</option>
          {skills.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <Spinner page />
      ) : error ? (
        <EmptyState icon="alertTriangle" title="Couldn't load projects" description={error} />
      ) : result.items.length === 0 ? (
        <EmptyState
          icon="search"
          title="No projects match your search"
          description="Try a different keyword or clear your filters to see everything that's recruiting right now."
        />
      ) : (
        <>
          <div className="project-grid">
            {result.items.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
          <Pagination page={result.pagination.page} totalPages={result.pagination.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
