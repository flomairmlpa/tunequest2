type Props = {
  className?: string;
};

export default function Logo({ className = "text-2xl" }: Props) {
  return (
    <span
      className={`font-display font-extrabold tracking-tight ${className}`}
    >
      <span className="text-gradient">Tune</span>Quest
    </span>
  );
}
