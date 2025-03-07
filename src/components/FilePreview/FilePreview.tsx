import { DocsThumbnailSvg, PdfThumbnailSvg, PowerPointThumbnailSvg, XcelThumbnailSvg } from "../Svgs";
import { FilePreviewProps } from "./filePreview.interface";

const FilePreview: React.FC<FilePreviewProps> = ({ fileUrl, fileName }) => {
    const isImage = (fileName: string) => {
        return [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".svg", ".tiff", ".ico"].some(ext => fileName.toLowerCase().includes(ext));
    };

    const isVideo = (fileName: string) => {
        return [".mp4", ".mov", ".avi"].some(ext => fileName.toLowerCase().includes(ext));
    };

    const isAudio = (fileName: string) => {
        return [".mp3"].some(ext =>
            fileName.toLowerCase().includes(ext)
        );
    };

    const isDocument = (fileName: string) => {
        return [".doc", ".docx",".txt"].some(ext =>
            fileName.toLowerCase().includes(ext)
        );
    };
    const isExcel = (fileName: string) => {
        return [".xls", ".xlsx", ".csv"].some(ext =>
            fileName.toLowerCase().includes(ext)
        );
    };
    const isPowerPoint = (fileName: string) => {
        return [  ".ppt", ".pptx"].some(ext =>
            fileName.toLowerCase().includes(ext)
        );
    };
    const isPdf = (fileName: string) => {
        return [".pdf",].some(ext =>
            fileName.toLowerCase().includes(ext)
        );
    };
   

    return (
        <div className="p-4 border border-gray rounded">
            {fileUrl && (
                isImage(fileName) ? (
                    <img
                        src={fileUrl}
                        alt="Uploaded"
                        className="rounded-lg max-w-[200px]"

                    />
                ) : isVideo(fileName) ? (
                    <video controls className="rounded-lg max-w-[300px]">
                        <source src={fileUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                ) : isDocument(fileName) ? (
                    <div className="w-full flex flex-col items-center">
                    <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary block  items-center gap-2"
                    >
                        <div className="flex justify-center">
                        <DocsThumbnailSvg/>
                        </div>
                    </a>
                    <p className="text-sm">{fileName}</p>
                    </div>
                ) :isPowerPoint(fileName) ? (
                    <div className="w-full flex flex-col items-center">
                    <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary block  items-center gap-2"
                    >
                        <div className="flex justify-center">
                        <PowerPointThumbnailSvg/>
                        </div>
                    </a>
                    <p className="text-sm">{fileName}</p>
                    </div>
                ): isExcel(fileName) ? (
                    <div className="w-full flex flex-col items-center">
                    <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary block  items-center gap-2"
                    >
                        <div className="flex justify-center">
                        <XcelThumbnailSvg/>
                        </div>
                    </a>
                    <p className="text-sm">{fileName}</p>
                    </div>
                ): isAudio(fileName) ? (

                    <audio controls>
                        <source src={fileUrl} type="audio/mp3" />
                        Your browser does not support the audio element.
                    </audio>
                ) : isPdf(fileName) ? (
                    <div className="w-full flex flex-col items-center">
                    <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary block  items-center gap-2"
                    >
                        <div className="flex justify-center">
                        <PdfThumbnailSvg/>
                        </div>
                    </a>
                    <p className="text-sm">{fileName}</p>
                    </div>
                ) :  
                    <a
                        href={fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary block"
                    >
                        File
                    </a>

            )}
        </div>
    );
};

export default FilePreview;