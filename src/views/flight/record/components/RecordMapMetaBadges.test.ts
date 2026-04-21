import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import RecordMapMetaBadges from "./RecordMapMetaBadges.vue";

describe("RecordMapMetaBadges", () => {
  it("renders location label and the three summary badges", async () => {
    render(RecordMapMetaBadges, {
      props: {
        locationLabel: "秦淮河东段河道走廊",
        trajectoryPointCount: 42,
      },
    });

    expect(await screen.findByText("秦淮河东段河道走廊")).not.toBeNull();
    expect(screen.getByText("Spark Snapshot")).not.toBeNull();
    expect(screen.getByText("Fixed Camera")).not.toBeNull();
    expect(screen.getByText("42 pts")).not.toBeNull();
  });
});
