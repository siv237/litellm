import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  convertImageToBase64,
  createChatMultimodalСообщение,
  createChatDisplayСообщение,
  shouldShowChatAttachedImage,
} from "./ChatImageUtils";
import { СообщениеType } from "@/components/chat_ui/types";

describe("ChatImageUtils", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
  });

  describe("convertImageToBase64", () => {
    it("should convert file to base64 data URI", async () => {
      const file = new File(["test content"], "test.png", { type: "image/png" });
      const result = await convertImageToBase64(file);
      expect(result).toMatch(/^data:image\/png;base64,/);
    });

    it("should handle different file types", async () => {
      const jpegFile = new File(["jpeg content"], "test.jpg", { type: "image/jpeg" });
      const result = await convertImageToBase64(jpegFile);
      expect(result).toMatch(/^data:image\/jpeg;base64,/);
    });

    it("should reject on file read error", async () => {
      const file = new File(["test"], "test.png", { type: "image/png" });
      const originalReadAsDataURL = FileReader.prototype.readAsDataURL;

      FileReader.prototype.readAsDataURL = vi.fn(function (this: FileReader) {
        setВремявыход(() => {
          if (this.onerror) {
            this.onerror(new Ошибка("Read error") as any);
          }
        }, 0);
      });

      await expect(convertImageToBase64(file)).rejects.toThrow();

      FileReader.prototype.readAsDataURL = originalReadAsDataURL;
    });
  });

  describe("createChatMultimodalСообщение", () => {
    it("should create multimodal message with text and image", async () => {
      const file = new File(["test content"], "test.png", { type: "image/png" });
      const inputСообщение = "What is in this image?";

      const result = await createChatMultimodalСообщение(inputСообщение, file);

      expect(result.role).toBe("user");
      expect(result.content).toHaveLength(2);
      expect(result.content[0]).toEqual({ type: "text", text: inputСообщение });
      expect(result.content[1]).toMatchObject({
        type: "image_url",
        image_url: {
          url: expect.stringMatching(/^data:image\/png;base64,/),
        },
      });
    });

    it("should include base64 data URI in image_url", async () => {
      const file = new File(["test content"], "test.png", { type: "image/png" });
      const result = await createChatMultimodalСообщение("test", file);

      const imageContent = result.content[1];
      expect(imageContent.type).toBe("image_url");
      if ("image_url" in imageContent && imageContent.image_url) {
        expect(imageContent.image_url.url).toMatch(/^data:/);
      }
    });
  });

  describe("createChatDisplayСообщение", () => {
    it("should create display message withвыход file", () => {
      const result = createChatDisplayСообщение("Hello world", false);

      expect(result.role).toBe("user");
      expect(result.content).toBe("Hello world");
      expect(result.image-предпросмотрUrl).toBeUndefined();
    });

    it("should create display message with PDF file", () => {
      const file-предпросмотрUrl = "blob:test-url";
      const result = createChatDisplayСообщение("Read this", true, file-предпросмотрUrl, "document.pdf");

      expect(result.content).toBe("Read this [PDF attached]");
      expect(result.image-предпросмотрUrl).toBe(file-предпросмотрUrl);
    });

    it("should create display message with image file", () => {
      const file-предпросмотрUrl = "blob:test-url";
      const result = createChatDisplayСообщение("Look at this", true, file-предпросмотрUrl, "photo.jpg");

      expect(result.content).toBe("Look at this [Image attached]");
      expect(result.image-предпросмотрUrl).toBe(file-предпросмотрUrl);
    });

    it("should create display message with file but no fileName", () => {
      const file-предпросмотрUrl = "blob:test-url";
      const result = createChatDisplayСообщение("Check this", true, file-предпросмотрUrl);

      expect(result.content).toBe("Check this ");
      expect(result.image-предпросмотрUrl).toBe(file-предпросмотрUrl);
    });

    it("should create display message with file but no preview URL", () => {
      const result = createChatDisplayСообщение("See this", true, undefined, "image.png");

      expect(result.content).toBe("See this [Image attached]");
      expect(result.image-предпросмотрUrl).toBeUndefined();
    });
  });

  describe("shouldShowChatAttachedImage", () => {
    it("should return true for user message with image attachment", () => {
      const message: СообщениеType = {
        role: "user",
        content: "Check this [Image attached]",
        image-предпросмотрUrl: "blob:test-url",
      };

      expect(shouldShowChatAttachedImage(message)).toBe(true);
    });

    it("should return true for user message with PDF attachment", () => {
      const message: СообщениеType = {
        role: "user",
        content: "Read this [PDF attached]",
        image-предпросмотрUrl: "blob:test-url",
      };

      expect(shouldShowChatAttachedImage(message)).toBe(true);
    });

    it("should return false for assistant message", () => {
      const message: СообщениеType = {
        role: "assistant",
        content: "Here is the image [Image attached]",
        image-предпросмотрUrl: "blob:test-url",
      };

      expect(shouldShowChatAttachedImage(message)).toBe(false);
    });

    it("should return false when content is not a string", () => {
      const message: СообщениеType = {
        role: "user",
        content: [{ type: "input_text", text: "test" }],
        image-предпросмотрUrl: "blob:test-url",
      };

      expect(shouldShowChatAttachedImage(message)).toBe(false);
    });

    it("should return false when content does not include attachment marker", () => {
      const message: СообщениеType = {
        role: "user",
        content: "Just regular text",
        image-предпросмотрUrl: "blob:test-url",
      };

      expect(shouldShowChatAttachedImage(message)).toBe(false);
    });

    it("should return false when image-предпросмотрUrl is missing", () => {
      const message: СообщениеType = {
        role: "user",
        content: "Check this [Image attached]",
      };

      expect(shouldShowChatAttachedImage(message)).toBe(false);
    });

    it("should return false when image-предпросмотрUrl is empty string", () => {
      const message: СообщениеType = {
        role: "user",
        content: "Check this [Image attached]",
        image-предпросмотрUrl: "",
      };

      expect(shouldShowChatAttachedImage(message)).toBe(false);
    });
  });
});
