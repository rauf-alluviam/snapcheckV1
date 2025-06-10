import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

// EST timezone identifier
const EST_TIMEZONE = 'America/New_York';

/**
 * Format a date to EST timezone for display (MM/DD/YYYY)
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date string in EST
 */
export const formatDateShortEST = (date) => {
  return dayjs(date).tz(EST_TIMEZONE).format('MM/DD/YYYY');
};

/**
 * Format a date and time to EST timezone for display (MM/DD/YYYY, HH:mm AM/PM EST)
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted datetime string in EST
 */
export const formatDateTimeForDisplayEST = (date) => {
  return dayjs(date).tz(EST_TIMEZONE).format('MM/DD/YYYY, hh:mm A') + ' EST';
};

/**
 * Format a date for CSV export (MM/DD/YYYY)
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date string in EST
 */
export const formatDateForCSV = (date) => {
  return dayjs(date).tz(EST_TIMEZONE).format('MM/DD/YYYY');
};

/**
 * Format a datetime for CSV export (MM/DD/YYYY HH:mm EST)
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted datetime string in EST
 */
export const formatDateTimeForCSV = (date) => {
  return dayjs(date).tz(EST_TIMEZONE).format('MM/DD/YYYY HH:mm') + ' EST';
};

/**
 * Format a date for PDF reports (MM/DD/YYYY)
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date string in EST
 */
export const formatDateForPDF = (date) => {
  return dayjs(date).tz(EST_TIMEZONE).format('MM/DD/YYYY');
};

/**
 * Format a datetime for PDF reports (MM/DD/YYYY HH:mm EST)
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted datetime string in EST
 */
export const formatDateTimeForPDF = (date) => {
  return dayjs(date).tz(EST_TIMEZONE).format('MM/DD/YYYY HH:mm') + ' EST';
};
