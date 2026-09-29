import { PUBLIC_STRINGS } from "../i18n/public.ts";
import { CLOSE_MESSAGE } from "./messages.ts";

// Design decision 4 of `openspec/changes/public-page-and-widget/design.md`: a dependency-free `public/widget.js`,
// built from here and committed, under 5 KB. It adds a floating button to the page that loads it and opens `/embed` in
// an iframe of the script's own origin. The button carries an accessible name and `Escape` closes the chat.
//
// `npm run build:widget` writes the file and `tests/widget.test.ts` fails when the committed file and this source
// drift apart.

export const WIDGET_PATH = "/widget.js";
export const EMBED_PATH = "/embed";
export const MAX_WIDGET_BYTES = 5 * 1024;
export const WIDGET_BANNER = "/* Cited widget · Built by Katalis */";

const widgetStrings = JSON.stringify({
  en: PUBLIC_STRINGS.en.widget,
  es: PUBLIC_STRINGS.es.widget,
});

const closeMessage = JSON.stringify(CLOSE_MESSAGE);

export function widgetSource(): string {
  return `${WIDGET_BANNER}
(function () {
  var tag = document.currentScript || document.getElementsByTagName("script")[document.getElementsByTagName("script").length - 1];
  if (!tag || !tag.src) return;
  if (document.querySelector("[data-cited=widget]")) return;
  var origin = tag.src.replace(/\\/widget\\.js.*$/, "");
  var strings = ${widgetStrings};
  var spanish = (document.documentElement.lang || "").slice(0, 2).toLowerCase() === "es";
  var text = strings[spanish ? "es" : "en"];
  var open = false;
  var frame = null;
  var asked = ${closeMessage};
  var fixed = "position:fixed;right:20px;z-index:2147483000";
  var button = document.createElement("button");
  button.type = "button";
  button.setAttribute("data-cited", "widget");
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-label", text.button);
  button.textContent = text.button;
  button.style.cssText = fixed + ";bottom:20px;border:0;padding:12px 18px;background:#171717;color:#fff;font:600 14px system-ui,sans-serif;cursor:pointer";
  function close() {
    if (frame) { frame.parentNode.removeChild(frame); frame = null; }
    open = false;
    button.setAttribute("aria-expanded", "false");
    button.focus();
  }
  function show() {
    frame = document.createElement("iframe");
    frame.setAttribute("data-cited", "widget");
    frame.title = text.title;
    frame.src = origin + "${EMBED_PATH}";
    frame.style.cssText = fixed + ";bottom:76px;width:380px;height:560px;max-width:calc(100vw - 40px);max-height:calc(100vh - 104px);border:1px solid #171717;background:#fff";
    document.body.appendChild(frame);
    open = true;
    button.setAttribute("aria-expanded", "true");
  }
  button.addEventListener("click", function () { if (open) { close(); } else { show(); } });
  document.addEventListener("keydown", function (event) { if (event.key === "Escape" && open) close(); });
  window.addEventListener("message", function (event) {
    if (event.origin !== origin) return;
    var data = event.data;
    if (!data || data.source !== asked.source || data.type !== asked.type) return;
    if (open) close();
  });
  if (document.body) { document.body.appendChild(button); } else { document.addEventListener("DOMContentLoaded", function () { document.body.appendChild(button); }); }
})();
`;
}
