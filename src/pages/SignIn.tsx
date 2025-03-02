import React, { useState } from "react";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { useNavigate } from "react-router-dom";
import useDatabase from "../hooks/useDatabase";

const SignIn: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isEmail, setIsEmail] = useState<boolean>(true);
  const [isPassword, setIsPassword] = useState<boolean>(true);

  const { loginUser } = useDatabase()
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (email === "") {
      setIsEmail(false);
      return;
    } else {
      setIsEmail(true);
    }
    if (password.trim() == "") {
      setIsPassword(false);
      return;
    } else {
      setIsPassword(true);
    }
    loginUser(email, password, navigate)
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
              setEmail(e.target.value)
              setIsEmail(true)
            }}
            value={email}
            className={`form-input ${!isEmail ? "error-input" : ""
              }`}
          />
          {!isEmail && (
            <p className="error-text">provide your email address</p>
          )}
        </div>
        <div className="w-full">
          <Input
            type="password"
            placeholder="Password"
            onChange={(e) => {
              setPassword(e.target.value)
              setIsPassword(true)
            }}
            value={password}
            className={`form-input ${!isPassword ? "error-input" : ""
              }`} />
          {!isPassword && (
            <p className="error-text">please provide your password</p>
          )}
        </div>
        <Button
          type="submit"
          className="bg-primary p-1 text-lg font-semibold rounded text-white w-full flex justify-center"
          btnText="Sign In"
        />
      </form>
      <div>
        <span>Don't have an account?</span>{" "}
        <Button type="button" className="text-primary font-semibold text-xl" onClick={() => navigate("/")} btnText="Sign Up" />

      </div>
    </div>
  );
};

export default SignIn;
