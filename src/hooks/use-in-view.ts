import { useEffect, useRef, useState } from "react";

export type UseInViewOptions = {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number;
  once?: boolean; // when false, toggles inView on enter/leave
};

export default function useInView(options?: UseInViewOptions) {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (options?.once !== false) observer.unobserve(entry.target);
        } else {
          if (options?.once === false) setInView(false);
        }
      },
      {
        root: options?.root ?? null,
        rootMargin: options?.rootMargin ?? "0px",
        threshold: options?.threshold ?? 0.15,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options?.root, options?.rootMargin, options?.threshold, options?.once]);

  return { ref, inView } as const;
}
