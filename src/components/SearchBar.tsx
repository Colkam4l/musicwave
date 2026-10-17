import React, { useState } from "react";
import { Search, X, Loader2 } from "lucide-react";

interface SearchBarProps {
  initialQuery?: string;
  isLoading?: boolean;
  onSearch: (query: string) => void;
  onClear?: () => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  initialQuery = "",
  isLoading = false,
  onSearch,
  onClear,
  placeholder = "Search songs, artists, or albums...",
}) => {
  const [value, setValue] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) {
      onSearch(trimmed);
    }
  };

  const handleClear = () => {
    setValue("");
    if (onClear) onClear();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    } else if (e.key === "Escape") {
      handleClear();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        width: "100%",
        maxWidth: "760px",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.5rem 0.75rem 0.5rem 1.25rem",
          background: "var(--bg-surface)",
          borderRadius: "var(--radius-full)",
          border: `1.5px solid ${isFocused ? "var(--border-focus)" : "var(--border-subtle)"}`,
          boxShadow: isFocused
            ? "0 0 20px var(--accent-glow), 0 4px 14px rgba(0,0,0,0.4)"
            : "0 4px 12px rgba(0, 0, 0, 0.25)",
          transition: "var(--transition-normal)",
        }}
      >
        <Search
          size={20}
          style={{
            color: isFocused ? "var(--accent)" : "var(--text-muted)",
            transition: "var(--transition-fast)",
            flexShrink: 0,
          }}
        />

        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--text-primary)",
            fontSize: "var(--font-size-md)",
            fontFamily: "var(--font-family)",
          }}
        />

        {value && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "0.25rem",
              borderRadius: "var(--radius-full)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "var(--transition-fast)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <X size={18} />
          </button>
        )}

        {isLoading && (
          <div
            style={{
              padding: "0.25rem",
              color: "var(--accent)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Loader2 size={18} className="animate-spin" />
          </div>
        )}

        <button
          type="submit"
          disabled={!value.trim() || isLoading}
          style={{
            background: value.trim() && !isLoading ? "var(--accent-gradient)" : "var(--bg-surface-elevated)",
            color: value.trim() && !isLoading ? "var(--text-inverse)" : "var(--text-muted)",
            border: "none",
            padding: "0.6rem 1.4rem",
            borderRadius: "var(--radius-full)",
            fontSize: "var(--font-size-sm)",
            fontWeight: 600,
            cursor: value.trim() && !isLoading ? "pointer" : "not-allowed",
            transition: "var(--transition-fast)",
            boxShadow: value.trim() && !isLoading ? "0 4px 12px var(--accent-glow)" : "none",
          }}
          onMouseEnter={(e) => {
            if (value.trim() && !isLoading) {
              e.currentTarget.style.filter = "brightness(1.1)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = "none";
          }}
        >
          Search
        </button>
      </div>
    </form>
  );
};
