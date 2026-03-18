const isDevelopment = import.meta.env.NODE_ENV === "development";
export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  error: (...args) => {
    console.error(...args);
  }
};