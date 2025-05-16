import { useEffect, useRef, useState } from "react";
import { ChatGptMessage } from "../type/ChatGptMessage";
import { IconButton, Tooltip } from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import ReactMarkdown from 'react-markdown'
import ReplyIcon from '@mui/icons-material/Reply';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import ControlPointIcon from '@mui/icons-material/ControlPoint';
import { ChatBoxContext } from "../interfaces/dremioInterfaces";

interface Props {
  onPasteGPTCode: (item: { codeText: string;}) => void;
  onOpenChatContext : () => void;
  chatContext : ChatBoxContext[] |null;
}

const ChatGptViewModule = ({onPasteGPTCode, onOpenChatContext, chatContext}: Props) => {
  const [chatGptMessages, setChatGptMessages] = useState<ChatGptMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copiedCodeText, setCopiedCodeText] = useState<string | null>(null);

  //Load chatcontext coming from parent
  useEffect(() => {
    console.log("chatContext updated:", chatContext);

    // call here backend to setup the context
    const uploadContext = async () => {
       fetch('/chatgpt/uploadContext', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatContext }),
      });
    };

    if (chatContext) {
      uploadContext();
    }
  }, [chatContext]);

  const handleCopyCodeText = (codeText: any) => {
    setCopiedCodeText(codeText);
    navigator.clipboard.writeText(codeText).then(() => {
      setTimeout(() => {
        setCopiedCodeText(null);
      }, 2000);
    }).catch(err => {
      console.error('Could not copy text: ', err);
    });
  }

  const handleTransferCodeText = (codeText: any) => {
    onPasteGPTCode({codeText: codeText});
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatGptMessages]);

  const handleNewPrompt = async () => {
    if (!input.trim()) return;

    // Step 1: Add user message to local history
    const updatedHistory: ChatGptMessage[] = [
      ...chatGptMessages,
      { role: "user", content: input }
    ];
    setChatGptMessages(updatedHistory); // Optimistic UI update

    // Step 2: Send full history to the backend
    const response = await fetch('/chatgpt/streamchat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ history: updatedHistory }),
    });

    if (!response.body) {
      throw new Error("Response body is null");
    }

    // Step 3: Stream assistant response
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let assistantContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const chunks = buffer.split("\n");
      buffer = chunks.pop() || "";

      for (const chunk of chunks) {
        if (chunk.startsWith("data:")) {
          const json = chunk.replace("data:", "").replace("null", "").trim();
          try {
            const parsed = JSON.parse(json);
            const chunkText = parsed.content;

            assistantContent += chunkText;

            // Optional: show streaming in progress (overwrite last assistant message)
            setChatGptMessages(prev => {
              const temp = [...prev];
              const last = temp[temp.length - 1];
              if (last?.role === "assistant") {
                temp[temp.length - 1] = {
                  ...last,
                  content: assistantContent
                };
              } else {
                temp.push({ role: "assistant", content: assistantContent });
              }
              return temp;
            });
          } catch (err) {
            console.error("Failed to parse JSON chunk:", json, err);
          }
        }
      }
    }

    setInput(""); // Clear input
  };

  return (
    <div className="flex flex-col stretch p-2">
      {/* Scrollable Messages Area */}
      <div className=" space-y-3 pr-2">
        {chatGptMessages.map((m, index) => (
          <div
            key={index}
            className={`whitespace-pre-wrap flex ${m.role === "user" ? "justify-end" : "justify-start"
              }`}
          >
            <div
              className={`p-3 rounded-lg shadow ${m.role === "user"
                ? "bg-blue-100 text-black max-w-md"
                : " text-black w-full"
                }`}
            >
              {m.role === "assistant" ? (
                <ReactMarkdown
                  components={{
                    code({ node, className, children, ...props }) {
                      const lang = className?.replace("language-", "");
                      const codeText = String(children).trim();

                      if (lang === "sql") {
                        return (
                          <div className="relative bg-gray-800 text-white text-sm font-mono p-4 rounded-md my-2 overflow-auto">
                            <pre className="whitespace-pre-wrap break-words">
                              <code>{codeText}</code>
                            </pre>

                            <span className="absolute top-2 right-2 px-2 py-1">
                              <IconButton onClick={() => handleCopyCodeText(codeText)} color="info">
                                <Tooltip title="Copy">
                                  {copiedCodeText !== null ? (
                                    <CheckIcon color="info" fontSize="small" />
                                  ) : (
                                    <ContentCopyIcon color="info" fontSize="small" />
                                  )}
                                </Tooltip>
                              </IconButton>
                            </span>
                            <span className="absolute top-2 right-10 px-2 py-1">
                              <IconButton onClick={() => handleTransferCodeText(codeText)} color="info">
                                <Tooltip title="Paste"><ReplyIcon /></Tooltip>
                              </IconButton>
                            </span>
                          </div>
                        );
                      }

                      return (
                        <code className="bg-gray-200 rounded px-1" {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {m.content}
                </ReactMarkdown>
              ) : (
                <span>{m.content}</span>
              )}
            </div>
          </div>
        ))}
      </div>
      {chatGptMessages.length === 0 ? (<div className="text-1xl mb-2 mt-5 font-semibold text-center" >What can I help with?</div>) : null}

      < div ref={bottomRef} />
      {/* Fixed Input Area */}
      < div className="sticky bottom-0 bg-white pt-3 pb-2" >
        <div className="flex items-center gap-2">
          
        <div className="relative w-full">
          <textarea
            value={input}
            rows={2}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleNewPrompt();
            }}
             className="flex-grow w-full border border-gray-300 rounded-lg p-2 pr-8 focus:outline-none"
            placeholder="Ask something about Dremio..."
          />
           <IconButton
            className="!absolute !bottom-1 !left-1 !z-10"
            onClick={onOpenChatContext}
            style={{ color: "gray" }}
            size="small">
            <Tooltip title="Add ChatBot Context">
              <ControlPointIcon />
            </Tooltip>
          </IconButton>
          </div>
          <IconButton
            onClick={handleNewPrompt}
            color="success"
            size="small"
            aria-label="run"
            disabled={!input.trim()}
          >
            <Tooltip title="Execute">
              <PlayCircleOutlineIcon />
            </Tooltip>
          </IconButton>
        </div>
      </div>
    </div>
  );


};

export default ChatGptViewModule;
