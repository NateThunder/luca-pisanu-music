type PhotoPlaceholderProps = {
  slot: "hero" | "bass" | "guitar" | "hat" | "standing" | "live";
  label: string;
  className?: string;
  framed?: boolean;
};

export function PhotoPlaceholder({
  slot,
  label,
  className = "",
  framed = false,
}: PhotoPlaceholderProps) {
  return (
    <div
      className={`photo-placeholder photo-placeholder--${slot} ${
        framed ? "photo-placeholder--framed" : ""
      } ${className}`}
      role="img"
      aria-label={`${label}. Temporary image placeholder.`}
    >
      <span className="photo-placeholder__halo" />
      <span className="photo-placeholder__figure">
        <span className="photo-placeholder__head" />
        <span className="photo-placeholder__body" />
        <span className="photo-placeholder__instrument" />
      </span>
      <span className="photo-placeholder__grain" />
      <span className="photo-placeholder__label">{label}</span>
    </div>
  );
}

