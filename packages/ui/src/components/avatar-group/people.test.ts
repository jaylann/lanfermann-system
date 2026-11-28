import { describe, expect, it } from "vitest";

import { initialsOf, personLabel } from "./people";

describe("initialsOf", () => {
  it("takes the first letters of the first and the last name", () => {
    expect(initialsOf("Anna Weber")).toBe("AW");
    expect(initialsOf("  anna maria  weber ")).toBe("AW");
    expect(initialsOf("Cher")).toBe("C");
    expect(initialsOf("  ")).toBe("");
  });

  it("takes a whole character where one is a pair of code units", () => {
    expect(initialsOf("𠮷田 太郎")).toBe("𠮷太");
  });

  it("raises the letters in the locale it is given, not in the runtime's", () => {
    expect(initialsOf("ilse irmgard")).toBe("II");
    expect(initialsOf("ilker ince", "tr")).toBe("İİ");
  });
});

describe("personLabel", () => {
  const labels = { online: "Im Dienst", away: "Abwesend", offline: "Offline" };

  it("puts the presence in brackets, in lower case", () => {
    expect(personLabel({ name: "Anna Weber" })).toBe("Anna Weber");
    expect(personLabel({ name: "Anna Weber", presence: "away" })).toBe("Anna Weber (abwesend)");
  });

  it("lowers it in the locale it is given, not in the runtime's", () => {
    expect(personLabel({ name: "Anna", presence: "online" }, labels)).toBe("Anna (im dienst)");
    expect(personLabel({ name: "Anna", presence: "online" }, labels, "tr")).toBe(
      "Anna (ım dienst)",
    );
  });
});
