import { lastAction, onBuild, onMount, onSet, onStop } from "nanostores";

let IMG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAMAAADzN3VRAAAATlBMVEVHcEwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8RERHk5OQoKCh7e3uwsLBHR0fExMQ3Nzf6+vpvb29TU1OQkJDdMs0wAAAADHRSTlMAFXayINXB4Po4aUhAg3I2AAAAz0lEQVQoz31S7RbDEBRTalTR+m7f/0VHcWs7W/OPnLhJXIQqZkEYl5wRMaMRE6ZcVnCKp5tYXnLEa+nEyuQn2NoU30SmLtUET+3Dg2UWbgdttlMDhbNd2gRWKeVdZ+iMRLPrtsyozTQZF4jAFBsLZ0M9EjQYS1V2VHuID2aDV9GbapGjfqtd0lInB/aaZjc+Kh8GPW9zjjoi3YFY9xZKHBUt9EAgT67gkjnI0zvIWX2Js0MH0FuWnVBB6W3oemj76vr//zz86cMePOzOz317A/hKGGNmJVoKAAAAAElFTkSuQmCC";

let logoStyles = "";
logoStyles += `background: url("${IMG}");`;
logoStyles += "background-size: cover;";
logoStyles += "font-family: Menlo, monospace;";
logoStyles += "padding: 0 3.5px;";
logoStyles += "margin-right: 4px";

let printStyles = (background, halfRadius = false) =>
  `font-family:Menlo,monospace;padding:0 5px;color:white;background-color:${background};border-radius:${
    halfRadius ? "0 99px 99px 0" : "99px"
  };`;

let styles = {
  logo: logoStyles,
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
  let consoleArgs = [styles.logo];
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
  console.groupCollapsed(tpl, ...consoleArgs);
  cb();
  console.groupEnd();
};

let log = ({ actionName, changed, newValue, oldValue, message, logType }) => {
  let tpl = `%c `;
  let consoleArgs = [styles.logo];
  if (logType) {
    tpl += `%c${logType}`;
    consoleArgs.push(logTypesStyles[logType] + "border-radius: 99px 0 0 99px;");
  }
  if (actionName) {
    console.log(tpl + "%caction", ...consoleArgs, styles.action, actionName);
  }
  if (changed) {
    console.log(tpl + "%ckey", ...consoleArgs, styles.changed, changed);
  }
  if (newValue) {
    console.log(tpl + "%cnew", ...consoleArgs, styles.new, newValue);
  }
  if (oldValue) {
    console.log(tpl + "%cold", ...consoleArgs, styles.old, oldValue);
  }
  if (message) {
    console.log(`%c${message}`, styles.message);
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
  deps = Object.entries(deps);
  let unsubs = deps.map(handle);
  return () => unsubs.map((fn) => fn());
};
