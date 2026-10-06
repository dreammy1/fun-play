import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Provider } from "react-redux";
import store from "./redux/store";
import { ToastProvider } from "react-toast-notifications";
import AppWrapper from "./AppWrapper.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <ToastProvider>
        <AppWrapper />
      </ToastProvider>
    </Provider>
  </StrictMode>
);