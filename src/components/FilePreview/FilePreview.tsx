import { isAudio, isDocument, isExcel, isImage, isPdf, isPowerPoint, isVideo } from "../../utils/fileExtensionChecker";
import { DocsThumbnailSvg, PdfThumbnailSvg, PowerPointThumbnailSvg, XcelThumbnailSvg } from "../Svgs";
import { FilePreviewProps } from "./filePreview.interface";

const FilePreview: React.FC<FilePreviewProps> = ({ fileUrl, fileName }) => {
   isImage(fileName)
   isAudio(fileName)
   isDocument(fileName)
   isExcel(fileName)
   isPdf(fileName)
   isPowerPoint(fileName)
   isVideo(fileName)

    return (
        <div className="p-4 border border-gray rounded">
            {fileUrl && (
                isImage(fileName) ? (
                    <img
                        src={fileUrl}
                        alt="Uploaded"
                        className="rounded-lg max-w-[300px]"

                    />
                ) : isVideo(fileName) ? (
                    <video controls className="rounded-lg max-w-[300px]">
                        <source src={fileUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                ) : isDocument(fileName) ? (
                    <div className="file-preview-container">
                    <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="file-preview-text"
                    >
                        <div className="media-thumnail-container">
                        <DocsThumbnailSvg/>
                        </div>
                    </a>
                    <p className="text-sm">{fileName}</p>
                    </div>
                ) :isPowerPoint(fileName) ? (
                    <div className="file-preview-container">
                    <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="file-preview-text"
                    >
                        <div className="media-thumnail-container">
                        <PowerPointThumbnailSvg/>
                        </div>
                    </a>
                    <p className="text-sm">{fileName}</p>
                    </div>
                ): isExcel(fileName) ? (
                    <div className="file-preview-container">
                    <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="file-preview-text"
                    >
                        <div className="media-thumnail-container">
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
                    <div className="file-preview-container">
                    <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="file-preview-text"
                    >
                        <div className="media-thumnail-container">
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
                        View File
                    </a>

            )}
        </div>
    );
};

export default FilePreview;