import { useState, useEffect } from "react";
import { FilePreviewProps } from "./filePreview.interface";

const FilePreview: React.FC<FilePreviewProps> = ({ fileUrl }) => {
    const [docPreview, setDocPreview] = useState<string | null>(null);
    const [pdfFirstPage, setPdfFirstPage] = useState<string | null>(null);

    useEffect(() => {
        if (fileUrl?.endsWith(".pdf")) {
            loadPdfFirstPage(fileUrl);
        } else if (fileUrl?.endsWith(".docx")) {
            loadDocxText(fileUrl);
        }
    }, [fileUrl]);

    // 📌 Load first page of PDF (fix import issue)
    const loadPdfFirstPage = async (pdfUrl: string) => {
        const pdfjsLib = await import("pdfjs-dist/build/pdf");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

        const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
        const page = await pdf.getPage(1);
        const scale = 1.5;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;
        setPdfFirstPage(canvas.toDataURL()); // Convert canvas to image
    };

    // 📌 Extract first 300 characters from DOCX text
    const loadDocxText = async (docxUrl: string) => {
        const response = await fetch(docxUrl);
        const blob = await response.blob();

        const reader = new FileReader();
        reader.onload = (event) => {
            if (!event.target?.result) return;
            const content = event.target.result.toString();
            setDocPreview(content.slice(0, 300) + "..."); // Limit preview
        };
        reader.readAsText(blob);
    };

    return (
        fileUrl && (
            <div className="max-w-[95%] bg-white border rounded mb-16 p-4">
                {fileUrl.match(/\.(jpeg|jpg|png|gif)$/) ? (
                    <img src={fileUrl} alt="Uploaded" className="max-w-xs rounded-lg" />
                ) : fileUrl.match(/\.(mp4|mov|avi)$/) ? (
                    <video controls className="max-w-xs">
                        <source src={fileUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                ) : fileUrl.match(/\.(mp3|wav)$/) ? (
                    <audio controls>
                        <source src={fileUrl} type="audio/mp3" />
                        Your browser does not support the audio element.
                    </audio>
                ) : fileUrl.match(/\.(pdf)$/) ? (
                    pdfFirstPage ? (
                        <img src={pdfFirstPage} alt="PDF Preview" className="w-full h-auto" />
                    ) : (
                        <p>Loading PDF preview...</p>
                    )
                ) : fileUrl.match(/\.(docx)$/) ? (
                    <div className="border p-2 max-h-[400px] overflow-auto">
                        {docPreview || "Loading document preview..."}
                    </div>
                ) : (
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary">
                        View Document
                    </a>
                )}
            </div>
        )
    );
};

export default FilePreview;
