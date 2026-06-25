export const SCHEDULE_FRIDAY_ERROR =
  'Não é permitido agendar gravações às sextas-feiras.'

export const SCHEDULE_DAY_CAPACITY_ERROR =
  'Cada dia permite no máximo 2 gravações (14h e 16h).'

export {
  SCHEDULE_TZ,
  FRIDAY_BLOCKED_MESSAGE,
  DAY_CAPACITY_MESSAGE,
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
  assertDayCapacity,
  computeDayCapacityFixChanges,
  findSlotConflict,
  hasOverfullDays,
  snapToSlotHour,
  type CapacityFixChange,
} from '../../shared/dayCapacityMigration'
