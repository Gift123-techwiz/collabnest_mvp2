import Logo from '../../components/ui/Logo';
import './AuthLayout.scss';

export default function AuthLayout({ children, heading, subheading }) {
  return (
    <div className="auth-layout">
      <div className="auth-panel-brand">
        <Logo to={null} size={30} dark showWordmark />
        <div className="auth-panel-brand-content">
          <h1>Where ideas find their team.</h1>
          <p>
            Discover projects that match your skills, build a team you can trust, and turn ambitious
            ideas into something real — together.
          </p>
        </div>
        <ul className="auth-panel-points">
          <li>Skill-matched project discovery</li>
          <li>Structured team formation &amp; task tracking</li>
          <li>A portfolio built from real, completed work</li>
        </ul>
      </div>
      <div className="auth-panel-form">
        <div className="auth-form-wrap">
          <div className="auth-mobile-logo">
            <Logo to={null} size={26} />
          </div>
          <h2>{heading}</h2>
          {subheading && <p className="auth-subheading">{subheading}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
