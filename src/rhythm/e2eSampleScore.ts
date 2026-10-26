interface E2ESampleEvent {
  pitch?: string;
  duration: number;
  staff: 1 | 2;
  type: string;
  dots?: number;
}

function e2eSampleEventsXml(events: readonly E2ESampleEvent[]): string {
  return events.map((event) => `<note>${event.pitch
    ? `<pitch><step>${event.pitch}</step><octave>${event.staff === 1 ? 4 : 3}</octave></pitch>`
    : '<rest/>'}<duration>${event.duration}</duration><type>${event.type}</type>${'<dot/>'.repeat(event.dots ?? 0)}<voice>1</voice><staff>${event.staff}</staff></note>`).join('');
}

export const E2E_SAMPLE_MUSICXML = `<score-partwise>
  <work><work-title>E2E Mixed Rhythm</work-title></work>
  <part-list><score-part id="P"><part-name>Piano</part-name></score-part></part-list>
  <part id="P">
    <measure number="1">
      <attributes><divisions>24</divisions><staves>2</staves><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
      <direction><sound tempo="60"/></direction>
      ${e2eSampleEventsXml([
        { pitch: 'D', duration: 18, staff: 1, type: 'eighth', dots: 1 },
        { pitch: 'E', duration: 6, staff: 1, type: '16th' },
        { pitch: 'F', duration: 12, staff: 1, type: 'eighth' },
        { pitch: 'G', duration: 12, staff: 1, type: 'eighth' },
        { pitch: 'A', duration: 12, staff: 1, type: 'eighth' },
        { pitch: 'B', duration: 6, staff: 1, type: '16th' },
        { pitch: 'C', duration: 6, staff: 1, type: '16th' },
        { pitch: 'D', duration: 24, staff: 1, type: 'quarter' },
      ])}
      <backup><duration>96</duration></backup>
      ${e2eSampleEventsXml([
        { pitch: 'C', duration: 6, staff: 2, type: '16th' },
        { pitch: 'D', duration: 6, staff: 2, type: '16th' },
        { pitch: 'E', duration: 6, staff: 2, type: '16th' },
        { pitch: 'F', duration: 6, staff: 2, type: '16th' },
        { pitch: 'G', duration: 12, staff: 2, type: 'eighth' },
        { pitch: 'A', duration: 6, staff: 2, type: '16th' },
        { pitch: 'B', duration: 6, staff: 2, type: '16th' },
        { duration: 12, staff: 2, type: 'eighth' },
        { pitch: 'C', duration: 12, staff: 2, type: 'eighth' },
        { pitch: 'D', duration: 18, staff: 2, type: 'eighth', dots: 1 },
        { pitch: 'E', duration: 6, staff: 2, type: '16th' },
      ])}
    </measure>
    <measure number="2">
      ${e2eSampleEventsXml([
        { pitch: 'C', duration: 12, staff: 1, type: 'eighth' },
        { pitch: 'D', duration: 6, staff: 1, type: '16th' },
        { pitch: 'E', duration: 6, staff: 1, type: '16th' },
        { pitch: 'F', duration: 12, staff: 1, type: 'eighth' },
        { pitch: 'G', duration: 12, staff: 1, type: 'eighth' },
        { pitch: 'A', duration: 18, staff: 1, type: 'eighth', dots: 1 },
        { pitch: 'B', duration: 6, staff: 1, type: '16th' },
        ...Array.from({ length: 8 }, (_, index) => ({
          pitch: ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'][index],
          duration: 3,
          staff: 1 as const,
          type: '32nd',
        })),
      ])}
      <backup><duration>96</duration></backup>
      ${e2eSampleEventsXml([
        { pitch: 'C', duration: 6, staff: 2, type: '16th' },
        { pitch: 'D', duration: 6, staff: 2, type: '16th' },
        { pitch: 'E', duration: 6, staff: 2, type: '16th' },
        { pitch: 'F', duration: 6, staff: 2, type: '16th' },
        { pitch: 'G', duration: 24, staff: 2, type: 'quarter' },
        { pitch: 'A', duration: 12, staff: 2, type: 'eighth' },
        { pitch: 'B', duration: 6, staff: 2, type: '16th' },
        { pitch: 'C', duration: 6, staff: 2, type: '16th' },
        { pitch: 'D', duration: 12, staff: 2, type: 'eighth' },
        { pitch: 'E', duration: 12, staff: 2, type: 'eighth' },
      ])}
    </measure>
    <measure number="3">
      ${e2eSampleEventsXml([
        ...Array.from({ length: 4 }, () => [
          { pitch: 'D', duration: 18, staff: 1 as const, type: 'eighth', dots: 1 },
          { pitch: 'E', duration: 6, staff: 1 as const, type: '16th' },
        ]).flat(),
      ])}
      <backup><duration>96</duration></backup>
      ${e2eSampleEventsXml([
        { duration: 24, staff: 2, type: 'quarter' },
        { pitch: 'F', duration: 12, staff: 2, type: 'eighth' },
        { duration: 12, staff: 2, type: 'eighth' },
        { pitch: 'G', duration: 24, staff: 2, type: 'quarter' },
        { pitch: 'A', duration: 18, staff: 2, type: 'eighth', dots: 1 },
        { pitch: 'B', duration: 6, staff: 2, type: '16th' },
      ])}
    </measure>
    <measure number="4">
      ${e2eSampleEventsXml([
        { pitch: 'C', duration: 24, staff: 1, type: 'quarter' },
        ...Array.from({ length: 4 }, (_, index) => ({
          pitch: ['D', 'E', 'F', 'G'][index],
          duration: 6,
          staff: 1 as const,
          type: '16th',
        })),
        ...Array.from({ length: 8 }, (_, index) => ({
          pitch: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'A'][index],
          duration: 3,
          staff: 1 as const,
          type: '32nd',
        })),
        { pitch: 'B', duration: 18, staff: 1, type: 'eighth', dots: 1 },
        { pitch: 'C', duration: 6, staff: 1, type: '16th' },
      ])}
      <backup><duration>96</duration></backup>
      ${e2eSampleEventsXml([
        { pitch: 'C', duration: 24, staff: 2, type: 'quarter' },
        ...Array.from({ length: 4 }, (_, index) => ({
          pitch: ['D', 'E', 'F', 'G'][index],
          duration: 12,
          staff: 2 as const,
          type: 'eighth',
        })),
        ...Array.from({ length: 4 }, (_, index) => ({
          pitch: ['A', 'B', 'C', 'D'][index],
          duration: 6,
          staff: 2 as const,
          type: '16th',
        })),
      ])}
    </measure>
  </part>
</score-partwise>`;
