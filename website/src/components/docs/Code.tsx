import { highlightCode } from '@/lib/highlight'
import { CopyButton } from './CopyButton'

interface CodeProps {
    code: string
    lang?: string
    filename?: string
}

/** Server component: highlights code at build time and adds a copy control. */
export async function Code({ code, lang = 'text', filename }: CodeProps) {
    const html = await highlightCode(code, lang)
    return (
        <div className="cd-code">
            <div className="cd-code-head">
                <span className="cd-code-label">{filename ?? lang}</span>
                <CopyButton text={code} />
            </div>
            <div className="cd-code-body" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
    )
}
