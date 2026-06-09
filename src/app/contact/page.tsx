import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { Reveal } from "@/components/Reveal";
import { ActionLink } from "@/components/ui";
import {
  contactEmail,
  inquiryTypes,
  type InquiryType,
} from "@/data/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Luca Pisanu about music, bookings, lessons, collaborations or press.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string | string[] }>;
}) {
  const requestedType = (await searchParams).type;
  const initialType =
    typeof requestedType === "string" &&
    inquiryTypes.some((item) => item.value === requestedType)
      ? (requestedType as InquiryType)
      : "music";

  return (
    <>
      <Reveal>
        <section className="contact-main poster-section">
          <div className="contact-main__intro">
            <h2>Send A Message</h2>
            <p>
              Share the useful details and Luca will reply directly. For lesson
              enquiries, include your level and what you would like to work on.
            </p>
            <div className="contact-direct">
              <span>Prefer email?</span>
              <ActionLink href={`mailto:${contactEmail}`} variant="text">
                {contactEmail}
              </ActionLink>
            </div>
          </div>
          <ContactForm initialType={initialType} />
        </section>
      </Reveal>

      <section className="contact-notes poster-section">
        <div>
          <h3>Music & Booking</h3>
          <p>Live work, sessions, sync, releases and production.</p>
        </div>
        <div>
          <h3>Lessons</h3>
          <p>One-to-one tuition, songwriting and musical development.</p>
        </div>
        <div>
          <h3>Collaboration</h3>
          <p>Bring the sketch, the half-song or the strange new direction.</p>
        </div>
      </section>
    </>
  );
}
