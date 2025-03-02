import React, { useState } from "react";
import { Input } from "../Input"; // Adjust import based on your project setup
import { AttachmentIconSvg, CameraIconSvg } from "../Svgs";

interface FileDataProps {
    id: string;
    file: File;
    url: string;
    
}


const messageTypeBtnData = [
    { id: 1, icon: <AttachmentIconSvg />, accept: "image/*,video/*,audio/*,.pdf,.docx,.xlsx" },
    { id: 2, icon: <CameraIconSvg />, accept: "image/*", capture: "environment" },
];

interface FileUploadPreviewProps {
    onClick: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileUploadPreview: React.FC<FileUploadPreviewProps> = ({ onClick }) => {
    const [files, setFiles] = useState<FileDataProps[]>([]);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files) return;

        const selectedFiles = Array.from(event.target.files).map((file) => ({
            id: `${file.name}-${Date.now()}`,
            file,
            url: URL.createObjectURL(file),
        }));

        setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
    };

    return (
        <div className="flex">
               {/* File Previews */}
               <div className="flex space-y-2">
                {files.map(({ id, file, url }) => (
                    <div key={id} className="border p-2 rounded-sm shadow-sm">
                        <p className="text-sm font-medium">{file.name}</p>

                        {/* Image Preview */}
                        {file.type.startsWith("image/") && <img src={url} alt="Preview" className="w-[40px] h-[40px] object-cover rounded-sm mt-2" />}

                        {/* Video Preview */}
                        {file.type.startsWith("video/") && (
                            <video controls className="w-full max-w-sm mt-2">
                                <source src={url} type={file.type} />
                                Your browser does not support the video tag.
                            </video>
                        )}

                        {/* Audio Preview */}
                        {file.type.startsWith("audio/") && (
                            <audio controls className="mt-2">
                                <source src={url} type={file.type} />
                                Your browser does not support the audio element.
                            </audio>
                        )}

                        {/* PDF Preview */}
                        {file.type === "application/pdf" && <iframe src={url} className="w-full h-40 mt-2" title="PDF Preview"></iframe>}

                        {/* DOC/XLS Download Link */}
                        {/\.(doc|docx|xls|xlsx)$/i.test(file.name) && (
                            <a href={url} download={file.name} className="text-blue-500 underline mt-2 block">
                                Download {file.name}
                            </a>
                        )}
                    </div>
                ))}
            </div>
            {/* File Upload Buttons */}
            <div className="border-l border-slate flex items-center my-1">
                {messageTypeBtnData.map((data) => (
                    <label key={data.id} className="cursor-pointer mx-1">
                        {data.icon}
                        <Input type="file" accept={data.accept} onChange={(e) => { handleFileUpload(e); onClick(e); }} className="hidden" multiple />
                    </label>
                ))}
            </div>
        </div>
    );
};

export default FileUploadPreview;
