/** Slowly drifting neon glows behind every page. */
export default function Background() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden bg-ink"
    >
      <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-neon-pink/30 blur-3xl animate-blob will-change-transform" />
      <div
        className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-neon-violet/30 blur-3xl animate-blob will-change-transform"
        style={{ animationDelay: "-7s" }}
      />
      <div
        className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-neon-cyan/20 blur-3xl animate-blob will-change-transform"
        style={{ animationDelay: "-14s" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(12,7,23,0.7)_100%)]" />
    </div>
  );
}
