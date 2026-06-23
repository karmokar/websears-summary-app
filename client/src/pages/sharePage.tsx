import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getShareConverastion } from "@/services/sharedService";

interface SharedMessage {
  ID: number;
  role: "user" | "model";
  content: string;
}

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const [title, setTitle] = useState("");
  const [messages, setMessages] = useState<SharedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    getShareConverastion(token)
      .then((data) => {
        setTitle(data.title);
        setMessages(data.messages);
      })
      .catch((err) => {
        console.log("SHARE FETCH ERROR:", err);
        setError(err.message || "Couldn't load this conversation.");
      })
      .finally(() => setLoading(false));
  }, [token]);
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Loading shared conversation...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted p-8">
      <div className="max-w-3xl mx-auto bg-background rounded-lg shadow p-6">
        <h1 className="text-2xl font-semibold mb-6">{title}</h1>
        <div className="flex flex-col gap-4">
          {messages.map((msg) => (
            <div
              key={msg.ID}
              className={`p-4 rounded-lg whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary/10 ml-auto max-w-[80%]"
                  : "bg-card max-w-[80%]"
              }`}
            >
              {msg.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
