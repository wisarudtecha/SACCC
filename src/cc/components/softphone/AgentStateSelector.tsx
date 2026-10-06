// Agent-state selector for the softphone header (`/cc/softphone`) — BRD
// FR-07 Ready / Not Ready / Break. Pure presentation: renders the presence
// pill (the latest AGENT_STATE_CHANGED state) and a dropdown that invokes
// `onSelect`; whether commands actually do anything (dev + mock mode only)
// is decided by `enabled` from `useSoftphone`, mirroring TelephonyToolbar.
//
// Command vocabulary + labels: `src/cc/types/agentStateCommand.ts`; wire
// contract: docs/Agent-State-Command-Contract.md.
import { Menu } from "@headlessui/react";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { ReactNode } from "react";
import {
  Check,
  ChevronDown,
  CircleCheck,
  CircleMinus,
  Coffee,
} from "lucide-react";
import {
  agentStateLabelKey,
  isAgentStateSelected,
  type AgentStateCommand,
} from "../../types/agentStateCommand";

export interface AgentStateSelectorProps {
  /** Latest AGENT_STATE_CHANGED payload state, or null before any event. */
  agentState: string | null;
  /** True when the command is wired (dev + mock mode only, like the toolbar). */
  enabled: boolean;
  onSelect: (state: AgentStateCommand) => void;
}

const COMMAND_OPTIONS: ReadonlyArray<{
  value: AgentStateCommand;
  labelKey: string;
  icon: ReactNode;
}> = [
  {
    value: "ready",
    labelKey: "cc.softphone.state_ready",
    icon: <CircleCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" />,
  },
  {
    value: "not_ready",
    labelKey: "cc.softphone.state_not_ready",
    icon: <CircleMinus className="h-4 w-4 text-amber-500" aria-hidden="true" />,
  },
  {
    value: "break",
    labelKey: "cc.softphone.state_break",
    icon: <Coffee className="h-4 w-4 text-sky-500" aria-hidden="true" />,
  },
];

export function AgentStateSelector({
  agentState,
  enabled,
  onSelect,
}: AgentStateSelectorProps) {
  const { t } = useTranslation();

  // Known states (either vocabulary) render localized; unknown states render
  // as-is (forward compatible, same rule as the lifecycle contract); no event
  // yet renders the placeholder.
  const stateKey = agentState === null ? null : agentStateLabelKey(agentState);
  const stateText =
    stateKey !== null
      ? t(stateKey)
      : (agentState ?? t("cc.softphone.agent_state_unknown"));
  const hint = enabled
    ? t("cc.softphone.agent_state")
    : t("cc.softphone.agent_state_command_unavailable");

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button
        type="button"
        disabled={!enabled}
        title={hint}
        aria-label={hint}
        className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 transition-colors enabled:hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:enabled:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {t("cc.softphone.agent_state")}:{" "}
        <span className="font-medium">{stateText}</span>
        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
      </Menu.Button>
      <Menu.Items className="absolute right-0 z-20 mt-2 w-44 origin-top-right rounded-lg border border-gray-200 bg-white shadow-lg focus:outline-none dark:border-gray-700 dark:bg-gray-900">
        <div className="px-1 py-1">
          {COMMAND_OPTIONS.map(({ value, labelKey, icon }) => (
            <Menu.Item key={value}>
              {({ active }) => (
                <button
                  type="button"
                  className={`${
                    active ? "bg-gray-100 dark:bg-gray-800" : ""
                  } flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-gray-700 dark:text-gray-200`}
                  onClick={() => onSelect(value)}
                >
                  {icon}
                  <span>{t(labelKey)}</span>
                  {isAgentStateSelected(value, agentState) && (
                    <Check
                      className="ml-auto h-3.5 w-3.5 text-gray-500 dark:text-gray-400"
                      aria-hidden="true"
                    />
                  )}
                </button>
              )}
            </Menu.Item>
          ))}
        </div>
      </Menu.Items>
    </Menu>
  );
}
