import React, { useState, useContext, useEffect } from "react";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { useNavigate } from "react-router-dom";
import BlankImg from "../../assets/Images/BlankImg.png";
import useDatabase from "../../hooks/useDatabase";
import { storage } from "../../utils/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { uid } from "uid";
import { toast } from "react-toastify";
import { RecipientContext, SenderContext } from "../../contexts/ChatContext";
import { SignUpProps } from "./signUp.interface";

const SignUp: React.FC<SignUpProps> = ({ isEditMode }) => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [profilePicUrl, setProfilePicUrl] = useState<string>("");
  const [nameError, setNameError] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>("");
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { signUp, updateUserProfile, getUserById } = useDatabase();
  const { senderId } = useContext(SenderContext);
  const {setRecipientId}=useContext(RecipientContext)

  useEffect(() => {

    const fetchUserData = async () => {
      if (isEditMode && senderId) {
        // setLoading(true);
        try {
          const user = await getUserById(senderId);
          if (user) {
            setName(user.username);
            setEmail(user.email);
            setPassword(user.password);
            setConfirmPassword(user.password);
            setProfilePicUrl(user.profilePicUrl);
          } else {
            toast.error("User not found");
            navigate("/");
          }
        } catch (error) {
          console.error("Error fetching user:", error);
          toast.error("Failed to load user data");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, []);


  const uploadImageAndGetURL = async (file: File) => {
    const storageRef = ref(storage, `userProfilePics/${uid()}`);
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

  const validateForm = () => {
    let isValid = true;

    // Reset error states
    setNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");

    // Validate inputs
    if (name.trim() === "") {
      setNameError("Enter your name");
      isValid = false;
    }

    if (!email.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)) {
      setEmailError("Email is invalid");
      isValid = false;
    }

    // Only validate password in sign-up mode or if password is provided in edit mode
    if (!isEditMode || password) {
      if (!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{6,}$/)) {
        setPasswordError("Password must contain at least 6 characters, including uppercase, lowercase, number and special character");
        isValid = false;
      }

      if (password !== confirmPassword) {
        setConfirmPasswordError("Passwords do not match");
        isValid = false;
      }
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      let uploadedImageUrl = profilePicUrl;

      // Upload image if selected
      if (profilePic) {
        uploadedImageUrl = await uploadImageAndGetURL(profilePic);
      }

      if (isEditMode) {
        // Update existing user profile
        const updatedUserData = {
          username: name,
          userId: senderId,
          email: email,
          password: password,
          profilePicUrl: uploadedImageUrl || profilePicUrl,
        };

        const result = await updateUserProfile(updatedUserData);

        if (!result.success) {
          toast.error(result.message || "Failed to update profile");
          return;
        }

        toast.success("Profile updated successfully!");
        navigate("/signIn")
        setRecipientId("")
      } else {
        // Register new user
        const userData = {
          userId: uid(),
          username: name,
          email,
          password,
          profilePicUrl: uploadedImageUrl || "",
        };

        const result = await signUp(userData);

        if (!result.success) {
          toast.error(result.message || "Failed to sign up");
          return;
        }

        // Reset form after successful signup
        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setProfilePic(null);
        setProfilePicUrl("");

        toast.success("Sign up successful!");
        navigate("/signIn");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(isEditMode
        ? "Error updating profile. Please try again."
        : "Error during signup. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col justify-center items-center space-y-4">
      <form
        onSubmit={handleSubmit}
        className="bg-smokeWhite w-[90%] max-w-[380px] shadow-xl p-4 rounded space-y-4 font-inter flex flex-col items-center py-8"
      >
        <h2 className="text-3xl font-semibold text-primary">
          {isEditMode ? "Edit Profile" : "Sign Up"}
        </h2>
        <div
          className="relative w-24 h-24 rounded-full overflow-hidden bg-white"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <img src={profilePicUrl || BlankImg} alt="Profile" className="w-full h-full object-cover" />
          <label className={`absolute h-[50%] top-[50%] w-full p-2 cursor-pointer ${isHovered ? "bg-black bg-opacity-50 flex gap-x-1 text-white text-sm items-center justify-center" : ""}`}>
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
            disabled={isEditMode} // Email can't be changed in edit mode
          />
          {emailError && <p className="error-text">{emailError}</p>}
        </div>

        {/* Password Field - Optional in Edit Mode */}
        <div className="w-full">
          <Input
            type="password"
            placeholder={isEditMode ? "New Password (optional)" : "Password"}
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            className={`form-input ${passwordError ? "error-input" : ""}`}
          />
          {passwordError && <p className="error-text">{passwordError}</p>}
        </div>

        {/* Confirm Password Field */}
        <div className="w-full">
          <Input
            type="password"
            placeholder={isEditMode ? "Confirm New Password" : "Confirm Password"}
            onChange={(e) => setConfirmPassword(e.target.value)}
            value={confirmPassword}
            className={`form-input ${confirmPasswordError ? "error-input" : ""}`}
          />
          {confirmPasswordError && <p className="error-text">{confirmPasswordError}</p>}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className={`bg-primary p-1 text-lg font-semibold rounded text-white w-full flex justify-center ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          btnText={loading
            ? (isEditMode ? "Updating..." : "Signing Up...")
            : (isEditMode ? "Update Profile" : "Sign Up")
          }
          disabled={loading}
        />
      </form>

      {/* Cancel Button in Edit Mode or Sign In Button in Sign Up Mode */}
      <div>
        {isEditMode ? (
          <Button
            type="button"
            btnText="Cancel"
            className="text-primary font-semibold text-xl"
            onClick={() => navigate("/")}
          />
        ) : (
          <>
            <span>Already have an account?</span>{" "}
            <Button
              type="button"
              btnText="Sign In"
              className="text-primary font-semibold text-xl"
              onClick={() => navigate("/signIn")}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default SignUp;