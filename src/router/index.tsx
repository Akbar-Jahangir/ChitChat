import React, { Suspense, lazy } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { ChatProvider } from "../contexts/ChatContext";
import SignUp from "../pages/SignUp";
import SignIn from "../pages/SignIn";

const Chat = lazy(() => import("../pages/Chat"))

export const AppRoutes: React.FC = () => {
  return (
    <ChatProvider>
      <Router>
        <Suspense
          fallback={
            <div className="w-full flex justify-center text-lg">Loading...</div>
          }
        >
          <Routes>
            <Route path="/" element={<SignUp />} />
            <Route path="signIn" element={<SignIn />} />
            <Route path="chat" element={<Chat />} />
          </Routes>
        </Suspense>
      </Router>
    </ChatProvider>
  );
};
