"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageSquare,
  MoreHorizontal,
  Trash2,
  Folder,
  Share,
  Copy,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import apiFetch from "@/lib/api";

export const NavHistory = () => {
  const {
    conversations,
    selectConversation,
    activeConversationId,
    deleteConversation,
  } = useAuth();

  // ── Share dialog state (must live inside the component) ──
  const [shareDialogeOpen, setShareDialogeOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState("");
  const [copied, setCopied] = useState(false);

  const handelShareClick = async (conversationId: number) => {
    setShareDialogeOpen(true);
    setShareLoading(true);
    setShareError("");
    setCopied(false);
    setShareUrl("");

    try {
      const data = await apiFetch(`/conversations/${conversationId}/share`, {
        method: "POST",
      });
      setShareUrl(data.shareUrl);
    } catch (error) {
      console.error("Share Failed:", error);
      setShareError("Couldn't generate a share link. Please try again.");
    } finally {
      setShareLoading(false);
    }
  };

  const handelCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const { isMobile } = useSidebar();

  if (!conversations || conversations.length == 0) {
    return null;
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>History</SidebarGroupLabel>
        <SidebarMenu>
          {conversations.map((convo) => (
            <SidebarMenuItem key={convo.ID}>
              <div className="flex items-center w-full">
                <SidebarMenuButton
                  onClick={() => selectConversation(convo.ID)}
                  isActive={activeConversationId === convo.ID}
                  className="truncate flex-1"
                >
                  <MessageSquare className="size-4" />
                  <span className="truncate">{convo.title}</span>
                </SidebarMenuButton>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction showOnHover>
                      <MoreHorizontal />
                      <span className="sr-only">More</span>
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-48"
                    side={isMobile ? "bottom" : "right"}
                    align={isMobile ? "end" : "start"}
                  >
                    <DropdownMenuItem
                      onClick={() => selectConversation(convo.ID)}
                    >
                      <Folder className="text-muted-foreground" />
                      <span>View Project</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handelShareClick(convo.ID)}
                    >
                      <Share className="text-muted-foreground" />
                      <span>Share Project</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer "
                      onClick={() => deleteConversation(convo.ID)}
                    >
                      <Trash2 className="text-muted-foreground" />
                      <span>Delete Project</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>

      {/* ── Share link dialog ── */}
      <Dialog open={shareDialogeOpen} onOpenChange={setShareDialogeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Conversation</DialogTitle>
          </DialogHeader>

          {shareLoading && (
            <p className="text-sm text-muted-foreground">Generating link...</p>
          )}

          {shareError && <p className="text-sm text-red-500">{shareError}</p>}

          {!shareLoading && !shareError && shareUrl && (
            <div className="flex items-center space-x-2">
              <Input
                value={shareUrl}
                readOnly
                onFocus={(e) => e.target.select()}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handelCopyUrl}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Anyone with this link can view this conversation. They won't need to
            log in.
          </p>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShareDialogeOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
