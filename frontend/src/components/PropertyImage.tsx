import { useState } from 'react'

/** Property photo that falls back to a neutral placeholder if the URL is broken,
 *  so one bad link never leaves a broken-image icon in front of a buyer. */
export default function PropertyImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false)

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={`${alt} (photo unavailable)`}
        className={`flex items-center justify-center bg-reed/60 text-stone ${className}`}
      >
        <span className="text-sm">Photo unavailable</span>
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`bg-reed/40 object-cover ${className}`}
    />
  )
}
