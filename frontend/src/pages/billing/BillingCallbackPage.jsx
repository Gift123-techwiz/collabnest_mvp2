import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Spinner } from '../../components/ui/Feedback';
import Icon from '../../components/ui/Icon';
import { verifyPayment } from '../../api/misc';

export default function BillingCallbackPage() {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference') || searchParams.get('trxref');
  const projectId = searchParams.get('projectId');
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    if (!reference) {
      setStatus('error');
      return;
    }
    verifyPayment(reference)
      .then((res) => setStatus(res.status === 'success' ? 'success' : 'failed'))
      .catch(() => setStatus('error'));
  }, [reference]);

  return (
    <div className="billing-callback-page">
      <div className="card billing-callback-card">
        {status === 'checking' && (
          <>
            <Spinner />
            <h3 style={{ marginTop: 16 }}>Confirming your payment...</h3>
            <p className="text-muted" style={{ fontSize: 13, marginTop: 6 }}>This only takes a moment.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="empty-icon" style={{ background: '#e7f9ee', color: '#22c55e' }}>
              <Icon name="checkCircle" size={28} />
            </div>
            <h3 style={{ marginTop: 16 }}>Payment successful</h3>
            <p className="text-muted" style={{ fontSize: 13, marginTop: 6, marginBottom: 20 }}>
              Your project's subscription is now active.
            </p>
            <Link to={projectId ? `/my-projects/${projectId}` : '/my-projects'} className="btn btn-primary">
              Back to your project
            </Link>
          </>
        )}
        {(status === 'failed' || status === 'error') && (
          <>
            <div className="empty-icon" style={{ background: '#fceae8', color: '#dc3b2e' }}>
              <Icon name="xCircle" size={28} />
            </div>
            <h3 style={{ marginTop: 16 }}>Payment not completed</h3>
            <p className="text-muted" style={{ fontSize: 13, marginTop: 6, marginBottom: 20 }}>
              We couldn't confirm this payment. If you were charged, it will still be reconciled
              automatically — check back shortly.
            </p>
            <Link to={projectId ? `/my-projects/${projectId}` : '/my-projects'} className="btn btn-secondary">
              Back to your project
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
