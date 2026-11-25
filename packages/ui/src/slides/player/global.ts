// The entry of the prebuilt player (`player/player.global.js`, one script with React inside): it
// puts everything a deck needs on `globalThis.__LF_SLIDES__`, so a deck that is one HTML file
// runs without a network. A deck's own script is compiled with `react`, `react/jsx-runtime` and
// `@lanfermann/ui/slides` mapped to `React`, `jsxRuntime` and `slides` here, and then calls
// `mount`. One React for the player and the deck: the slides read the deck's context.
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";

import * as slides from "@/slides";

export { mount } from "./mount";
export { version } from "./version";
export { jsxRuntime, React, slides };
