'use client';

import { useEffect, useRef } from 'react';

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => {
      if (preference.matches) video?.pause();
      else void video?.play().catch(() => { /* Keep the poster if autoplay is blocked. */ });
    };
    syncMotion();
    preference.addEventListener('change', syncMotion);
    return () => preference.removeEventListener('change', syncMotion);
  }, []);

  return (
    <video ref={videoRef} className="hero-image" width="1280" height="720"
      src="/brand/sheriff-hero.mp4" poster="/brand/sheriff-video-poster.jpg"
      muted loop playsInline controls={false} disablePictureInPicture
      preload="metadata" aria-hidden="true"/>
  );
}
