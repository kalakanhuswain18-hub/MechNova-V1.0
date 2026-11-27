
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import Overview from "./pages/Overview";
import MachineGroups from "./pages/MachineGroups";
import Machines from "./pages/Machines";
import AttentionRequired from "./pages/AttentionRequired";
import Predictions from "./pages/Predictions";
import Settings from "./pages/Settings";

function ComingSoon({ title }) {
  return (
    <section className="panel">
      <p className="section-label">MECHNOVA / MODULE</p>
      <h1 className="text-2xl font-bold mt-3">{title}</h1>
      <p className="mt-2 text-gray-400">
        This module is under development.
      </p>
    </section>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Overview />} />

          <Route
  path="/machine-groups"
  element={<MachineGroups />}
/>

          <Route
  path="/machines"
  element={<Machines />}
/>

         <Route
  path="/attention-required"
  element={<AttentionRequired />}
/>

       <Route
  path="/predictions"
  element={<Predictions />}
/>

         <Route
  path="/settings"
  element={<Settings />}
/>

          <Route
            path="*"
            element={<ComingSoon title="Page Not Found" />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
