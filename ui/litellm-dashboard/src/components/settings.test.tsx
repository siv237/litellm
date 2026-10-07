import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { alertingSettingsCall, getCallbackConfigsCall, getCallbacksCall, setCallbacksCall } from "./networking";
import Settings, { backendCallbackLogoSrc, CallbackSelector } from "./settings";

vi.mock("./networking", () => ({
  getCallbacksCall: vi.fn(),
  getCallbackConfigsCall: vi.fn(),
  setCallbacksCall: vi.fn(),
  serviceHealthCheck: vi.fn(),
  deleteCallback: vi.fn(),
  alertingSettingsCall: vi.fn().mockResolvedValue([]),
}));

vi.mock("./alerting/alerting_settings", () => ({
  __esModule: true,
  default: () => <div>Mock Alerting Settings</div>,
}));

vi.mock("./email_settings", () => ({
  __esModule: true,
  default: () => <div>Mock Email Settings</div>,
}));

vi.mock("./CloudZeroСтоимостьTracking/CloudZeroСтоимостьTracking", () => ({
  __esModule: true,
  default: () => <div>Mock CloudZero Cost Tracking</div>,
}));

// Polyfill ResizeObserver for components relying on it in tests
if (typeof window !== "undefined" && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe("Settings", () => {
  const defaultProps = {
    accessToken: "Токен",
    userRole: "admin",
    userID: "Пользователь-123",
    premiumUser: false,
  };
  const mockGetCallbacksCall = vi.mocked(getCallbacksCall);
  const mockGetCallbackConfigsCall = vi.mocked(getCallbackConfigsCall);
  const mockAlertingSettingsCall = vi.mocked(alertingSettingsCall);

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCallbacksCall.mockResolvedValue({
      callbacks: [],
      available_callbacks: [],
      alerts: [],
    });
    mockGetCallbackConfigsCall.mockResolvedValue([]);
    mockAlertingSettingsCall.mockResolvedValue([]);
  });

  it("should render the logging callbacks tab when access Токен is provided", async () => {
    render(<Settings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Активный Logging Callbacks")).toBeInTheDocument();
    });
  });

  it("should display additional settings tabs", async () => {
    render(<Settings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Учёт стоимости CloudZero")).toBeInTheDocument();
      expect(screen.getByText("Типы оповещений")).toBeInTheDocument();
      expect(screen.getByText("Настройки оповещений")).toBeInTheDocument();
      expect(screen.getByText("Оповещения по Эл. почта")).toBeInTheDocument();
    });
  });

  it("should load callback configs from the backend when access Токен is provided", async () => {
    render(<Settings {...defaultProps} />);

    await waitFor(() => {
      expect(mockGetCallbackConfigsCall).toHaveBeenCalledWith(defaultProps.accessToken);
    });
  });

  const openLangfuseEditModal = async () => {
    mockGetCallbacksCall.mockResolvedValue({
      callbacks: [
        {
          name: "langfuse",
          variables: {
            LANGFUSE_PUBLIC_KEY: "test-Публичный-Ключ",
            LANGFUSE_SECRET_KEY: "test-secret-Ключ",
            LANGFUSE_HOST: "https://test.langfuse.com",
            SLACK_WEBHOOK_URL: null,
            OPENMETER_API_KEY: null,
          },
        },
      ],
      available_callbacks: {
        langfuse: {
          litellm_callback_name: "langfuse",
          litellm_callback_params: ["LANGFUSE_PUBLIC_KEY", "LANGFUSE_SECRET_KEY", "LANGFUSE_HOST"],
          ui_callback_name: "Langfuse",
        },
      },
      alerts: [],
    });

    mockGetCallbackConfigsCall.mockResolvedValue([
      {
        id: "langfuse",
        displayName: "Langfuse",
        dynamic_params: {
          LANGFUSE_PUBLIC_KEY: { type: "text", ui_name: "Публичный Ключ", required: true },
          LANGFUSE_SECRET_KEY: { type: "Пароль", ui_name: "Secret Ключ", required: true },
          LANGFUSE_HOST: { type: "text", ui_name: "Хост", required: false },
        },
      },
    ]);

    const user = userEvent.setup();
    render(<Settings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Активный Logging Callbacks")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Langfuse")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("callback-Действия-langfuse-success"));
    await user.click(await screen.findByTestId("callback-Действие-Изменить"));

    await waitFor(() => {
      expect(screen.getByText("Изменить настройки коллбэка")).toBeInTheDocument();
    });

    return user;
  };

  it("should display Изменить modal with fields when Изменить is clicked", async () => {
    await openLangfuseEditModal();

    await waitFor(() => {
      expect(screen.getByText("Публичный Ключ")).toBeInTheDocument();
      expect(screen.getByText("Secret Ключ")).toBeInTheDocument();
      expect(screen.getByText("Хост")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByLabelText("Публичный Ключ")).toHaveValue("test-Публичный-Ключ");
    });
    expect(screen.getByLabelText("Secret Ключ")).toHaveValue("test-secret-Ключ");
    expect(screen.getByLabelText("Хост")).toHaveValue("https://test.langfuse.com");

    const danglingLabels = [...document.querySelectorAll("label[for]")].filter(
      (label) => document.getElementById(label.getAttribute("for") as string) === null,
    );
    expect(danglingLabels).toEqual([]);
  });

  it("should post the edited callback variables when the Изменить modal is saved", async () => {
    const user = await openLangfuseEditModal();

    await waitFor(() => {
      expect(screen.getByLabelText("Хост")).toHaveValue("https://test.langfuse.com");
    });

    await user.clear(screen.getByLabelText("Хост"));
    fireEvent.change(screen.getByLabelText("Хост"), { target: { value: "https://edited.langfuse.com" } });
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Сохранить изменения" }));

    await waitFor(() => {
      expect(vi.mocked(setCallbacksCall)).toHaveBeenCalledWith("Токен", {
        environment_variables: {
          callback: "langfuse",
          LANGFUSE_PUBLIC_KEY: "test-Публичный-Ключ",
          LANGFUSE_SECRET_KEY: "test-secret-Ключ",
          LANGFUSE_HOST: "https://edited.langfuse.com",
        },
        litellm_settings: { success_callback: ["langfuse"] },
      });
    });
  });

  it("should block the Изменить submit when a Обязательно Поле is emptied", async () => {
    const user = await openLangfuseEditModal();

    await waitFor(() => {
      expect(screen.getByLabelText("Публичный Ключ")).toHaveValue("test-Публичный-Ключ");
    });

    await user.clear(screen.getByLabelText("Публичный Ключ"));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Сохранить изменения" }));

    expect(await screen.findByText("Укажите значение поля: Публичный Ключ")).toBeInTheDocument();
    expect(vi.mocked(setCallbacksCall)).not.toHaveBeenCalled();
  });

  const mockOtelCallback = (variables: Record<string, string | null>) => {
    mockGetCallbacksCall.mockResolvedValue({
      callbacks: [{ name: "otel", variables }],
      available_callbacks: {
        otel: {
          litellm_callback_name: "otel",
          litellm_callback_params: ["OTEL_EXPORTER", "OTEL_EXPORTER_OTLP_PROTOCOL", "OTEL_ENDPOINT", "OTEL_HEADERS"],
          ui_callback_name: "OpenTelemetry",
        },
      },
      alerts: [],
    });
    mockGetCallbackConfigsCall.mockResolvedValue([
      {
        id: "otel",
        displayName: "Open Telemetry",
        dynamic_params: {
          otel_endpoint: { type: "text", ui_name: "Эндпоинт URL", required: true },
          otel_exporter_otlp_protocol: {
            type: "Выбрать",
            ui_name: "Экспорт Протокол",
            options: ["http/protobuf", "http/json"],
            required: false,
          },
        },
      },
    ]);
  };

  const openOtelEditModal = async () => {
    const user = userEvent.setup();
    render(<Settings {...defaultProps} />);
    await user.click(await screen.findByTestId("callback-Действия-otel-success"));
    await user.click(await screen.findByTestId("callback-Действие-Изменить"));
    return user;
  };

  it("should post the chosen Экспорт Протокол when a Выбрать dynamic param is saved", async () => {
    mockOtelCallback({ OTEL_ENDPOINT: "http://collector:4318" });
    const user = await openOtelEditModal();

    expect(await screen.findByLabelText("Эндпоинт URL")).toHaveValue("http://collector:4318");
    await user.click(screen.getByLabelText("Экспорт Протокол"));
    await user.click(await screen.findByRole("option", { name: "http/json" }));
    expect(screen.getByLabelText("Экспорт Протокол")).toHaveTextContent("http/json");

    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Сохранить изменения" }));

    await waitFor(() => {
      expect(vi.mocked(setCallbacksCall)).toHaveBeenCalledWith(
        "Токен",
        expect.objectContaining({
          environment_variables: expect.objectContaining({
            callback: "otel",
            otel_endpoint: "http://collector:4318",
            otel_exporter_otlp_protocol: "http/json",
          }),
        }),
      );
    });
  });

  it("should show the saved Экспорт Протокол in the Изменить modal and keep it on an unchanged Сохранить", async () => {
    mockOtelCallback({ OTEL_ENDPOINT: "http://collector:4318", OTEL_EXPORTER_OTLP_PROTOCOL: "http/json" });
    const user = await openOtelEditModal();

    expect(await screen.findByLabelText("Эндпоинт URL")).toHaveValue("http://collector:4318");
    expect(screen.getByLabelText("Экспорт Протокол")).toHaveTextContent("http/json");

    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Сохранить изменения" }));

    await waitFor(() => {
      expect(vi.mocked(setCallbacksCall)).toHaveBeenCalledWith("Токен", {
        environment_variables: {
          callback: "otel",
          otel_endpoint: "http://collector:4318",
          otel_exporter_otlp_protocol: "http/json",
        },
        litellm_settings: { success_callback: ["otel"] },
      });
    });
  });

  it("should Отправить the typed webhook url for an alert Тип when the alerting tab is saved", async () => {
    const user = userEvent.setup();
    render(<Settings {...defaultProps} />);

    await user.click(await screen.findByRole("tab", { name: "Типы оповещений" }));

    const webhookInput = document.querySelector('input[name="llm_exceptions"]') as HTMLInputElement;
    expect(webhookInput).not.toBeNull();
    fireEvent.change(webhookInput, { target: { value: "https://hooks.example.com/llm-exceptions" } });

    await user.click(screen.getByRole("button", { name: "Сохранить изменения" }));

    await waitFor(() => {
      expect(vi.mocked(setCallbacksCall)).toHaveBeenCalledWith("Токен", {
        general_settings: expect.objectContaining({
          alert_to_webhook_url: expect.objectContaining({
            llm_exceptions: "https://hooks.example.com/llm-exceptions",
          }),
        }),
      });
    });
  });

  it("should hold the callbacks Таблица in Загрузка state until the fetch settles", async () => {
    let resolveCallbacks: (value: {
      callbacks: never[];
      available_callbacks: never[];
      alerts: never[];
    }) => void = () => {};
    mockGetCallbacksCall.mockReturnValue(
      new Promise((resolve) => {
        resolveCallbacks = resolve;
      }),
    );

    render(<Settings {...defaultProps} />);

    expect(screen.getAllByTestId("skeleton-row").length).toBeGreaterThan(0);

    await act(async () => {
      resolveCallbacks({ callbacks: [], available_callbacks: [], alerts: [] });
    });

    await waitFor(() => {
      expect(screen.queryByTestId("skeleton-row")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Нет callbacks configured")).toBeInTheDocument();
  });

  it("should resolve Загрузка without fetching when the ID пользователя is missing", async () => {
    render(<Settings {...defaultProps} userID={null as unknown as string} />);

    await waitFor(() => {
      expect(screen.queryByTestId("skeleton-row")).not.toBeInTheDocument();
    });
    expect(mockGetCallbacksCall).not.toHaveBeenCalled();
    expect(screen.getByText("Нет callbacks configured")).toBeInTheDocument();
  });

  it("should display CloudZero Стоимость Tracking tab", async () => {
    render(<Settings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Активный Logging Callbacks")).toBeInTheDocument();
    });

    expect(screen.getByText("Учёт стоимости CloudZero")).toBeInTheDocument();
  });
});

