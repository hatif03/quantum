import { Masthead } from "../components/layout/Masthead";
import { Journey } from "../components/journey/Journey";
import type { ChapterId } from "../journey/chapters";

interface JourneyPageProps {
  initialChapter?: ChapterId;
}

export function JourneyPage({ initialChapter }: JourneyPageProps) {
  return (
    <>
      <Masthead />
      <Journey initialChapter={initialChapter} />
    </>
  );
}
