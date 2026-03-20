const isDevelopment = import.meta.env.VITE_NODE_ENV === "development";
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