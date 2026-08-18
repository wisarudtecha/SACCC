// utils/timeConverter.ts
export const millisecondsToMinutes = (milliseconds: number): number => {
  return milliseconds / 60000;
};

// With rounding
export const msToMinutesRounded = (milliseconds: number): number => {
  return Math.round(milliseconds / 60000);
};

// With decimal places
export const msToMinutesFixed = (milliseconds: number, decimals: number = 2): string => {
  return (milliseconds / 60000).toFixed(decimals);
};
