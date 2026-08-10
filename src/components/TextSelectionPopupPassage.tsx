import * as React from "react";

import { useTextSelection } from "@/hooks/useTextSelection";

import { ViewMeaningButton } from "./text-selection/ViewMeaningButton";
import { WordMeaningPopup } from "./text-selection/WordMeaningPopup";

export function TextSelectionPopupPassage({ passage }: { passage: string }) {
  return (
    <div>
      <p className="whitespace-pre-line font-[Georgia,Times_New_Roman,serif] text-[17px] leading-[1.5] text-foreground">
        {passage}
      </p>
    </div>
  );
}
