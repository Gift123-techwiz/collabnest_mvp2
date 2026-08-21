import Icon from './Icon';

export default function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 32 }}>
      <button
        className="btn btn-secondary btn-sm"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="Previous page"
      >
        <Icon name="chevronLeft" size={16} />
        Prev
      </button>
      <span style={{ fontSize: 13, color: '#647089', fontWeight: 600 }}>
        Page {page} of {totalPages}
      </span>
      <button
        className="btn btn-secondary btn-sm"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Next page"
      >
        Next
        <Icon name="chevronRight" size={16} />
      </button>
    </div>
  );
}
