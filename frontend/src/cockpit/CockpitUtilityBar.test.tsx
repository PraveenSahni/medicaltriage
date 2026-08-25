import { fireEvent, render, screen } from "@testing-library/react";
import { CockpitUtilityBar } from "./CockpitUtilityBar";
import type { AuthenticatedSession } from "../auth/session";

const session = {
  user: { fullName: "Layla Hassan" }
} as AuthenticatedSession;

describe("Cockpit hold-first navigation", () => {
  it("blocks sign out during an active call and tells the nurse to hold it", () => {
    const onLogout = jest.fn();
    render(
      <CockpitUtilityBar
        session={session}
        onLogout={onLogout}
        onBack={jest.fn()}
        autoGenerateOn={false}
        onToggleGenerate={jest.fn()}
        navigationLocked
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(onLogout).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Select Hold Call");
  });

  it("allows sign out after the call is held", () => {
    const onLogout = jest.fn();
    render(
      <CockpitUtilityBar
        session={session}
        onLogout={onLogout}
        autoGenerateOn={false}
        onToggleGenerate={jest.fn()}
        navigationLocked={false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
