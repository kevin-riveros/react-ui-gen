export interface SelectedElement {
  tagName: string;
  cssSelector: string;
  className: string;
  textContent: string;
  sourceFile: string | null;
  sourceLine: string | null;
  sourceComponent: string | null;
  boundingRect: { top: number; left: number; width: number; height: number };
  ancestors: string[];
}

export interface SelectedRegion {
  elements: SelectedElement[];
  rect: { top: number; left: number; width: number; height: number };
}

export type InspectSelection =
  | { type: "element"; data: SelectedElement }
  | { type: "region"; data: SelectedRegion };

/** Messages sent from parent → iframe */
export type InspectParentMessage = {
  type: "inspect-mode";
  enabled: boolean;
};

/** Messages sent from iframe → parent */
export type InspectIframeMessage =
  | { type: "element-selected"; payload: SelectedElement }
  | { type: "region-selected"; payload: SelectedRegion };
