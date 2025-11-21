"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import WordForm, { WordFormData } from "./WordForm";
import PhraseForm, { PhraseFormData } from "./PhraseForm";
import QuoteForm, { QuoteFormData } from "./QuoteForm";
import HypotheticalForm, { HypotheticalFormData } from "./HypotheticalForm";
import { Entry } from "@/types/models";

type EntryFormData =
  | WordFormData
  | PhraseFormData
  | QuoteFormData
  | HypotheticalFormData;

interface EntryFormProps {
  entryType: "word" | "phrase" | "quote" | "hypothetical";
  initialData?: Partial<Entry>;
  mode?: "create" | "edit";
}

/**
 * EntryForm wrapper component that dynamically renders the appropriate form
 * Requirements: 2.1, 2.7, 2.9
 */
export default function EntryForm({
  entryType,
  initialData,
  mode = "create",
}: EntryFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const handleSubmit = async (data: EntryFormData) => {
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setError("Authentication required. Please log in.");
        router.push("/admin/login");
        return;
      }

      const url =
        mode === "edit" && initialData?._id
          ? `/.netlify/functions/entries-update/${initialData._id}`
          : "/.netlify/functions/entries-create";

      const method = mode === "edit" ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Handle validation errors
        // Requirement: 2.9
        if (responseData.error?.details) {
          const validationErrors = responseData.error.details;
          setError(
            `Validation failed: ${JSON.stringify(validationErrors, null, 2)}`
          );
        } else {
          setError(responseData.error?.message || "Failed to save entry");
        }
        return;
      }

      // Success
      // Requirement: 2.7
      setSuccess(
        mode === "edit"
          ? "Entry updated successfully!"
          : "Entry created successfully!"
      );

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/admin");
      }, 1500);
    } catch (err) {
      console.error("Entry submission error:", err);
      setError("Network error. Please try again.");
    }
  };

  const handleCancel = () => {
    router.push("/admin");
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600 whitespace-pre-wrap">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {/* Dynamically render appropriate form based on entry type */}
      {/* Requirement: 2.1 */}
      {entryType === "word" && (
        <WordForm
          initialData={
            initialData as Partial<import("@/types/models").WordEntry>
          }
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}

      {entryType === "phrase" && (
        <PhraseForm
          initialData={
            initialData as Partial<import("@/types/models").PhraseEntry>
          }
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}

      {entryType === "quote" && (
        <QuoteForm
          initialData={
            initialData as Partial<import("@/types/models").QuoteEntry>
          }
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}

      {entryType === "hypothetical" && (
        <HypotheticalForm
          initialData={
            initialData as Partial<import("@/types/models").HypotheticalEntry>
          }
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
