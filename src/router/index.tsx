import React, { Suspense, lazy } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { ChatProvider } from "../contexts/ChatContext";
import SignUp from "../pages/SignUp/SignUp";
import SignIn from "../pages/SignIn";
import EditProfile from "../components/EditProfile";

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
            <Route path="editProfile" element={<EditProfile />} />
          </Routes>
        </Suspense>
      </Router>
    </ChatProvider>
  );
};
