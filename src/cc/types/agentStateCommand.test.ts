import { describe, expect, it } from "vitest";
import {
  AGENT_STATE_COMMANDS,
  AGENT_STATE_COMMAND_EVENT_EQUIVALENTS,
  agentStateLabelKey,
  isAgentStateSelected,
  normalizeAgentStateCommand,
  type AgentStateCommand,
} from "./agentStateCommand";

describe("normalizeAgentStateCommand", () => {
  it("accepts each command value as-is", () => {
    for (const command of AGENT_STATE_COMMANDS) {
      expect(normalizeAgentStateCommand(command)).toBe(command);
    }
  });

  it("normalizes surrounding whitespace and letter case", () => {
    expect(normalizeAgentStateCommand(" READY ")).toBe("ready");
    expect(normalizeAgentStateCommand("Not_Ready")).toBe("not_ready");
    expect(normalizeAgentStateCommand("  Break\t")).toBe("break");
  });

  it("returns null for empty or whitespace-only strings", () => {
    expect(normalizeAgentStateCommand("")).toBeNull();
    expect(normalizeAgentStateCommand("   ")).toBeNull();
  });

  it("returns null for system-driven event states (not agent-selectable)", () => {
    expect(normalizeAgentStateCommand("on_call")).toBeNull();
    expect(normalizeAgentStateCommand("after_call_work")).toBeNull();
    expect(normalizeAgentStateCommand("offline")).toBeNull();
    // Canonical equivalents of commands are event values, not command values.
    expect(normalizeAgentStateCommand("available")).toBeNull();
    expect(normalizeAgentStateCommand("busy")).toBeNull();
  });

  it("returns null for unknown values", () => {
    expect(normalizeAgentStateCommand("hmm")).toBeNull();
    expect(normalizeAgentStateCommand("ready; DROP TABLE agents")).toBeNull();
  });

  it("returns null for non-strings", () => {
    expect(normalizeAgentStateCommand(null)).toBeNull();
    expect(normalizeAgentStateCommand(42)).toBeNull();
    expect(normalizeAgentStateCommand({ state: "ready" })).toBeNull();
    expect(normalizeAgentStateCommand(undefined)).toBeNull();
  });
});

describe("agentStateLabelKey", () => {
  it("resolves a label key for every command value", () => {
    expect(agentStateLabelKey("ready")).toBe("cc.softphone.state_ready");
    expect(agentStateLabelKey("not_ready")).toBe("cc.softphone.state_not_ready");
    expect(agentStateLabelKey("break")).toBe("cc.softphone.state_break");
  });

  it("resolves a label key for every canonical event state", () => {
    expect(agentStateLabelKey("available")).toBe("cc.softphone.state_available");
    expect(agentStateLabelKey("on_call")).toBe("cc.softphone.state_on_call");
    expect(agentStateLabelKey("busy")).toBe("cc.softphone.state_busy");
    expect(agentStateLabelKey("after_call_work")).toBe(
      "cc.softphone.state_after_call_work"
    );
    expect(agentStateLabelKey("offline")).toBe("cc.softphone.state_offline");
  });

  it("returns null for unknown states so callers render them as-is", () => {
    expect(agentStateLabelKey("out_to_lunch")).toBeNull();
  });
});

describe("isAgentStateSelected", () => {
  it("selects a command when the event echoed the command value", () => {
    expect(isAgentStateSelected("ready", "ready")).toBe(true);
    expect(isAgentStateSelected("break", "break")).toBe(true);
  });

  it("selects a command when the event echoed the canonical equivalent", () => {
    expect(isAgentStateSelected("ready", "available")).toBe(true);
    expect(isAgentStateSelected("not_ready", "busy")).toBe(true);
  });

  it("does not select a command for other states, even related ones", () => {
    expect(isAgentStateSelected("ready", "break")).toBe(false);
    expect(isAgentStateSelected("ready", "on_call")).toBe(false);
    expect(isAgentStateSelected("break", "busy")).toBe(false);
    expect(isAgentStateSelected("ready", "out_to_lunch")).toBe(false);
  });

  it("does not select any command before an event arrives", () => {
    expect(isAgentStateSelected("ready", null)).toBe(false);
  });
});

describe("vocabulary completeness (contract §5 sync)", () => {
  it("gives every command a label key and an event equivalent", () => {
    for (const command of AGENT_STATE_COMMANDS) {
      expect(agentStateLabelKey(command)).not.toBeNull();
      expect(AGENT_STATE_COMMAND_EVENT_EQUIVALENTS[command]).toBeTruthy();
    }
  });

  it("keeps each command's event equivalent labeled", () => {
    const commands: readonly AgentStateCommand[] = AGENT_STATE_COMMANDS;
    for (const command of commands) {
      const equivalent = AGENT_STATE_COMMAND_EVENT_EQUIVALENTS[command];
      expect(agentStateLabelKey(equivalent)).not.toBeNull();
    }
  });
});
