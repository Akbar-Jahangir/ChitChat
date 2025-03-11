export const isImage = (fileName: string) => {
    return [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".svg", ".tiff", ".ico"].some(ext => fileName.toLowerCase().includes(ext));
};

export const isVideo = (fileName: string) => {
    return [".mp4", ".mov", ".avi"].some(ext => fileName.toLowerCase().includes(ext));
};

export const isAudio = (fileName: string) => {
    return [".mp3"].some(ext =>
        fileName.toLowerCase().includes(ext)
    );
};

export const isDocument = (fileName: string) => {
    return [".doc", ".docx",".txt"].some(ext =>
        fileName.toLowerCase().includes(ext)
    );
};
export const isExcel = (fileName: string) => {
    return [".xls", ".xlsx", ".csv"].some(ext =>
        fileName.toLowerCase().includes(ext)
    );
};
export const isPowerPoint = (fileName: string) => {
    return [  ".ppt", ".pptx"].some(ext =>
        fileName.toLowerCase().includes(ext)
    );
};
export const isPdf = (fileName: string) => {
    return [".pdf",].some(ext =>
        fileName.toLowerCase().includes(ext)
    );
};