import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import { Spinner, EmptyState } from '../ui/Feedback';
import { listNotifications, markNotificationRead, markAllNotificationsRead } from '../../api/misc';
import { NOTIFICATION_TYPE_META, formatRelativeTime } from '../../utils/constants';
import { useNotifications } from '../../context/NotificationsContext';

export default function NotificationBell() {
  const { unreadCount, refreshUnreadCount } = useNotifications();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      try {
        const res = await listNotifications({ pageSize: 8 });
        setItems(res.items);
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleItemClick(n) {
    if (!n.isRead) {
      await markNotificationRead(n.id);
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, isRead: true } : i)));
      refreshUnreadCount();
    }
  }

  async function handleMarkAll() {
    await markAllNotificationsRead();
    setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
    refreshUnreadCount();
  }

  return (
    <div className="notif-bell" ref={ref}>
      <button className="btn btn-icon btn-ghost" onClick={toggleOpen} aria-label="Notifications">
        <Icon name="bell" size={20} />
        {unreadCount > 0 && <span className="notif-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-panel-header">
            <h4>Notifications</h4>
            {items.some((i) => !i.isRead) && (
              <button className="link-btn" onClick={handleMarkAll} style={{ fontSize: 12 }}>
                Mark all read
              </button>
            )}
          </div>
          <div className="notif-panel-body">
            {loading ? (
              <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
                <Spinner />
              </div>
            ) : items.length === 0 ? (
              <EmptyState icon="bell" title="No notifications yet" description="You'll see updates about applications, tasks and your projects here." />
            ) : (
              items.map((n) => {
                const meta = NOTIFICATION_TYPE_META[n.type] || { icon: 'info' };
                return (
                  <button
                    key={n.id}
                    className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                    onClick={() => handleItemClick(n)}
                  >
                    <span className="notif-item-icon">
                      <Icon name={meta.icon} size={15} />
                    </span>
                    <span className="notif-item-body">
                      <span className="notif-item-title">{n.title}</span>
                      <span className="notif-item-message">{n.message}</span>
                      <span className="notif-item-time">{formatRelativeTime(n.createdAt)}</span>
                    </span>
                    {!n.isRead && <span className="notif-item-unread-mark" />}
                  </button>
                );
              })
            )}
          </div>
          <Link to="/notifications" className="notif-panel-footer" onClick={() => setOpen(false)}>
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
