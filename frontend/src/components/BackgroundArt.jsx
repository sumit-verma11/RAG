import './BackgroundArt.css';

export function BackgroundArt() {
  return (
    <svg className="bg-art" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <circle className="bg-art-ring" cx="120" cy="120" r="160" />
      <circle className="bg-art-ring bg-art-ring-alt" cx="1320" cy="160" r="230" />
      <circle className="bg-art-ring" cx="180" cy="800" r="150" />
      <circle className="bg-art-ring bg-art-ring-alt" cx="1260" cy="780" r="190" />
      <circle className="bg-art-ring" cx="720" cy="440" r="340" />
      <circle className="bg-art-dot" cx="120" cy="120" r="4" />
      <circle className="bg-art-dot" cx="1320" cy="160" r="4" />
      <circle className="bg-art-dot" cx="180" cy="800" r="4" />
      <circle className="bg-art-dot" cx="1260" cy="780" r="4" />
      <circle className="bg-art-dot" cx="720" cy="440" r="4" />
      <line className="bg-art-line" x1="120" y1="120" x2="720" y2="440" />
      <line className="bg-art-line" x1="1320" y1="160" x2="720" y2="440" />
      <line className="bg-art-line" x1="180" y1="800" x2="720" y2="440" />
      <line className="bg-art-line" x1="1260" y1="780" x2="720" y2="440" />
      <line className="bg-art-line" x1="120" y1="120" x2="1320" y2="160" />
      <line className="bg-art-line" x1="180" y1="800" x2="1260" y2="780" />
    </svg>
  );
}
