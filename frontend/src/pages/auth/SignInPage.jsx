import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { Field } from '../../components/ui/Form';
import { Spinner } from '../../components/ui/Feedback';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../api/client';

export default function SignInPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '', rememberMe: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      const from = location.state?.from || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout heading="Welcome back" subheading="Sign in to keep building with your team.">
      {error && <div className="auth-error-banner">{error}</div>}
      <form onSubmit={handleSubmit} noValidate>
        <Field label="Email address" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            className="input"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />
        </Field>
        <Field label="Password" htmlFor="password">
          <input
            id="password"
            name="password"
            type="password"
            className="input"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
          />
        </Field>
        <label className="checkbox-row" style={{ marginBottom: 24 }}>
          <input type="checkbox" name="rememberMe" checked={form.rememberMe} onChange={handleChange} />
          Keep me signed in for 30 days
        </label>
        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
          {loading ? <Spinner /> : 'Sign in'}
        </button>
      </form>
      <p className="auth-form-footer">
        New to CollabNest? <Link to="/signup">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
