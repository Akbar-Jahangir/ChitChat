export interface TextareaProps {
    placeholder?: string;
    className?: string;
    value?: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}
