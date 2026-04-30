
/**
 * Formatting Utilities
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const truncateString = (str: string, num: number): string => {
  if (str.length <= num) return str;
  return str.slice(0, num) + '...';
};

/**
 * Image Utilities
 */
export const getImageUrls = (projectId: string, imageId: string) => {
  const ts = new Date().getTime();
  return {
    originalUrl: `/api/projects/${projectId}/images/${imageId}/file?type=original&t=${ts}`,
    restoredUrl: `/api/projects/${projectId}/images/${imageId}/file?type=restored&t=${ts}`,
    thumbnailUrl: `/api/projects/${projectId}/images/${imageId}/file?type=thumbnail&t=${ts}`
  };
};

export const getSafeFilename = (filename: string): string => {
  return filename.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
};

/**
 * Async Utilities
 */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const timeout = <T>(promise: Promise<T>, ms: number, errorMessage = 'Operation timed out'): Promise<T> => {
  let timer: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMessage)), ms);
  });
  
  return Promise.race([
    promise.then(res => {
      clearTimeout(timer);
      return res;
    }),
    timeoutPromise
  ]);
};

/**
 * Object Utilities
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

export const omit = <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};
