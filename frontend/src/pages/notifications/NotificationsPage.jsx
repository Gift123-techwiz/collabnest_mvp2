import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import { Spinner, EmptyState } from '../../components/ui/Feedback';
import Pagination from '../../components/ui/Pagination';
import { listNotifications, markNotificationRead, markAllNotificationsRead } from '../../api/misc';
import { useNotifications } from '../../context/NotificationsContext';
import { NOTIFICATION_TYPE_META, formatRelativeTime } from '../../utils/constants';
import './NotificationsPage.scss';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { refreshUnreadCount } = useNotifications();
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    listNotifications({ page, pageSize: 20, unreadOnly: unreadOnly || undefined })
      .then(setResult)
      .finally(() => setLoading(false));
  }, [page, unreadOnly]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleClick(n) {
    if (!n.isRead) {
      await markNotificationRead(n.id);
      refreshUnreadCount();
      load();
    }
    if (n.relatedEntityType === 'project' || n.relatedEntityType === 'application' || n.relatedEntityType === 'task') {
      const targetProjectId = n.relatedEntityType === 'project' ? n.relatedEntityId : null;
      if (targetProjectId) navigate(`/projects/${targetProjectId}`);
    }
  }

  async function handleMarkAll() {
    await markAllNotificationsRead();
    refreshUnreadCount();
    load();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p className="text-muted">Everything happening across your projects and applications.</p>
        </div>
        <button className="btn btn-secondary" onClick={handleMarkAll}>
          Mark all as read
        </button>
      </div>

      <div className="tabs" style={{ marginBottom: 24 }}>
        <button className={`tab-btn ${!unreadOnly ? 'active' : ''}`} onClick={() => { setUnreadOnly(false); setPage(1); }}>
          All
        </button>
        <button className={`tab-btn ${unreadOnly ? 'active' : ''}`} onClick={() => { setUnreadOnly(true); setPage(1); }}>
          Unread
        </button>
      </div>

      {loading ? (
        <Spinner page />
      ) : result.items.length === 0 ? (
        <EmptyState icon="bell" title="Nothing here yet" description="You'll see updates about applications, tasks, and your team here." />
      ) : (
        <>
          <div className="notif-list-page">
            {result.items.map((n) => {
              const meta = NOTIFICATION_TYPE_META[n.type] || { icon: 'info' };
              return (
                <button key={n.id} className={`notif-list-item ${!n.isRead ? 'unread' : ''}`} onClick={() => handleClick(n)}>
                  <span className="notif-item-icon">
                    <Icon name={meta.icon} size={16} />
                  </span>
                  <span className="notif-item-body">
                    <span className="notif-item-title">{n.title}</span>
                    <span className="notif-item-message">{n.message}</span>
                    <span className="notif-item-time">{formatRelativeTime(n.createdAt)}</span>
                  </span>
                  {!n.isRead && <span className="notif-item-unread-mark" />}
                </button>
              );
            })}
          </div>
          <Pagination page={result.pagination.page} totalPages={result.pagination.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
