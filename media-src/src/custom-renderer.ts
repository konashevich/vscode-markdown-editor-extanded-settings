import Vditor from 'vditor'

export function setupCustomRenderer(vditor: Vditor) {
  // Access the Lute instance
  const lute = vditor.lute;
  
  // Try to get WalkContinue from the constructor or default to 0
  // In Lute, WalkStop=1, WalkSkipChildren=2, WalkContinue=0
  const WalkContinue = 0;

  lute.SetJSRenderers({
    renderers: {
      Md2VditorIRDOM: {
        renderText: (node: any, entering: boolean) => {
          if (entering) {
            const text = node.TokensStr();
            // Regex for [@...]
            const regex = /\[@(.*?)\]/g;
            
            if (regex.test(text)) {
              const fragments: string[] = [];
              let lastPos = 0;
              let m;
              
              // Reset regex lastIndex just in case
              regex.lastIndex = 0;
              
              while ((m = regex.exec(text)) !== null) {
                // Text before match
                if (m.index > lastPos) {
                  fragments.push(escapeHTML(text.slice(lastPos, m.index)));
                }
                
                // The match - wrapped in custom span
                // We use a specific class that Vditor might respect or at least not break
                // vditor-ir__node is used for IR nodes.
                fragments.push(`<span class="custom-syntax-highlight">${escapeHTML(m[0])}</span>`);
                
                lastPos = regex.lastIndex;
              }
              
              // Remaining text
              if (lastPos < text.length) {
                fragments.push(escapeHTML(text.slice(lastPos)));
              }
              
              return [fragments.join(''), WalkContinue];
            }
            
            // Default behavior: return escaped text
            return [escapeHTML(text), WalkContinue];
          }
          return ["", WalkContinue];
        }
      },
      HTML2Md: {
        renderInlineHTML: (node: any, entering: boolean) => {
          if (entering) {
            const html = node.TokensStr();
            // Check if it is our custom span
            const match = html.match(/<span class="custom-syntax-highlight">(.*?)<\/span>/);
            if (match) {
              const content = match[1];
              // Unescape HTML entities to get back the original text
              const unescaped = content.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
              return [unescaped, WalkContinue];
            }
            return [html, WalkContinue];
          }
          return ["", WalkContinue];
        }
      }
    }
  });
}

function escapeHTML(str: string) {
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m as keyof typeof map] || m);
}

const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
};
