import { entities } from "@/api/entities";
import { invoke } from "@/api/functions";
import { uploadFile } from "@/api/uploads";

const WHATSAPP_CONNECT_URL = import.meta.env.VITE_WHATSAPP_CONNECT_URL || "";

export const base44 = {
  entities,
  integrations: {
    Core: {
      UploadFile: uploadFile,
    },
  },
  functions: {
    invoke,
  },
  agents: {
    getWhatsAppConnectURL() {
      return WHATSAPP_CONNECT_URL || "#";
    },
    async listConversations() {
      return [];
    },
    async addMessage() {
      throw new Error("WhatsApp provider is not configured");
    },
  },
};
