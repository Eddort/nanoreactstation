import { lastAction, onMount, onSet } from "nanostores";

// let tpl = `%cnanostores%caction`

const styles = {
  bage: "color:white;background:black;padding-left:4px;padding-right:4px;font-weight:normal;",
  action:
    "color:white;background:green;padding-left:4px;padding-right:4px;font-weight:normal;",
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
    printStyles.push(styles.action);
  }
  if (storeName) {
    tpl += `%c${storeName}`;
    printStyles.push(styles.storeName);
  }
  console.group(tpl, ...printStyles);
  cb();
  console.groupEnd();
};

// const getFileLink = () => {
//   let stackTrace = new Error().stack; //get the stack trace string
//   console.log(stackTrace, stackTrace.split("\n"))
//   let userFile = stackTrace.split("\n")[4]; //create an array with all lines
//   return userFile.replace("at ", "").trim();
// };

const handleSet = (storeName, store) => {
  return onSet(store, ({ changed, newValue }) => {
    const actionName = store[lastAction];
    group(
      () => {
        console.log(
          "actionName:",
          actionName,
          "oldValue:",
          store.get(),
          "newValue:",
          newValue
        );
      },
      { logType: logTypes.change, storeName }
    );
  });
};

const handleMount = (storeName, store) => {
  return onMount(store, () => {
    group(
      () => {
        console.log("store is active");
      },
      { logType: logTypes.create, storeName }
    );
  });
};

const storeLogger = (storeName, store) => {
  group(
    () => {
      console.log("listeners:", store.lc, "value", store.get());
    },
    { logType: logTypes.start, storeName }
  );
  const unsubs = [handleSet(storeName, store), handleMount(storeName, store)];
  return () => unsubs.map((fn) => fn());
};
const templateLogger = () => {};

const handle = ([storeName, store]) => {
  return store.onBuild
    ? templateLogger(storeName, store)
    : storeLogger(storeName, store);
};

export const logger = (deps) => {
  deps = Object.entries(deps);
  const unsubs = deps.map(handle);
  return () => unsubs.map((fn) => fn());
};
