import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/App";
import { ThemeProvider } from "@/components/ui/theme";
import { clearAtlasCache } from "@/features/atlas/lib/atlas-data";

const fields = [
  "ga",
  "gb",
  "tau00",
  "tau10",
  "tau01",
  "tau11",
  "observed_both",
  "observed_b_only",
  "observed_a_only",
  "observed_neither",
  "tau1x",
  "taux1",
  "rho",
  "log_odds_ratio",
  "lrt",
  "wald",
  "p",
  "q",
  "direction",
  "rank",
  "tau_mass",
  "effective_n",
  "excluded_samples",
];

const modelRow = (direction: "ME" | "CO", rank: number) => [
  direction === "ME" ? "TP53_M" : "EGFR_M",
  direction === "ME" ? "KRAS_M" : "PIK3CA_M",
  0.8,
  0.1,
  0.1,
  direction === "ME" ? 0 : 0.03,
  direction === "ME" ? 1 : 14,
  8,
  9,
  82,
  0.1,
  0.12,
  direction === "ME" ? -0.4 : 0.5,
  null,
  direction === "ME" ? 7 : 18,
  null,
  0.001,
  0.004,
  direction,
  rank,
  560 / 561,
  560,
  1,
];

const pairModelRow = (ga: string, gb: string, direction: "ME" | "CO", rank: number) => {
  const row = modelRow(direction, rank);
  row[0] = ga;
  row[1] = gb;
  return row;
};

const baselineRow = (ga: string, gb: string, fisherMeQ: number) => [
  ga,
  gb,
  fisherMeQ / 2,
  0.9,
  fisherMeQ,
  0.9,
  0.8,
  0.8,
  0.8,
  0.8,
  1,
  0.2,
  0.3,
  0.8,
  0.8,
  0.8,
  0.8,
];

const manifest = {
  release_id: "k100-2026-08-26",
  schema_version: "2.0.0",
  immutable: true,
  generated_at: "2026-08-26T12:00:00Z",
  coverage: { cohorts: 1 },
  analysis: { k: 100 },
  bmrs: ["cbase", "dig", "mutsig"],
  methods: ["fisher", "discover", "megsa", "wesme_wesco"],
  index_file: "index.json",
  readme_file: "README.md",
  readme_sha256: "abc",
  readme_bytes: 100,
};

const index = {
  release_id: manifest.release_id,
  cohorts: [
    {
      id: "TCGA__LUAD",
      study: "TCGA",
      cohort: "LUAD",
      cancer: "Lung adenocarcinoma",
      n_samples: 561,
      median_mutations: 44,
      cbio: "https://example.org/cbio",
      data_file: "cohorts/TCGA__LUAD.json",
      data_sha256: "def",
      data_bytes: 1234,
    },
  ],
};

const cohort = {
  id: "TCGA__LUAD",
  drivers: ["TP53", "EGFR"],
  models: Object.fromEntries(
    ["cbase", "dig", "mutsig"].map((bmr) => {
      const modelOnlyRows =
        bmr === "cbase"
          ? [pairModelRow("BRAF_M", "NRAS_M", "ME", 2)]
          : bmr === "dig"
            ? [pairModelRow("CDKN2A_M", "RB1_M", "ME", 2)]
            : [];
      return [bmr, { fields, rows: [modelRow("ME", 1), modelRow("CO", 1), ...modelOnlyRows] }];
    }),
  ),
  baselines: {
    fields: [
      "ga",
      "gb",
      "fisher_me_p",
      "fisher_co_p",
      "fisher_me_q",
      "fisher_co_q",
      "discover_me_p",
      "discover_co_p",
      "discover_me_q",
      "discover_co_q",
      "megsa_lrt",
      "megsa_p",
      "megsa_q",
      "wesme_p",
      "wesco_p",
      "wesme_q",
      "wesco_q",
    ],
    rows: [
      baselineRow("TP53_M", "KRAS_M", 0.004),
      baselineRow("EGFR_M", "PIK3CA_M", 0.8),
      baselineRow("ALK_M", "ROS1_M", 0.0002),
      baselineRow("BRAF_M", "NRAS_M", 0.0003),
      baselineRow("CDKN2A_M", "RB1_M", 0.0004),
    ],
  },
  testing_universes: {
    models: { mutsig: { origins: { cbase_fallback: [] } } },
  },
};

function json(value: unknown) {
  return { ok: true, status: 200, json: async () => value } as Response;
}

