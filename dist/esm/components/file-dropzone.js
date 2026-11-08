"use client";

// src/components/file-dropzone.tsx
import { useRef, useState } from "react";
import { cn } from "../cn.js";
import { XIcon } from "./icons.js";
import { IconButton } from "./primitives.js";
import { useStrings } from "./provider.js";
import { FILE_STRINGS } from "./strings.js";
import { jsx, jsxs } from "react/jsx-runtime";
function matchesAccept(file, accept) {
  const tokens = (accept ?? "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
  if (tokens.length === 0) return true;
  const fileName = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.some((t) => {
    if (t.startsWith(".")) return fileName.endsWith(t);
    if (t.endsWith("/*")) return type.startsWith(t.slice(0, -1));
    return type === t;
  });
}
var sameFile = (a, b) => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(n < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}
function syncInput(input, files) {
  if (!input) return;
  try {
    const dt = new DataTransfer();
    for (const f of files) dt.items.add(f);
    input.files = dt.files;
  } catch {
  }
}
function FileDropzone({
  accept,
  multiple = false,
  maxSize,
  maxFiles,
  onFilesChange,
  name,
  disabled = false,
  required = false,
  invalid = false,
  label,
  className,
  ref,
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...rest
}) {
  const strings = useStrings(FILE_STRINGS);
  const input = useRef(null);
  const depth = useRef(0);
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const isInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";
  const take = (incoming) => {
    const rejected = [];
    const list = multiple ? [...files] : [];
    const cap = multiple ? maxFiles ?? Infinity : 1;
    let changed = false;
    for (const file of incoming) {
      if (!matchesAccept(file, accept)) rejected.push({ file, reason: "type" });
      else if (maxSize !== void 0 && file.size > maxSize) rejected.push({ file, reason: "size" });
      else if (multiple && list.some((f) => sameFile(f, file))) continue;
      else if (list.length >= cap) rejected.push({ file, reason: "count" });
      else {
        list.push(file);
        changed = true;
      }
    }
    const next = !multiple && list.length === 0 ? files : list;
    syncInput(input.current, next);
    if (!changed && rejected.length === 0) return;
    if (next !== files) setFiles(next);
    onFilesChange?.(next, rejected);
  };
  const removeAt = (index) => {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    syncInput(input.current, next);
    onFilesChange?.(next, []);
  };
  const onDragEnter = (e) => {
    e.preventDefault();
    depth.current += 1;
    if (!disabled) setDragging(true);
  };
  const onDragOver = (e) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = disabled ? "none" : "copy";
  };
  const onDragLeave = () => {
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setDragging(false);
  };
  const onDrop = (e) => {
    e.preventDefault();
    depth.current = 0;
    setDragging(false);
    if (disabled) return;
    take(Array.from(e.dataTransfer?.files ?? []));
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ...rest,
      ref,
      "data-state": dragging ? "dragging" : "idle",
      "data-disabled": disabled ? "" : void 0,
      className: cn("group grid gap-2", className),
      children: [
        /* @__PURE__ */ jsxs(
          "label",
          {
            onDragEnter,
            onDragOver,
            onDragLeave,
            onDrop,
            className: cn(
              "relative flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-th-elevated px-4 py-5 text-center text-sm text-th-hi2",
              "transition-colors duration-150 hover:border-th-hi3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-th-accent/40",
              isInvalid ? "border-th-loss" : "border-th-line-control",
              "group-data-[state=dragging]:border-th-accent group-data-[state=dragging]:bg-th-accent-soft",
              "group-data-[disabled]:cursor-not-allowed group-data-[disabled]:opacity-50",
              "forced-colors:border-[ButtonText] forced-colors:group-data-[state=dragging]:border-[Highlight] forced-colors:group-data-[state=dragging]:outline forced-colors:group-data-[state=dragging]:outline-2 forced-colors:group-data-[state=dragging]:outline-[Highlight]",
              "forced-colors:has-[:focus-visible]:outline forced-colors:has-[:focus-visible]:outline-2 forced-colors:has-[:focus-visible]:outline-[Highlight]"
            ),
            children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  ref: input,
                  id,
                  type: "file",
                  name,
                  accept,
                  multiple,
                  disabled,
                  required,
                  "aria-label": ariaLabel,
                  "aria-labelledby": ariaLabelledBy,
                  "aria-describedby": ariaDescribedBy,
                  "aria-invalid": isInvalid || void 0,
                  onChange: (e) => take(Array.from(e.target.files ?? [])),
                  className: "sr-only"
                }
              ),
              /* @__PURE__ */ jsx("span", { children: label ?? strings.dropzoneLabel }),
              /* @__PURE__ */ jsx(
                "span",
                {
                  "aria-hidden": "true",
                  className: "inline-flex h-8 items-center rounded-lg border border-th-line-control px-3 text-xs font-medium text-th-hi pointer-coarse:h-11 pointer-coarse:text-sm",
                  children: strings.browseFiles
                }
              )
            ]
          }
        ),
        files.length > 0 ? /* @__PURE__ */ jsx("ul", { className: "grid gap-1.5", children: files.map((file, i) => /* @__PURE__ */ jsxs(
          "li",
          {
            className: "flex items-center gap-2 rounded-lg border border-th-line bg-th-surface py-1 pe-1 ps-3 text-sm",
            children: [
              /* @__PURE__ */ jsx("span", { className: "min-w-0 flex-1 truncate text-th-hi", title: file.name, children: file.name }),
              /* @__PURE__ */ jsx("span", { className: "shrink-0 text-xs tabular-nums text-th-hi3", children: formatBytes(file.size) }),
              /* @__PURE__ */ jsx(IconButton, { label: strings.removeFile(file.name), size: "sm", disabled, onClick: () => removeAt(i), children: /* @__PURE__ */ jsx(XIcon, { size: 14 }) })
            ]
          },
          `${file.name}-${file.size}-${file.lastModified}-${i}`
        )) }) : null
      ]
    }
  );
}
export {
  FileDropzone
};
