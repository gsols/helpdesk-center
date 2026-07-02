import { useRef, useState, useCallback, useEffect } from 'react';

/**
 * SplitPane
 * Renders two resizable columns separated by a draggable divider.
 *
 * Props:
 *   leftContent   — JSX for the left column
 *   rightContent  — JSX for the right column
 *   initialLeft   — initial left-column width as a percentage (default 40)
 *   minLeft       — minimum left width % (default 20)
 *   maxLeft       — maximum left width % (default 70)
 *   height        — CSS height string for both columns (default 'calc(100vh - 88px)')
 */
export default function SplitPane({
  leftContent,
  rightContent,
  initialLeft = 40,
  minLeft = 20,
  maxLeft = 70,
  height = 'calc(100vh - 88px)',
}) {
  const [leftPct, setLeftPct] = useState(initialLeft);
  const containerRef          = useRef(null);
  const dragging              = useRef(false);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor    = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragging.current || !containerRef.current) return;
      const rect  = containerRef.current.getBoundingClientRect();
      const pct   = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.min(maxLeft, Math.max(minLeft, pct)));
    };
    const onMouseUp = () => {
      if (!dragging.current) return;
      dragging.current               = false;
      document.body.style.cursor    = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
    };
  }, [minLeft, maxLeft]);

  return (
    <div
      ref={containerRef}
      style={{ display: 'flex', alignItems: 'flex-start', gap: 0, width: '100%' }}
    >
      {/* Left column */}
      <div
        className="split-list-col"
        style={{
          width: `${leftPct}%`,
          flexShrink: 0,
          minWidth: 0,
          overflowY: 'auto',
          maxHeight: height,
        }}
      >
        {leftContent}
      </div>

      {/* Drag handle */}
      <div
        onMouseDown={onMouseDown}
        style={{
          width: 9,
          flexShrink: 0,
          alignSelf: 'stretch',
          cursor: 'col-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 4px',
          borderRadius: 4,
        }}
        onMouseEnter={e => { e.currentTarget.querySelector('div').style.background = '#c0cdd8'; }}
        onMouseLeave={e => { e.currentTarget.querySelector('div').style.background = '#d1d5db'; }}
        title="Drag to resize"
      >
        {/* Visual track */}
        <div style={{
          width: 3,
          height: '100%',
          minHeight: 40,
          background: '#d1d5db',
          borderRadius: 3,
          transition: 'background 0.15s',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Right column */}
      <div
        className="split-detail-col"
        style={{
          flex: 1,
          minWidth: 0,
          overflowY: 'auto',
          maxHeight: height,
        }}
      >
        {rightContent}
      </div>
    </div>
  );
}
