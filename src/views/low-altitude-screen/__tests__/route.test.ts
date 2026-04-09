import { describe, expect, it } from "vitest";
import { Layout, constantRoutes } from "@/router";

describe("low-altitude screen route", () => {
  it("registers /low-altitude-screen as a standalone top-level route", () => {
    const lowAltitudeScreenRoute = constantRoutes.find(
      (route) => route.path === "/low-altitude-screen"
    );

    expect(lowAltitudeScreenRoute).toBeTruthy();
    expect(lowAltitudeScreenRoute?.name).toBe("LowAltitudeScreen");
    expect(lowAltitudeScreenRoute?.component).not.toBe(Layout);
    expect(lowAltitudeScreenRoute?.meta?.hidden).toBe(true);
  });
});
