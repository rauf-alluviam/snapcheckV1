// Date utility functions for consistent date formatting across the application

// EST timezone offset
const EST_TIMEZONE = 'America/New_York';

/**
 * Converts a date input to ISO datetime string
 * @param date - Date string in YYYY-MM-DD format, Date object, or ISO string
 * @returns ISO datetime string (YYYY-MM-DDTHH:mm:ss.sssZ)
 */
export const toISODateTime = (date: string | Date): string => {
  if (typeof date === 'string') {
    // If it's already an ISO string, return as is
    if (date.includes('T') && date.includes('Z')) {
      return date;
    }
    
    // If it's a date string (YYYY-MM-DD), convert to noon UTC to avoid date shifting
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Use noon UTC to preserve the date regardless of timezone
      return date + 'T12:00:00.000Z';
    }
    
    // Try to parse as a general date string
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      throw new Error(`Invalid date: ${date}`);
    }
    return dateObj.toISOString();
  }
  
  if (date instanceof Date) {
    return date.toISOString();
  }
  
  throw new Error(`Invalid date input: ${date}`);
};

/**
 * Converts a date to YYYY-MM-DD format for HTML date inputs
 * @param date - Date object, ISO string, or date string
 * @returns Date string in YYYY-MM-DD format
 */
export const toDateString = (date: string | Date): string => {
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }
  
  if (isNaN(dateObj.getTime())) {
    throw new Error(`Invalid date: ${date}`);
  }
  
  return dateObj.toISOString().split('T')[0];
};

/**
 * Gets current date in YYYY-MM-DD format
 * @returns Current date string in YYYY-MM-DD format
 */
export const getCurrentDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Gets current datetime in ISO format
 * @returns Current datetime string in ISO format
 */
export const getCurrentISODateTime = (): string => {
  return new Date().toISOString();
};

/**
 * Formats date for display purposes with consistent EST timezone
 * @param date - Date string or Date object
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string in EST timezone
 */
export const formatDateForDisplay = (
  date: string | Date, 
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    timeZone: EST_TIMEZONE
  }
): string => {
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  return dateObj.toLocaleDateString('en-US', {
    ...options,
    timeZone: EST_TIMEZONE
  });
};

/**
 * Formats datetime for display with consistent EST timezone
 * @param date - Date string or Date object
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted datetime string in EST timezone
 */
export const formatDateTimeForDisplay = (
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
    timeZone: EST_TIMEZONE
  }
): string => {
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  return dateObj.toLocaleString('en-US', {
    ...options,
    timeZone: EST_TIMEZONE
  });
};

/**
 * Formats date in short format for cards and lists (EST timezone)
 * @param date - Date string or Date object
 * @returns Short formatted date string (e.g., "Mar 15, 2024")
 */
export const formatDateShort = (date: string | Date): string => {
  return formatDateForDisplay(date, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: EST_TIMEZONE
  });
};

/**
 * Formats date in long format for detail views (EST timezone)
 * @param date - Date string or Date object
 * @returns Long formatted date string (e.g., "March 15, 2024")
 */
export const formatDateLong = (date: string | Date): string => {
  return formatDateForDisplay(date, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: EST_TIMEZONE
  });
};

/**
 * Formats time only in EST timezone
 * @param date - Date string or Date object
 * @returns Time string (e.g., "2:30 PM EST")
 */
export const formatTimeOnly = (date: string | Date): string => {
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Time';
  }
  
  return dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
    timeZone: EST_TIMEZONE
  });
};

/**
 * Validates if a date string is in the correct format
 * @param dateString - Date string to validate
 * @returns Boolean indicating if the date is valid
 */
export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * Gets relative time string (e.g., "2 hours ago", "3 days ago")
 * @param date - Date string or Date object
 * @returns Relative time string
 */
export const getRelativeTime = (date: string | Date): string => {
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  const now = new Date();
  const diff = now.getTime() - dateObj.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
};
