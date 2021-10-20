import { lastAction, onBuild, onMount, onSet, onStop } from "nanostores";

const styles = {
  bage: "color:white;background:black;padding-left:4px;padding-right:4px;font-weight:normal;",
  type: "color:white;background:green;padding-left:4px;padding-right:4px;font-weight:normal;",
  new: "color:white;background:green;padding-left:4px;padding-right:4px;font-weight:normal;",
  old: "color:white;background:tomato;padding-left:4px;padding-right:4px;font-weight:normal;",
  action:
    "color:white;background:indigo;padding-left:4px;padding-right:4px;font-weight:normal;",
  message:
    "color:white;background:black;padding-left:4px;padding-right:4px;font-weight:normal;",
  storeName:
    "color:white;background:blue;padding-left:4px;padding-right:4px;font-weight:normal;",
};

const logTypes = {
  start: "store connected",
  create: "store create",
  change: "store changed",
};

const group = (cb, { logType, storeName }) => {
  let tpl = `%cnanostores`;
  let printStyles = [styles.bage];
  if (logType) {
    tpl += `%c${logType}`;
    printStyles.push(styles.type);
  }
  if (storeName) {
    tpl += `%c${storeName}`;
    printStyles.push(styles.storeName);
  }
  console.group(tpl, ...printStyles);
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
      { logType: logTypes.change, storeName }
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
