import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import "./Messages.css";

function formatDate(value) {
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  async function fetchMessages() {
    setLoading(true);
    setError("");

    const { data, error: messagesError } = await supabase
      .from("contact_messages")
      .select("id, name, email, subject, message, created_at")
      .order("created_at", { ascending: false });

    if (messagesError) {
      setError(messagesError.message || "Could not load messages.");
    } else {
      setMessages(data || []);
      setSelectedMessage((current) =>
        data?.find((message) => message.id === current?.id) || null,
      );
    }

    setLoading(false);
  }

  const filteredMessages = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return messages;

    return messages.filter((message) =>
      [message.name, message.email, message.subject, message.message]
        .some((value) => value?.toLowerCase().includes(query)),
    );
  }, [messages, search]);

  return (
    <div className="admin-page admin-messages-page">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">MINIMAL / ADMIN</span>
          <h1>MESSAGES</h1>
          <p>Read messages sent through the contact form.</p>
        </div>

        <button className="admin-refresh-button" onClick={fetchMessages}>
          REFRESH
        </button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-messages-toolbar">
        <p>{messages.length} TOTAL MESSAGES</p>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search messages"
          aria-label="Search messages"
        />
      </div>

      {loading ? (
        <div className="admin-loading">LOADING MESSAGES...</div>
      ) : filteredMessages.length === 0 ? (
        <div className="admin-empty">
          <h2>{messages.length ? "NO MATCHING MESSAGES" : "NO MESSAGES YET"}</h2>
          <p>
            {messages.length
              ? "Try a different search term."
              : "Contact form submissions will appear here."}
          </p>
        </div>
      ) : (
        <section className="admin-message-list">
          {filteredMessages.map((message) => (
            <article className="admin-message" key={message.id}>
              <div className="admin-message-meta">
                <div>
                  <span>{formatDate(message.created_at)}</span>
                  <h2>{message.subject}</h2>
                  <p>
                    {message.name} · {message.email}
                  </p>
                </div>
                <a href={`mailto:${message.email}`}>REPLY</a>
              </div>

              <p className="admin-message-preview">{message.message}</p>

              <button
                className="admin-view-button"
                onClick={() => setSelectedMessage(message)}
              >
                VIEW MESSAGE <span>→</span>
              </button>
            </article>
          ))}
        </section>
      )}

      {selectedMessage && (
        <div
          className="admin-modal-overlay"
          onClick={() => setSelectedMessage(null)}
          role="presentation"
        >
          <section
            className="admin-modal admin-message-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="message-subject"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div>
                <span>{formatDate(selectedMessage.created_at)}</span>
                <h2 id="message-subject">{selectedMessage.subject}</h2>
              </div>
              <button
                className="admin-modal-close"
                onClick={() => setSelectedMessage(null)}
                aria-label="Close message"
              >
                ×
              </button>
            </div>
            <div className="admin-modal-content">
              <div className="admin-modal-section">
                <span>FROM</span>
                <h3>{selectedMessage.name}</h3>
                <a href={`mailto:${selectedMessage.email}`}>
                  {selectedMessage.email}
                </a>
              </div>
              <div className="admin-modal-section">
                <span>MESSAGE</span>
                <p className="admin-message-body">{selectedMessage.message}</p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
