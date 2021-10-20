import { lastAction, onBuild, onMount, onSet, onStop } from "nanostores";
const printStyles = (background) =>
  `color:white;padding-left:4px;padding-right:4px;font-weight:normal;background:${background};`;
const styles = {
  bage: printStyles("black"),
  type: printStyles("green"),
  new: printStyles("green"),
  old: printStyles("tomato"),
  action: printStyles("indigo"),
  message: printStyles("black"),
  storeName:
    "color:white;padding-left:4px;padding-right:4px;font-weight:normal;",
};

const logTypes = {
  start: "store connected",
  create: "store create",
  change: "store changed",
};

const group = (cb, { logType, storeName, value }) => {
  let tpl = `%cnanostores`;
  let consoleArgs = [styles.bage];
  if (logType) {
    tpl += `%c${logType}`;
    consoleArgs.push(styles.type);
  }
  if (storeName) {
    tpl += `%c${storeName}`;
    consoleArgs.push(styles.storeName);
  }
  if (value) {
    tpl += ` ->`;
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
    console.log("%cchanged", styles.type, changed);
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

const handleSet = (storeName, store) => {
  return onSet(store, ({ changed, newValue }) => {
    const actionName = store[lastAction];
    group(
      () => {
        log({ actionName, changed, newValue, oldValue: store.get() });
      },
      { logType: logTypes.change, storeName, value: newValue }
    );
  });
};

const handleMount = (storeName, store) => {
  return onMount(store, () => {
    group(
      () => {
        log({ message: "store mounted" });
      },
      { logType: logTypes.create, storeName }
    );
  });
};

const storeLogger = (storeName, store) => {
  group(
    () => {
      log({ message: `logger connected to ${storeName}` });
    },
    { logType: logTypes.start, storeName }
  );
  const unsubs = [handleSet(storeName, store), handleMount(storeName, store)];
  return () => unsubs.map((fn) => fn());
};

const templateLogger = (templateName, template) => {
  return onBuild(template, ({ store }) => {
    const unsubLog = storeLogger(`${templateName}-${store.get().id}`, store);
    const usubStop = onStop(store, () => {
      unsubLog();
      usubStop();
    });
  });
};

const handle = ([storeName, store]) => {
  return store.build
    ? templateLogger(storeName, store)
    : storeLogger(storeName, store);
};

export const logger = (deps) => {
  deps = Object.entries(deps);
  const unsubs = deps.map(handle);
  return () => unsubs.map((fn) => fn());
};
