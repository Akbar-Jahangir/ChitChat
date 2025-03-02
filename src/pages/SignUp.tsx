import React, { useState } from "react";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { useNavigate } from "react-router-dom";
import BlankImg from "../assets/Images/blankImg.png"
import { uid } from "uid";
import useDatabase from "../hooks/useDatabase";
import { signUpProps } from "../interfaces/signUp.interface";


const SignUp: React.FC = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const { signUpUser } = useDatabase()


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let isValid = true;
    // Name Validation
    if (name.trim() === "") {
      setNameError("Enter your name");
      isValid = false;
    } else if (name.trim().length < 2) {
      setNameError("Name should be at least 2 characters long");
      isValid = false;
    } else {
      setNameError("");
    }

    // Email Validation
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailPattern.test(email)) {
      setEmailError("Email is invalid");
      isValid = false;
    } else {
      setEmailError("");
    }

    // Password Validation
    const passwordPattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{6,}$/;
    if (!passwordPattern.test(password)) {
      setPasswordError(
        "Password must be at least 6 characters long, contain one uppercase, one lowercase, one number, and one special character."
      );
      isValid = false;
    } else {
      setPasswordError("");
    }

    if (isValid) {
      const userId = uid();
      const newUser: signUpProps = {
        userId,
        username: name,
        email,
        password,
        profilePicUrl: profilePicUrl || "",
      };
      signUpUser(newUser); // Pass the user data to useAuth
      setName("")
      setEmail("")
      setPassword("")
      setProfilePicUrl("")
    }
  };

  const handleProfilePicUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col justify-center items-center space-y-4">
      <form
        onSubmit={handleSubmit}
        className="bg-smokeWhite w-[90%] max-w-[380px] shadow-xl p-4 rounded space-y-4 font-inter flex flex-col items-center py-8"
      >
        <h2 className="text-3xl font-semibold text-primary">Sign Up</h2>
        <div
          className="relative w-24 h-24 rounded-full overflow-hidden bg-white"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <img src={profilePicUrl || BlankImg} alt="Profile" className="w-full h-full object-cover" />
          {/* Hidden File Input */}
          <label className={`absolute h-[50%] top-[50%]  w-full p-2 cursor-pointer ${isHovered && " bg-black bg-opacity-50 gap-x-1 text-white text-sm"}`}>
            📷 {isHovered && (
              <span className="text-white">
                update
              </span>
            )}
            <Input type="file" accept="image/*" onChange={handleProfilePicUrlChange} className="hidden" />
          </label>
        </div>
        {/* Name Field */}
        <div className="w-full">
          <Input
            type="text"
            placeholder="Full Name"
            onChange={(e) => setName(e.target.value)}
            value={name}
            className={`form-input ${nameError ? "error-input" : ""
              }`}
          />
          {nameError && <p className="error-text">{nameError}</p>}
        </div>

        {/* Email Field */}
        <div className="w-full">
          <Input
            type="email"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            className={`form-input ${emailError ? "error-input" : ""
              }`}
          />
          {emailError && <p className="error-text">{emailError}</p>}
        </div>

        {/* Password Field */}
        <div className="w-full">
          <Input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            className={`form-input ${passwordError ? "error-input" : ""
              }`}
          />
          {passwordError && (
            <p className="error-text">{passwordError}</p>
          )}
        </div>

        {/* Sign Up Button */}
        <Button
          type="submit"
          className="bg-primary p-1 text-lg font-semibold rounded text-white w-full flex justify-center"
          btnText="Sign Up"
        />
      </form>

      {/* Sign In Button */}
      <div>
        <span>Already have an account?</span>{" "}
        <Button
          type="button"
          btnText="Sign In"
          className="text-primary font-semibold text-xl"
          onClick={() => navigate("signIn")}
        />
      </div>
    </div>
  );
};

export default SignUp;
