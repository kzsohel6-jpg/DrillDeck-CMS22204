export default function StatCard({ label, value, hint, icon: Icon, tone = "blue" }) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <div className="stat-top">
        <span>{label}</span>
        {Icon && <span className="stat-icon"><Icon size={19} /></span>}
      </div>
      <strong>{value}</strong>
      {hint && <small>{hint}</small>}
    </article>
  );
}
