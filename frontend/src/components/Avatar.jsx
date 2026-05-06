export default function Avatar({ initials, size = 36, color = '#824c2b' }) {
  return (
    <div
      className="rounded-full grid place-items-center text-white font-semibold flex-shrink-0"
      style={{ width: size, height: size, background: color, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  )
}
