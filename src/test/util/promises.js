/**
 * A promise class with a timeout. Taken from:
 * https://stackoverflow.com/questions/32461271/
 *    nodejs-timeout-a-promise-if-failed-to-complete-in-time
 */
class TimeoutPromise extends Promise {
  constructor(timeout, callback) {
    const haveTimeout = typeof timeout === "number";
    const init = haveTimeout ? callback : timeout;
    super((resolve, reject) => {
      if (haveTimeout) {
        const timer = setTimeout(() => {
          reject(new Error(`Promise timed out after ${timeout}ms`));
        }, timeout);
        init(
          (value) => {
            clearTimeout(timer);
            resolve(value);
          },
          (error) => {
            clearTimeout(timer);
            reject(error);
          }
        );
      } else {
        init(resolve, reject);
      }
    });
  }
  static resolveWithTimeout(timeout, x) {
    if (!x || typeof x.then !== "function") {
      // `x` isn't a thenable, no need for the timeout,
      // fulfill immediately
      return this.resolve(x);
    }
    return new this(timeout, x.then.bind(x));
  }
}

exports.TimeoutPromise = TimeoutPromise;
