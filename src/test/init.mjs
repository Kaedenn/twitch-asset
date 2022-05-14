/**
 * Test suite setup script
 *
 * This script sets up some necessary utilities for testing the application.
 */

import { spawn } from "child_process";
import { TimeoutPromise } from "./util/promises.js";
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import https from "https";
dotenv.config();

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

/**
 * Start the service before running any tests.
 */
export async function mochaGlobalSetup() {
  try {
    this.service = await startService();
  } catch (err) {
    console.error("startService() failed with error %s", err);
    for (const child of children) {
      child.kill("SIGKILL");
    }
    throw err;
  }
}

/**
 * Terminate the service after all tests are finished.
 */
export async function mochaGlobalTeardown() {
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

export const mochaHooks = {
  /**
   * Before running the test suites, connect to the service.
   */
  beforeAll() {
    const config = { timeout: 1000 };
    config.baseURL = `http://localhost:${process.env.APP_HTTP_PORT}`;
    if (process.env.APP_USE_HTTPS) {
      config.baseURL = `https://localhost:${process.env.APP_HTTPS_PORT}`;
      if (process.env.APP_KEY_FILE && process.env.APP_CRT_FILE) {
        console.log("Loading cert file %s", process.env.APP_CRT_FILE);
        const crt_path = process.env.APP_CRT_FILE;
        config.httpsAgent = new https.Agent({
          rejectUnauthorized: false,
          cert: fs.readFileSync(crt_path)
        });
      }
    }
    this.api = axios.create(config);
  },

  /**
   * Skip the tests if we failed to construct the API for whatever reason.
   */
  beforeEach() {
    if (!this.api) {
      console.error("API not available; skipping");
      this.skip();
    }
  }
};