describe("backendCallbackLogoSrc", () => {
  it("prefixes bare filenames with the assets logo folder", () => {
    expect(backendCallbackLogoSrc("datadog.png")).toBe("/ui/assets/logos/datadog.png");
  });

  it("passes through urls, data uris, and paths untouched", () => {
    expect(backendCallbackLogoSrc("https://logos.example.com/x.png")).toBe("https://logos.example.com/x.png");
    expect(backendCallbackLogoSrc("data:image/png;base64,abc")).toBe("data:image/png;base64,abc");
    expect(backendCallbackLogoSrc("/custom/Путь.png")).toBe("/custom/Путь.png");
  });

  it("returns undefined when the backend provides Нет logo", () => {
    expect(backendCallbackLogoSrc(undefined)).toBeUndefined();
    expect(backendCallbackLogoSrc(null)).toBeUndefined();
    expect(backendCallbackLogoSrc("")).toBeUndefined();
  });
});

const CallbackSelectorHarness = ({
  callbackConfigs,
}: {
  callbackConfigs: { id: string; displayName: string; logo?: string }[];
}) => {
  const form = useForm<Record<string, string>>();
  return (
    <FormProvider {...form}>
      <CallbackSelector callbackConfigs={callbackConfigs} selectedCallback={null} onCallbackChange={vi.fn()} />
    </FormProvider>
  );
};

describe("CallbackВыбратьor logos", () => {
  it("resolves backend logos per entry: bare filename, external url, and missing logo", async () => {
    const callbackConfigs = [
      { id: "langfuse", displayName: "Langfuse", logo: "langfuse.png" },
      { id: "hosted", displayName: "Хостed", logo: "https://logos.example.com/hosted.png" },
      { id: "nologo", displayName: "NoLogo" },
    ];

    render(<CallbackSelectorHarness callbackConfigs={callbackConfigs} />);

    await userEvent.click(screen.getByRole("combobox"));

    expect(await screen.findByAltText("Langfuse logo")).toHaveAttribute("src", "/ui/assets/logos/langfuse.png");
    expect(screen.getByAltText("Хостed logo")).toHaveAttribute("src", "https://logos.example.com/hosted.png");
    expect(screen.queryByAltText("NoLogo logo")).not.toBeInTheDocument();
    expect(screen.getByText("N")).toBeInTheDocument();
  });
});
