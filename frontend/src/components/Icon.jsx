const paths = {
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" /></>,
  cloud: <><path d="M17.5 19H8a5 5 0 1 1 1.6-9.74A6 6 0 0 1 21 12.5 3.5 3.5 0 0 1 17.5 19Z" /></>,
  'cloud-sun': <><circle cx="16" cy="7" r="3" /><path d="M16 2v2M21 7h-2M19.54 3.46l-1.42 1.42M5 19h8a4 4 0 0 0 .5-7.97A5 5 0 0 0 4.1 12.4 3.3 3.3 0 0 0 5 19Z" /></>,
  rain: <><path d="M7 17.5 6 20M12 17.5 11 20M17 17.5 16 20M17.5 16H8a5 5 0 1 1 1.6-9.74A6 6 0 0 1 21 9.5 3.5 3.5 0 0 1 17.5 16Z" /></>,
  pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  activity: <><path d="M4 14h4l2-6 4 11 2-7h4" /></>,
  chevron: <path d="m6 9 6 6 6-6" />,
  sparkle: <><path d="m12 3-1.2 4.4L7 9l3.8 1.6L12 15l1.2-4.4L17 9l-3.8-1.6L12 3ZM19 14l-.7 2.3L16 17l2.3.7L19 20l.7-2.3L22 17l-2.3-.7L19 14Z" /></>,
  alert: <><path d="M12 3 2.7 19h18.6L12 3Z" /><path d="M12 9v4M12 16h.01" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  send: <><path d="m22 2-7 20-4-9-9-4 20-7Z" /><path d="M22 2 11 13" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  drop: <path d="M12 3s-5 5.4-5 9a5 5 0 0 0 10 0c0-3.6-5-9-5-9Z" />,
  wind: <><path d="M3 8h10a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7" /></>,
  uv: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" /></>,
  run: <><circle cx="14.5" cy="4.5" r="2" /><path d="m13 7-2 4 3 2 2-3M9 11l-3 2 3 4M14 13l3 4M10 19l-3 2M18 20l-2-3" /></>,
  bike: <><circle cx="6.5" cy="17" r="3" /><circle cx="17.5" cy="17" r="3" /><path d="M6.5 17 10 9h4l3.5 8M10 9l-2-3h3M14 9l2-2h2" /></>,
  event: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16M8 14h3M13 14h3M8 17h2" /></>,
  fitness: <path d="m6 8 1.5 8M4 10l3-1M20 10l-3-1M18 8l-1.5 8M9 12h6" />,
  leaf: <><path d="M20 4C12 4 5 8 5 15c0 3 2 5 5 5 7 0 11-7 11-15Z" /><path d="M4 20c4-5 8-8 14-12" /></>,
  plane: <path d="m3 11 18-8-7 18-3-7-5-3 5-1-8 1Z" />,
  users: <><circle cx="9" cy="9" r="3" /><path d="M3 20a6 6 0 0 1 12 0M15 8a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5" /></>,
  car: <><path d="m5 16 1.5-6h11L19 16H5Z" /><path d="M7 10 8.5 7h7L17 10M3 16h18M7 19h.01M17 19h.01" /></>,
  calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  chat: <path d="M4 5h16v11H8l-4 4V5Z" />,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.5 1.5-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.4h-2.1v-.4a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.5-1.5.1-.1A1.7 1.7 0 0 0 9 15a1.7 1.7 0 0 0-1.5-1H7v-2h.5A1.7 1.7 0 0 0 9 11a1.7 1.7 0 0 0-.3-1.9l-.1-.1L10.1 7l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V5.5h2.1v.4a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.5 1.5-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.4v2H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
}

export default function Icon({ name, size = 20, strokeWidth = 1.8, className = '' }) {
  return <svg className={`icon ${className}`} viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.sparkle}</svg>
}
