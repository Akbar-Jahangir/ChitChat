import React, { useState } from "react";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { useNavigate } from "react-router-dom";
import BlankImg from "../../public/Images/BlankImg.png"
import useDatabase from "../hooks/useDatabase";
import { storage } from "../utils/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { uid } from "uid";
import { toast } from "react-toastify";;

const SignUp: React.FC = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [profilePicUrl, setProfilePicUrl] = useState<string>("");
  const [nameError, setNameError] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState<boolean>(false); // ✅ Loading state
  const navigate = useNavigate();
  const { signUp } = useDatabase();

  const uploadImageAndGetURL = async (file: File) => {
    const storageRef = ref(storage, `userProfilePics/${uid()}`); // ✅ Add parentheses after uid()
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setProfilePic(file);
      
      // Show the selected image immediately
      const localUrl = URL.createObjectURL(file);
      setProfilePicUrl(localUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let isValid = true;

    // Validate inputs
    if (name.trim() === "") {
      setNameError("Enter your name");
      isValid = false;
    }
    if (!email.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)) {
      setEmailError("Email is invalid");
      isValid = false;
    }
    if (!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{6,}$/)) {
      setPasswordError("Weak password");
      isValid = false;
    }

    if (!isValid) return;

    setLoading(true);
    try {
      let uploadedImageUrl = profilePicUrl;

      // Upload image if selected
      if (profilePic) {
        uploadedImageUrl = await uploadImageAndGetURL(profilePic);
        setProfilePicUrl(uploadedImageUrl);
      }
      const userData = {
        username: name,
        email,
        password,
        profilePicUrl: uploadedImageUrl,
      };

      // Register user
      const result = await signUp(userData);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      // Reset fields
      setName("");
      setEmail("");
      setPassword("");
      setProfilePic(null);
      setProfilePicUrl("");

      toast.success("Sign up successful!");
      navigate("/signIn");
    } catch  {
      toast.error("Error during signup. Please try again.");
    } finally {
      setLoading(false); // ✅ Stop loading
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
          <label className={`absolute h-[50%] top-[50%]  w-full p-2 cursor-pointer ${isHovered && " bg-black bg-opacity-50 gap-x-1 text-white text-sm"}`}>
            📷 {isHovered && <span className="text-white">update</span>}
            <Input type="file" accept="image/*" onChange={handleProfilePicChange} className="hidden" />
          </label>
        </div>

        {/* Name Field */}
        <div className="w-full">
          <Input
            type="text"
            placeholder="Full Name"
            onChange={(e) => setName(e.target.value)}
            value={name}
            className={`form-input ${nameError ? "error-input" : ""}`}
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
            className={`form-input ${emailError ? "error-input" : ""}`}
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
            className={`form-input ${passwordError ? "error-input" : ""}`}
          />
          {passwordError && <p className="error-text">{passwordError}</p>}
        </div>

        {/* Sign Up Button */}
        <Button
          type="submit"
          className={`bg-primary p-1 text-lg font-semibold rounded text-white w-full flex justify-center ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          btnText={loading ? "Signing Up..." : "Sign Up"}
          disabled={loading} // ✅ Disable button during signup
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
