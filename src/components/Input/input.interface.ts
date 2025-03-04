export interface InputProps {
    placeholder?: string;
    className?: string;
    type: string;
    value?: string;
    accept?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}