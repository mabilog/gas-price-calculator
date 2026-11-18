// `tabs` is a list of { id, label }. Used for the mode switch and the tab bars.
export function Tabs({ tabs, value, onChange, label, variant = "tabs" }) {
  return (
    <div class={variant} role="tablist" aria-label={label}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
