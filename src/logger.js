import { lastAction, onBuild, onMount, onSet, onStop } from "nanostores";
import { styles, logTypesStyles, queue, bageLoader, run } from "./bage-logger";

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
  let consoleArgs = [() => styles.logo];
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
