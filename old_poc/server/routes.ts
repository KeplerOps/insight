import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { llmService, type Provider } from "./llm";
import { db } from "@db";
import { chats, messages, users, folders, tags, chatTags, artifacts } from "@db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { githubService } from "./github";
import { validateUUID } from "./utils";
import { handleTrigger, stripTriggers } from "./workflows";

type Role = "user" | "assistant";

interface Message {
  role: Role;
  content: string;
}

// Shared function to handle triggers and generate responses
async function handleTriggersAndResponse(
  content: string,
  chatId: string,
  chat: { provider: string; model: string },
  messageHistory: Message[]
): Promise<{ skipLLM: boolean; assistantMessage: any; cleanContent: string }> {
  const { content: cleanContent, triggers } = stripTriggers(content);
  
  let skipLLM = false;
  let assistantMessage = null;

  // Handle triggers sequentially
  for (const trigger of triggers) {
    const result = await handleTrigger(trigger, await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(messages.createdAt));

    if (result?.message) {
      [assistantMessage] = await db
        .insert(messages)
        .values({
          chatId,
          role: "assistant",
          content: result.message,
        })
        .returning();
    }

    if (result?.returnControl) {
      skipLLM = true;
      break;
    }
  }

  if (!skipLLM) {
    const assistantContent = await llmService.generateResponse(
      chat.provider as Provider,
      chat.model,
      [...messageHistory, { role: "user", content: cleanContent }]
    );

    [assistantMessage] = await db
      .insert(messages)
      .values({
        chatId,
        role: "assistant",
        content: assistantContent,
      })
      .returning();
  }

  return { skipLLM, assistantMessage, cleanContent };
}

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Folder routes
  app.get("/api/folders", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const userFolders = await db
      .select()
      .from(folders)
      .where(eq(folders.userId, req.user.id))
      .orderBy(desc(folders.updatedAt));

    res.json(userFolders);
  });

  app.post("/api/folders", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const { name, color } = req.body;
    const [folder] = await db
      .insert(folders)
      .values({
        userId: req.user.id,
        name,
        color,
      })
      .returning();

    res.json(folder);
  });

  app.put("/api/folders/:folderId", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const folderId = parseInt(req.params.folderId);
    const { name, color } = req.body;

    const [updatedFolder] = await db
      .update(folders)
      .set({ name, color })
      .where(
        and(eq(folders.id, folderId), eq(folders.userId, req.user.id))
      )
      .returning();

    res.json(updatedFolder);
  });

  // Tag routes
  app.get("/api/tags", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const userTags = await db
      .select()
      .from(tags)
      .where(eq(tags.userId, req.user.id))
      .orderBy(tags.name);

    res.json(userTags);
  });

  app.post("/api/tags", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const { name, color } = req.body;
    const [tag] = await db
      .insert(tags)
      .values({
        userId: req.user.id,
        name,
        color,
      })
      .returning();

    res.json(tag);
  });

  // Chat tag management
  app.post("/api/chats/:chatId/tags/:tagId", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const chatId = req.params.chatId;
    const tagId = parseInt(req.params.tagId);

    // Validate UUID format
    const uuidValidation = validateUUID(chatId);
    if (!uuidValidation.valid) {
      return res.status(400).json({ 
        error: "Invalid chat ID format", 
        details: uuidValidation.error 
      });
    }

    // Verify ownership
    const [chat] = await db
      .select()
      .from(chats)
      .where(
        and(eq(chats.id, chatId), eq(chats.userId, req.user.id))
      )
      .limit(1);

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const [tag] = await db
      .select()
      .from(tags)
      .where(
        and(eq(tags.id, tagId), eq(tags.userId, req.user.id))
      )
      .limit(1);

    if (!tag) {
      return res.status(404).json({ error: "Tag not found" });
    }

    try {
      await db
        .insert(chatTags)
        .values({
          chatId,
          tagId,
        })
        .onConflictDoNothing();

      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ 
        error: "Failed to add tag to chat",
        details: error.message 
      });
    }
  });

  app.delete("/api/chats/:chatId/tags/:tagId", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const chatId = req.params.chatId; 
    const tagId = parseInt(req.params.tagId);

    await db
      .delete(chatTags)
      .where(
        and(
          eq(chatTags.chatId, chatId),
          eq(chatTags.tagId, tagId)
        )
      );

    res.status(204).send();
  });

  // Chat routes (updated to include folderId)
  app.post("/api/chats", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const { title, provider, model, folderId } = req.body;
    const [chat] = await db
      .insert(chats)
      .values({
        userId: req.user.id,
        title,
        provider,
        model,
        folderId: folderId || null,
      })
      .returning();

    res.json(chat);
  });

  app.get("/api/chats", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const userChats = await db
      .select()
      .from(chats)
      .where(eq(chats.userId, req.user.id))
      .orderBy(desc(chats.updatedAt));

    res.json(userChats);
  });

  app.get("/api/chats/:chatId/messages", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const chatId = req.params.chatId;

    // Validate UUID format
    const uuidValidation = validateUUID(chatId);
    if (!uuidValidation.valid) {
      return res.status(400).json({ 
        error: "Invalid chat ID format", 
        details: uuidValidation.error 
      });
    }

    try {
      const [chat] = await db
        .select()
        .from(chats)
        .where(
          and(eq(chats.id, chatId), eq(chats.userId, req.user.id))
        )
        .limit(1);

      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }

      const chatMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chatId))
        .orderBy(messages.createdAt);

      res.json(chatMessages);
    } catch (error: any) {
      res.status(500).json({ 
        error: "Failed to fetch chat messages",
        details: error.message 
      });
    }
  });

  app.post("/api/chats/:chatId/messages", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const chatId = req.params.chatId;
    const { content } = req.body;

    // Validate UUID format
    const uuidValidation = validateUUID(chatId);
    if (!uuidValidation.valid) {
      return res.status(400).json({ 
        error: "Invalid chat ID format", 
        details: uuidValidation.error 
      });
    }

    try {
      const [chat] = await db
        .select()
        .from(chats)
        .where(
          and(eq(chats.id, chatId), eq(chats.userId, req.user.id))
        )
        .limit(1);

      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }

      const messageHistory = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chatId))
        .orderBy(messages.createdAt)
        .then(res => res
          .map(msg => ({ 
            role: msg.role as Role, 
            content: msg.content 
          }))
          .filter(msg => msg.content.trim() !== "")
        );

      const { cleanContent, assistantMessage } = await handleTriggersAndResponse(
        content,
        chatId,
        chat,
        messageHistory
      );

      // Save user message with cleaned content
      const [userMessage] = await db
        .insert(messages)
        .values({
          chatId,
          role: "user",
          content: cleanContent,
        })
        .returning();

      res.json([userMessage, assistantMessage]);
    } catch (error: any) {
      res.status(500).json({ 
        error: "Failed to process chat message",
        details: error.message 
      });
    }
  });

  app.put("/api/chats/:chatId/messages/:messageId", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const chatId = req.params.chatId;
    const messageId = req.params.messageId;
    const { content } = req.body;

    // Validate UUID format for chatId
    const uuidValidation = validateUUID(chatId);
    if (!uuidValidation.valid) {
      return res.status(400).json({ 
        error: "Invalid chat ID format", 
        details: uuidValidation.error 
      });
    }

    try {
      // Verify chat ownership and message exists
      const [message] = await db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.id, messageId),
            eq(messages.chatId, chatId)
          )
        )
        .limit(1);

      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }

      // Verify chat ownership
      const [chat] = await db
        .select()
        .from(chats)
        .where(
          and(eq(chats.id, chatId), eq(chats.userId, req.user.id))
        )
        .limit(1);

      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }

      // Get chat history up to the edited message
      const chatHistory = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chatId))
        .orderBy(desc(messages.createdAt));

      // Find the index of the edited message
      const editedMessageIndex = chatHistory.findIndex(m => m.id === messageId);
      if (editedMessageIndex === -1) {
        throw new Error("Message not found in history");
      }

      // Delete all messages that come after the edited message
      const messagesToDelete = chatHistory.slice(0, editedMessageIndex).map(m => m.id);
      if (messagesToDelete.length > 0) {
        await db
          .delete(messages)
          .where(
            and(
              eq(messages.chatId, chatId),
              inArray(messages.id, messagesToDelete)
            )
          );
      }

      // Keep only messages up to the edited message
      const relevantHistory = chatHistory.slice(editedMessageIndex).reverse();
      const messageHistory = relevantHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const { cleanContent, assistantMessage } = await handleTriggersAndResponse(
        content,
        chatId,
        chat,
        messageHistory as Message[]
      );

      // Update the message
      const [updatedMessage] = await db
        .update(messages)
        .set({ content: cleanContent, updatedAt: new Date() })
        .where(eq(messages.id, messageId))
        .returning();

      // Return both the edited message and the new assistant response
      res.json([updatedMessage, assistantMessage]);

    } catch (error: any) {
      res.status(500).json({ 
        error: "Failed to edit message and regenerate response",
        details: error.message 
      });
    }
  });

  app.put("/api/chats/:chatId", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const chatId = req.params.chatId; 
    const { archived, folderId } = req.body;

    const [updatedChat] = await db
      .update(chats)
      .set({ 
        archived,
        folderId: folderId || null,
        updatedAt: new Date(),
      })
      .where(
        and(eq(chats.id, chatId), eq(chats.userId, req.user.id))
      )
      .returning();

    res.json(updatedChat);
  });

  app.delete("/api/chats/:chatId", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const chatId = req.params.chatId; 

    await db
      .delete(messages)
      .where(eq(messages.chatId, chatId));

    await db
      .delete(chats)
      .where(
        and(eq(chats.id, chatId), eq(chats.userId, req.user.id))
      );

    res.status(204).send();
  });

  // Artifact routes
  app.post("/api/chats/:chatId/messages/:messageId/artifacts", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const chatId = req.params.chatId;
    const messageId = req.params.messageId;
    const { type, name, content, metadata } = req.body;

    // Verify ownership
    const [chat] = await db
      .select()
      .from(chats)
      .where(
        and(eq(chats.id, chatId), eq(chats.userId, req.user.id))
      )
      .limit(1);

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const [artifact] = await db
      .insert(artifacts)
      .values({
        chatId,
        messageId,
        type,
        name,
        content,
        metadata: metadata || {},
      })
      .returning();

    res.json(artifact);
  });

  app.get("/api/chats/:chatId/artifacts", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const chatId = req.params.chatId;
    const artifactsList = await db
      .select()
      .from(artifacts)
      .where(eq(artifacts.chatId, chatId));

    res.json(artifactsList);
  });

  app.put("/api/artifacts/:artifactId", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const { name, content } = req.body;
    const [updatedArtifact] = await db
      .update(artifacts)
      .set({ name, content })
      .where(eq(artifacts.id, req.params.artifactId))
      .returning();

    res.json(updatedArtifact);
  });

  app.delete("/api/artifacts/:artifactId", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    await db
      .delete(artifacts)
      .where(eq(artifacts.id, req.params.artifactId));

    res.status(204).send();
  });

  // User settings routes
  app.put("/api/user/settings", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const { openaiKey, anthropicKey, githubKey } = req.body;

    // Verify GitHub token if provided
    if (githubKey) {
      githubService.setToken(githubKey);
      const isValid = await githubService.verifyToken();
      if (!isValid) {
        return res.status(400).send("Invalid GitHub token");
      }
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        openaiKey,
        anthropicKey,
        githubKey,
      })
      .where(eq(users.id, req.user.id))
      .returning();

    res.json(updatedUser);
  });

  const httpServer = createServer(app);
  return httpServer;
}