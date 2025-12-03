// app\i18n\clerk - et.ts
import { enUS } from "@clerk/localizations";

export const etEE = {
  ...enUS,
  locale: "et-EE",

  // Меню аватарки (UserButton)
  userButton: {
    ...(enUS.userButton ?? {}),
    action__manageAccount: "Halda kontot",
    action__signOut: "Logi välja",
  },

  // Страница входа (как было)
  signIn: {
    ...(enUS.signIn ?? {}),
    start: {
      ...(enUS.signIn?.start ?? {}),
      title: "Logi sisse",
      subtitle: "Jätkamiseks logi oma kontoga",
    },
  },

  // (Опционально) Страница профиля/настроек
  userProfile: {
    ...(enUS.userProfile ?? {}),
    navbar: {
      ...(enUS.userProfile?.navbar ?? {}),
      account: "Konto",
      security: "Turvalisus",
    },
  },
} satisfies typeof enUS;
