import { onNotify, action, lastAction } from "nanostores";

const SILENT_ACTION = "rdt_silent";

const getRDT = () =>
  typeof window !== "undefined" && window.__REDUX_DEVTOOLS_EXTENSION__;

function instanceId(storeName = "default store") {
  return `[nanostore]: ${storeName}`;
}

const RDT = (storeName) => {
  let rdt = getRDT();
  if (!rdt) {
    return {
      call: () => {},
      subscribe: () => {},
      unsubscribe: () => {},
    };
  }

  let connected = rdt.connect({
    instanceId: instanceId(storeName),
  });

  let call = ({ store, actionName, path }) => {
    let type = actionName || path || "root";
    connected.send(
      {
        type: `${storeName || "nanostore"}: ${type}`,
        payload: store.get(),
      },
      store.get()
    );
  };

  return {
    call,
    subscribe: connected.subscribe,
    unsubscribe: connected.unsubscribe,
  };
};

export const reduxDevtools = (deps) => {
  deps = Object.entries(deps);

  let handleRDT = (extState, silentReinit) => {
    console.log(extState)
    if (
      !extState ||
      !extState.payload ||
      !extState.payload.type ||
      !extState.state
    ) {
      return;
    }

    let { type } = extState.payload;
    let { state } = extState;
    if (type !== "JUMP_TO_STATE" && type !== "JUMP_TO_ACTION") return;
    let parsed;
    try {
      parsed = JSON.parse(state) || {};
    } catch {
      return;
    }

    silentReinit(parsed);
  };
  let unuse = deps.map(([storeName, store]) => {
    let { subscribe, call, unsubscribe } = RDT(storeName);

    let silentReinit = action(store, SILENT_ACTION, (store, value) => {
      store.set(value);
    });

    let hadnl = (ext) => handleRDT(ext, silentReinit);

    subscribe(hadnl);

    let unsub = () => unsubscribe(hadnl);
    let unChange = onNotify(store, ({ changed }) => {
      if (store[lastAction] !== SILENT_ACTION) {
        call({ store, path: changed, actionName: store[lastAction] });
      }
    });
    return () => [unsub, unChange].map((cb) => cb());
  });
  return () => unuse.map((cb) => cb());
};
