export const genCaseID = (): string => {
  const currentTime = new Date();
  
  // Convert to UTC+7
  const utcPlus7Time = new Date(currentTime.getTime() + (7 * 60 * 60 * 1000));
  
  const year = utcPlus7Time.getUTCFullYear().toString().slice(-2);
  const month = String(utcPlus7Time.getUTCMonth() + 1).padStart(2, '0');
  const day = String(utcPlus7Time.getUTCDate()).padStart(2, '0');
  const hour = String(utcPlus7Time.getUTCHours()).padStart(2, '0');
  const minute = String(utcPlus7Time.getUTCMinutes()).padStart(2, '0');
  const second = String(utcPlus7Time.getUTCSeconds()).padStart(2, '0');
  
  // Use performance.now() for sub-millisecond precision
  const perfTime = performance.now();
  const microseconds = String(Math.floor((perfTime % 1000) * 1000)).padStart(7, '0');

  const timestamp = `D${year}${month}${day}${hour}${minute}${second}${microseconds}`;
  
  return timestamp;
};

export const genWordOrderID = (): string => {
  const currentTime = new Date();
  
  // Convert to UTC+7
  const utcPlus7Time = new Date(currentTime.getTime() + (7 * 60 * 60 * 1000));
  
  const year = utcPlus7Time.getUTCFullYear().toString().slice(-2);
  const month = String(utcPlus7Time.getUTCMonth() + 1).padStart(2, '0');
  const day = String(utcPlus7Time.getUTCDate()).padStart(2, '0');
  const hour = String(utcPlus7Time.getUTCHours()).padStart(2, '0');
  const minute = String(utcPlus7Time.getUTCMinutes()).padStart(2, '0');
  const second = String(utcPlus7Time.getUTCSeconds()).padStart(2, '0');
  
  // Use performance.now() for sub-millisecond precision
  const perfTime = performance.now();
  const microseconds = String(Math.floor((perfTime % 1000) * 1000)).padStart(7, '0');

  const timestamp = `WO${year}${month}${day}${hour}${minute}${second}${microseconds}`;
  
  return timestamp;
};