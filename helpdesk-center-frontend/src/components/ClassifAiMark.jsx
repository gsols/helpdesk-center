export default function ClassifAiMark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="8,6 40,6 36,14 4,14"  fill="#0f172a" opacity="0.40" />
      <polygon points="4,16 36,16 32,24 0,24" fill="#0f172a" opacity="0.65" />
      <polygon points="8,26 40,26 36,34 4,34" fill="#0f172a" opacity="1.00" />
      <polygon points="0,24 8,6 8,14 4,14"   fill="#0f172a" opacity="0.30" />
      <polygon points="4,34 12,16 8,16 0,34"  fill="#0f172a" opacity="0.50" />
    </svg>
  );
}