export const PENCIL_FILTER_ID = "sketch-pencil";
export const CHALK_FILTER_ID = "sketch-chalk";
export const ROUGH_FILTER_ID = "sketch-rough";

export function SketchDefs() {
  return (
    <defs>
      <filter id={PENCIL_FILTER_ID} x="-8%" y="-8%" width="116%" height="116%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.045"
          numOctaves={4}
          seed={2}
          result="noise"
        />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale={3.8} />
      </filter>
      <filter id={CHALK_FILTER_ID} x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.08"
          numOctaves={2}
          seed={5}
          result="chalkNoise"
        />
        <feDisplacementMap in="SourceGraphic" in2="chalkNoise" scale={2.2} />
      </filter>
      <filter id={ROUGH_FILTER_ID} x="-4%" y="-4%" width="108%" height="108%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="0.35" result="blur" />
        <feTurbulence baseFrequency="0.06" numOctaves={3} result="roughen" />
        <feDisplacementMap in="blur" in2="roughen" scale={1.8} />
      </filter>
    </defs>
  );
}
