export const SCHEDULE_FRIDAY_ERROR =
  'Não é permitido agendar gravações às sextas-feiras.'

export {
  SCHEDULE_TZ,
  FRIDAY_BLOCKED_MESSAGE,
  dayKeyFromIso,
  weekdayInScheduleTz,
  isFridayDayKey,
  isFriday,
  isValidScheduleDate,
  isCascadeBusinessDay,
  addDaysToDayKey,
  nextCascadeBusinessDayKey,
  localTimeParts,
  buildScheduledAt,
  assertValidScheduleDate,
} from '../../shared/scheduleDates'

export {
  computeFridayFixChanges,
  hasScheduledFridaySessions,
  type FridayFixChange,
} from '../../shared/fridayMigration'

export {
  findSlotConflict,
  type CapacityFixChange,
} from '../../shared/dayCapacityMigration'
