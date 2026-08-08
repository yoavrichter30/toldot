import { ProjectStateView } from '../api/game';

interface Props {
  projects: ProjectStateView[];
  onStartProject: (name: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  available: '#9e9e9e',
  active: '#2196f3',
  completed: '#4caf50',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className="project-status-badge"
      style={{ background: STATUS_COLORS[status] || '#9e9e9e' }}
    >
      {status}
    </span>
  );
}

function ProgressBar({ value, max, animated }: { value: number; max: number; animated?: boolean }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="project-bar">
      <div className="project-bar-rows">
        <span>Progress</span>
        <span>{pct}%</span>
      </div>
      <div className="project-bar-track">
        <div
          className={`project-bar-fill${animated ? ' progress-animated' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  onStart,
}: {
  project: ProjectStateView;
  onStart: (name: string) => void;
}) {
  return (
    <div className="project-entry">
      <div className="project-header">
        <strong>{project.name}</strong>
        <StatusBadge status={project.status} />
      </div>
      <div className="project-description">{project.description}</div>
      <ProgressBar value={project.progress} max={project.requiredDays} animated={project.status === 'active'} />
      {project.status === 'available' && (
        <button
          className="project-start-btn"
          onClick={() => onStart(project.name)}
        >
          Start
        </button>
      )}
      {project.status === 'completed' && (
        <span className="project-complete-icon" title="Completed">&#10003;</span>
      )}
    </div>
  );
}

export function ProjectPanel({ projects, onStartProject }: Props) {
  const available = projects.filter(p => p.status === 'available');
  const active = projects.filter(p => p.status === 'active');
  const completed = projects.filter(p => p.status === 'completed');

  if (projects.length === 0) {
    return (
      <div className="card project-panel">
        <h4>Major Projects</h4>
        <p className="empty-state">No major projects available.</p>
      </div>
    );
  }

  const handleStart = (name: string) => {
    onStartProject(name);
  };

  return (
    <div className="card project-panel">
      <h4>Major Projects</h4>

      {available.length > 0 && (
        <div className="project-group">
          <h5 className="project-group-title">Available</h5>
          {available.map(p => <ProjectCard key={p.id} project={p} onStart={handleStart} />)}
        </div>
      )}

      {active.length > 0 && (
        <div className="project-group">
          <h5 className="project-group-title">Active</h5>
          {active.map(p => <ProjectCard key={p.id} project={p} onStart={handleStart} />)}
        </div>
      )}

      {completed.length > 0 && (
        <div className="project-group">
          <h5 className="project-group-title">Completed</h5>
          {completed.map(p => <ProjectCard key={p.id} project={p} onStart={handleStart} />)}
        </div>
      )}
    </div>
  );
}
