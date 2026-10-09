// Agent-state selector for the softphone header — restyled to a compact pill
// with a colored status dot.
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
  agentState: string | null;
  enabled: boolean;
  onSelect: (state: AgentStateCommand) => void;
}

const COMMAND_OPTIONS: ReadonlyArray<{
  value: AgentStateCommand;
  labelKey: string;
  icon: ReactNode;
  dotColor: string;
}> = [
  {
    value: "ready",
    labelKey: "cc.softphone.state_ready",
    icon: <CircleCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" />,
    dotColor: "bg-emerald-500",
  },
  {
    value: "not_ready",
    labelKey: "cc.softphone.state_not_ready",
    icon: <CircleMinus className="h-4 w-4 text-amber-500" aria-hidden="true" />,
    dotColor: "bg-amber-500",
  },
  {
    value: "break",
    labelKey: "cc.softphone.state_break",
    icon: <Coffee className="h-4 w-4 text-sky-500" aria-hidden="true" />,
    dotColor: "bg-sky-500",
  },
];

function stateDotColor(agentState: string | null): string {
  if (isAgentStateSelected("ready", agentState)) return "bg-emerald-500";
  if (isAgentStateSelected("not_ready", agentState)) return "bg-amber-500";
  if (isAgentStateSelected("break", agentState)) return "bg-sky-500";
  return "bg-gray-400";
}

export function AgentStateSelector({
  agentState,
  enabled,
  onSelect,
}: AgentStateSelectorProps) {
  const { t } = useTranslation();

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
        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors enabled:hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:enabled:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span
          className={`h-2.5 w-2.5 rounded-full ${stateDotColor(agentState)}`}
          aria-hidden="true"
        />
        <span>{stateText}</span>
        <ChevronDown className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
      </Menu.Button>
      <Menu.Items className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-xl border border-gray-200 bg-white shadow-lg focus:outline-none dark:border-gray-700 dark:bg-gray-900">
        <div className="px-1 py-1">
          {COMMAND_OPTIONS.map(({ value, labelKey, dotColor }) => (
            <Menu.Item key={value}>
              {({ active }) => (
                <button
                  type="button"
                  className={`${
                    active ? "bg-gray-100 dark:bg-gray-800" : ""
                  } flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-700 dark:text-gray-200`}
                  onClick={() => onSelect(value)}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${dotColor}`}
                    aria-hidden="true"
                  />
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
