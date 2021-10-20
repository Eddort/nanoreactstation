import { lastAction, onBuild, onMount, onSet, onStop } from "nanostores";

const printStyles = (background) =>
  `color:white;padding-left:4px;padding-right:4px;font-weight:normal;background:${background};`;

const styles = {
  bage: printStyles("black"),
  new: printStyles("green"),
  old: printStyles("tomato"),
  action: printStyles("indigo"),
  changed: printStyles("MidnightBlue"),
  message: "padding-left:4px;padding-right:4px;font-weight:normal;",
  storeName: "padding-left:4px;padding-right:4px;font-weight:normal;",
};

const logTypesStyles = {
  start: printStyles("blue"),
  create: printStyles("#8f1fff"),
  change: printStyles("green"),
  stop: printStyles("tomato"),
};

const group = (cb, { logType, storeName, value }) => {
  let tpl = `%cnanostores`;
  let consoleArgs = [styles.bage];
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

const log = ({ actionName, changed, newValue, oldValue, message }) => {
  if (actionName) {
    console.log("%caction", styles.action, actionName);
  }
  if (changed) {
    console.log("%cchanged", styles.changed, changed);
  }
  if (newValue) {
    console.log("%cnew", styles.new, newValue);
  }
  if (oldValue) {
    console.log("%cold", styles.old, oldValue);
  }
  if (message) {
    console.log(`%c${message}`, styles.message);
  }
};

const handleSet = (storeName, store) =>
  onSet(store, ({ changed, newValue }) => {
    const actionName = store[lastAction];
    group(
      () => {
        log({ actionName, changed, newValue, oldValue: store.get() });
      },
      { logType: "change", storeName, value: newValue }
    );
  });

const handleMount = (storeName, store) =>
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

const storeLogger = (storeName, store) => {
  group(
    () => {
      log({ message: `Logger was connected to ${storeName}` });
    },
    { logType: "start", storeName }
  );
  const unsubs = [handleSet(storeName, store), handleMount(storeName, store)];
  return () => unsubs.map((fn) => fn());
};

const templateLogger = (templateName, template) =>
  onBuild(template, ({ store }) => {
    const unsubLog = storeLogger(`${templateName}-${store.get().id}`, store);
    const usubStop = onStop(store, () => {
      unsubLog();
      usubStop();
    });
  });

const handle = ([storeName, store]) =>
  store.build
    ? templateLogger(storeName, store)
    : storeLogger(storeName, store);

export const logger = (deps) => {
  deps = Object.entries(deps);
  const unsubs = deps.map(handle);
  return () => unsubs.map((fn) => fn());
};
