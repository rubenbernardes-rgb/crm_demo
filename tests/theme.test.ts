import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const srcDir = fileURLToPath(new URL("../src", import.meta.url));

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...walk(path));
    else out.push(path);
  }
  return out;
}

const css = readFileSync(join(srcDir, "styles.css"), "utf8");

describe("Darkmatter theme", () => {
  it("light root block uses the Darkmatter primary color", () => {
    expect(css).toContain("--primary: #d87943");
    expect(css).toContain("--ring: #d87943");
  });

  it("has a .dark block with the Darkmatter dark background", () => {
    const darkStart = css.indexOf(".dark");
    expect(darkStart).toBeGreaterThan(-1);
    const darkBlock = css.slice(darkStart);
    expect(darkBlock).toContain("#121113");
    expect(darkBlock).toContain("--primary: #e78a53");
  });

  it("uses the Darkmatter radius and font stacks", () => {
    expect(css).toContain("--radius: 0.75rem");
    expect(css).toContain("--radius-sm: 8px");
    expect(css).toContain("--radius-lg: 16px");
    expect(css).toContain('"Geist Mono", ui-monospace, monospace');
    expect(css).toContain('"JetBrains Mono", ui-monospace, monospace');
  });

  it("removes the legacy brand hexes from the whole src tree", () => {
    const files = walk(srcDir).filter((f) => /\.(ts|tsx|css)$/.test(f));
    expect(files.length).toBeGreaterThan(0);
    const legacy = ["#ecad0a", "#209dd7", "#753991"];
    for (const file of files) {
      const text = readFileSync(file, "utf8").toLowerCase();
      for (const hex of legacy) {
        expect(text, `${file} still contains ${hex}`).not.toContain(hex);
      }
    }
  });
});
