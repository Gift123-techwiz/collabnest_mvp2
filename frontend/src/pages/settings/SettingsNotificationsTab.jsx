import { useEffect, useState } from 'react';
import { Spinner } from '../../components/ui/Feedback';
import { getNotificationPreferences, updateNotificationPreference } from '../../api/misc';
import { NOTIFICATION_TYPE_META } from '../../utils/constants';
import { useToast } from '../../context/ToastContext';

export default function SettingsNotificationsTab() {
  const toast = useToast();
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingType, setSavingType] = useState(null);

  useEffect(() => {
    getNotificationPreferences()
      .then(setPrefs)
      .finally(() => setLoading(false));
  }, []);

  async function handleToggle(pref) {
    if (pref.locked) return;
    setSavingType(pref.type);
    const nextEnabled = !pref.enabled;
    setPrefs((prev) => prev.map((p) => (p.type === pref.type ? { ...p, enabled: nextEnabled } : p)));
    try {
      await updateNotificationPreference(pref.type, nextEnabled);
    } catch (err) {
      toast.error(err.message);
      setPrefs((prev) => prev.map((p) => (p.type === pref.type ? { ...p, enabled: !nextEnabled } : p)));
    } finally {
      setSavingType(null);
    }
  }

  if (loading) return <Spinner page />;

  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <p className="text-muted" style={{ fontSize: 13, marginBottom: 20 }}>
        Choose which in-app notifications you want to receive. CollabNest never sends email —
        everything happens right here.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {prefs.map((pref) => {
          const meta = NOTIFICATION_TYPE_META[pref.type] || { label: pref.type };
          return (
            <div key={pref.type} className="pref-row">
              <div>
                <strong>{meta.label}</strong>
                {pref.locked && <span className="badge badge-neutral" style={{ marginLeft: 8 }}>Always on</span>}
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={pref.enabled}
                  disabled={pref.locked || savingType === pref.type}
                  onChange={() => handleToggle(pref)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
