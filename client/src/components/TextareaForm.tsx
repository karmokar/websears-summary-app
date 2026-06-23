"use client";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "./ui/button";
import sendIcon from "../assets/send.png";
import microphoneIcon from "../assets/microphone.png";
import addFile from "../assets/plus.png";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { HardDrive, Upload, File as FileIcon, X } from "lucide-react";
import { useGooglePicker } from "@/hooks/useGooglePicker";
import * as pdfjsLib from "pdfjs-dist";


pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface FormData {
  text: string;
}

// Renders the first page of a PDF to a PNG data URL for use as a thumbnail
async function renderPdfThumbnail(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1 });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas context unavailable");

  await page.render({ canvas, canvasContext: context, viewport }).promise;
  return canvas.toDataURL("image/png");
}

function getExtensionBadge(fileName: string) {
  const ext = fileName.split(".").pop()?.toUpperCase() || "FILE";
  return ext.length > 5 ? "FILE" : ext;
}

export function TextareaForm({
  onSubmit: onPromptSubmit,
  isLoading,
  modelSelector,
}: {
  onSubmit: (prompt: string, file: File | null) => void;
  isLoading: boolean;
  modelSelector?: React.ReactNode;
}) {
  const form = useForm<FormData>({
    defaultValues: { text: "" },
  });

  const { openPicker } = useGooglePicker();
  const [isPopoverOpen, setIspopoverOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // FIXED: Renamed to plural to match your usage
  const [pastedContents, setPastedContents] = useState<string[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // ── Drag & drop state ──
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // ── Thumbnail preview state ──
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isThumbnailLoading, setIsThumbnailLoading] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    async function buildPreview() {
      if (!selectedFile) {
        setPreviewUrl(null);
        return;
      }

      if (selectedFile.type.startsWith("image/")) {
        objectUrl = URL.createObjectURL(selectedFile);
        setPreviewUrl(objectUrl);
        return;
      }

      if (selectedFile.type === "application/pdf") {
        setIsThumbnailLoading(true);
        try {
          const dataUrl = await renderPdfThumbnail(selectedFile);
          if (!cancelled) setPreviewUrl(dataUrl);
        } catch (err) {
          console.error("PDF thumbnail generation failed:", err);
          if (!cancelled) setPreviewUrl(null);
        } finally {
          if (!cancelled) setIsThumbnailLoading(false);
        }
        return;
      }

      setPreviewUrl(null);
    }

    buildPreview();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  const handelDriverClick = () => {
    openPicker((file) => {
      toast(`Selected file:${file.name}`);
    });
  };

  const handelFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      setSelectedFile(file);
      setIspopoverOpen(false);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    // Required so the browser allows a drop here at all
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only turn off the highlight when we actually leave the container,
    // not when we move between child elements inside it
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggingOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const textWatch = form.watch("text");

  async function onSubmit(data: FormData) {
    if (!data.text.trim() && !selectedFile) return;

    onPromptSubmit(data.text.trim(), selectedFile);
    form.reset();
    setSelectedFile(null);
    setPastedContents([]); // FIXED: Using the plural setter

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full space-y-2 flex flex-col"
      >
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div
                  className={`relative rounded-lg border bg-background focus-within:ring-ring overflow-visible transition-colors ${
                    isDraggingOver ? "border-primary border-2 bg-primary/5" : ""
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {/* DRAG OVERLAY */}
                  {isDraggingOver && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm pointer-events-none">
                      <div className="flex flex-col items-center gap-2 text-primary">
                        <Upload className="h-6 w-6" />
                        <p className="text-sm font-medium">
                          Drop file to attach
                        </p>
                      </div>
                    </div>
                  )}

                  {/* SELECTED FILE — Claude-style square preview card */}
                  {selectedFile && (
                    <div className="px-4 pt-4 pb-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="group relative w-36 h-36 rounded-xl border border-border bg-white shadow-sm overflow-hidden">
                              {/* Remove button */}
                              <button
                                type="button"
                                onClick={() => setSelectedFile(null)}
                                className="absolute top-1.5 right-1.5 z-10 rounded-full bg-background/90 hover:bg-muted border border-border p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>

                              {/* Thumbnail content */}
                              {previewUrl ? (
                                <img
                                  src={previewUrl}
                                  alt={selectedFile.name}
                                  className="w-full h-full object-cover bg-white"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted/40">
                                  {isThumbnailLoading ? (
                                    <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
                                  ) : (
                                    <FileIcon className="h-9 w-9 text-muted-foreground" />
                                  )}
                                </div>
                              )}

                              {/* Type badge */}
                              <span className="absolute bottom-1.5 left-1.5 bg-foreground/85 text-background text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md tracking-wide">
                                {getExtensionBadge(selectedFile.name)}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="bg-white p-2 rounded-md">
                              {selectedFile.name}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}

                  {/* PASTED CARDS ROW */}
                  {pastedContents.length > 0 && (
                    <div className="flex flex-row gap-4 overflow-x-auto px-4 pt-4 pb-2">
                      {pastedContents.map((content, index) => (
                        <div
                          key={index}
                          onClick={() => setExpandedIndex(index)}
                          className="group relative bg-muted/40 border border-border rounded-xl p-3 w-56 flex-shrink-0 overflow-visible mt-2 cursor-pointer hover:bg-muted/80 transition-colors"
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newContents = pastedContents.filter(
                                (_, i) => i !== index,
                              );
                              setPastedContents(newContents);
                              if (newContents.length === 0) {
                                form.setValue("text", "");
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 absolute -top-3 -left-3 bg-background border border-border hover:bg-muted text-foreground rounded-full p-1 shadow-sm transition-all duration-200 z-10"
                          >
                            <X className="w-4 h-4" />
                          </button>

                          <div className="line-clamp-4 text-foreground/70 text-[11px] leading-relaxed mb-3 break-all font-mono">
                            {content}
                          </div>

                          <div>
                            <span className="border border-border/80 text-foreground/80 text-[10px] font-bold px-2.5 py-1 rounded-md">
                              PASTED
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TEXT INPUT FOR INSTRUCTIONS */}
                  {pastedContents.length > 0 && (
                    <input
                      type="text"
                      placeholder="Add a message or just hit send..."
                      className="w-full bg-transparent px-4 py-2 pb-12 text-sm outline-none text-foreground placeholder:text-muted-foreground"
                      onChange={(e) => {
                        // Combine the user's typed message with ALL pasted contents
                        const combinedPasted = pastedContents
                          .map((text) => "```\n" + text + "\n```")
                          .join("\n\n");
                        const combined = e.target.value
                          ? `${e.target.value}\n\n${combinedPasted}`
                          : combinedPasted;
                        form.setValue("text", combined);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          form.handleSubmit(onSubmit)();
                        }
                      }}
                      // 1. ADD THIS ONPASTE HANDLER HERE
                      onPaste={(e) => {
                        const pasted = e.clipboardData.getData("text");
                        if (pasted.length > 300) {
                          e.preventDefault();

                          setPastedContents((prev) => {
                            const newContents = [...prev, pasted];

                            // Grab whatever the user might have already typed
                            const currentTypedText = (
                              e.target as HTMLInputElement
                            ).value;
                            const combinedPasted =
                              newContents.join("\n\n---\n\n");

                            const combined = currentTypedText
                              ? `${currentTypedText}\n\n${combinedPasted}`
                              : combinedPasted;

                            form.setValue("text", combined);
                            return newContents;
                          });
                        }
                      }}
                    />
                  )}

                  {/* MAIN TEXTAREA */}
                  <Textarea
                    placeholder="How can I help you today?"
                    className={`w-full resize-none border-0 bg-transparent px-4 pt-4 pb-12 focus-visible:ring-0 focus-visible:ring-offset-0 max-h-[400px] overflow-y-auto ${
                      pastedContents.length > 0
                        ? "opacity-0 h-0 min-h-0 pt-0 pb-0 absolute pointer-events-none"
                        : "min-h-[100px]"
                    }`}
                    {...field}
                    ref={(e) => {
                      field.ref(e);
                      (textareaRef as any).current = e;
                    }}
                    disabled={isLoading}
                    rows={1}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = "auto";
                      target.style.height = `${target.scrollHeight}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        form.handleSubmit(onSubmit)();
                        e.currentTarget.blur();
                      }
                    }}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData("text");
                      if (pasted.length > 300) {
                        e.preventDefault();

                        // Add the new text to our array of pasted contents
                        setPastedContents((prev) => {
                          const newContents = [...prev, pasted];
                          // Instantly update the form value so it's ready to submit
                          form.setValue(
                            "text",
                            newContents.join("\n\n---\n\n"),
                          );
                          return newContents;
                        });
                      }
                    }}
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handelFileSelect}
                    className="hidden"
                  />
                  <div className="absolute bottom-2 left-2 flex items-center gap-2">
                    <Popover
                      open={isPopoverOpen}
                      onOpenChange={setIspopoverOpen}
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <PopoverTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                type="button"
                                className="rounded-full hover:bg-slate-400"
                              >
                                <img
                                  src={addFile}
                                  alt="Add file"
                                  className="size-8"
                                />
                              </Button>
                            </PopoverTrigger>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="bg-white p-2 rounded-md">Add file</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <PopoverContent className="w-auto p-1 bg-slate-300">
                        <div className="grid gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="justify-start hover:bg-slate-400"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Files
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="justify-start hover:bg-slate-400"
                            onClick={handelDriverClick}
                          >
                            <HardDrive className="mr-2 h-4 w-4" />
                            Add from Drive
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="absolute bottom-2 right-2 flex items-center gap-4 overflow-visible">
                    {modelSelector}
                    <TooltipProvider>
                      {textWatch.trim().length > 0 ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              type="submit"
                              disabled={isLoading}
                              className="bg-slate-300 rounded-full hover:bg-slate-400"
                            >
                              <img
                                src={sendIcon}
                                alt="Send"
                                className="size-5"
                              />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="bg-white p-2 rounded-md">Submit</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              type="button"
                              disabled={isLoading}
                              className="bg-slate-300 rounded-full hover:bg-slate-400"
                            >
                              <img
                                src={microphoneIcon}
                                alt="Mic"
                                className="size-5"
                              />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="bg-white p-2 rounded-md">
                              Use Microphone
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TooltipProvider>
                  </div>
                </div>
              </FormControl>
              <FormDescription></FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* FULL SCREEN MODAL FOR PASTED CONTENT */}
        {expandedIndex !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in-0"
            onClick={() => setExpandedIndex(null)} // Click outside to close
          >
            <div
              className="bg-background text-foreground rounded-2xl w-full max-w-4xl max-h-full flex flex-col shadow-2xl border border-border overflow-hidden"
              onClick={(e) => e.stopPropagation()} // Prevent clicks inside modal from closing it
            >
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <div>
                  <h2 className="text-xl font-semibold">Pasted content</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {pastedContents[expandedIndex]?.length} characters •
                    Formatting may be inconsistent from source
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedIndex(null)}
                  className="p-2 hover:bg-muted rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-muted/30 m-6 rounded-xl border border-border/50 flex-1 min-h-[300px]">
                <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                  {pastedContents[expandedIndex]}
                </pre>
              </div>
            </div>
          </div>
        )}
      </form>
    </Form>
  );
}
