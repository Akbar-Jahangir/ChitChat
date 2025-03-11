import React, { useContext, useEffect } from "react";
import SignUp from "../pages/SignUp/SignUp";
import { useNavigate } from "react-router-dom";
import { SenderContext } from "../contexts/ChatContext";


const EditProfile: React.FC = () => {
    const { senderId } = useContext(SenderContext);
    const navigate = useNavigate();
      useEffect(() => {
        if (!senderId) {
          navigate("/signIn");
        }
      }, []);

    return <SignUp isEditMode={true} />;
};

export default EditProfile;