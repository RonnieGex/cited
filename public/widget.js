/* Cited widget · Built by Katalis */
(function () {
  var tag = document.currentScript || document.getElementsByTagName("script")[document.getElementsByTagName("script").length - 1];
  if (!tag || !tag.src) return;
  if (document.querySelector("[data-cited=widget]")) return;
  var origin = tag.src.replace(/\/widget\.js.*$/, "");
  var strings = {"en":{"button":"Ask us","title":"Ask this business","close":"Close"},"es":{"button":"Pregúntanos","title":"Pregunta a este negocio","close":"Cerrar"}};
  var spanish = (document.documentElement.lang || "").slice(0, 2).toLowerCase() === "es";
  var text = strings[spanish ? "es" : "en"];
  var open = false;
  var frame = null;
  var asked = {"source":"cited-embed","type":"close"};
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
    frame.src = origin + "/embed";
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
