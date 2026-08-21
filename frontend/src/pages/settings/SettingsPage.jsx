import { useState } from 'react';
import SettingsAccountTab from './SettingsAccountTab';
import SettingsNotificationsTab from './SettingsNotificationsTab';

const TABS = [
  { key: 'account', label: 'Account & Security' },
  { key: 'notifications', label: 'Notifications' },
];

export default function SettingsPage() {
  const [tab, setTab] = useState('account');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p className="text-muted">Manage your account and notification preferences.</p>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 28 }}>
        {TABS.map((t) => (
          <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'account' && <SettingsAccountTab />}
      {tab === 'notifications' && <SettingsNotificationsTab />}
    </div>
  );
}
