export function ProjectSkeleton() {
  return <div className="project-skeleton" role="status" aria-label="Loading project"><span className="sr-only">Loading project…</span><div className="skeleton-metrics">{[0,1,2].map(i => <div key={i}><span /><strong /></div>)}</div><div className="skeleton-card"><span /><span /><div /></div><div className="skeleton-card"><span /><span /></div></div>;
}
