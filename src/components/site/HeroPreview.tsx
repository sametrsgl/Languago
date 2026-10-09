// Homepage hero: a living preview of the student "Bugün" screen. The card
// tilts toward the pointer or finger and the badges float at different
// depths; the plan ticks itself off and skill rings fill. Everything holds
// still for people who prefer reduced motion.
import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';

const PLAN = [
  { label: 'Kelime tekrarı', meta: '12 kart · 4 dk' },
  { label: 'Video ders: At the airport', meta: 'Dinleme · 6 dk' },
  { label: 'Konuşma: kendini tanıt', meta: 'Kayıt · 3 dk' },
];
const SKILLS = [
  { label: 'Dinleme', value: 0.72 },
  { label: 'Okuma', value: 0.58 },
  { label: 'Yazma', value: 0.41 },
  { label: 'Konuşma', value: 0.33 },
];
const C = 2 * Math.PI * 22;
const SPRING = { stiffness: 120, damping: 18, mass: 0.6 };

function Ring({ value, label, delay, still }: { value: number; label: string; delay: number; still: boolean }) {
  return (
    <div className="hp-ring">
      <svg viewBox="0 0 52 52" aria-hidden="true">
        <circle cx="26" cy="26" r="22" className="hp-ring-track" />
        <motion.circle
          cx="26" cy="26" r="22" className="hp-ring-val"
          strokeDasharray={C}
          initial={{ strokeDashoffset: still ? C * (1 - value) : C }}
          animate={{ strokeDashoffset: C * (1 - value) }}
          transition={{ duration: 1.4, delay, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span>{label}</span>
    </div>
  );
}

export default function HeroPreview() {
  const still = !!useReducedMotion();
  const [done, setDone] = useState(still ? 1 : 0);
  const box = useRef<HTMLDivElement>(null);
  // Pointer position relative to the preview centre, -1..1 on each axis.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, SPRING);
  const sy = useSpring(py, SPRING);
  const rotateY = useTransform(sx, [-1, 1], [-10, 10]);
  const rotateX = useTransform(sy, [-1, 1], [8, -8]);
  const depth = (k: number) => ({ x: useTransform(sx, [-1, 1], [-k, k]), y: useTransform(sy, [-1, 1], [-k, k]) });
  const chipA = depth(22);
  const chipB = depth(-18);
  const chipC = depth(14);

  useEffect(() => {
    if (still) return;
    const t = setInterval(() => setDone((d) => (d + 1) % (PLAN.length + 1)), 1800);
    return () => clearInterval(t);
  }, [still]);

  useEffect(() => {
    if (still) return;
    const move = (x: number, y: number) => {
      const el = box.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      px.set(Math.max(-1, Math.min(1, (x - (r.left + r.width / 2)) / (r.width / 1.2))));
      py.set(Math.max(-1, Math.min(1, (y - (r.top + r.height / 2)) / (r.height / 1.2))));
    };
    const onPointer = (e: PointerEvent) => move(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => { const t = e.touches[0]; if (t) move(t.clientX, t.clientY); };
    const reset = () => { px.set(0); py.set(0); };
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('touchend', reset, { passive: true });
    document.documentElement.addEventListener('pointerleave', reset);
    return () => {
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('touchend', reset);
      document.documentElement.removeEventListener('pointerleave', reset);
    };
  }, [still, px, py]);

  const float = (y: number, d: number) => (still ? {} : { animate: { y: [0, y, 0] }, transition: { duration: d, repeat: Infinity, ease: 'easeInOut' as const } });

  return (
    <div className="hp" ref={box} aria-label="Öğrenci ekranı önizlemesi" role="img">
      <motion.div className="hp-tilt" style={still ? undefined : { rotateX, rotateY }}>
        <motion.div className="hp-card" initial={still ? false : { opacity: 0, y: 30, rotate: -2 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: .8, ease: [0.16, 1, 0.3, 1] }}>
          <div className="hp-top">
            <img src="/brand/logo-mark.svg" alt="" width="34" height="34" />
            <div><b>Günaydın, Elif</b><small>Salı · 7 günlük seri</small></div>
          </div>
          <div className="hp-lesson">
            <div><small>Bugün 19:00 · Birebir ders</small><b>Past simple ile hikâye anlatmak</b></div>
            <motion.span className="hp-join" {...(still ? {} : { animate: { boxShadow: ['0 0 0 0 rgba(245,158,11,.55)', '0 0 0 12px rgba(245,158,11,0)'] }, transition: { duration: 1.6, repeat: Infinity } })}>Derse katıl</motion.span>
          </div>
          <div className="hp-plan">
            <small>Bugünün planı · 13 dk</small>
            {PLAN.map((p, i) => (
              <div className={`hp-task${i < done ? ' is-done' : ''}`} key={p.label}>
                <motion.span className="hp-check" animate={{ scale: i < done ? [1, 1.25, 1] : 1 }} transition={{ duration: .35 }}>{i < done ? '✓' : ''}</motion.span>
                <span><b>{p.label}</b><small>{p.meta}</small></span>
              </div>
            ))}
          </div>
          <div className="hp-rings">
            {SKILLS.map((s, i) => <Ring key={s.label} {...s} delay={0.4 + i * 0.15} still={still} />)}
          </div>
        </motion.div>
      </motion.div>
      <motion.div className="hp-chip hp-chip-a" style={still ? undefined : chipA}><motion.span {...float(-10, 4)}>+12 kelime</motion.span></motion.div>
      <motion.div className="hp-chip hp-chip-b" style={still ? undefined : chipB}><motion.span {...float(8, 5)}>A2 → B1 yolunda</motion.span></motion.div>
      <motion.div className="hp-chip hp-chip-c" style={still ? undefined : chipC}><motion.span {...float(-7, 4.5)}>Kendi seçtiğiniz saatlere uygun canlı dersler</motion.span></motion.div>
    </div>
  );
}
