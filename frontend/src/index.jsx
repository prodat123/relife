import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { UserProvider } from "./Account/UserContext";
import { BrowserRouter as Router } from "react-router-dom";
import { TooltipProvider } from "./Miscellaneous/TooltipProvider";
import { FontProvider } from "./Miscellaneous/FontProvider";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <UserProvider>
    <TooltipProvider>
      <Router>
        <App />
      </Router>
    </TooltipProvider>
  </UserProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
