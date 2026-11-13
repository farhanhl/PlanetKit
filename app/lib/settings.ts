import { db } from "@/app/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface AppConfig {
  telegramBotToken?: string;
  telegramChatId?: string;
  canvaInviteLink?: string;
  removeBgApiKey?: string;
  updatedAt?: string;
}

const SETTINGS_COLLECTION = "settings";
const APP_CONFIG_DOC = "app_config";

export async function getAppConfig(): Promise<AppConfig> {
  try {
    const configDocRef = doc(db, SETTINGS_COLLECTION, APP_CONFIG_DOC);
    const snap = await getDoc(configDocRef);
    if (!snap.exists()) {
      return {
        telegramBotToken: "",
        telegramChatId: "",
        canvaInviteLink: "",
        removeBgApiKey: "",
        updatedAt: "",
      };
    }
    const data = snap.data() as AppConfig;

    return {
      telegramBotToken: data.telegramBotToken || "",
      telegramChatId: data.telegramChatId || "",
      canvaInviteLink: data.canvaInviteLink || "",
      removeBgApiKey: data.removeBgApiKey || "",
      updatedAt: data.updatedAt || "",
    };
  } catch (err) {
    console.error("Failed to fetch app config from firestore:", err);
    return {
      telegramBotToken: "",
      telegramChatId: "",
      canvaInviteLink: "",
      removeBgApiKey: "",
      updatedAt: "",
    };
  }
}

export async function saveAppConfig(config: Partial<AppConfig>): Promise<void> {
  const configDocRef = doc(db, SETTINGS_COLLECTION, APP_CONFIG_DOC);
  await setDoc(
    configDocRef,
    {
      ...config,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}
