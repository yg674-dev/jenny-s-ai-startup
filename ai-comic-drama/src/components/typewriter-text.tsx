"use client";

import { useEffect, useRef, useState } from "react";

const CHAR_MS = 32;

export function TypewriterText({
  text,
  onDone,
  className,
  cursor = true,
}: {
  text: string;
  onDone?: () => void;
  className?: string;
  cursor?: boolean;
}) {
  const [shown, setShown] = useState("");
  const [skipped, setSkipped] = useState(false);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    setShown("");
    setSkipped(false);
    if (!text) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setShown(text);
      onDoneRef.current?.();
      return;
    }

    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        onDoneRef.current?.();
      }
    }, CHAR_MS);
    return () => clearInterval(interval);
  }, [text]);

  const isDone = skipped || shown.length >= text.length;

  return (
    <div
      className={className}
      onClick={() => {
        if (!isDone) {
          setShown(text);
          setSkipped(true);
          onDoneRef.current?.();
        }
      }}
    >
      <NarrativeBody
        text={isDone ? text : shown}
        showCursor={cursor && !isDone}
      />
    </div>
  );
}

function NarrativeBody({
  text,
  showCursor,
}: {
  text: string;
  showCursor: boolean;
}) {
  const lines = text.split("\n").filter((l) => l.length > 0 || text === "");
  return (
    <div className="flex flex-col gap-3">
      {lines.map((line, i) => {
        const dialogue = line.match(/^([^：:]{1,12})[:：]\s*(.+)$/);
        const isLast = i === lines.length - 1;
        if (dialogue) {
          return (
            <p
              key={`line-${i}-${line.length}`}
              className="pl-4 border-l-2 border-primary/50"
            >
              <span className="text-primary/90 font-medium mr-2">
                {dialogue[1]}
              </span>
              <span
                className={
                  isLast && showCursor ? "typewriter-cursor" : undefined
                }
              >
                「{dialogue[2]}」
              </span>
            </p>
          );
        }
        return (
          <p
            key={`line-${i}-${line.length}`}
            className={isLast && showCursor ? "typewriter-cursor" : undefined}
          >
            {line || " "}
          </p>
        );
      })}
    </div>
  );
}
