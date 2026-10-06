import React, { useEffect, useRef } from 'react';
import videoUrl from '@/assets/flo-welcome-loop.mp4';
import posterUrl from '@/assets/flo-welcome-poster.jpg';
import harshPhoto from '@/assets/harsh.jpg';
import dhruvPhoto from '@/assets/dhruv.jpg';

// The existing scroll position drives the dissolve; navigation remains native.
export function WelcomeBackdrop({ viewport }) {
    const backdrop = useRef(null);
    const video = useRef(null);
    useEffect(() => {
        const container = viewport.current;
        const media = video.current;
        const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
        let playing = false;
        const update = () => {
            const end = container.children[1]?.offsetTop || container.clientHeight || 1;
            const progress = Math.max(0, Math.min(1, container.scrollTop / end));
            backdrop.current.style.opacity = String(1 - progress);
            const shouldPlay = progress < 1 && !preference.matches && !document.hidden;
            if (shouldPlay === playing) return;
            playing = shouldPlay;
            if (shouldPlay) media.play()?.catch(() => { playing = false; });
            else media.pause();
        };
        update();
        container.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        document.addEventListener('visibilitychange', update);
        preference.addEventListener?.('change', update);
        return () => {
            container.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
            document.removeEventListener('visibilitychange', update);
            preference.removeEventListener?.('change', update);
            media.pause();
        };
    }, [viewport]);
    return <div ref={backdrop} className="welcome-backdrop" aria-hidden="true" style={{ backgroundImage: `url(${posterUrl})` }}>
        <video ref={video} src={videoUrl} poster={posterUrl} muted loop playsInline preload="metadata" />
    </div>;
}

export default function WelcomePage() {
    return <div className="welcome-layout">
        <div className="welcome-copy">
            <h1>Your SDLC, Now Agentic - with Spring AI</h1>
            <p className="welcome-subtitle">Build, Review &amp; Ship with AI Agents</p>
            <div className="welcome-event"><p>10 Oct, 2026 <span> / </span> 3pm – 3:45pm</p><p>Bubble Coral Stage · Level 8 · North</p><span>Hands-on workshop</span></div>
            <p className="welcome-waiting"><span />Welcome. We’ll begin shortly.</p>
        </div>
        <div className="welcome-speakers" aria-label="Workshop presenters">
            <figure><div className="welcome-portrait"><img src={harshPhoto} alt="Harsh Vishwakarma" /></div><figcaption>Harsh Vishwakarma<span>Sr. Staff Engineer</span></figcaption></figure>
            <figure><div className="welcome-portrait"><img src={dhruvPhoto} alt="Dhruv Gupta" /></div><figcaption>Dhruv Gupta<span>Principal Engineer</span></figcaption></figure>
        </div>
    </div>;
}
