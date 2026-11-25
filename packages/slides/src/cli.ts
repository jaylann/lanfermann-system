#!/usr/bin/env node
// The `slides` command. It only hands the arguments on: everything it does is in the library
// (./index.ts), which a server uses without this file.
import { run } from "./run";

process.exitCode = await run(process.argv.slice(2), {
  out: (line) => console.log(line),
  err: (line) => console.error(line),
  cwd: process.cwd(),
});
