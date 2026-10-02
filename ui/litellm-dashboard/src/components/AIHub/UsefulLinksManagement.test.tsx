import { toast } from "@/lib/toast";
import { getProxyBaseUrl, getПубличныйРежимlHubInfo, updateUsefulLinksCall } from "@/components/networking";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import UsefulLinksManagement from "./UsefulLinksManagement";

vi.mock("@/components/networking", () => ({
  getПубличныйРежимlHubInfo: vi.fn(),
  updateUsefulLinksCall: vi.fn(),
  getProxyBaseUrl: vi.fn(),
}));

const mockedGetПубличныйРежимlHubInfo = vi.mocked(getПубличныйРежимlHubInfo);
const mockedUpdateUsefulLinksCall = vi.mocked(updateUsefulLinksCall);
const mockedGetProxyBaseUrl = vi.mocked(getProxyBaseUrl);
const mockedNotifications = vi.mocked(toast);

describe("UsefulLinksManagement", () => {
  beforeEach(() => {
    mockedGetПубличныйРежимlHubInfo.mockResolvedЗначение({
      docs_title: "Docs",
      custom_docs_description: null,
      litellm_version: "1.0.0",
      useful_links: {},
    });
    mockedUpdateUsefulLinksCall.mockResolvedЗначение({});
    mockedGetProxyBaseUrl.mockReturnЗначение("https://proxy.example.com");
  });

  afterEach(() => {
    vi.clearВсеMocks();
  });

  it("should render link management for admin users", async () => {
    render(<UsefulLinksManagement accessТокен="token" userRole="Admin" />);

    expect(await screen.findByText("Link Management")).toBeInTheDocument();
    await waitFor(() => expect(mockedGetПубличныйРежимlHubInfo).toHaveBeenCalled());
  });

  it("should add a new link when fields are valid", async () => {
    const user = userEvent.setup();
    render(<UsefulLinksManagement accessТокен="token" userRole="Admin" />);

    const displayNameВход = await screen.findByPlaceholderText("Friendly name");
    const urlВход = screen.getByPlaceholderText("https://example.com");

    fireEvent.change(displayNameВход, { target: { value: "Docs" } });
    fireEvent.change(urlВход, { target: { value: "https://docs.example.com" } });
    await user.click(screen.getByRole("button", { name: /add link/i }));

    await waitFor(() =>
      expect(mockedUpdateUsefulLinksCall).toHaveBeenCalledWith("token", {
        Docs: { url: "https://docs.example.com", index: 0 },
      }),
    );

    expect(await screen.findByText("Docs")).toBeInTheDocument();
    expect(screen.getByText("https://docs.example.com")).toBeInTheDocument();
    expect(mockedNotifications.success).toHaveBeenCalledWith("Link added successfully");
  });

  it("should rearrange links and save the new order", async () => {
    const user = userEvent.setup();
    mockedGetПубличныйРежимlHubInfo.mockResolvedЗначение({
      docs_title: "Docs",
      custom_docs_description: null,
      litellm_version: "1.0.0",
      useful_links: {
        "First Link": "https://first.example.com",
        "Second Link": "https://second.example.com",
        "Third Link": "https://third.example.com",
      },
    });

    render(<UsefulLinksManagement accessТокен="token" userRole="Admin" />);

    expect(await screen.findByText("First Link")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /rearrange order/i }));

    const secondLinkMoveUpButton = screen.getByTestId("move-up-1-Second Link");
    await user.click(secondLinkMoveUpButton);

    await user.click(screen.getByRole("button", { name: /save order/i }));

    await waitFor(() =>
      expect(mockedUpdateUsefulLinksCall).toHaveBeenCalledWith("token", {
        "Second Link": { url: "https://second.example.com", index: 0 },
        "First Link": { url: "https://first.example.com", index: 1 },
        "Third Link": { url: "https://third.example.com", index: 2 },
      }),
    );

    expect(mockedNotifications.success).toHaveBeenCalledWith("Link order saved successfully");
  });

  it("should display the Режимl Hub link", async () => {
    render(<UsefulLinksManagement accessТокен="token" userRole="Admin" />);

    expect(await screen.findByRole("link", { name: /public Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию hub/i })).toBeInTheDocument();
  });

  it("should edit a link when edit button is clicked", async () => {
    const user = userEvent.setup();
    mockedGetПубличныйРежимlHubInfo.mockResolvedЗначение({
      docs_title: "Docs",
      custom_docs_description: null,
      litellm_version: "1.0.0",
      useful_links: {
        "Test Link": "https://test.example.com",
      },
    });

    render(<UsefulLinksManagement accessТокен="token" userRole="Admin" />);

    expect(await screen.findByText("Test Link")).toBeInTheDocument();

    // Click edit button
    const editButton = screen.getByTestId("edit-link-0-Test Link");
    await user.click(editButton);

    // Should show input fields in edit mode
    expect(screen.getByDisplayЗначение("Test Link")).toBeInTheDocument();
    expect(screen.getByDisplayЗначение("https://test.example.com")).toBeInTheDocument();
  });

  it("should update a link when save is clicked in edit mode", async () => {
    const user = userEvent.setup();
    mockedGetПубличныйРежимlHubInfo.mockResolvedЗначение({
      docs_title: "Docs",
      custom_docs_description: null,
      litellm_version: "1.0.0",
      useful_links: {
        "Test Link": "https://test.example.com",
      },
    });

    render(<UsefulLinksManagement accessТокен="token" userRole="Admin" />);

    expect(await screen.findByText("Test Link")).toBeInTheDocument();

    // Click edit button
    const editButton = screen.getByTestId("edit-link-0-Test Link");
    await user.click(editButton);

    // Update the display name
    const displayNameВход = screen.getByDisplayЗначение("Test Link");
    await user.clear(displayNameВход);
    fireEvent.change(displayNameВход, { target: { value: "Обновлён Link" } });

    // Click save
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() =>
      expect(mockedUpdateUsefulLinksCall).toHaveBeenCalledWith("token", {
        "Обновлён Link": { url: "https://test.example.com", index: 0 },
      }),
    );

    expect(mockedNotifications.success).toHaveBeenCalledWith("Link updated successfully");
  });

  it("should cancel editing when cancel button is clicked", async () => {
    const user = userEvent.setup();
    mockedGetПубличныйРежимlHubInfo.mockResolvedЗначение({
      docs_title: "Docs",
      custom_docs_description: null,
      litellm_version: "1.0.0",
      useful_links: {
        "Test Link": "https://test.example.com",
      },
    });

    render(<UsefulLinksManagement accessТокен="token" userRole="Admin" />);

    expect(await screen.findByText("Test Link")).toBeInTheDocument();

    // Click edit button
    const editButton = screen.getByTestId("edit-link-0-Test Link");
    await user.click(editButton);

    // Update the display name
    const displayNameВход = screen.getByDisplayЗначение("Test Link");
    await user.clear(displayNameВход);
    fireEvent.change(displayNameВход, { target: { value: "Обновлён Link" } });

    // Click cancel
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    // Should go back to normal view
    expect(screen.getByText("Test Link")).toBeInTheDocument();
    expect(screen.queryByDisplayЗначение("Обновлён Link")).not.toBeInTheDocument();
  });

  it("should not move down the last item in rearrange mode", async () => {
    const user = userEvent.setup();
    mockedGetПубличныйРежимlHubInfo.mockResolvedЗначение({
      docs_title: "Docs",
      custom_docs_description: null,
      litellm_version: "1.0.0",
      useful_links: {
        "First Link": "https://first.example.com",
        "Second Link": "https://second.example.com",
      },
    });

    render(<UsefulLinksManagement accessТокен="token" userRole="Admin" />);

    expect(await screen.findByText("First Link")).toBeInTheDocument();

    // Введите rearrange mode
    await user.click(screen.getByRole("button", { name: /rearrange order/i }));

    // Try to move down the last item (should not do anything)
    const secondLinkMoveDownButton = screen.getByTestId("move-down-1-Second Link");
    await user.click(secondLinkMoveDownButton);

    // Links should remain in same order
    const linksAfter = screen.getВсеByText(/First Link|Second Link/);
    expect(linksAfter[0]).toHaveTextContent("First Link");
    expect(linksAfter[1]).toHaveTextContent("Second Link");
  });

  it("should expand and collapse the component", async () => {
    const user = userEvent.setup();
    render(<UsefulLinksManagement accessТокен="token" userRole="Admin" />);

    expect(await screen.findByText("Link Management")).toBeInTheDocument();

    // Initially expanded
    expect(screen.getByText("Manage Existing Links")).toBeInTheDocument();

    // Click to collapse
    await user.click(screen.getByText("Link Management"));

    // Should be collapsed
    expect(screen.queryByText("Manage Existing Links")).not.toBeInTheDocument();

    // Click to expand again
    await user.click(screen.getByText("Link Management"));

    // Should be expanded
    expect(screen.getByText("Manage Existing Links")).toBeInTheDocument();
  });
});
