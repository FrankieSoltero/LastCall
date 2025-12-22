# Schedule Page - Backend Endpoints Analysis

## ✅ What's Been Updated

### 1. Type Alignment
- ✅ Imported API types: `Role`, `RoleWithCounts`, `ScheduleDetail`, `ShiftDetail`, etc.
- ✅ Created local extended types: `EmployeeDisplay`, `LocalShift`
- ✅ Updated all component props and state to use correct types

### 2. Implemented with Current Endpoints
- ✅ **Fetch Roles**: Using `api.getRoles(orgId)`
- ✅ **Fetch Employees**: Using `api.getEmployees(orgId)` with roleAssignments transformation
- ✅ **Calculate Shifts Count**: From local schedule state

---

## ❌ What Still Needs Backend Work

### 1. Employee Availability Checking (CRITICAL)

**Current State:** Mock `isAvailable: true` for all employees

**What's Needed:**
We need to check if an employee is available for a specific shift based on their org availability.

**Endpoint Already Exists:**
```typescript
api.getAllOrgAvailability(orgId) // Returns all employees' availability
```

**Implementation Needed:**
```typescript
// In fetchData(), after getting employees:
const allAvailability = await api.getAllOrgAvailability(orgId as string);

// Create a map of employee availability
const availabilityMap = new Map();
allAvailability.forEach(avail => {
  if (!availabilityMap.has(avail.employee.id)) {
    availabilityMap.set(avail.employee.id, []);
  }
  availabilityMap.get(avail.employee.id).push(avail);
});

// Function to check if employee is available for a shift
const isEmployeeAvailableForShift = (
  employeeId: string,
  dayOfWeek: string, // "Monday", "Tuesday", etc.
  shiftStart: string, // "17:00"
  shiftEnd: string    // "02:00"
) => {
  const empAvailability = availabilityMap.get(employeeId) || [];
  const dayAvail = empAvailability.find(a => a.dayOfWeek === dayOfWeek);

  if (!dayAvail || dayAvail.status === 'UNAVAILABLE') return false;

  // Check time overlap (would need time parsing logic)
  // For now, just check if they're available that day
  return dayAvail.status === 'AVAILABLE' || dayAvail.status === 'PREFERRED';
};
```

**Challenge:** Need to convert "Mon", "Tue", etc. to full day names for matching

---

### 2. Save/Create Schedule (CRITICAL)

**Current State:** Just console.log, no actual save

**Existing Endpoint:**
```typescript
api.createSchedule(orgId, data: CreateScheduleRequest)
```

**What CreateScheduleRequest Requires:**
```typescript
interface CreateScheduleRequest {
  weekStartDate: string; // "2025-01-06" (Monday)
  availabilityDeadline: string; // "2025-01-03" (3 days before)
}
```

**Problem:**
Our current UI uses a day-of-week picker (Mon, Tue, Wed...) but doesn't capture:
- Which specific week this schedule is for
- What the availability deadline should be

**Solutions:**

**Option A - Add Date Picker to UI:**
```typescript
// Add to component state
const [weekStartDate, setWeekStartDate] = useState<string>('');
const [availabilityDeadline, setAvailabilityDeadline] = useState<string>('');

// Add DatePicker to UI for selecting which week this schedule is for
```

**Option B - Auto-calculate next week:**
```typescript
// Automatically create schedule for next week
const getNextMonday = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  return nextMonday.toISOString().split('T')[0]; // "2025-01-06"
};

const weekStartDate = getNextMonday();
const deadline = new Date(weekStartDate);
deadline.setDate(deadline.getDate() - 3);
const availabilityDeadline = deadline.toISOString().split('T')[0];
```

**After Creating Schedule:**
We get back a `ScheduleDetail` with `scheduleDays` array. Then we need to:

