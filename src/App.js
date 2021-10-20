import logo from "./logo.svg";
import "./App.css";
import { action, atom, map, mapTemplate } from "nanostores";
import { logger } from "./logger";
// import { reduxDevtools } from "./RDT";

const atomStore = atom(1);
const mapStore = map({});
const Post = mapTemplate((newPost, id) => {
  newPost.setKey("title", "New post");
  newPost.setKey("updatedAt", Date.now());
});
// reduxDevtools({ store });
logger({ atomStore, mapStore, Post });
const act = action(atomStore, "atom-action", (store) => {
  store.set(store.get() + 1);
});
const setMap = action(mapStore, "map-action-set", (store) => {
  store.set({ initial: true, otherValue: "some" });
});
const setMapKey = action(mapStore, "map-action-setKey", (store) => {
  store.setKey("initial", !store.get().initial);
});
function App() {
  atomStore.listen(() => {});
  mapStore.listen(() => {});
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <div className="App-link" onClick={act}>
          Atom
        </div>
        <div className="App-link" onClick={setMap}>
          Map set
        </div>
        <div className="App-link" onClick={setMapKey}>
          Map set key
        </div>
        <div className="App-link" onClick={() => Post(Date.now())}>
          Create Map
        </div>
      </header>
    </div>
  );
}

export default App;
