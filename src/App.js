import logo from "./logo.svg";
import "./App.css";
import { action, atom } from "nanostores";
import { logger } from "./logger";
// import { reduxDevtools } from "./RDT";

const store = atom(1);
// reduxDevtools({ store });
logger({ store });
const act = action(store, "test-action", (store) => {
  store.set(store.get() + 1);
  store.listen(() => {})
});
function App() {
  store.listen(() => {})
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a className="App-link" onClick={act}>
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
