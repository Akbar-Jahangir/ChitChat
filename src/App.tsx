import React from "react";
import { AppRoutes } from "./router/index"; // Ensure this path is correct
import { ToastContainer } from "react-toastify";

const App: React.FC = () => {
  return (
    <>
      <ToastContainer position="top-center" autoClose={3000} />
      <AppRoutes />
    </>
  );
};

export default App;
