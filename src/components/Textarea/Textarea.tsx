import React, { useRef, useEffect } from "react";
import { TextareaProps } from "./textarea.interface";

export const Textarea: React.FC<TextareaProps> = ({
    placeholder = "Write something...",
    onChange,
    className,
    value,
    onKeyDown
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "5px";
            const scrollHeight = textareaRef.current.scrollHeight;
            const maxHeight = 5 + 4 * 24;

            textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
        }
    }, [value]);

    return (
        <textarea
            ref={textareaRef}
            className={`resize-none max-h-12 overflow-y-auto focus:outline-none ${className}`}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            rows={1}
            style={{scrollbarWidth: "none" }}
        />
    );
};
