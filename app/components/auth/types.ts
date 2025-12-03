// app/components/auth/types.ts (пример, можешь положить где удобно)
export type AuthMessages = {
  signIn: string;
  signUp: string;
  welcomeBack: string;
  createAccount: string;
  email: string;
  password: string;
  confirmPassword: string;

  passwordStrength: string;
  passwordHint: string;
  passwordStrengthWeak: string;
  passwordStrengthMedium: string;
  passwordStrengthStrong: string;

  showPasswordAria: string;
  hidePasswordAria: string;

  forgotPassword: string;
  submitSignIn: string;
  submitSignUp: string;

  passwordsDontMatch: string;
  enterEmailFirst: string;
  resetSent: string;
  weakPassword: string;

  accountCreated: string;
  signInFlowIncomplete: string;
  signUpFlowIncomplete: string;

  somethingWentWrong: string;

  forgotPasswordDescription: string;
  resetPasswordDescription: string;
  sendResetCodeButton: string;
  resetPasswordButton: string;
};
