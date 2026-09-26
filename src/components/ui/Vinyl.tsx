type Props = {
  spinning: boolean;
  image?: string;
  className?: string;
};

/** A record that spins while music plays. The label shows the cover art once known. */
export default function Vinyl({ spinning, image, className = "" }: Props) {
  return (
    <div className={`relative rounded-full ${className}`}>
      <div
        className="absolute inset-0 rounded-full vinyl-grooves shadow-[0_24px_60px_-12px_rgba(0,0,0,0.8)] ring-1 ring-white/5 animate-spin-slow"
        style={{ animationPlayState: spinning ? "running" : "paused" }}
      >
        <div className="absolute inset-[31%] overflow-hidden rounded-full bg-[conic-gradient(from_0deg,#ff4fa3,#8b5cf6,#3ee6ff,#ffc94d,#ff4fa3)]">
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt=""
              className="h-full w-full object-cover animate-fade-in"
            />
          )}
        </div>
        <div className="absolute left-1/2 top-1/2 h-[5%] w-[5%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink ring-2 ring-white/20" />
      </div>
      <div className="absolute inset-0 rounded-full vinyl-sheen" />
    </div>
  );
}
