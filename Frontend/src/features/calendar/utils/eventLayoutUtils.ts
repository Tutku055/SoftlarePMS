import type { CalendarEventDto } from '../types/calendar.types';

export type PositionedCalendarEvent = CalendarEventDto & {
  lane: number;
  laneCount: number;
  startMin: number;
  endMin: number;
};

export type EventGroup = {
  id: string;
  events: PositionedCalendarEvent[];
  lane: number;
  laneCount: number;
};

const MIN_EVENT_DURATION_MINUTES = 45;

/**
 * Layouts day events for the time grid.
 * 
 * Overlapping events are clustered together, then split by visibility type
 * (normal vs confidential). Each type occupies its own lane (side-by-side).
 * Within each type-lane, all events are stacked into a single EventGroup
 * so EventStack can render one card with "+N more".
 * 
 * The last event in each type group is placed first (shown as the visible card).
 */
export const layoutDayEvents = (
  events: CalendarEventDto[],
  _maxLanes: number = 3
): EventGroup[] => {
  const normalized = events
    .map((evt) => {
      const start = new Date(evt.startTime);
      const end = new Date(evt.endTime);
      const startMin = start.getHours() * 60 + start.getMinutes();
      let endMin = end.getHours() * 60 + end.getMinutes();

      if (endMin <= startMin) {
        endMin = startMin + MIN_EVENT_DURATION_MINUTES;
      }

      return {
        ...evt,
        startMin,
        endMin,
        lane: 0,
        laneCount: 1,
      };
    })
    .sort(
      (a, b) =>
        a.startMin - b.startMin ||
        a.endMin - b.endMin ||
        a.id.localeCompare(b.id)
    );

  const grouped: EventGroup[] = [];
  let cluster: typeof normalized = [];
  let clusterEnd = -1;

  const flushCluster = () => {
    if (!cluster.length) return;

    // Split cluster by visibility type: normal vs confidential
    const normalEvents = cluster.filter(e => e.visibilityLevel !== 2);
    const confEvents = cluster.filter(e => e.visibilityLevel === 2);

    const typeGroups = [normalEvents, confEvents].filter(g => g.length > 0);
    const laneCount = typeGroups.length;

    typeGroups.forEach((typeGroup, laneIdx) => {
      // Reverse so the last added event (end of array) becomes events[0]
      // EventStack renders events[0] as the visible card
      const reversed = [...typeGroup].reverse();

      const groupEvents = reversed.map(evt => ({
        ...evt,
        lane: laneIdx,
        laneCount,
      }));

      grouped.push({
        id: `type-${laneIdx}-${groupEvents[0].id}`,
        events: groupEvents,
        lane: laneIdx,
        laneCount,
      });
    });

    cluster = [];
    clusterEnd = -1;
  };

  normalized.forEach((evt) => {
    if (cluster.length && evt.startMin >= clusterEnd) {
      flushCluster();
    }

    cluster.push(evt);
    clusterEnd = clusterEnd < 0 ? evt.endMin : Math.max(clusterEnd, evt.endMin);
  });

  flushCluster();

  return grouped;
};
