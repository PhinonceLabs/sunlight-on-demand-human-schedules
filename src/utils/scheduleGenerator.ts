
import { TimeIntensityPair, standardSchedules, LightingSchedule } from './lightingStandards';
import { format, addMinutes, parse } from 'date-fns';

// Interface for sunrise/sunset data
export interface SunTimesData {
  sunrise: Date;
  sunset: Date;
  timezone: string;
  location: string;
}

const HOURS_PER_DAY = 24;
const MINUTES_PER_DAY = HOURS_PER_DAY * 60;
const DAY_START_POINT: TimeIntensityPair = { time: 0, intensity: 5, temperature: 2200 };
const DAY_END_POINT: TimeIntensityPair = { time: HOURS_PER_DAY, intensity: 5, temperature: 2200 };

const clampHour = (value: number): number => Math.min(HOURS_PER_DAY, Math.max(0, value));

const normalizeGeneratedSchedule = (points: TimeIntensityPair[]): TimeIntensityPair[] => {
  const middlePoints = points
    .filter((point) => Number.isFinite(point.time))
    .map((point) => ({ ...point, time: clampHour(point.time) }))
    // Preserve canonical day boundaries so clamped sun-time points cannot replace them.
    .filter((point) => point.time !== DAY_START_POINT.time && point.time !== DAY_END_POINT.time)
    .sort((a, b) => a.time - b.time)
    .filter((point, index, self) => index === 0 || point.time !== self[index - 1].time);

  return [{ ...DAY_START_POINT }, ...middlePoints, { ...DAY_END_POINT }];
};

// Helper function to create a custom schedule based on wake and sleep times
export const generateCustomSchedule = (
  wakeTime: number,  // 0-24 hour
  sleepTime: number, // 0-24 hour
  maxIntensity: number = 100,
  baseSchedule: string = "Optimal Office Lighting",
  sunTimes?: SunTimesData // Optional sunrise/sunset data
): TimeIntensityPair[] => {
  // Get the base schedule to modify
  const baseScheduleData = standardSchedules.find(s => s.name === baseSchedule) || standardSchedules[0];
  
  // Default schedule assumes wake at 6 AM and sleep at 10 PM
  const defaultWake = 6;
  const defaultSleep = 22;
  
  // Adjust wake and sleep times based on sunrise and sunset if provided
  let adjustedWakeTime = wakeTime;
  let adjustedSleepTime = sleepTime;
  
  if (sunTimes) {
    const sunriseHour = sunTimes.sunrise.getHours() + (sunTimes.sunrise.getMinutes() / 60);
    const sunsetHour = sunTimes.sunset.getHours() + (sunTimes.sunset.getMinutes() / 60);
    
    // Optional: Adjust wake time to not be earlier than 30 minutes before sunrise
    if (adjustedWakeTime < sunriseHour - 0.5) {
      adjustedWakeTime = Math.max(adjustedWakeTime, sunriseHour - 0.5);
    }
    
    // Optional: Adjust sleep time to not be earlier than sunset
    if (adjustedSleepTime < sunsetHour + 1) {
      adjustedSleepTime = Math.max(adjustedSleepTime, sunsetHour + 1);
    }
  }

  adjustedWakeTime = clampHour(adjustedWakeTime);
  adjustedSleepTime = clampHour(adjustedSleepTime);
  
  const customSchedule: TimeIntensityPair[] = [];
  
  // Add midnight starting point
  customSchedule.push({ ...DAY_START_POINT });
  
  // Find the base schedule points that occur during active hours
  const activeHoursPoints = baseScheduleData.schedule.filter(
    point => point.time >= defaultWake && point.time <= defaultSleep
  );
  
  // Scale the active hours to fit the user's wake/sleep cycle
  if (activeHoursPoints.length > 0) {
    const activeHoursDuration = defaultSleep - defaultWake;
    const userActiveHoursDuration = adjustedSleepTime - adjustedWakeTime;
    
    // Create points for the user's active hours
    activeHoursPoints.forEach(basePoint => {
      // Calculate the relative position in the active period
      const relativePosition = (basePoint.time - defaultWake) / activeHoursDuration;
      const newTime = adjustedWakeTime + (relativePosition * userActiveHoursDuration);
      const roundedTime = Math.round(newTime * 2) / 2; // Round to nearest half hour
      
      // Scale intensity if needed
      const scaledIntensity = (basePoint.intensity / 100) * maxIntensity;
      
      customSchedule.push({
        time: roundedTime,
        intensity: scaledIntensity,
        temperature: basePoint.temperature
      });
    });
  }
  
  // If we have sunrise/sunset data, add special points for those times
  if (sunTimes) {
    const sunriseHour = sunTimes.sunrise.getHours() + (sunTimes.sunrise.getMinutes() / 60);
    const sunsetHour = sunTimes.sunset.getHours() + (sunTimes.sunset.getMinutes() / 60);
    
    // Add a point for sunrise with higher color temperature (more blue light)
    customSchedule.push({
      time: sunriseHour,
      intensity: 85,
      temperature: 5500 // Cooler light at sunrise
    });
    
    // Add a point for 1 hour after sunrise with max brightness
    customSchedule.push({
      time: Math.min(sunriseHour + 1, 12),
      intensity: maxIntensity,
      temperature: 6500 // Highest blue light content
    });
    
    // Add a point for 1 hour before sunset
    customSchedule.push({
      time: Math.max(sunsetHour - 1, 16),
      intensity: 80,
      temperature: 4200 // Beginning to warm
    });
    
    // Add a point for sunset with warmer light
    customSchedule.push({
      time: sunsetHour,
      intensity: 60,
      temperature: 3500 // Warmer light at sunset
    });
    
    // Add a point for 1 hour after sunset with even warmer light
    customSchedule.push({
      time: sunsetHour + 1,
      intensity: 30,
      temperature: 2700 // Very warm light after sunset
    });
  }
  
  // Add sleep time and overnight points
  customSchedule.push({ 
    time: adjustedSleepTime, 
    intensity: 10, 
    temperature: 2200 
  });
  
  customSchedule.push({ ...DAY_END_POINT });
  
  // Sort, clamp, and dedupe so generated schedules always satisfy persisted schema constraints.
  return normalizeGeneratedSchedule(customSchedule);
};

