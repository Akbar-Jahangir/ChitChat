import React, { useContext, useState } from "react";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { db, query, where, getDocs } from "../utils/firebaseConfig";
import {
  collection,
} from "firebase/firestore";
import { SenderContext } from "../contexts/ChatContext";

const SignIn: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isEmail, setIsEmail] = useState<boolean>(true);
  const [isPassword, setIsPassword] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate();
    const { setSendername, setSenderId, setSenderPicUrl } =
      useContext(SenderContext);
      const authenticateUserCredentials = async (email: string, password: string) => {
        try {
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("email", "==", email));
          const querySnapshot = await getDocs(q);
      
          if (querySnapshot.empty) {
            toast.error("Email does not exist");
            return false; // Indicate login failure
          }
      
          const userData = querySnapshot.docs[0].data();
      
          if (userData.password !== password) {
            toast.error("Incorrect password. Please try again.");
            return false;
          }
      
          setSenderId(userData.userId);
          setSendername(userData.username);
          setSenderPicUrl(userData.profilePicUrl);
      
          toast.success(`Logged in as ${userData.username}!`);
          return true; // Indicate login success
        } catch (err) {
          console.error("Error during login:", err);
          toast.error("Something went wrong. Please try again.");
          return false;
        }
      };
      
      // Update handleSubmit
      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
      
        if (!email.trim() || !password.trim()) {
          toast.error("Please fill in all fields.");
          return;
        }
      
        setLoading(true);
      
        if (!navigator.onLine) {
          toast.error("No internet connection. Please check your network.");
          setLoading(false);
          return;
        }
      
        try {
          const success = await Promise.race([
            authenticateUserCredentials (email, password),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Connection timeout")), 10000)
            ),
          ]);
      
          if (success) navigate("/chat");
        } catch  {
          toast.error("Login failed. Please try again.");
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
          className={`bg-primary p-1 text-lg font-semibold rounded text-white w-full flex justify-center ${loading ? "opacity-50 cursor-not-allowed" : ""
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