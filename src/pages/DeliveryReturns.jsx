import { Link } from "react-router-dom";

const sections = [
  { number: "01", title: "DELIVERY", text: "We confirm every order by phone before dispatch. Delivery within Ulaanbaatar is arranged after confirmation, and orders over 150,000 MNT qualify for complimentary delivery." },
  { number: "02", title: "PAYMENT", text: "Orders are currently placed with cash on delivery. Our team will confirm the final delivery cost, address, and timing with you directly." },
  { number: "03", title: "SIZE EXCHANGES", text: "Need another size? Contact us within 7 days of receiving your order. Items should be unworn, unwashed, and returned with their original packaging." },
  { number: "04", title: "NEED HELP?", text: "For order questions, delivery updates, or exchange requests, our studio is happy to help. Please include your name and order number when you contact us." },
];

export default function DeliveryReturns() {
  return (
    <div className="policy-page">
      <section className="policy-hero">
        <span>MINIMAL / CLIENT CARE</span>
        <h1>DELIVERY<br />&amp; RETURNS.</h1>
        <p>Everything you need to know before your order arrives.</p>
      </section>
      <section className="policy-sections">
        {sections.map((section) => (
          <article className="policy-section" key={section.number}>
            <span>{section.number}</span>
            <h2>{section.title}</h2>
            <p>{section.text}</p>
          </article>
        ))}
      </section>
      <section className="policy-contact">
        <span>STILL HAVE A QUESTION?</span>
        <Link to="/contact">CONTACT THE STUDIO <b>→</b></Link>
      </section>
    </div>
  );
}
