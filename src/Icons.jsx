import React from 'react'

const paths = {
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
  globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  medal: <><circle cx="12" cy="14" r="6"/><path d="m8.5 8-3-5h5l1.5 3 1.5-3h5l-3 5"/><path d="m12 11 1 2 2 .3-1.5 1.5.4 2.2-1.9-1-1.9 1 .4-2.2L9 13.3l2-.3z"/></>,
  trophy: <><path d="M8 21h8M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v2a4 4 0 0 0 4 4M17 6h3v2a4 4 0 0 1-4 4"/></>,
  record: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
  book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5z"/><path d="M4 6.5v13M8 8h8M8 12h6"/></>,
  chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
  play: <path d="m8 5 11 7-11 7z"/>,
  fast: <><path d="m3 5 9 7-9 7zM12 5l9 7-9 7z"/></>,
  chevron: <path d="m9 18 6-6-6-6"/>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  filter: <path d="M4 5h16l-6 7v5l-4 2v-7z"/>,
  sparkles: <><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2zM5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8zM19 14l.6 1.4L21 16l-1.4.6L19 18l-.6-1.4L17 16l1.4-.6z"/></>,
  running: <><circle cx="14" cy="4" r="2"/><path d="m8 21 3-7 3 2 2 5M6 12l4-4 4 2 4-1M12 8l-1 6"/></>,
  waves: <><path d="M2 7c2 2 4 2 6 0s4-2 6 0 4 2 8 0M2 12c2 2 4 2 6 0s4-2 6 0 4 2 8 0M2 17c2 2 4 2 6 0s4-2 6 0 4 2 8 0"/></>,
  bike: <><circle cx="6" cy="17" r="4"/><circle cx="18" cy="17" r="4"/><path d="m6 17 4-8h4l4 8M10 9l3 8H6M14 9l2-3M9 6h3"/></>,
  target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
  ball: <><circle cx="12" cy="12" r="9"/><path d="M5 6c4 2 5 8 3 12M19 6c-4 2-5 8-3 12"/></>,
  dumbbell: <><path d="M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12"/></>,
  shield: <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>,
  swords: <><path d="m14 4 6 6-4 4-6-6zM4 20l6-6M20 4l-6 6M4 4l16 16"/></>,
  flag: <><path d="M5 21V4M5 5h11l-2 4 2 4H5"/></>,
  arrowUp: <><path d="m12 19V5M6 11l6-6 6 6"/></>,
  arrowDown: <><path d="m12 5v14M18 13l-6 6-6-6"/></>,
  minus: <path d="M5 12h14"/>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></>,
  reset: <><path d="M4 4v6h6"/><path d="M20 11a8 8 0 1 0-2 5.3L20 14"/></>,
  save: <><path d="M4 4h14l2 2v14H4z"/><path d="M8 4v6h8V4M8 20v-6h8v6"/></>,
  podium: <><path d="M3 21v-7h6v7M9 21V8h6v13M15 21v-10h6v10"/><path d="M11 5h2M12 4v4"/></>,
  country: <><path d="M4 21V5l8-3 8 3v16M9 21v-5h6v5M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  star: <path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.9-5.4 2.9 1-6-4.3-4.2 6-.9z"/>,
  news: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h6M7 16h4M15 12h2v4h-2z"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z"/></>,
}

export function Icon({ name, size = 20, strokeWidth = 1.8, className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name] || paths.sparkles}
    </svg>
  )
}
