import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brisanje računa | Brendia Pro",
  robots: { index: true },
};

// Public page (not in the protected-routes list) required by Google Play:
// explains how a Brendia Pro app user requests account & data deletion.
export default async function DeleteAccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const hr = locale !== "en";

  const c = hr
    ? {
        title: "Brisanje računa i podataka",
        intro:
          "Ova stranica opisuje kako korisnici Brendia Pro aplikacije i platforme mogu zatražiti brisanje svog računa i povezanih podataka.",
        howTitle: "Kako zatražiti brisanje",
        howSteps: [
          "Pošaljite e-mail na info@brendiapro.hr s adrese e-pošte kojom ste registrirani.",
          'U naslov poruke napišite "Brisanje računa".',
          "Zahtjev ćemo potvrditi i obraditi u roku od 30 dana.",
        ],
        deleteTitle: "Što se briše",
        deleteItems: [
          "Korisnički račun i profil (ime, e-mail, telefon)",
          "Napredak u tečaju i povijest gledanja lekcija",
          "Poslane fotografije radova",
          "Poruke, obavijesti i registrirani uređaji",
        ],
        keepTitle: "Što zadržavamo",
        keepText:
          "Podatke o kupnjama i izdanim računima zadržavamo koliko to zahtijevaju porezni i računovodstveni propisi Republike Hrvatske, neovisno o brisanju računa.",
        contact: "Pitanja? Javite nam se na info@brendiapro.hr.",
      }
    : {
        title: "Account and data deletion",
        intro:
          "This page describes how users of the Brendia Pro app and platform can request deletion of their account and associated data.",
        howTitle: "How to request deletion",
        howSteps: [
          "Send an e-mail to info@brendiapro.hr from the e-mail address you registered with.",
          'Use the subject line "Delete my account".',
          "We will confirm and process your request within 30 days.",
        ],
        deleteTitle: "What gets deleted",
        deleteItems: [
          "User account and profile (name, e-mail, phone)",
          "Course progress and lesson watch history",
          "Submitted work photos",
          "Messages, notifications and registered devices",
        ],
        keepTitle: "What we keep",
        keepText:
          "Purchase and invoice records are retained for as long as required by Croatian tax and accounting regulations, regardless of account deletion.",
        contact: "Questions? Contact us at info@brendiapro.hr.",
      };

  return (
    <main className="min-h-screen bg-cream px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <p className="font-heading text-3xl text-primary">Brendia Pro&reg;</p>
        <h1 className="font-heading mt-8 text-4xl text-primary">{c.title}</h1>
        <p className="mt-4 text-gray-700">{c.intro}</p>

        <h2 className="font-heading mt-10 text-2xl text-primary">{c.howTitle}</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-gray-700">
          {c.howSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        <h2 className="font-heading mt-10 text-2xl text-primary">{c.deleteTitle}</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-700">
          {c.deleteItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h2 className="font-heading mt-10 text-2xl text-primary">{c.keepTitle}</h2>
        <p className="mt-3 text-gray-700">{c.keepText}</p>

        <p className="mt-10 border-t border-gray-200 pt-6 text-sm text-gray-500">
          {c.contact}
        </p>
      </div>
    </main>
  );
}
