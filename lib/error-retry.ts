type RetryHandler = () => Promise<void> | void;

let currentRetryHandler: RetryHandler | null = null;

export const setServerRetryHandler = (handler: RetryHandler | null) => {
  currentRetryHandler = handler;
};

export const getServerRetryHandler = (): RetryHandler | null => {
  return currentRetryHandler;
};

export const clearServerRetryHandler = () => {
  currentRetryHandler = null;
};
