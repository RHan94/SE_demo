import { contextBridge, ipcRenderer } from 'electron';
import type { CodeGenerationRequest, CodeResponse, UmlResponse } from './openaiService';

declare global {
  interface Window {
    api: {
      generateUml(prompt: string): Promise<UmlResponse>;
      generateCode(request: CodeGenerationRequest): Promise<CodeResponse>;
    };
  }
}

contextBridge.exposeInMainWorld('api', {
  async generateUml(prompt: string): Promise<UmlResponse> {
    return ipcRenderer.invoke('generate-uml', prompt);
  },
  async generateCode(request: CodeGenerationRequest): Promise<CodeResponse> {
    return ipcRenderer.invoke('generate-code', request);
  },
});
