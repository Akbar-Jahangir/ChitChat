export interface CameraProps {
    onCapture: (dataURL: string, fileName: string) => void;
    onClose: () => void;
  }