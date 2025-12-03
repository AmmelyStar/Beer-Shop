// app/components/auth/AuthTabs.tsx
"use client";

type Mode = "login" | "register";

type AuthTabsProps = {
  mode: Mode;
  onChange: (mode: Mode) => void;
  signInLabel: string; // локализованный текст, например messages.signIn
  signUpLabel: string; // локализованный текст, например messages.signUp
};

export function AuthTabs({
  mode,
  onChange,
  signInLabel,
  signUpLabel,
}: AuthTabsProps) {
  return (
    <div className="mt-6 flex w-full border-b border-white/10">
      <button
        type="button"
        onClick={() => onChange("login")}
        className={`flex-1 pb-6 px-1 text-center text-base font-semibold transition-colors border-b-2 ${
          mode === "login"
            ? "text-yellow-400 border-yellow-400"
            : "text-gray-500 hover:text-white border-transparent"
        }`}
      >
        {signInLabel}
      </button>

      <button
        type="button"
        onClick={() => onChange("register")}
        className={`flex-1 pb-3 px-1 text-center text-base font-semibold transition-colors border-b-2 ${
          mode === "register"
            ? "text-yellow-400 border-yellow-400"
            : "text-gray-500 hover:text-white border-transparent"
        }`}
      >
        {signUpLabel}
      </button>
    </div>
  );
}