```typescript
// For each day with shifts:
for (const day of DAYS) {
  if (scheduleData[day].length > 0) {
    // Find the corresponding scheduleDay
    const scheduleDay = createdSchedule.scheduleDays.find(
      sd => sd.dayOfWeek === dayToFullName(day) // "Mon" -> "Monday"
    );

    // Create each shift
    for (const shift of scheduleData[day]) {
      await api.createShift(scheduleDay.id, {
        roleId: shift.roleId,
        employeeId: shift.assignedEmployeeId,
        startTime: shift.startTime,
        endTime: shift.endTime,
        isOnCall: shift.isOnCall
      });
    }
  }
}
```

---

### 3. Load Existing Schedule (MEDIUM PRIORITY)

**Current State:** Always starts with empty schedule

**What's Needed:**
- Route parameter to indicate editing mode: `/schedules/[scheduleId]`
- Or query param: `/schedules/new?editId=abc123`

**Endpoint Already Exists:**
```typescript
api.getSchedule(scheduleId) // Returns ScheduleDetail
```

**Implementation:**
```typescript
// In useEffect, check if we're editing
const { scheduleId } = useLocalSearchParams();

if (scheduleId) {
  // Load existing schedule
  const schedule = await api.getSchedule(scheduleId as string);

  // Transform to WeeklySchedule format
  const transformed: WeeklySchedule = {
    Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: []
  };

  schedule.scheduleDays.forEach(day => {
    const dayKey = fullNameToDay(day.dayOfWeek); // "Monday" -> "Mon"
    transformed[dayKey] = day.shifts.map(shift => ({
      id: shift.id,
      roleId: shift.role.id,
      roleName: shift.role.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      assignedEmployeeId: shift.employee?.id || null,
      isOnCall: shift.isOnCall || false
    }));
  });

  setScheduleData(transformed);
}
```

---

## 🔧 New Endpoints Needed

### None Required!

All necessary endpoints already exist. We just need to:

1. ✅ **Use `getAllOrgAvailability()`** to check employee availability
2. ✅ **Add date pickers** or auto-calculate dates for schedule creation
3. ✅ **Transform data** between UI format (WeeklySchedule) and API format (ScheduleDetail)
4. ✅ **Use `createSchedule()` + `createShift()`** for saving

---

## 📋 Implementation Priority

**Phase 1 - Make it functional:**
1. ✅ Fetch roles/employees (DONE)
2. ✅ Add date selection for schedule week (Auto-calculated next Monday)
3. ✅ Implement save schedule logic (DONE)
4. ✅ Transform data formats properly (DONE)

**Phase 2 - Improve UX:**
5. ✅ Load existing schedules for editing (DONE)
   - Detects `scheduleId` URL parameter
   - Fetches existing schedule via `api.getSchedule()`
   - Transforms ScheduleDetail to WeeklySchedule format
   - Sets edit mode and displays week start date in header
6. ✅ Check employee availability dynamically (DONE)
   - Fetches all org availability via `api.getAllOrgAvailability()`
   - Builds availability map for quick lookup
   - Created `isEmployeeAvailableForShift()` helper function
   - Checks availability based on day and shift time when staffing
7. ✅ Update shift counts in real-time (DONE)
   - Added useEffect that watches scheduleData changes
   - Recalculates shift counts for all employees
   - Updates employee list with new counts
   - Used in staffing modal to sort by least shifts

**Phase 3 - Polish:**
8. ⬜ Publish schedule functionality
9. ⬜ Delete shifts
10. ⬜ Copy schedule to next week

---

## 🎯 Helper Functions Needed

```typescript
// Convert day abbreviations
const dayToFullName = (day: string): string => {
  const map: Record<string, string> = {
    Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday',
    Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday'
  };
  return map[day];
};

const fullNameToDay = (fullName: string): string => {
  const map: Record<string, string> = {
    Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
    Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun'
  };
  return map[fullName];
};

// Calculate next Monday
const getNextMonday = (): string => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  return nextMonday.toISOString().split('T')[0];
};
```
