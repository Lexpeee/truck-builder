"use client";
import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { HeroTheme } from "./scene-config";

// three.js and the scene are fetched only after hydration (see mount effect).
const ShowroomScene = dynamic(() => import("./ShowroomScene"), { ssr: false });

const MOBILE_QUERY = "(max-width: 767px)";
const subscribeMobile = (cb: () => void) => {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/** WebGL or model failure: render nothing and let the poster stay. */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function HeroStage({
  theme,
  model,
  label,
  children,
}: {
  theme: HeroTheme;
  model?: string;
  label: string;
  /** Server-rendered poster image. */
  children: ReactNode;
}) {
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(true);
  const [tabShown, setTabShown] = useState(true);
  const mobile = useSyncExternalStore(
    subscribeMobile,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );

  // Defer the 3D bundle until the page is interactive and the browser is idle.
  useEffect(() => {
    const start = () => setMounted(true);
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(start, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(start, 200);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!stage) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(stage);
    const onVis = () => setTabShown(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [stage]);

  const onReady = useCallback(() => setReady(true), []);

  return (
    <div
      ref={setStage}
      className="sh-stage"
      data-ready={ready || undefined}
      role="img"
      aria-label={label}
      tabIndex={0}
    >
      {children}
      {mounted && (
        <SceneBoundary>
          <ShowroomScene
            theme={theme}
            model={model}
            mobile={mobile}
            active={visible && tabShown}
            inputTarget={stage}
            onReady={onReady}
          />
        </SceneBoundary>
      )}
    </div>
  );
}
