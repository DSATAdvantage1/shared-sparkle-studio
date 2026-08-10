import * as React from "react";
import { toast } from "sonner";

import { useWordMeaning } from "@/hooks/useWordMeaning";
import { useTextSelection } from "@/hooks/useTextSelection";
import { addVocabularyItem, hasVocabularyWord } from "@/lib/vocabulary-flash";

import { Button } from "@/components/ui/button";
import { BookmarkPlus, X, Lightbulb, BookOpen, Sparkles } from "lucide-react";

function safeJoinSynonyms(synonyms: string[] | undefined) {
  if (!synonyms || !synonyms.length) return "";
  return synonyms.filter(Boolean).join(", ");
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function WordMeaningPopup() {
  const {
    selection,
    toolbarPosition,
    meaningOpen,
    setMeaningOpen,
    setMeaningWord,
    clearSelection,
  } = useTextSelection();

  const { loading, meaning, fetchMeaning } = useWordMeaning();
  const [added, setAdded] = React.useState(false);
  const [isAlreadySaved, setIsAlreadySaved] = React.useState(false);

  // Reset added state when word changes
  React.useEffect(() => {
    setAdded(false);
    setIsAlreadySaved(false);
  }, [selection?.text]);

  // Fetch meaning only when popup is opened
  React.useEffect(() => {
    if (!meaningOpen) return;
    if (!selection?.text) return;

    const word = selection.text.trim();
    setMeaningWord(word);
    // Check if already in vocabulary
    try {
      setIsAlreadySaved(hasVocabularyWord(word));
    } catch {
      setIsAlreadySaved(false);
    }
    void fetchMeaning(word, undefined);
  }, [meaningOpen, selection?.text, fetchMeaning, setMeaningWord]);

  const style: React.CSSProperties | undefined = toolbarPosition
    ? {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 9999,
      }
    : undefined;

  const onClose = React.useCallback(() => {
    setMeaningOpen(false);
    clearSelection();
  }, [setMeaningOpen, clearSelection]);

  function handleAddToVocabulary() {
    if (!meaning?.word) return;
    try {
      const result = addVocabularyItem({
        word: meaning.word,
        definition: meaning.definition,
        partOfSpeech: meaning.partOfSpeech || null,
        pronunciation: meaning.pronunciation || null,
        synonyms: meaning.synonyms,
        memoryTip: meaning.memoryTip || null,
        exampleSentence: meaning.examples?.[0] || null,
      });

      if (result.status === "added") {
        setAdded(true);
        setIsAlreadySaved(true);
        toast.success(`"${meaning.word}" added to Vocabulary!`);
      } else {
        setIsAlreadySaved(true);
        toast.info(`"${meaning.word}" is already in your Vocabulary.`);
      }
    } catch {
      toast.error("Could not save word. Please try again.");
    }
  }

  if (!selection?.text || !toolbarPosition) return null;

  return (
    <div style={style} aria-live="polite">
      {!meaningOpen ? null : (
        <div
          data-word-meaning-popover="true"
          className="w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
          role="dialog"
          aria-modal="false"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600">
                Word Meaning
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-[Georgia,serif] text-[17px] font-bold text-slate-800">
                {selection.text}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-[440px] overflow-auto">
            {loading && (
              <div className="flex items-center gap-3 px-4 py-5 text-sm text-slate-500">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                Looking up definition…
              </div>
            )}

            {!loading && meaning && (
              <div className="divide-y divide-slate-100">
                {/* Meaning */}
                <div className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Meaning
                    {meaning.partOfSpeech && (
                      <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold capitalize text-blue-700">
                        {meaning.partOfSpeech}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                    {meaning.definition || "No definition found."}
                  </p>
                  <div className="mt-2 text-[10px] text-slate-400">
                    Word: {meaning.word}
                  </div>
                </div>

                {/* Synonyms */}
                {meaning.synonyms && meaning.synonyms.length > 0 && (
                  <div className="px-4 py-3">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Synonyms
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {meaning.synonyms.slice(0, 6).map((s) => (
                        <span
                          key={s}
                          className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Memory Tip */}
                {meaning.memoryTip && (
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-amber-600">
                      <Lightbulb className="h-3 w-3" />
                      Memory Tip
                    </div>
                    <p className="mt-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
                      {meaning.memoryTip}
                    </p>
                  </div>
                )}

                {/* Example */}
                {meaning.examples && meaning.examples.length > 0 && (
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                      <Sparkles className="h-3 w-3" />
                      Example
                    </div>
                    <p className="mt-1.5 text-xs italic leading-relaxed text-slate-600">
                      "{meaning.examples[0]}"
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 bg-slate-50 px-4 py-3">
                  <Button
                    size="sm"
                    type="button"
                    onClick={handleAddToVocabulary}
                    disabled={isAlreadySaved || added}
                    className={`flex items-center gap-1.5 rounded-full text-xs font-semibold ${
                      isAlreadySaved || added
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    <BookmarkPlus className="h-3.5 w-3.5" />
                    {isAlreadySaved || added ? "Saved ✓" : "Add to Vocabulary"}
                  </Button>

                  <Button
                    size="sm"
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    className="rounded-full text-xs text-slate-500"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}

            {!loading && !meaning && (
              <div className="px-4 py-5">
                <p className="text-sm text-slate-500">
                  No definition found for this word. Try selecting a single
                  word.
                </p>
                <Button
                  size="sm"
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="mt-3 rounded-full text-xs"
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
