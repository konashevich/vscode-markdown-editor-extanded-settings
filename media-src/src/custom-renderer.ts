import Vditor from 'vditor'

const WalkContinue = 0
const WikiLinkPattern = /\[\[([^[\]\n]+?)\]\]/g

interface WikiRendererOptions {
  enabled: boolean
}

export function setupCustomRenderer(
  vditor: Vditor,
  options: WikiRendererOptions
) {
  const lute = vditor.lute
  const renderText = (node: any, entering: boolean) => {
    if (!entering) {
      return ['', WalkContinue]
    }

    const text = node.TokensStr()
    WikiLinkPattern.lastIndex = 0

    if (!options.enabled || !WikiLinkPattern.test(text)) {
      WikiLinkPattern.lastIndex = 0
      return [escapeHTML(text), WalkContinue]
    }

    WikiLinkPattern.lastIndex = 0
    const fragments: string[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = WikiLinkPattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        fragments.push(escapeHTML(text.slice(lastIndex, match.index)))
      }

      const source = match[0]
      const payload = parseWikiLinkPayload(match[1])
      const displayText = payload.label || payload.target

      fragments.push(
        `<span class="wiki-link-chip" data-wiki-link="1" data-wiki-target="${escapeAttribute(
          payload.target
        )}" data-wiki-source="${escapeAttribute(source)}" title="Open wiki page ${escapeAttribute(
          payload.target
        )}">${escapeHTML(displayText)}</span>`
      )

      lastIndex = WikiLinkPattern.lastIndex
    }

    if (lastIndex < text.length) {
      fragments.push(escapeHTML(text.slice(lastIndex)))
    }

    return [fragments.join(''), WalkContinue]
  }

  lute.SetJSRenderers({
    renderers: {
      Md2VditorIRDOM: { renderText },
      Md2VditorDOM: { renderText },
      Md2VditorSVDOM: { renderText },
      Md2HTML: { renderText },
      HTML2Md: {
        renderInlineHTML: (node: any, entering: boolean) => {
          if (!entering) {
            return ['', WalkContinue]
          }

          const html = node.TokensStr()
          const match = html.match(/data-wiki-source="([^"]+)"/)
          if (match) {
            return [unescapeHTML(match[1]), WalkContinue]
          }

          return [html, WalkContinue]
        },
      },
    },
  })
}

function parseWikiLinkPayload(payload: string) {
  const [target, label] = payload.split('|', 2).map((part) => part.trim())

  return {
    target,
    label: label || '',
  }
}

function escapeHTML(str: string) {
  return str.replace(/[&<>"']/g, (match) => HtmlEscapeMap[match] || match)
}

function escapeAttribute(str: string) {
  return escapeHTML(str)
}

function unescapeHTML(str: string) {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

const HtmlEscapeMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}
