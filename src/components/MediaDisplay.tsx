import { Message } from "../interfaces/message.interface";
import {
    ImageIconSvg,
    MP3IconSvg,
    PdfIconSvg,
    VideoIconSvg,
  } from "./Svgs";

export const MediaDisplay: React.FC<{
    mediaType: string | null;
    mediaItems: Message[];
  }> = ({ mediaType, mediaItems }) => {
    if (!mediaType) return null;
  
    const filteredItems = mediaItems.filter(item => 
      mediaType === "ALL" ? true : item.fileType!.toUpperCase() === mediaType
    );
  
    return (
      <div className="w-full">
        <h3 className="font-semibold mb-2">{mediaType} Files</h3>
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {filteredItems.map((item) => (
              <div key={item.messageId} className="p-2 border border-lightGray rounded-md">
                <a
                  href={item.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-primary hover:underline"
                >
                  <div className="flex items-center space-x-2">
                    {mediaType === "PDF" && <PdfIconSvg />}
                    {mediaType === "VIDEO" && <VideoIconSvg />}
                    {mediaType === "MP3" && <MP3IconSvg />}
                    {mediaType === "image/png" && <ImageIconSvg />}
                    {mediaType === "ALL" && (
                      item.fileType!.toUpperCase() === "PDF" ? <PdfIconSvg /> :
                      item.fileType!.toUpperCase() === "VIDEO" ? <VideoIconSvg /> :
                      item.fileType!.toUpperCase() === "MP3" ? <MP3IconSvg /> :
                      <ImageIconSvg />
                    )}
                    <span className="text-xs truncate" title={item.fileName}>
                      {item.fileName}
                    </span>
                  </div>
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No {mediaType.toLowerCase()} files found</p>
        )}
      </div>
    );
  };
  