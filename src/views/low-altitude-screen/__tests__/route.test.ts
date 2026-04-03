import { describe, expect, it } from "vitest";
import { constantRoutes } from "@/router";

describe("low-altitude screen route", () => {
  it("registers a dedicated /low-altitude-screen route under the layout", () => {
    const rootRoute = constantRoutes.find((route) => route.path === "/");
    const lowAltitudeScreenRoute = rootRoute?.children?.find(
      (route) => route.path === "low-altitude-screen"
    );

    expect(lowAltitudeScreenRoute).toBeTruthy();
    expect(lowAltitudeScreenRoute?.name).toBe("LowAltitudeScreen");
  });
});
