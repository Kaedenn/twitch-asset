import { spawn } from "child_process";
import { TimeoutPromise } from "./util/promises.js";

/* Milliseconds after which a spawn is assumed to have failed */
const SERVICE_TIMEOUT = 5000;

const children = [];

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

export let service = null;

export const mochaHooks = {
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
