/**
 * CommentSection — "employee_ticket_detail_refined_layout" wireframe
 *
 * Editor: contenteditable div — WYSIWYG inline formatting like an email composer.
 * Toolbar uses document.execCommand for bold/italic/underline (native browser),
 * and insertHTML for code and links.
 * On submit the DOM is serialised back to a plain-text markdown-compatible string
 * that the backend stores and the bubble renderer displays.
 *
 * Layout (top → bottom):
 *  1. INITIAL REPORT card  — ticket.description + ticket.createdAt (pinned)
 *  2. System event pill    — "AGENT ASSIGNED TO TICKET"
 *  3. Conversation thread  — agent LEFT, employee RIGHT
 *  4. Toolbar (above editor)
 *  5. contenteditable editor + Send button row
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { useMessages, useAddMessage } from '../hooks/useMessages';
import { useAuth } from '../context/AuthContext';
import { useTicketSocket } from '../hooks/useTicketSocket';
import { Bold, Italic, Link2, Paperclip, List, Code2, Send, ChevronDown, ChevronUp, Wifi, WifiOff } from 'lucide-react';

/* ── DOM → markdown serialiser ───────────────────────────────────────────── */
/**
 * Walks a contenteditable DOM node and converts browser-native formatting
 * back to the markdown tokens the backend stores and the bubble renderer uses.
 *
 * Handles: <b>/<strong> → **…**, <i>/<em> → _…_, <code> → `…`,
 *          <a> → […](url),  <li>/<div starting with •> → • …,
 *          <br>/<div> → newline, plain text → verbatim.
 */
function serialiseToMarkdown(el) {
  let out = '';

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const tag = node.tagName.toLowerCase();

    if (tag === 'br') { out += '\n'; return; }

    if (tag === 'b' || tag === 'strong') {
      out += '**'; node.childNodes.forEach(walk); out += '**'; return;
    }
    if (tag === 'i' || tag === 'em') {
      out += '_'; node.childNodes.forEach(walk); out += '_'; return;
    }
    if (tag === 'code') {
      out += '`'; node.childNodes.forEach(walk); out += '`'; return;
    }
    if (tag === 'a') {
      const href = node.getAttribute('href') || 'url';
      out += '['; node.childNodes.forEach(walk); out += `](${href})`; return;
    }
    if (tag === 'li') {
      out += '• '; node.childNodes.forEach(walk); out += '\n'; return;
    }
    if (tag === 'ul' || tag === 'ol') {
      node.childNodes.forEach(walk); return;
    }

    // Block elements (div, p) → newline after content (mimics visual line break)
    const isBlock = ['div', 'p'].includes(tag);
    const before = out;
    node.childNodes.forEach(walk);
    // Only append newline if content was added and doesn't already end with one
    if (isBlock && out !== before && !out.endsWith('\n')) out += '\n';
  }

  el.childNodes.forEach(walk);
  return out.replace(/\n$/, '').trim(); // strip trailing newline
}

/* ── Markdown → HTML for paste-back-in (initial load / clear) ───────────── */
// Not needed — editor always starts empty after send.

