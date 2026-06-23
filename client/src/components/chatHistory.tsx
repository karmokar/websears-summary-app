import { useState, useRef, useEffect } from "react";
import { type Message } from "@/pages/Dashboard";
import { User, Bot, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface User {
  Username: string;
  Email: string;
}

// 1. Collapsible Long Text Message
const LongTextMessage = ({
  content,
  role,
}: {
  content: string;
  role: string;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = role === "user" && content.length > 500;

  return (
    <div className="relative">
      <div className={isLong && !isExpanded ? "max-h-48 overflow-hidden" : ""}>
        <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
        {isLong && !isExpanded && (
          <div
            className={`absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t to-transparent pointer-events-none ${
              role === "user" ? "from-blue-500" : "from-neutral-100"
            }`}
          />
        )}
      </div>
      {isLong && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-xs font-medium opacity-70 hover:opacity-100 transition-opacity"
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
};

// 2. Markdown Components Configuration
const markdownComponents = {
  p: ({ children }: any) => (
    <p className="mb-2 last:mb-0 whitespace-pre-wrap break-words">{children}</p>
  ),
  strong: ({ children }: any) => (
    <strong className="font-semibold">{children}</strong>
  ),
  ul: ({ children }: any) => (
    <ul className="list-disc list-outside ml-4 space-y-1 my-2">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal list-outside ml-4 space-y-1 my-2">
      {children}
    </ol>
  ),
  li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
  h1: ({ children }: any) => (
    <h1 className="text-lg font-bold mb-2">{children}</h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-base font-bold mb-1">{children}</h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-sm font-semibold mb-1">{children}</h3>
  ),
  code: ({ inline, className, children, ...props }: any) => {
    if (!inline) {
      return (
        <code
          className="block bg-[#1e1e1e] text-gray-200 rounded-xl p-4 text-xs font-mono overflow-x-auto my-2"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code
        className="bg-black/20 text-inherit rounded px-1.5 py-0.5 text-[11px] font-mono"
        {...props}
      >
        {children}
      </code>
    );
  },
};

const formatAIResponse = (text: string): string => {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return sentences.map((s) => `- ${s}`).join("\n");
};

// 3. Main ChatHistory Component
export const ChatHistory = ({
  messages,
  isLoading,
  user,
}: {
  messages: Message[];
  isLoading: boolean;
  user: User | null;
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <h1
          className="text-5xl text-center font-bold italic"
          style={{ fontFamily: "'Dancing Script', cursive" }}
        >
          Hello {user ? user.Username : "Guest"}
        </h1>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex items-start gap-3 ${
            message.role === "user" ? "flex-row-reverse" : "flex-row"
          }`}
        >
          {/* Avatar */}
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
              message.role === "user"
                ? "bg-blue-500 text-white"
                : "bg-neutral-200 text-neutral-600"
            }`}
          >
            {message.role === "user" ? <User size={16} /> : <Bot size={16} />}
          </div>

          {/* Bubble */}
          <div
            className={`max-w-[75%] flex flex-col gap-1 ${
              message.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <p className="text-xs font-semibold text-neutral-500 px-1">
              {message.role === "user" ? user?.Username : "Websears"}
            </p>

            {message.role === "user" ? (
              <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-full bg-blue-500 text-white rounded-tr-sm">
                <LongTextMessage
                  content={message.content}
                  role={message.role}
                />
              </div>
            ) : (
              <div className="text-sm leading-relaxed max-w-full text-neutral-800 px-1">
                <ReactMarkdown components={markdownComponents}>
                  {formatAIResponse(message.content)}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-neutral-600">
            <Bot size={16} />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-neutral-500 px-1">
              Websears
            </p>
            <div className="bg-neutral-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
              <p className="text-sm text-neutral-500">Thinking...</p>
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
};
