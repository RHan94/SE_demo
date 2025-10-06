import { contextBridge, ipcRenderer } from 'electron';
import type { UmlResponse } from './openaiService';

declare global {
  interface Window {
    api: {
      generateUml(prompt: string): Promise<UmlResponse>;
    };
  }
}

contextBridge.exposeInMainWorld('api', {
  async generateUml(prompt: string): Promise<UmlResponse> {
    return ipcRenderer.invoke('generate-uml', prompt);
  },
});
