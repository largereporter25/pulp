import { Switch, Route } from "wouter";
import Library from "./pages/Library";
import Editor from "./pages/Editor";

export default function App() {
  return (
    <Switch>
      <Route path="/" component={Library} />
      <Route path="/doc/:id" component={Editor} />
      <Route>404 — page not found</Route>
    </Switch>
  );
}
