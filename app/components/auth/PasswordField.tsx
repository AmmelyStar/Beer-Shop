// app/components/auth/PasswordField.tsx
"use client";

import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

type PasswordFieldProps = {
  id?: string;
  name?: string;
  label: string; // локализованный текст для label
  value: string;
  onChange: (value: string) => void;

  showPassword: boolean;
  onToggleShow: () => void;

  autoComplete?: string;
  required?: boolean;
  placeholder?: string;

  // локализованные тексты для aria-label кнопки глаза
  showPasswordLabel: string;
  hidePasswordLabel: string;

  // опциональный help-текст под полем (тоже локализуемый)
  hint?: string;
};

export default function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  showPassword,
  onToggleShow,
  autoComplete,
  required = true,
  placeholder,
  showPasswordLabel,
  hidePasswordLabel,
  hint,
}: PasswordFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm/6 font-medium text-gray-300">
        {label}
      </label>

      <div className="mt-2 relative">
        <input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full rounded-md bg-white px-3 py-1.5 pr-10 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
        />

        <button
          type="button"
          onClick={onToggleShow}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
          aria-label={showPassword ? hidePasswordLabel : showPasswordLabel}
        >
          {showPassword ? (
            <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
          ) : (
            <EyeIcon className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
