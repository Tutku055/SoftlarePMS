import React, { useEffect, useRef } from "react";
import { Box, Typography, Card } from "@mui/material";
import {
  Lock,
  Event as EventIcon,
  Celebration,
  Cake,
  StickyNote2,
} from "@mui/icons-material";
import type {
  CalendarDayDto,
  CalendarFilters,
  CalendarEventDto,
  CalendarNoteDto,
  VirtualCalendarEventDto,
} from "../../types/calendar.types";
import { CalendarEventType } from "../../types/calendar.types";
import {
  formatDateToIso,
  formatTimeDisplay,
} from "../../utils/calendarDateUtils";
import styles from "../Calendar.module.css";

import { layoutDayEvents } from "../../utils/eventLayoutUtils";
import { EventStack } from "./EventStack";

interface DayViewProps {
  currentDate: Date;
  calendarData: CalendarDayDto[];
  filters: CalendarFilters;
  onSelectEvent: (event: CalendarEventDto) => void;
  onSelectNote: (note: CalendarNoteDto) => void;
  onSelectVirtualEvent: (vEvent: VirtualCalendarEventDto) => void;
  onTimeSlotClick: (date: string, hour: number) => void;
}

const SLOT_HEIGHT = 48; // Compact 48px slot height

export const DayView: React.FC<DayViewProps> = ({
  currentDate,
  calendarData,
  filters,
  onSelectEvent,
  onSelectNote,
  onSelectVirtualEvent,
  onTimeSlotClick,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 8 * SLOT_HEIGHT - 16;
    }
  }, []);

  const isoDate = formatDateToIso(currentDate);
  const dayData = calendarData.find((d) => d.date === isoDate);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const today = new Date();
  const isToday = isoDate === formatDateToIso(today);
  const currentMinutesFromMidnight = today.getHours() * 60 + today.getMinutes();
  const dayEvents = filters.showPhysicalEvents
    ? layoutDayEvents((dayData?.physicalEvents || []).filter(e => {
        const isExplicitSolid = e.eventType === CalendarEventType.AllDay || e.eventType === CalendarEventType.MultiDay;
        const isLegacyMultiDay = !e.eventType && e.startTime.split('T')[0] !== e.endTime.split('T')[0];
        return !isExplicitSolid && !isLegacyMultiDay;
      }), 3)
    : [];

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Day Title & All-day highlights */}
      <Box
        sx={{
          p: 1.5,
          borderBottom: "1px solid rgba(140, 140, 160, 0.15)",
          bgcolor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.02)"
              : "rgba(140, 140, 160, 0.02)",
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {currentDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </Typography>

        {/* All day items */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 0.5 }}>
          {filters.showHolidays &&
            dayData?.virtualEvents
              ?.filter((v) => v.type === 1)
              .map((h) => (
                <Box
                  key={h.id}
                  className={styles.eventChip}
                  style={{
                    backgroundColor: "#10B98122",
                    borderLeftColor: "#10B981",
                    color: "#10B981",
                    padding: "3px 8px",
                  }}
                  onClick={() => onSelectVirtualEvent(h)}
                >
                  <Celebration sx={{ fontSize: 13 }} />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {h.title}
                  </Typography>
                </Box>
              ))}

          {filters.showBirthdays &&
            dayData?.virtualEvents
              ?.filter((v) => v.type === 2)
              .map((b) => (
                <Box
                  key={b.id}
                  className={styles.eventChip}
                  style={{
                    backgroundColor: "#EC489922",
                    borderLeftColor: "#EC4899",
                    color: "#EC4899",
                    padding: "3px 8px",
                  }}
                  onClick={() => onSelectVirtualEvent(b)}
                >
                  <Cake sx={{ fontSize: 13 }} />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {b.title}
                  </Typography>
                </Box>
              ))}

          {filters.showNotes &&
            dayData?.notes?.map((n) => (
              <Box
                key={n.id}
                className={styles.eventChip}
                style={{
                  backgroundColor: `${n.colorCode}22`,
                  borderLeftColor: n.colorCode,
                  color: n.colorCode,
                  padding: "3px 8px",
                }}
                onClick={() => onSelectNote(n)}
              >
                {n.visibilityLevel === 2 ? (
                  <Lock sx={{ fontSize: 13 }} />
                ) : (
                  <StickyNote2 sx={{ fontSize: 13 }} />
                )}
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {n.content}
                </Typography>
              </Box>
            ))}
            
          {/* All-Day & Multi-Day Physical Events */}
          {filters.showPhysicalEvents &&
            dayData?.physicalEvents
              ?.filter(e => {
                const isExplicitSolid = e.eventType === CalendarEventType.AllDay || e.eventType === CalendarEventType.MultiDay;
                const isLegacyMultiDay = !e.eventType && e.startTime.split('T')[0] !== e.endTime.split('T')[0];
                return isExplicitSolid || isLegacyMultiDay;
              })
              .map((e) => {
                const isConf = e.visibilityLevel === 2;
                const isMulti = e.eventType === CalendarEventType.MultiDay || (!e.eventType && e.startTime.split('T')[0] !== e.endTime.split('T')[0]);
                return (
                  <Box
                    key={e.id}
                    className={styles.eventChip}
                    style={{
                      backgroundColor: isConf ? "#8B5CF6" : "#3B82F6",
                      color: "#fff",
                      padding: "3px 8px",
                      border: "none",
                    }}
                    onClick={() => onSelectEvent(e)}
                  >
                    {isConf ? (
                      <Lock sx={{ fontSize: 13 }} />
                    ) : (
                      <EventIcon sx={{ fontSize: 13 }} />
                    )}
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {e.title}
                      {isMulti && " (Multi-Day)"}
                    </Typography>
                  </Box>
                );
              })}
        </Box>
      </Box>

      {/* 24-Hour Time Grid */}
      <Box ref={scrollContainerRef} className={styles.timeGridScroll}>
        <Box className={styles.timeGridMain}>
          <Box className={styles.timeGutter}>
            {hours.map((hour) => (
              <Box key={hour} className={styles.timeGutterSlot}>
                {hour === 0 ? "" : `${hour < 10 ? "0" : ""}${hour}:00`}
              </Box>
            ))}
          </Box>

          <Box
            className={styles.dayColumnsContainer}
            sx={{ gridTemplateColumns: "1fr" }}
          >
            <Box className={styles.dayColumn}>
              {isToday && (
                <Box
                  className={styles.currentTimeLine}
                  style={{
                    top: `${(currentMinutesFromMidnight / 60) * SLOT_HEIGHT}px`,
                  }}
                />
              )}

              {hours.map((hour) => (
                <Box
                  key={hour}
                  className={styles.hourSlot}
                  onClick={() => onTimeSlotClick(isoDate, hour)}
                />
              ))}

              {dayEvents.map((group) => {
                if (group.events.length > 1) {
                  return (
                    <EventStack
                      key={group.id}
                      events={group.events}
                      onSelectEvent={onSelectEvent}
                      slotHeight={SLOT_HEIGHT}
                    />
                  );
                }

                const evt = group.events[0];
                const isConf = evt.visibilityLevel === 2;
                const top = (evt.startMin / 60) * SLOT_HEIGHT;
                const height = Math.max(
                  30,
                  ((evt.endMin - evt.startMin) / 60) * SLOT_HEIGHT,
                );
                const laneWidth = 100 / evt.laneCount;
                const laneInset = evt.laneCount > 1 ? 3 : 8;

                return (
                  <Card
                    key={evt.id}
                    sx={{
                      position: "absolute",
                      top: `${top}px`,
                      height: `${height}px`,
                      left:
                        evt.laneCount > 1
                          ? `calc(${evt.lane * laneWidth}% + ${laneInset}px)`
                          : 8,
                      right:
                        evt.laneCount > 1
                          ? `calc(${(evt.laneCount - evt.lane - 1) * laneWidth}% + ${laneInset}px)`
                          : 8,
                      bgcolor: isConf ? "#7C3AED" : "primary.main",
                      color: "#fff",
                      borderRadius: 1.5,
                      p: "4px 8px",
                      cursor: "pointer",
                      boxShadow: "0 3px 12px rgba(0,0,0,0.15)",
                      zIndex: 6 + evt.lane,
                      overflow: "hidden",
                      boxSizing: "border-box",
                      transition: "transform 0.15s ease",
                      "&:hover": {
                        transform: "scale(1.01)",
                        zIndex: 20,
                      },
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent(evt);
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {isConf ? (
                        <Lock sx={{ fontSize: 16 }} />
                      ) : (
                        <EventIcon sx={{ fontSize: 16 }} />
                      )}
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, fontSize: "0.82rem" }}
                      >
                        {evt.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ opacity: 0.85, ml: "auto", fontSize: "0.72rem" }}
                      >
                        {formatTimeDisplay(evt.startTime)} –{" "}
                        {formatTimeDisplay(evt.endTime)}
                      </Typography>
                    </Box>
                    {evt.description && (
                      <Typography
                        variant="caption"
                        sx={{
                          opacity: 0.9,
                          mt: 0.25,
                          display: "block",
                          fontSize: "0.72rem",
                        }}
                      >
                        {evt.description}
                      </Typography>
                    )}
                  </Card>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
