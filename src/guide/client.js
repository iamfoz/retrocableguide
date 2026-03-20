import { APP_CONFIG } from "../config.js";
import { buildDemoGuidePayload } from "./demoData.js";

export async function loadGuideData() {
  try {
    const response = await fetch(APP_CONFIG.proxyPath);
    if (!response.ok) {
      throw new Error(`Guide request failed with ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return {
      ...buildDemoGuidePayload(),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
