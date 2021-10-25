import { atom } from "nanostores";

export const queue = atom([]);
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

export const run = () => {
  queue.subscribe((messages) => {
    if (!messages.length) return;
    messages.forEach(({ type, content = [] }) => {
      console[type](...content.map((d) => (typeof d === "function" ? d() : d)));
    });
    queue.clear();
  });
};

let IMG = "https://nanostores.github.io/nanostores/logo.svg";

export const bageLoader = (async () => {
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

export let styles = {
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

export let logTypesStyles = {
  start: printStyles("blue"),
  create: printStyles("#8f1fff"),
  change: printStyles("green"),
  stop: printStyles("tomato"),
};
