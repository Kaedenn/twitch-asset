/**
 * Test suite setup script
 *
 * This script sets up some necessary utilities for testing the application.
 *
 * TODO: Allow for custom .env files.
 */

import { spawn } from "child_process";
import { TimeoutPromise } from "./util/promises.js";

/* Milliseconds after which the service is assumed to have failed */
const SERVICE_TIMEOUT = 5000;

/* Array of spawned child processes (so that no child is left behind) */
const children = [];

/**
 * Spawn a child process. Returns a promise that resolves after receiving a
 * "spawn" event and rejects after seeing an "error" event. Does not perform
 * additional checks, like timeouts or whatnot.
 */
function spawnProcess(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args);
    child.on("spawn", () => {
      resolve(child);
      children.push(child);
    });
    child.on("error", (err) => {
      reject(err);
    });
  });
}

/**
 * Start the service so that we can test it.
 *
 * This simply runs "npm run start" with a timeout defined above. This waits
 * for the application to print "Application ready" before resolving and
 * rejects on either seeing "Application initialization failed" or if the
 * timeout expires.
 */
async function startService() {
  const proc = await spawnProcess("npm", ["run", "start"]);
  return await new TimeoutPromise(SERVICE_TIMEOUT, (resolve, reject) => {
    proc.stdout.on("data", (data) => {
      const lines = data.toString().trimEnd().split(/\n/);
      for (const line of lines) {
        console.log(`proc: ${line}`);
        if (line.match(/Application ready/)) {
          console.log("Service started successfully");
          resolve(proc);
        }
      }
    });
    proc.stderr.on("data", (data) => {
      const lines = data.toString().trimEnd().split(/\n/);
      for (const line of lines) {
        console.log(`proc: stderr: ${line}`);
        if (line.match(/Application initialization failed/)) {
          reject(new Error(line));
        }
      }
    });
  });
}

/* Reference to the child process is made available */
export let service = null;

export const mochaHooks = {
  /**
   * Before running the test suite, start the service.
   */
  async beforeAll() {
    try {
      service = await startService();
    } catch (err) {
      console.error("startService() failed with error %s", err);
      for (const child of children) {
        child.kill("SIGKILL");
      }
      throw err;
    }
  },

  /**
   * After running the test suite, stop (or even kill) the service.
   */
  afterAll() {
    for (const child of children) {
      if (!child.killed) {
        child.kill("SIGTERM");
        setTimeout(() => {
          if (!child.killed) {
            console.error("Failed to kill child with PID %d", child.pid);
            child.kill("SIGKILL");
          }
        }, 1000);
      }
    }
  }
};
