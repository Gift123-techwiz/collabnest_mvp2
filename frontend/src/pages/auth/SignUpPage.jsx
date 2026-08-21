import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { Field } from '../../components/ui/Form';
import { Spinner } from '../../components/ui/Feedback';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../api/client';

function calculateAge(dateStr) {
  if (!dateStr) return null;
  const dob = new Date(dateStr);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const hadBirthday =
    today.getMonth() > dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hadBirthday) age -= 1;
  return age;
}

export default function SignUpPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', dateOfBirth: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setFieldErrors((f) => ({ ...f, [name]: undefined }));
  }

  function validate() {
    const errs = {};
    if (!form.fullName || form.fullName.trim().length < 2) {
      errs.fullName = 'Full name is required (min 2 characters)';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'A valid email is required';
    }
    if (form.password.length < 8 || !/\d/.test(form.password)) {
      errs.password = 'Must be at least 8 characters and include a number';
    }
    if (!form.dateOfBirth) {
      errs.dateOfBirth = 'Date of birth is required';
    } else {
      const age = calculateAge(form.dateOfBirth);
      if (age === null || age < 16) {
        errs.dateOfBirth = 'You must be at least 16 years old to use CollabNest';
      }
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to create your account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout heading="Create your account" subheading="Join CollabNest and start building with the right people.">
      {error && <div className="auth-error-banner">{error}</div>}
      <form onSubmit={handleSubmit} noValidate>
        <Field label="Full name" htmlFor="fullName" error={fieldErrors.fullName}>
          <input
            id="fullName"
            name="fullName"
            className={`input ${fieldErrors.fullName ? 'has-error' : ''}`}
            placeholder="Jane Doe"
            value={form.fullName}
            onChange={handleChange}
            autoComplete="name"
          />
        </Field>
        <Field label="Email address" htmlFor="email" error={fieldErrors.email}>
          <input
            id="email"
            name="email"
            type="email"
            className={`input ${fieldErrors.email ? 'has-error' : ''}`}
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
          />
        </Field>
        <Field label="Password" htmlFor="password" hint="At least 8 characters, including a number" error={fieldErrors.password}>
          <input
            id="password"
            name="password"
            type="password"
            className={`input ${fieldErrors.password ? 'has-error' : ''}`}
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
          />
        </Field>
        <Field label="Date of birth" htmlFor="dateOfBirth" error={fieldErrors.dateOfBirth}>
          <input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            className={`input ${fieldErrors.dateOfBirth ? 'has-error' : ''}`}
            value={form.dateOfBirth}
            onChange={handleChange}
            max={new Date().toISOString().slice(0, 10)}
          />
        </Field>
        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? <Spinner /> : 'Create account'}
        </button>
      </form>
      <p className="auth-form-footer">
        Already have an account? <Link to="/signin">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
