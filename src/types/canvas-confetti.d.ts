declare module "canvas-confetti" {
  export type Options = {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
    shapes?: Array<"square" | "circle" | "star">;
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
  };

  export type ConfettiFunction = (options?: Options) => Promise<null> | null;

  const confetti: ConfettiFunction & {
    reset: () => void;
  };

  export default confetti;
}
