import { ContributionFlow } from "@/components/collect/ContributionFlow";

export default function ContributePage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="font-heading text-h1 text-heading">
          Contribute Your Voice
        </h1>
        <p className="mt-2 font-body text-body text-muted">
          Help train our AI by recording keywords and mantras. Each step takes
          under a minute.
        </p>
      </div>
      <ContributionFlow />
    </main>
  );
}
