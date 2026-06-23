"use client";

import { useState } from "react";

export interface DemographicsData {
  language?: string;
  nativeLanguage?: string;
  ageGroup?: string;
  gender?: string;
  region?: string;
}

export interface DemographicsStepProps {
  onSave: (data: DemographicsData) => Promise<void>;
  onSkip: () => void;
}

const inputClass =
  "h-12 w-full rounded-sm border-[1.5px] border-border bg-surface px-4 font-body text-body text-foreground placeholder:text-muted/70 transition-shadow focus:border-primary focus:outline-none focus:shadow-[0_0_0_3px_var(--color-primary-light)]";

const selectClass =
  "h-12 w-full rounded-sm border-[1.5px] border-border bg-surface px-4 font-body text-body text-foreground transition-shadow focus:border-primary focus:outline-none focus:shadow-[0_0_0_3px_var(--color-primary-light)] cursor-pointer";

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="font-body text-body-sm font-medium text-heading">
      {children}
    </label>
  );
}

function FieldWrap({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5">{children}</div>;
}

export function DemographicsStep({ onSave, onSkip }: DemographicsStepProps) {
  const [language, setLanguage] = useState("");
  const [nativeLanguage, setNativeLanguage] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [gender, setGender] = useState("");
  const [region, setRegion] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const data: DemographicsData = {
      language: language.trim() || undefined,
      nativeLanguage: nativeLanguage.trim() || undefined,
      ageGroup: ageGroup || undefined,
      gender: gender || undefined,
      region: region.trim() || undefined,
    };
    setIsSaving(true);
    try {
      await onSave(data);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-6 shadow-md">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-h2 text-heading">About You</h2>
        <p className="font-body text-body text-muted">
          Help us improve the dataset by sharing a bit about yourself (all optional).
        </p>
      </div>

      <fieldset disabled={isSaving} className="flex flex-col gap-4 border-none p-0">
        <legend className="sr-only">Contributor information</legend>

        {/* Language */}
        <FieldWrap>
          <Label htmlFor="demographics-language">Primary language spoken</Label>
          <input
            id="demographics-language"
            className={inputClass}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="e.g. English, Hindi, Bengali"
          />
        </FieldWrap>

        {/* Native language */}
        <FieldWrap>
          <Label htmlFor="demographics-native-language">Mother tongue</Label>
          <input
            id="demographics-native-language"
            className={inputClass}
            value={nativeLanguage}
            onChange={(e) => setNativeLanguage(e.target.value)}
            placeholder="e.g. Gujarati, Tamil, Punjabi"
          />
        </FieldWrap>

        {/* Age group */}
        <FieldWrap>
          <Label htmlFor="demographics-age-group">Age group</Label>
          <select
            id="demographics-age-group"
            className={selectClass}
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value)}
          >
            <option value="">Prefer not to say</option>
            <option value="under_18">Under 18</option>
            <option value="18_30">18–30</option>
            <option value="31_50">31–50</option>
            <option value="51_plus">51+</option>
          </select>
        </FieldWrap>

        {/* Gender */}
        <FieldWrap>
          <Label htmlFor="demographics-gender">Gender</Label>
          <select
            id="demographics-gender"
            className={selectClass}
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non_binary">Non-binary</option>
          </select>
        </FieldWrap>

        {/* Region */}
        <FieldWrap>
          <Label htmlFor="demographics-region">City / Country</Label>
          <input
            id="demographics-region"
            className={inputClass}
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="e.g. Mumbai, India"
          />
        </FieldWrap>

      </fieldset>

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary w-full max-w-xs gap-2"
        >
          {isSaving ? "Saving…" : "Save & Continue"}
        </button>

        <button
          type="button"
          onClick={onSkip}
          disabled={isSaving}
          className="font-body text-body-sm text-muted underline-offset-2 transition-colors hover:text-primary-dark hover:underline"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
