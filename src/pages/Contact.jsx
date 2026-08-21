import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Contact() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="minimal-contact">

      {/* HEADER */}
      <section className="contact-intro">
        <span className="contact-eyebrow">
          GET IN TOUCH
        </span>

        <h1>
          LET'S TALK.
        </h1>

        <p>
          Questions about an order, our collection,
          or simply want to say hello?
          We'd love to hear from you.
        </p>
      </section>


      {/* MAIN CONTENT */}
      <section className="contact-layout">

        {/* LEFT — CONTACT INFORMATION */}
        <div className="contact-details">

          <div className="contact-detail">
            <span className="detail-label">
              EMAIL
            </span>

            <a href="mailto:hello@minimal-fashion.com">
              tugit8833@gmail.com
            </a>
          </div>


          <div className="contact-detail">
            <span className="detail-label">
              PHONE
            </span>

            <a href="tel:+15552345678">
              +976 99689168
            </a>
          </div>


          <div className="contact-detail">
            <span className="detail-label">
              STUDIO
            </span>

            <p>
              1429 Fashion Ave
              <br />
              New York, NY 10018
            </p>
          </div>


          <div className="contact-detail">
            <span className="detail-label">
              HOURS
            </span>

            <p>
              Monday — Friday
              <br />
              10:00 — 18:00 EST
            </p>
          </div>


          {/* SOCIAL */}
          <div className="contact-social">

            <span className="detail-label">
              FOLLOW
            </span>

            <div className="social-minimal">

              <a href="#">
                Instagram
              </a>

              <a href="#">
                Facebook
              </a>

              <a href="#">
                Pinterest
              </a>

            </div>

          </div>

        </div>


        {/* RIGHT — FORM */}
        <div className="minimal-contact-form">

          <div className="form-heading">
            <span className="detail-label">
              MESSAGE
            </span>

            <h2>
              HOW CAN WE HELP?
            </h2>
          </div>


          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              setSubmitting(true);

              const form = e.target;
              const payload = {
                name: form.name.value.trim(),
                email: form.email.value.trim(),
                subject: form.subject.value.trim(),
                message: form.message.value.trim(),
              };

              const { error: insertError } = await supabase
                .from("contact_messages")
                .insert(payload);

              setSubmitting(false);

              if (insertError) {
                setError(insertError.message);
                return;
              }

              setSent(true);
              form.reset();
            }}
          >

            <div className="minimal-form-row">

              <div className="minimal-field">
                <label htmlFor="name">
                  NAME
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Your name"
                />
              </div>


              <div className="minimal-field">
                <label htmlFor="email">
                  EMAIL
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="your@email.com"
                />
              </div>

            </div>


            <div className="minimal-field">

              <label htmlFor="subject">
                SUBJECT
              </label>

              <input
                id="subject"
                name="subject"
                type="text"
                required
                placeholder="What can we help with?"
              />

            </div>


            <div className="minimal-field">

              <label htmlFor="message">
                MESSAGE
              </label>

              <textarea
                id="message"
                name="message"
                rows="6"
                required
                placeholder="Write your message..."
              />

            </div>


            <button
              type="submit"
              className="minimal-submit"
              disabled={submitting}
            >
              {submitting ? "SENDING..." : "SEND MESSAGE"}
              <span>→</span>
            </button>

            {sent && (
              <p className="order-message">
                Thank you. Your message was saved.
              </p>
            )}

            {error && (
              <p className="order-message">{error}</p>
            )}

          </form>

        </div>

      </section>


      {/* FOOTER STATEMENT */}
      <section className="contact-footer">

        <span>
          MINIMAL / 2026
        </span>

        <p>
          Designed for those who appreciate
          simplicity.
        </p>

      </section>

    </div>
  )
}