function installFetch(cohortPayload: typeof cohort = cohort) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("manifest.json")) return json(manifest);
      if (url.endsWith("index.json")) return json(index);
      if (url.endsWith("TCGA__LUAD.json")) return json(cohortPayload);
      return { ok: false, status: 404, json: async () => ({}) } as Response;
    }),
  );
}

function resultIds(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll<HTMLElement>("[data-result-id]"))
    .map((element) => element.dataset.resultId)
    .filter((id): id is string => id != null)
    .sort();
}

function renderApp() {
  return render(
    <ThemeProvider>
      <App />
    </ThemeProvider>,
  );
}

describe("Atlas v2 critical flow", () => {
  beforeEach(() => {
    clearAtlasCache();
    window.localStorage.clear();
    window.history.replaceState(
      null,
      "",
      "/#view=explore&mode=consensus&display=list",
    );
    installFetch();
  });

  it("chooses cancer then cohort, defaults to both ranked lanes, and opens addressable evidence", async () => {
    const user = userEvent.setup();
    const { container } = renderApp();

    expect(await screen.findByRole("heading", { name: "Choose a cancer." })).toBeInTheDocument();
    const navigation = screen.getByRole("navigation", { name: "Primary" });
    const brand = screen.getByRole("link", { name: "DIALECT Atlas" });
    expect(brand.querySelector('img[src*="dialect-icon.png"]')).toHaveClass("sm:hidden");
    expect(brand.querySelector('img[src*="dialect-wordmark.png"]')).toHaveClass("hidden", "sm:block");
    expect(
      within(navigation)
        .getAllByRole("link")
        .slice(0, 3)
        .map((link) => link.textContent),
    ).toEqual(["About", "Explore", "Compare"]);

    await user.click(screen.getByRole("button", { name: /^Lung\b/ }));
    expect(await screen.findByText("Choose a study cohort.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Lung adenocarcinoma/ }));

    expect(await screen.findByRole("heading", { name: "Lung adenocarcinoma" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mutually exclusive" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Co-occurring" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Significant only" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "List" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("561").parentElement).toHaveTextContent("561 tumors");
    expect(screen.getByRole("button", { name: "Change cancer or cohort" })).toBeInTheDocument();
    expect(screen.queryByText(/All 3 backgrounds.*q/)).not.toBeInTheDocument();
    expect(window.location.hash).toContain("cohort=TCGA__LUAD");

    const audit = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(audit.violations).toEqual([]);

    const pair = container.querySelector<HTMLElement>(
      '[data-result-id="ME::KRAS_M::TP53_M"] button',
    );
    expect(pair).not.toBeNull();
    await user.click(pair!);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Significant under all 3 backgrounds")).toBeInTheDocument();
    expect(screen.getByText(/3\/3 distinct backgrounds agree on ME; 3\/3 meet q < 0\.01/)).toBeInTheDocument();
    expect(window.location.hash).toContain("pair=ME%3A%3AKRAS_M%3A%3ATP53_M");
  });

  it("keeps both interaction directions identical in the list and network", async () => {
    window.history.replaceState(
      null,
      "",
      "/#view=explore&cohort=TCGA__LUAD&mode=consensus&display=list",
    );
    const user = userEvent.setup();
    const { container } = renderApp();

    expect(await screen.findByRole("heading", { name: "Co-occurring" })).toBeInTheDocument();
    expect(resultIds(container)).toEqual([
      "CO::EGFR_M::PIK3CA_M",
      "ME::KRAS_M::TP53_M",
    ]);

    await user.click(screen.getByRole("button", { name: "Network" }));
    const network = await screen.findByRole("region", {
      name: "Interaction network",
    });
    expect(network).toHaveTextContent("1 ME + 1 CO");
    expect(window.location.hash).toContain("display=network");
  });

  it("changes the background model in Customize and recomputes the ranked result set", async () => {
    window.history.replaceState(
      null,
      "",
      "/#view=explore&cohort=TCGA__LUAD&mode=consensus&display=list",
    );
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByRole("heading", { name: "Mutually exclusive" })).toBeInTheDocument();
    expect(screen.queryByText("BRAF_M")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Customize Atlas results" }));
    await user.click(screen.getByRole("radio", { name: /^CBaSE\b/ }));
    await user.click(screen.getByRole("button", { name: "Close" }));

    await waitFor(() => expect(window.location.hash).toContain("mode=cbase"));
    expect(await screen.findByText("BRAF_M")).toBeInTheDocument();
  });

  it("shares q and significance filters and can recover the ranked list", async () => {
    window.history.replaceState(
      null,
      "",
      "/#view=explore&cohort=TCGA__LUAD&mode=consensus&display=list",
    );
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByRole("heading", { name: "Mutually exclusive" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Significant only" }));
    await waitFor(() => expect(window.location.hash).toContain("significant=1"));

    await user.click(screen.getByRole("button", { name: "Customize Atlas results" }));
    await user.click(screen.getByRole("button", { name: "0.001" }));
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(await screen.findByText("No pairs meet q < 0.001.")).toBeInTheDocument();
    expect(window.location.hash).toContain("q=0.001");
    await user.click(screen.getByRole("button", { name: "Show ranked pairs" }));
    await waitFor(() => expect(window.location.hash).not.toContain("significant="));
    expect(await screen.findByRole("heading", { name: "Mutually exclusive" })).toBeInTheDocument();
  });

  it("keeps ranked deep links but invalidates unsupported pairs in significant-only view", async () => {
    window.history.replaceState(
      null,
      "",
      "/#view=explore&cohort=TCGA__LUAD&mode=consensus&pair=ME%3A%3AKRAS_M%3A%3ATP53_M&display=list",
    );
    const unsupported = structuredClone(cohort);
    unsupported.models.dig.rows[0][17] = 0.02;
    installFetch(unsupported);

    const ranked = renderApp();
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Not significant under all 3 backgrounds")).toBeInTheDocument();
    expect(window.location.hash).toContain("pair=");

    ranked.unmount();
    clearAtlasCache();
    window.history.replaceState(
      null,
      "",
      "/#view=explore&cohort=TCGA__LUAD&mode=consensus&pair=ME%3A%3AKRAS_M%3A%3ATP53_M&display=list&significant=1",
    );
    renderApp();
    expect(await screen.findByRole("heading", { name: "Mutually exclusive" })).toBeInTheDocument();
    await waitFor(() => {
      expect(window.location.hash).not.toContain("pair=");
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("sorts comparison evidence and opens any DIALECT-tested pair regardless of Explore mode", async () => {
    window.history.replaceState(
      null,
      "",
      "/#view=compare&cohort=TCGA__LUAD&mode=consensus&display=list",
    );
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByRole("heading", { name: "Compare methods" })).toBeInTheDocument();
    const meSection = screen.getByRole("heading", { name: "Mutually exclusive" }).closest("section");
    expect(meSection).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Co-occurring" })).toBeInTheDocument();
    const table = within(meSection!).getByRole("table");
    await user.click(within(meSection!).getByRole("button", { name: "Sort by Fisher" }));
    const fisherHeader = within(meSection!).getByRole("columnheader", { name: /Fisher/ });
    expect(fisherHeader).toHaveAttribute("aria-sort", "ascending");
    expect(within(table).getAllByRole("row")[1]).toHaveTextContent("ALK_M / ROS1_M");
    expect(within(meSection!).queryByRole("button", { name: "ALK_M / ROS1_M" })).not.toBeInTheDocument();

    await user.click(within(meSection!).getByRole("button", { name: "Sort by Fisher" }));
    expect(fisherHeader).toHaveAttribute("aria-sort", "descending");
    await user.click(within(meSection!).getAllByRole("button", { name: "BRAF_M / NRAS_M" })[0]);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Not significant under all 3 backgrounds")).toBeInTheDocument();
    expect(screen.getByText(/1\/3 distinct backgrounds agree on ME; 1\/3 meet q < 0\.01/)).toBeInTheDocument();
    expect(window.location.hash).toContain("pair=ME%3A%3ABRAF_M%3A%3ANRAS_M");
  });

  it("shows an honest significant-only zero state and recovers ranked pairs", async () => {
    window.history.replaceState(
      null,
      "",
      "/#view=explore&cohort=TCGA__LUAD&mode=consensus&display=list&significant=1",
    );
    const empty = structuredClone(cohort);
    for (const model of Object.values(empty.models)) {
      for (const row of model.rows) row[17] = 0.02;
    }
    installFetch(empty);
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByText("No pairs meet q < 0.01.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show ranked pairs" }));
    await waitFor(() => expect(window.location.hash).not.toContain("significant="));
    expect(await screen.findByRole("heading", { name: "Mutually exclusive" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Co-occurring" })).toBeInTheDocument();
  });
});
