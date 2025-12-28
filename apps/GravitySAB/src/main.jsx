import { render } from "preact";
import * as preactCompat from "preact/compat";
import { App } from "./App";
import { useComponentData } from "@gravity-platform/gravity-client";
import "./index.css";

// Expose Preact as React for dynamic component loading
// This allows dynamically loaded components to use React hooks
window.React = preactCompat;
window.ReactDOM = { render };

// Expose component data store globally for dynamic components
window.__gravityComponentData = useComponentData;

render(<App />, document.getElementById("app"));
