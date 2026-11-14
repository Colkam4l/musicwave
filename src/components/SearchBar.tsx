import React, { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, ArrowUpRight } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal state with prop if it changes
  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  // Fetch suggestions with debouncing
  useEffect(() => {
    const trimmed = value.trim();
    if (!trimmed || !isFocused) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await invoke<string[]>("get_search_suggestions", {
          query: trimmed,
        });
        if (Array.isArray(results) && results.length > 0) {
          setSuggestions(results.slice(0, 8));
          setShowDropdown(true);
          setSelectedIndex(-1);
        } else {
          setSuggestions([]);
          setShowDropdown(false);
        }
      } catch {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [value, isFocused]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const triggerSearch = (queryToSearch: string) => {
    const clean = queryToSearch.trim();
    if (!clean) return;
    setValue(clean);
    setShowDropdown(false);
    onSearch(clean);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
      triggerSearch(suggestions[selectedIndex]);
    } else {
      triggerSearch(value);
    }
  };

  const handleClear = () => {
    setValue("");
    setSuggestions([]);
    setShowDropdown(false);
    if (onClear) onClear();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showDropdown && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        return;
      }
    }

    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "760px",
        margin: "0 auto",
      }}
    >
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.5rem 0.75rem 0.5rem 1.25rem",
            background: "var(--bg-surface)",
            borderRadius: showDropdown && suggestions.length > 0 ? "24px 24px 0 0" : "var(--radius-full)",
            border: `1.5px solid ${isFocused ? "var(--border-focus)" : "var(--border-subtle)"}`,
            borderBottom: showDropdown && suggestions.length > 0 ? "none" : undefined,
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
            id="musicwave-search-input"
            type="text"
            value={value}
            autoComplete="off"
            onChange={(e) => {
              setValue(e.target.value);
              setSelectedIndex(-1);
            }}
            onFocus={() => {
              setIsFocused(true);
              if (suggestions.length > 0) setShowDropdown(true);
            }}
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
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--text-primary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-muted)")
              }
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
              background:
                value.trim() && !isLoading
                  ? "var(--accent-gradient)"
                  : "var(--bg-surface-elevated)",
              color:
                value.trim() && !isLoading
                  ? "var(--text-inverse)"
                  : "var(--text-muted)",
              border: "none",
              padding: "0.6rem 1.4rem",
              borderRadius: "var(--radius-full)",
              fontSize: "var(--font-size-sm)",
              fontWeight: 600,
              cursor: value.trim() && !isLoading ? "pointer" : "not-allowed",
              transition: "var(--transition-fast)",
              boxShadow:
                value.trim() && !isLoading
                  ? "0 4px 12px var(--accent-glow)"
                  : "none",
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

      {/* Autocomplete Suggestions Popover */}
      {showDropdown && suggestions.length > 0 && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 100,
            margin: 0,
            padding: "0.35rem 0",
            listStyle: "none",
            background: "var(--bg-surface)",
            borderRadius: "0 0 20px 20px",
            border: `1.5px solid ${isFocused ? "var(--border-focus)" : "var(--border-subtle)"}`,
            borderTop: "1px solid var(--border-subtle)",
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.45)",
            backdropFilter: "blur(20px)",
            maxHeight: "320px",
            overflowY: "auto",
          }}
        >
          {suggestions.map((suggestion, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <li
                key={`${suggestion}-${idx}`}
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent blur before click registers
                  triggerSearch(suggestion);
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  padding: "0.65rem 1.25rem",
                  fontSize: "var(--font-size-sm)",
                  color: isSelected
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                  background: isSelected
                    ? "var(--bg-surface-elevated)"
                    : "transparent",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Search
                    size={16}
                    style={{
                      color: isSelected
                        ? "var(--accent)"
                        : "var(--text-muted)",
                      flexShrink: 0,
                    }}
                  />
                  <span>{suggestion}</span>
                </div>
                <ArrowUpRight
                  size={14}
                  style={{
                    color: "var(--text-muted)",
                    opacity: isSelected ? 0.8 : 0,
                    transition: "opacity 0.15s ease",
                    flexShrink: 0,
                  }}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
