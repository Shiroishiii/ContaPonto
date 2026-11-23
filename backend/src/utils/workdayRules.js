export const STANDARD_RECORD_SEQUENCE = ["ENTRY", "BREAK_START", "BREAK_END", "EXIT"];

export function getRecordSequence(scheduleDay) {
    if (scheduleDay && !scheduleDay.breakStartTime && !scheduleDay.breakEndTime) {
        return ["ENTRY", "EXIT"];
    }
    return STANDARD_RECORD_SEQUENCE;
}
