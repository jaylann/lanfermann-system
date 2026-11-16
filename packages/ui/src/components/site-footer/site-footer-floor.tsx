"use client";

import { useEffect, useRef } from "react";

/**
 * Says on <html> whether the reader has come down to the floor of the page: the end of the
 * footer is less than half a window below the window, and the page has been scrolled. Then
 * `data-site-floor` is on <html>, and base.css paints the root in the footer's colour.
 *
 * Safari 26 fills what lies beyond the page from the root's colour: the strip above the page at
 * the top (behind the status bar) and the strip under it at the end (behind the toolbar). One
 * colour cannot match both ends, the ground above and the footer below, so the root takes the
 * colour of the end the reader is at. A page short enough to show both ends at once keeps the
 * ground until it is scrolled, because the status bar shows the top.
 */
export function SiteFooterFloor() {
  const mark = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const end = mark.current;
    if (!end) return;
    const html = document.documentElement;
    let frame = 0;
    const update = () => {
      frame = 0;
      const below = end.getBoundingClientRect().top - window.innerHeight;
      if (below < window.innerHeight / 2 && window.scrollY > 0) html.dataset.siteFloor = "";
      else delete html.dataset.siteFloor;
    };
    const schedule = () => {
      frame ||= requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      delete html.dataset.siteFloor;
    };
  }, []);

  return <span ref={mark} aria-hidden data-slot="site-footer-floor" className="block h-0" />;
}
