import { AvailabilityWithFallback } from "@/types/api";

export const formatWeekDate = (dateString: string) => {
    // Extract just the date part in case it includes time component
    const dateOnly = dateString.split('T')[0];
    const date = new Date(dateOnly + 'T00:00:00'); // Force local timezone interpretation
    const options: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    };
    return `Week of ${date.toLocaleDateString('en-US', options)}`;
};
// Helper Functions
export const dayToFullName = (day: string): string => {
    const map: Record<string, string> = {
        Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday',
        Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday'
    };
    return map[day];
};

export const fullNameToDay = (fullName: string): string => {
    const map: Record<string, string> = {
        Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
        Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun'
    };
    return map[fullName];
};

export const getNextMonday = (): string => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);

    // Format in local time to avoid timezone issues
    const year = nextMonday.getFullYear();
    const month = String(nextMonday.getMonth() + 1).padStart(2, '0');
    const day = String(nextMonday.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Get next N Mondays (for date picker)
export const getNextMondays = (count: number = 8): string[] => {
    const mondays: string[] = [];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;

    for (let i = 0; i < count; i++) {
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + daysUntilMonday + (i * 7));

        // Format in local time to avoid timezone issues
        const year = nextMonday.getFullYear();
        const month = String(nextMonday.getMonth() + 1).padStart(2, '0');
        const day = String(nextMonday.getDate()).padStart(2, '0');
        mondays.push(`${year}-${month}-${day}`);
    }

    return mondays;
};

// Convert date string to day abbreviation
export const dateToDay = (dateString: string): string => {
    // Extract just the date part in case it includes time component
    const dateOnly = dateString.split('T')[0];
    const date = new Date(dateOnly + 'T00:00:00'); // Add time to avoid timezone issues
    const dayIndex = date.getDay(); // 0=Sunday, 1=Monday, etc.
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayIndex];
};

// Calculate the actual date for a specific day of the week given a week start date
export const calculateDateForDay = (weekStartDate: string, dayKey: string): string => {
    const dayOffset: Record<string, number> = {
        Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6
    };
    console.log(new Date(weekStartDate));
    const start = new Date(weekStartDate);
    console.log(start);
    const offset = dayOffset[dayKey];
    console.log(offset);
    console.log(start.getDate());
    console.log(start.getDate() + offset);
    start.setDate(start.getDate() + offset);
    return start.toISOString();
};

// Helper to check if employee is available for a specific shift
export const isEmployeeAvailableForShift = (
    employeeAvailability: AvailabilityWithFallback[],
    dayOfWeek: string, // "Monday", "Tuesday", etc.
    shiftStart: string, // "17:00"
    shiftEnd: string | null   // "02:00"
): boolean => {
    // Find availability for this day of week
    const dayAvail = employeeAvailability.find(a => a.dayOfWeek === dayOfWeek);

    if (!dayAvail) return false;
    if (dayAvail.status === 'UNAVAILABLE') return false;

    // For now, if they're marked AVAILABLE or PREFERRED for that day, return true
    // TODO: Add time overlap checking if needed
    return dayAvail.status === 'AVAILABLE' || dayAvail.status === 'PREFERRED';
};