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
  const [loading, setLoading] = useState<boolean>(false); // 🔥 Loading state

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
    try {
      await login(email, password);
      navigate("/chat");
    } catch  {
      toast.error("Login failed. Please check your credentials.");
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
          btnText={loading ? "Loading..." : "Sign In"} // Show loading text
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