// Get current recommended light settings based on the time
export const getCurrentLightSettings = (
  schedule: TimeIntensityPair[],
  currentHour: number = new Date().getHours() + (new Date().getMinutes() / 60)
): { intensity: number, temperature: number } => {
  // Handle case when the current hour is before the first schedule point or after the last
  if (currentHour < schedule[0].time) {
    return {
      intensity: schedule[schedule.length - 1].intensity,
      temperature: schedule[schedule.length - 1].temperature
    };
  }
  
  if (currentHour >= schedule[schedule.length - 1].time) {
    return {
      intensity: schedule[0].intensity,
      temperature: schedule[0].temperature
    };
  }
  
  // Find the two points we're between
  let beforeIndex = 0;
  for (let i = 0; i < schedule.length; i++) {
    if (schedule[i].time <= currentHour) {
      beforeIndex = i;
    } else {
      break;
    }
  }
  
  const afterIndex = beforeIndex + 1 < schedule.length ? beforeIndex + 1 : 0;
  
  // Calculate the interpolation factor
  let factor = 0;
  if (schedule[afterIndex].time > schedule[beforeIndex].time) {
    factor = (currentHour - schedule[beforeIndex].time) / 
      (schedule[afterIndex].time - schedule[beforeIndex].time);
  }
  
  // Interpolate the values
  const intensity = Math.round(
    schedule[beforeIndex].intensity + 
    factor * (schedule[afterIndex].intensity - schedule[beforeIndex].intensity)
  );
  
  const temperature = Math.round(
    schedule[beforeIndex].temperature + 
    factor * (schedule[afterIndex].temperature - schedule[beforeIndex].temperature)
  );
  
  return { intensity, temperature };
};

// Create a new schedule with the name and description
export const createNamedSchedule = (
  name: string,
  description: string,
  schedule: TimeIntensityPair[]
): LightingSchedule => {
  return {
    name,
    description,
    schedule,
    citations: [
      "Custom schedule based on peer-reviewed lighting research principles."
    ]
  };
};

// Get sunrise and sunset times for a location using free API
export const fetchSunTimes = async (
  latitude: number,
  longitude: number,
  timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone,
  date: Date = new Date()
): Promise<SunTimesData | null> => {
  try {
    const dateStr = format(date, 'yyyy-MM-dd');
    // Using free sunrise-sunset.org API
    const response = await fetch(
      `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&date=${dateStr}&formatted=0`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch sunrise/sunset data');
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK') {
      throw new Error('Invalid sunrise/sunset data received');
    }
    
    // Parse the UTC times and convert to local time zone
    const sunriseUTC = new Date(data.results.sunrise);
    const sunsetUTC = new Date(data.results.sunset);
    
    // Adjust for timezone
    const sunriseTZ = new Date(
      sunriseUTC.toLocaleString('en-US', { timeZone: timezone })
    );
    
    const sunsetTZ = new Date(
      sunsetUTC.toLocaleString('en-US', { timeZone: timezone })
    );
    
    return {
      sunrise: sunriseTZ,
      sunset: sunsetTZ,
      timezone,
      location: `${latitude.toFixed(2)},${longitude.toFixed(2)}`
    };
  } catch (error) {
    console.error('Error fetching sun times:', error);
    return null;
  }
};

// Format the time for display
export const formatTime = (hour: number): string => {
  const safeHour = Number.isFinite(hour) ? hour : 0;
  const totalMinutes = Math.round(safeHour * 60);
  const normalizedMinutes = ((totalMinutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const h = Math.floor(normalizedMinutes / 60);
  const m = normalizedMinutes % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
};

// Convert time string to decimal hours
export const timeStringToDecimal = (timeStr: string): number => {
  const [time, period] = timeStr.split(' ');
  const [hourStr, minuteStr] = time.split(':');
  
  let hour = parseInt(hourStr);
  const minute = parseInt(minuteStr);
  
  // Adjust for PM
  if (period === 'PM' && hour < 12) {
    hour += 12;
  }
  // Adjust for 12 AM
  if (period === 'AM' && hour === 12) {
    hour = 0;
  }
  
  return hour + minute / 60;
};

// Get the user's timezone
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