/* ── renderMarkdown — used only in chat bubbles ──────────────────────────── */
function renderMarkdown(text, isDark = false) {
  if (!text) return null;
  const INLINE = /(`[^`]+`)|(\*\*(.+?)\*\*)|(_(.+?)_)|(\[([^\]]+)\]\(([^)]+)\))/g;

  function renderInline(line) {
    const parts = [];
    let last = 0, m;
    INLINE.lastIndex = 0;
    while ((m = INLINE.exec(line)) !== null) {
      if (m.index > last) parts.push(line.slice(last, m.index));
      if (m[1]) {
        parts.push(<code key={m.index} style={{
          fontFamily: 'monospace', fontSize: '0.88em',
          background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
          padding: '1px 5px', borderRadius: 3,
        }}>{m[1].slice(1, -1)}</code>);
      } else if (m[2]) {
        parts.push(<strong key={m.index}>{m[3]}</strong>);
      } else if (m[4]) {
        parts.push(<em key={m.index}>{m[5]}</em>);
      } else if (m[6]) {
        parts.push(<a key={m.index} href={m[8]} target="_blank" rel="noreferrer" style={{
          color: isDark ? '#93c5fd' : '#2563eb', textDecoration: 'underline',
        }}>{m[7]}</a>);
      }
      last = m.index + m[0].length;
    }
    if (last < line.length) parts.push(line.slice(last));
    return parts;
  }

  const lines = text.split('\n');
  const nodes = [];
  lines.forEach((line, i) => {
    const isBullet = line.startsWith('• ') || line.startsWith('- ');
    const content  = isBullet ? line.slice(2) : line;
    if (isBullet) {
      nodes.push(
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
          <span style={{ flexShrink: 0, marginTop: 1 }}>•</span>
          <span>{renderInline(content)}</span>
        </div>
      );
    } else if (line === '') {
      nodes.push(<div key={i} style={{ height: '0.5em' }} />);
    } else {
      nodes.push(<div key={i}>{renderInline(line)}</div>);
    }
  });
  return nodes;
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const fmtTime = (d) => d
  ? new Date(d).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    })
  : '';

function getInitials(fullName) {
  if (!fullName) return '?';
  const parts = fullName.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

/* ── Initial Report card ─────────────────────────────────────────────────── */
function InitialReportCard({ ticket }) {
  const [open, setOpen] = useState(false);
  if (!ticket) return null;
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 10,
      borderBottom: '1px solid #e5e7eb',
      background: '#ffffff',
      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    }}>
      <div onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '9px 14px', background: '#f8f9ff',
        borderBottom: open ? '1px solid #e5e7eb' : 'none',
        cursor: 'pointer', userSelect: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#45464d' }}>
            Initial Report
          </span>
          <span style={{ fontSize: 10, color: '#76777d' }}>{fmtTime(ticket.createdAt)}</span>
        </div>
        <span style={{ color: '#9ca3af', display: 'flex' }}>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </div>
      {open && (
        <div style={{ padding: '12px 14px', fontSize: 14, color: '#0b1c30', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {ticket.description
            ? ticket.description
            : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No description provided.</span>
          }
        </div>
      )}
    </div>
  );
}

/* ── System event pill ───────────────────────────────────────────────────── */
function SystemPill({ text }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 16px' }}>
      <span style={{
        background: '#e5eeff', border: '1px solid rgba(198,198,205,0.4)',
        borderRadius: 999, fontSize: 10, fontWeight: 700,
        letterSpacing: '0.07em', textTransform: 'uppercase', color: '#45464d',
        padding: '3px 12px',
      }}>{text}</span>
    </div>
  );
}

/* ── Message bubbles ─────────────────────────────────────────────────────── */
function OwnMessage({ comment }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, maxWidth: '85%', marginLeft: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, color: '#76777d' }}>{fmtTime(comment.createdAt)}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0b1c30' }}>{comment.sender?.name ?? 'You'}</span>
      </div>
      <div style={{
        background: '#0b1c30', border: '1px solid #0b1c30',
        padding: '12px 14px', fontSize: 14, color: '#ffffff', lineHeight: 1.6,
        borderRadius: '8px 0 8px 8px', wordBreak: 'break-word',
      }}>
        {renderMarkdown(comment.body, true)}
      </div>
    </div>
  );
}

function TheirMessage({ comment }) {
  const initials = getInitials(comment.sender?.name);
  const isAgentSender = comment.sender?.role && comment.sender.role !== 'EMPLOYEE';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: '85%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', background: '#1e293b',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 700, color: '#94a3b8', flexShrink: 0,
        }}>{initials}</div>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0b1c30' }}>{comment.sender?.name ?? 'User'}</span>
        {isAgentSender && <span style={{ fontSize: 13, color: '#3b82f6' }} title="Support Agent">✓</span>}
        <span style={{ fontSize: 11, color: '#76777d' }}>{fmtTime(comment.createdAt)}</span>
      </div>
      <div style={{
        background: '#dce9ff', border: '1px solid #c6c6cd',
        padding: '12px 14px', fontSize: 14, color: '#0b1c30', lineHeight: 1.6,
        borderRadius: '0 8px 8px 8px', wordBreak: 'break-word',
      }}>
        {renderMarkdown(comment.body, false)}
      </div>
    </div>
  );
}

/* ── Main CommentSection ─────────────────────────────────────────────────── */
export default function CommentSection({ ticketId, ticket, onAttachFile }) {
  const { user } = useAuth();
  const { data: comments = [], isLoading } = useMessages(ticketId);
  const addMessage = useAddMessage();
  const attachInputRef = useRef(null);
  const editorRef      = useRef(null);   // contenteditable div
  const scrollContainerRef = useRef(null);
  const bottomRef = useRef(null);

  // Track whether editor has any content (for Send button disabled state)
  const [isEmpty, setIsEmpty] = useState(true);

  /* ── Live connection status ─────────────────────────────────────────────── */
  const [wsLive, setWsLive] = useState(false);
  useTicketSocket(ticketId, () => setWsLive(true));
  const wsStatus = wsLive || !isLoading ? 'live' : 'connecting';

  /* Scroll to bottom on new messages */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  /* ── Drag-to-resize ─────────────────────────────────────────────────────── */
  const MIN_H = 120, MAX_H = 480;
  const [editorHeight, setEditorHeight] = useState(200);
  const dragStartY = useRef(null);
  const dragStartH = useRef(null);

  const onDragStart = useCallback((e) => {
    e.preventDefault();
    dragStartY.current = e.clientY;
    dragStartH.current = editorHeight;
    const onMove = (ev) => setEditorHeight(Math.min(MAX_H, Math.max(MIN_H, dragStartH.current + (dragStartY.current - ev.clientY))));
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [editorHeight]);

  /* ── execCommand helpers ────────────────────────────────────────────────── */
  const exec = useCallback((cmd, value = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    setIsEmpty(!editorRef.current?.textContent?.trim());
  }, []);

  const insertLink = useCallback(() => {
    const sel = window.getSelection();
    const selectedText = sel?.toString() || 'link text';
    const url = window.prompt('Enter URL:', 'https://');
    if (!url) return;
    editorRef.current?.focus();
    document.execCommand('insertHTML', false,
      `<a href="${url}" target="_blank" rel="noreferrer" style="color:#2563eb;text-decoration:underline">${selectedText}</a>`
    );
    setIsEmpty(false);
  }, []);

  const insertCode = useCallback(() => {
    const sel = window.getSelection();
    const selectedText = sel?.toString() || 'code';
    editorRef.current?.focus();
    document.execCommand('insertHTML', false,
      `<code style="font-family:monospace;font-size:0.88em;background:rgba(0,0,0,0.08);padding:1px 5px;border-radius:3px">${selectedText}</code>`
    );
    setIsEmpty(false);
  }, []);

  const insertBullet = useCallback(() => {
    editorRef.current?.focus();
    // If already in a list context, execCommand toggles it off; works both ways
    document.execCommand('insertUnorderedList', false, null);
    setIsEmpty(!editorRef.current?.textContent?.trim());
  }, []);

  /* ── Keyboard shortcuts ─────────────────────────────────────────────────── */
  const handleKeyDown = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') { e.preventDefault(); exec('bold');   return; }
      if (e.key === 'i') { e.preventDefault(); exec('italic'); return; }
      if (e.key === 'k') { e.preventDefault(); insertLink();   return; }
      if (e.key === '`') { e.preventDefault(); insertCode();   return; }
    }
    // Enter sends (Shift+Enter = real newline handled by browser default)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isEmpty && !addMessage.isPending) submitMessage();
    }
  }, [isEmpty, addMessage.isPending]); // eslint-disable-line

  /* ── Submit ─────────────────────────────────────────────────────────────── */
  const submitMessage = async () => {
    const el = editorRef.current;
    if (!el) return;
    const markdown = serialiseToMarkdown(el);
    if (!markdown) return;
    try {
      await addMessage.mutateAsync({ ticketId, message: markdown });
      // Clear the editor
      el.innerHTML = '';
      setIsEmpty(true);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch {
      alert('Failed to post comment');
    }
  };

  const isOwn = (c) => c.sender?.id != null && c.sender.id === user?.id;

  /* ── Toolbar button style helpers ───────────────────────────────────────── */
  const tbBtn = (title, onClick, children) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }} // prevent blur
      style={toolbarBtnStyle}
    >
      {children}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#ffffff' }}>

      {/* ── Live status strip ────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '4px 14px',
        background: wsStatus === 'live' ? '#f0fdf4' : '#fffbeb',
        borderBottom: '1px solid #e5e7eb',
        fontSize: 11, fontWeight: 600,
        color: wsStatus === 'live' ? '#15803d' : '#92400e',
      }}>
        {wsStatus === 'live'
          ? <><Wifi size={12} /> Live</>
          : <><WifiOff size={12} /> Connecting…</>
        }
      </div>

      {/* ── Conversation thread ──────────────────────────────────────────── */}
      <div ref={scrollContainerRef} style={{ flex: 1, padding: '0 0 16px 0', overflowY: 'auto', minHeight: 0 }}>
        <InitialReportCard ticket={ticket} />
        <div style={{ padding: '16px 20px 0' }}>
          {ticket?.assignee && <SystemPill text={`${ticket.assignee.name} assigned to ticket`} />}
          {isLoading ? (
            <p style={{ fontSize: 13, color: '#76777d' }}>Loading…</p>
          ) : comments.length === 0 ? (
            <p style={{ fontSize: 13, color: '#76777d', textAlign: 'center', padding: '8px 0' }}>No replies yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {comments.map((c) => isOwn(c)
                ? <OwnMessage   key={c.id} comment={c} />
                : <TheirMessage key={c.id} comment={c} />
              )}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Reply editor — resizable ─────────────────────────────────────── */}
      <div style={{ height: editorHeight, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#f8f9ff' }}>

        {/* Drag handle */}
        <div onMouseDown={onDragStart} style={{
          height: 6, flexShrink: 0,
          background: '#f1f5f9',
          borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb',
          cursor: 'ns-resize',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: '#cbd5e1' }} />)}
          </div>
        </div>

        {/* Editor card */}
        <div style={{ flex: 1, padding: '0 16px 16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ border: '1px solid #e5e7eb', background: '#ffffff', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

            {/* ── Formatting toolbar ─────────────────────────────────────── */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0,
              padding: '4px 6px',
              borderBottom: '1px solid #e5e7eb',
              background: '#f8f9ff',
            }}>
              {tbBtn('Bold (Ctrl+B)',         () => exec('bold'),    <Bold   size={14} />)}
              {tbBtn('Italic (Ctrl+I)',        () => exec('italic'),  <Italic size={14} />)}
              {tbBtn('Link (Ctrl+K)',          insertLink,            <Link2  size={14} />)}
              {/* Paperclip — file attach */}
              <button
                type="button"
                title="Attach file"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => attachInputRef.current?.click()}
                style={toolbarBtnStyle}
              >
                <Paperclip size={14} />
              </button>
              <div style={{ width: 1, height: 16, background: '#e5e7eb', margin: '0 4px' }} />
              {tbBtn('Bullet list',           insertBullet,          <List   size={14} />)}
              {tbBtn('Inline code (Ctrl+`)',  insertCode,            <Code2  size={14} />)}
            </div>

            {/* Hidden file input */}
            <input
              ref={attachInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => { if (onAttachFile) onAttachFile(e.target.files); e.target.value = ''; }}
            />

            {/* ── contenteditable editor ─────────────────────────────────── */}
            <div style={{ flex: 1, position: 'relative', minHeight: 0, overflow: 'hidden' }}>
              {/* Placeholder — shown when editor is empty */}
              {isEmpty && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0,
                  padding: '10px 14px',
                  fontSize: 14, color: '#94a3b8',
                  pointerEvents: 'none', userSelect: 'none',
                }}>
                  Type your reply here… (Shift+Enter for new line)
                </div>
              )}
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={() => setIsEmpty(!editorRef.current?.textContent?.trim())}
                onKeyDown={handleKeyDown}
                style={{
                  height: '100%', overflowY: 'auto',
                  padding: '10px 14px',
                  fontSize: 14, color: '#0b1c30', lineHeight: 1.65,
                  outline: 'none',
                  fontFamily: 'inherit',
                  wordBreak: 'break-word',
                }}
              />
            </div>

            {/* ── Bottom bar: "Replying as" + Send ───────────────────────── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0,
              padding: '5px 8px 5px 14px',
              borderTop: '1px solid #e5e7eb',
              background: '#f8f9ff',
            }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#76777d' }}>
                Replying as <span style={{ color: '#0b1c30' }}>{user?.name ?? 'You'}</span>
              </span>
              <button
                type="button"
                onClick={submitMessage}
                disabled={addMessage.isPending || isEmpty}
                style={{
                  background: addMessage.isPending || isEmpty ? '#94a3b8' : '#0b1c30',
                  color: '#ffffff', border: 'none',
                  padding: '5px 14px',
                  fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  cursor: addMessage.isPending || isEmpty ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                  borderRadius: 0, transition: 'background 150ms', flexShrink: 0,
                }}
              >
                {addMessage.isPending ? 'Sending…' : 'Send'}
                <Send size={11} />
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Style constants ─────────────────────────────────────────────────────── */
const toolbarBtnStyle = {
  background: 'transparent', border: 'none',
  color: '#45464d', cursor: 'pointer',
  padding: '4px 5px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: 3,
};
