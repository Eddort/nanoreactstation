import { lastAction, onBuild, onMount, onSet, onStop, atom } from "nanostores";

const queue = atom([]);
queue.push = function (v) {
  this.set([...this.get(), v]);
};
queue.clear = function () {
  this.set([]);
};

function toDataURL(url) {
  return new Promise((resolve) => {
    let xhr = new XMLHttpRequest();

    xhr.onload = function () {
      let reader = new FileReader();
      reader.onloadend = function () {
        resolve(reader.result);
      };
      reader.readAsDataURL(xhr.response);
    };
    xhr.open("GET", url);
    xhr.responseType = "blob";
    xhr.send();
  });
}

const run = () => {
  queue.subscribe((messages) => {
    if (!messages.length) return;
    messages.forEach(({ type, content = [] }) => {
      console[type](
        ...content.map((d) => (typeof d === "function" ? d(styles) : d))
      );
    });
    queue.clear();
  });
};

let IMG = "https://nanostores.github.io/nanostores/logo.svg";

const bageLoader = (async () => {
  let dataUrl = await toDataURL(IMG);
  IMG = dataUrl;
  let logoStyles = "";
  logoStyles += `background-image: url("${IMG}");`;
  logoStyles += "background-size: cover;";
  logoStyles += "font-family: Menlo, monospace;";
  logoStyles += "padding: 0 3.1px;";
  logoStyles += "margin-right: 4px";
  styles.logo = logoStyles;
})();

let printStyles = (background, halfRadius = false) =>
  `font-family:Menlo,monospace;padding:0 5px;background-color:${background};border-radius:${
    halfRadius ? "0 99px 99px 0" : "99px"
  };`;

let styles = {
  logo: "",
  new: printStyles("#1da1f2", true),
  old: printStyles("#1da1f2", true),
  action: printStyles("indigo", true),
  changed: printStyles("MidnightBlue", true),
  message:
    "border-radius:10px;font-family:Menlo,monospace;margin-left:4px;padding:0 5px;",
  storeName:
    "border-radius:10px;font-family:Menlo,monospace;margin-left:4px;padding:0 5px;",
};

let logTypesStyles = {
  start: printStyles("blue"),
  create: printStyles("#8f1fff"),
  change: printStyles("green"),
  stop: printStyles("tomato"),
};

let group = (cb, { logType, storeName, value }) => {
  let tpl = `%c `;
  let consoleArgs = [() => styles.logo];
  if (logType) {
    tpl += `%c${logType}`;
    consoleArgs.push(logTypesStyles[logType]);
  }
  if (storeName) {
    tpl += `%c${storeName}`;
    consoleArgs.push(styles.storeName);
  }
  if (value) {
    tpl += ` →`;
    consoleArgs.push(value);
  }
  queue.push({ type: "groupCollapsed", content: [tpl, ...consoleArgs] });
  cb();
  queue.push({ type: "groupEnd" });
};

let log = ({ actionName, changed, newValue, oldValue, message, logType }) => {
  let tpl = `%c `;
  let consoleArgs = [styles.logo];
  if (logType) {
    tpl += `%c${logType}`;
    consoleArgs.push(logTypesStyles[logType] + "border-radius: 99px 0 0 99px;");
  }
  if (actionName) {
    queue.push({
      type: "log",
      content: [tpl + "%caction", ...consoleArgs, styles.action, actionName],
    });
  }
  if (changed) {
    queue.push({
      type: "log",
      content: [tpl + "%ckey", ...consoleArgs, styles.changed, changed],
    });
  }
  if (newValue) {
    queue.push({
      type: "log",
      content: [tpl + "%cnew", ...consoleArgs, styles.new, newValue],
    });
  }
  if (oldValue) {
    queue.push({
      type: "log",
      content: [tpl + "%cold", ...consoleArgs, styles.old, oldValue],
    });
  }
  if (message) {
    queue.push({ type: "log", content: [`%c${message}`, styles.message] });
  }
};

let handleSet = (storeName, store) =>
  onSet(store, ({ changed, newValue }) => {
    let actionName = store[lastAction];
    group(
      () => {
        log({
          actionName,
          changed,
          newValue,
          oldValue: store.get(),
          logType: "change",
        });
      },
      { logType: "change", storeName, value: newValue }
    );
  });

let handleMount = (storeName, store) =>
  onMount(store, () => {
    group(
      () => {
        log({ message: "Store was mounted" });
      },
      { logType: "create", storeName }
    );
    return () => {
      group(
        () => {
          log({ message: "Store was unmounted" });
        },
        { logType: "stop", storeName }
      );
    };
  });

let storeLogger = (storeName, store) => {
  group(
    () => {
      log({
        message: `Logger was connected to ${storeName}`,
      });
    },
    { logType: "start", storeName }
  );
  let unsubs = [handleSet(storeName, store), handleMount(storeName, store)];
  return () => unsubs.map((fn) => fn());
};

let templateLogger = (templateName, template) =>
  onBuild(template, ({ store }) => {
    let unsubLog = storeLogger(`${templateName}-${store.get().id}`, store);
    let usubStop = onStop(store, () => {
      unsubLog();
      usubStop();
    });
  });

let handle = ([storeName, store]) =>
  store.build
    ? templateLogger(storeName, store)
    : storeLogger(storeName, store);

export let logger = (deps) => {
  bageLoader.then(run);
  deps = Object.entries(deps);
  let unsubs = deps.map(handle);
  return () => unsubs.map((fn) => fn());
};
