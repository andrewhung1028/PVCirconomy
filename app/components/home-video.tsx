'use client';
import { useRef, useState } from 'react';
export function HomeVideo() {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  async function toggle() {
    if (!video.current) return;
    if (playing) { video.current.pause(); return; }
    setFailed(false);
    try { await video.current.play(); } catch { setFailed(true); }
  }
  return <><video ref={video} id="home-process-video" muted loop playsInline preload="none" poster="/images/circulator-poster.jpg" aria-label="PV Circulator separating a retired solar panel" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => { setPlaying(false); setFailed(true); }}><source src="/videos/pv-circulator-operation.mp4" type="video/mp4" /></video><button type="button" className="pc-home-video-toggle" aria-controls="home-process-video" aria-pressed={playing} onClick={toggle}>{failed ? 'Retry process video' : playing ? 'Pause process video' : 'Play process video'}</button></>;
}
