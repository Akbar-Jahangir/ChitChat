export interface InputProps {
    placeholder?: string;
    className?: string;
    type: string;
    value?: string;
    accept?: string;
    capture?: "user" | "environment";
    multiple?: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}