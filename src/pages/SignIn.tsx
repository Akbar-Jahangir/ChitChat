import React, { useState } from "react";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { useNavigate } from "react-router-dom";
import useDatabase from "../hooks/useDatabase";
import { toast } from "react-toastify";

const SignIn: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isEmail, setIsEmail] = useState<boolean>(true);
  const [isPassword, setIsPassword] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  const { login } = useDatabase();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please provide your email address.");
      return;
    } else {
      setIsEmail(true);
    }
    if (!password.trim()) {
      toast.error("Please provide your password.");
      return;
    } else {
      setIsPassword(true);
    }

    setLoading(true);
    
    // Check internet connection before attempting login
    if (!navigator.onLine) {
      toast.error("No internet connection. Please check your network and try again.");
      setLoading(false);
      return;
    }
    
    try {
      // Set a timeout to detect slow connections
      const loginPromise = login(email, password);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Connection timeout")), 10000); // 10 second timeout
      });
      
      await Promise.race([loginPromise, timeoutPromise]);
      navigate("/chat");
    } catch (error) {
      // Handle different types of errors
      if (!navigator.onLine) {
        toast.error("Internet connection lost. Please check your network.");
      } else if (error instanceof Error && error.message === "Connection timeout") {
        toast.error("Connection is too slow. Please check your internet connection.");
      } else if (error instanceof Error && error.message.includes("network")) {
        toast.error("Network error. Please check your internet connection and try again.");
      } else {
        toast.error("Login failed. Please check your credentials.");
      }
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col justify-center items-center space-y-4">
      <form
        onSubmit={handleSubmit}
        className="bg-smokeWhite w-[90%] max-w-[380px] shadow-xl p-4 rounded space-y-4 font-inter flex flex-col items-center py-12"
      >
        <p className="text-3xl font-semibold text-primary mb-4">Sign In</p>

        <div className="w-full">
          <Input
            type="email"
            placeholder="Email"
            onChange={(e) => {
              setEmail(e.target.value);
              setIsEmail(true);
            }}
            value={email}
            className={`form-input ${!isEmail ? "error-input" : ""}`}
          />
        </div>
        <div className="w-full">
          <Input
            type="password"
            placeholder="Password"
            onChange={(e) => {
              setPassword(e.target.value);
              setIsPassword(true);
            }}
            value={password}
            className={`form-input ${!isPassword ? "error-input" : ""}`}
          />
        </div>

        <Button
          type="submit"
          className={`bg-primary p-1 text-lg font-semibold rounded text-white w-full flex justify-center ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={loading}
          btnText={loading ? "Signing in..." : "Sign In"}
        />
      </form>
      <div>
        <span>Don't have an account?</span>{" "}
        <Button
          type="button"
          className="text-primary font-semibold text-xl"
          onClick={() => navigate("/")}
          btnText="Sign Up"
        />
      </div>
    </div>
  );
};

export default SignIn;