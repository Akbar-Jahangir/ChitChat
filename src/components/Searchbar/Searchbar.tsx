import React from "react";
import { SearchIconSvg } from "../Svgs";
import { Input } from "../Input";
import { Button } from "../Button";
import { SearchbarProps } from "./searchbar.interface";

export const Searchbar: React.FC<SearchbarProps> = ({ searchValue, setSearchValue }) => {

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };
  return (
    <form
      onSubmit={handleSubmit}
      className="w-[100%] flex gap-x-2 px-3 rounded-full bg-white items-center py-2 text-sm"
    >
      <Button type="submit" icon={<SearchIconSvg />} />
      <Input
        placeholder="Search Here..."
        type="search"
        value={searchValue}
        onChange={(e) => setSearchValue?.(e.target.value)}
        className="w-[90%] focus:outline-none placeholder:text-sm"
      />
    </form>

  );
};

