"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import WordForm, { WordFormData } from "./WordForm";
import PhraseForm, { PhraseFormData } from "./PhraseForm";
import QuoteForm, { QuoteFormData } from "./QuoteForm";
import HypotheticalForm, { HypotheticalFormData } from "./HypotheticalForm";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

      // If this is a quote with a new author (has author but no authorId), create the author first
      if (data.type === "quote" && data.author && !data.authorId) {
        const authorResponse = await fetch(
          "/.netlify/functions/authors-create",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ name: data.author }),
          }
        );

        const authorData = await authorResponse.json();

        if (!authorResponse.ok) {
          // If author already exists, use the existing one
          if (
            authorResponse.status === 409 &&
            authorData.error?.details?.existingAuthor
          ) {
            data.authorId =
              authorData.error.details.existingAuthor._id.toString();
          } else {
            setError(authorData.error?.message || "Failed to create author");
            return;
          }
        } else {
          // Author created successfully, use the new ID
          data.authorId = authorData.author._id.toString();
        }
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

  const handleDelete = async () => {
    if (!initialData?._id) {
      setError("Cannot delete: Entry ID is missing");
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setError("Authentication required. Please log in.");
        router.push("/admin/login");
        return;
      }

      const response = await fetch(
        `/.netlify/functions/entries-delete/${initialData._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        setError(responseData.error?.message || "Failed to delete entry");
        setIsDeleting(false);
        setShowDeleteModal(false);
        return;
      }

      // Success - redirect to admin page
      setSuccess("Entry deleted successfully!");
      setTimeout(() => {
        router.push("/admin");
      }, 1000);
    } catch (err) {
      console.error("Delete error:", err);
      setError("Network error. Please try again.");
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-accent-pink/10 border-2 border-accent-pink rounded-md">
          <p className="text-sm text-accent-pink whitespace-pre-wrap">
            {error}
          </p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-accent-teal/10 border-2 border-accent-teal rounded-md">
          <p className="text-sm text-accent-teal">{success}</p>
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
          onDelete={
            mode === "edit" ? () => setShowDeleteModal(true) : undefined
          }
        />
      )}

      {entryType === "phrase" && (
        <PhraseForm
          initialData={
            initialData as Partial<import("@/types/models").PhraseEntry>
          }
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onDelete={
            mode === "edit" ? () => setShowDeleteModal(true) : undefined
          }
        />
      )}

      {entryType === "quote" && (
        <QuoteForm
          initialData={
            initialData as Partial<import("@/types/models").QuoteEntry>
          }
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onDelete={
            mode === "edit" ? () => setShowDeleteModal(true) : undefined
          }
        />
      )}

      {entryType === "hypothetical" && (
        <HypotheticalForm
          initialData={
            initialData as Partial<import("@/types/models").HypotheticalEntry>
          }
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onDelete={
            mode === "edit" ? () => setShowDeleteModal(true) : undefined
          }
        />
      )}

      {/* Delete confirmation modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        entryTitle={
          (initialData as any)?.name ||
          (initialData as any)?.body?.substring(0, 50) ||
          "this entry"
        }
        isDeleting={isDeleting}
      />
    </div>
  );
}
