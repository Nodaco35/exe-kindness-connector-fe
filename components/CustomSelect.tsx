"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import styles from "./CustomSelect.module.scss";

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Vui lòng chọn...",
  disabled = false,
  required = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div
      ref={dropdownRef}
      className={`${styles.selectContainer} ${isOpen ? styles.isOpen : ""} ${
        disabled ? styles.disabled : ""
      }`}
    >
      <div className={styles.selectTrigger} onClick={handleToggle}>
        <span className={selectedOption ? styles.selectedText : styles.placeholder}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={18} className={styles.arrow} />
      </div>

      {isOpen && (
        <ul className={styles.optionsList}>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li
                key={opt.value}
                className={`${styles.optionItem} ${isSelected ? styles.isSelected : ""}`}
                onClick={() => handleSelect(opt.value)}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={16} className={styles.checkIcon} />}
              </li>
            );
          })}
        </ul>
      )}
      
      {/* Hidden input to support native form validation if needed */}
      <input
        type="text"
        value={value}
        required={required}
        disabled={disabled}
        readOnly
        style={{
          opacity: 0,
          position: "absolute",
          width: 0,
          height: 0,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
