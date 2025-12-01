import {DOCUMENT, inject, Injectable, Renderer2, RendererFactory2} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BotpressService {
  private renderer: Renderer2;
  private chatActivo = false;
  private scriptsInyectados: HTMLScriptElement[] = [];
  document: Document = inject(DOCUMENT);
  private botpressScriptUrl = 'https://cdn.botpress.cloud/webchat/v3.4/inject.js';
  private botpressConfigUrl = 'https://files.bpcontent.cloud/2025/11/24/21/20251124215022-R8UW9CO6.js';
  constructor(
    rendererFactory: RendererFactory2,
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }
  initChat() {
    if (this.chatActivo) return;
    console.log('Iniciando Botpress...');
    const scriptInject = this.renderer.createElement('script');
    scriptInject.src = this.botpressScriptUrl;
    scriptInject.async = true;
    this.renderer.appendChild(this.document.body, scriptInject);
    this.scriptsInyectados.push(scriptInject);
    scriptInject.onload = () => {
      const scriptConfig = this.renderer.createElement('script');
      scriptConfig.src = this.botpressConfigUrl;
      scriptConfig.defer = true;
      this.renderer.appendChild(this.document.body, scriptConfig);
      this.scriptsInyectados.push(scriptConfig);
    };
    this.chatActivo = true;
  }
  destroyChat() {
    console.log('Destruyendo Botpress (Objetivo: .bpChatContainer)...');
    const win = this.document.defaultView as any;
    if (win && win.botpressWebChat) {
      win.botpressWebChat = undefined;
    }
    const scripts = ['bp-inject-script', 'bp-config-script'];
    scripts.forEach(id => {
      const el = this.document.getElementById(id);
      if (el) el.remove();
    });
    this.scriptsInyectados = [];
    const elementosChat = this.document.getElementsByClassName('bpChatContainer');
    while (elementosChat.length > 0) {
      const elemento = elementosChat[0];
      if (elemento && elemento.parentNode) {
        elemento.parentNode.removeChild(elemento);
      } else {
        elemento.remove();
      }
    }
    const widget = this.document.getElementById('bp-web-widget');
    if (widget) widget.remove();
    console.log('Limpieza de Botpress completada.');
  }
}
