import { lastAction, onBuild, onMount, onSet, onStop } from "nanostores";

function toDataURL(url, callback) {
  var xhr = new XMLHttpRequest();

  xhr.onload = function () {
    var reader = new FileReader();
    reader.onloadend = function () {
      callback(reader.result);
    };
    reader.readAsDataURL(xhr.response);
  };
  xhr.open("GET", url);
  //   xhr.setRequestHeader("Access-Control-Allow-Origin", "*");
  xhr.responseType = "blob";
  xhr.send();
}
let IMG = "https://nanostores.github.io/nanostores/logo.svg";
toDataURL(IMG, function (dataUrl) {
  console.log(dataUrl);
  IMG = dataUrl;
  console.log("%c ", `background:url("${dataUrl}") center;`, "!!!");
  logoStyles = "";
  logoStyles += `background-image: url("${IMG}");`;
  logoStyles += "background-size: cover;";
  logoStyles += "font-family: Menlo, monospace;";
  logoStyles += "padding: 0 3.1px;";
  logoStyles += "margin-right: 4px";
  styles.logo = logoStyles
});

let logoStyles = "";
logoStyles += `background: url("${IMG}") center;`;
logoStyles += "background-size: cover;";
logoStyles += "font-family: Menlo, monospace;";
logoStyles += "padding: 0 3.1px;";
logoStyles += "margin-right: 4px";


let printStyles = (background) =>
  `font-family:Menlo,monospace;padding:0 5px;background-color:${background};`;

let styles = {
  logo: logoStyles,
  new: printStyles("#1da1f2"),
  old: printStyles("#1da1f2"),
  action: printStyles("indigo"),
  changed: printStyles("MidnightBlue"),
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
    consoleArgs.push(logTypesStyles[logType]);
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
