
import { FilePreviewProps } from "./filePreview.interface";

const FilePreview: React.FC<FilePreviewProps> = ({ fileUrl }) => {

    const isImage = (fileUrl: string) => {
        return ["image/png", "image/jpg", "image/jpeg", "image/gif", "image/bmp", "image/webp", "image/svg", "image/tiff", "image/ico"].some(ext => fileUrl.toLowerCase().includes(ext));
    };

    const isVideo = (fileUrl: string) => {
        return ["video/mp4", "video/mov", "video/avi"].some(ext => fileUrl.toLowerCase().includes(ext));
    };


    const isPdf = (fileUrl: string) => {
        return ["application/pdf"].some(ext =>
            fileUrl.toLowerCase().includes(ext)
        );
    };
    const isAudio = (fileUrl: string) => {
        return ["audio/mp3", "audio/mpeg"].some(ext =>
            fileUrl.toLowerCase().includes(ext)
        );
    };

    return (
        <div className="p-4 border border-gray rounded">
            {fileUrl && (
                isImage(fileUrl) ? (
                    <img

                        src={fileUrl}
                        alt="Uploaded"
                        className="rounded-lg max-w-[200px]"

                    />
                ) : isVideo(fileUrl) ? (
                    <video controls className="rounded-lg w-[300px]">
                        <source src={fileUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                ) : isPdf(fileUrl) ? (
                    <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary block"
                    >
                        View Document
                    </a>

                ) : isAudio(fileUrl) ? (

                    <audio controls>
                        <source src={fileUrl} type="audio/mp3" />
                        Your browser does not support the audio element.
                    </audio>
                ) :
                    <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary block"
                    >
                        View Document
                    </a>

            )}
        </div>
    )

};

export default FilePreview;
