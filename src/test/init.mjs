import { spawn } from "child_process";

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

function spawnProcess(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args);
    child.on("spawn", () => {
      resolve(child);
    });
    child.on("error", (err) => {
      reject(err);
    });
  });
}

async function startService() {
  const proc = await spawnProcess("npm", ["run", "start"]);
  return await new TimeoutPromise(1000, (resolve, reject) => {
    proc.stdout.on("data", (data) => {
      const line = data.toString().trimEnd();
      console.log(`proc: ${line}`);
      if (line.match(/Application ready/)) {
        console.log("Service started successfully");
        resolve(proc);
      }
    });
    proc.stderr.on("data", (data) => {
      const line = data.toString().trimEnd();
      console.log(`proc: ${line}`);
      if (line.match(/Application initialization failed/)) {
        reject(new Error(line));
      }
    });
  });
}

let service = null;

export const mochaHooks = {
  async beforeAll() {
    service = await startService();
  },

  afterAll() {
    service.kill("SIGTERM");
    setTimeout(() => {
      if (!service.killed) {
        console.error(`Failed to kill service with pid ${service.pid}`);
        service.kill("SIGKILL");
      }
    }, 1000);
  }
};
