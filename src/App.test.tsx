import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/App";
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

function expectFact(label: string, value: string) {
  const fact = screen.getByText(label).parentElement;
  expect(fact).not.toBeNull();
  expect(fact).toHaveTextContent(value);
}

describe("Atlas v2 critical flow", () => {
  beforeEach(() => {
    clearAtlasCache();
    window.history.replaceState(
      null,
      "",
      "/#view=explore&mode=consensus&display=network&direction=all&compare=ME",
    );
    installFetch();
  });

  it("chooses cancer then cohort, shows significant counts, and opens addressable evidence", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    expect(await screen.findByRole("heading", { name: "Choose a cancer." })).toBeInTheDocument();
    const navigation = screen.getByRole("navigation", { name: "Primary" });
    expect(
      within(navigation)
        .getAllByRole("link")
        .slice(0, 3)
        .map((link) => link.textContent),
    ).toEqual(["About", "Explore", "Compare"]);

    await user.click(screen.getByRole("button", { name: /^Lung\b/ }));
    expect(await screen.findByText("Choose a study cohort.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Lung adenocarcinoma/ }));

    expect(await screen.findByRole("heading", { name: "Significant interactions" })).toBeInTheDocument();
    expectFact("Significant ME", "1");
    expectFact("Significant CO", "1");
    expect(window.location.hash).toContain("cohort=TCGA__LUAD");

    await user.click(screen.getByRole("button", { name: "Show list" }));
    expect(await screen.findByRole("heading", { name: "Mutually exclusive" })).toBeInTheDocument();
    const audit = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(audit.violations).toEqual([]);

    const pair = container.querySelector<HTMLElement>(
      '[data-result-id="ME::KRAS_M::TP53_M"] button',
    );
    expect(pair).not.toBeNull();
    await user.click(pair!);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Significant under all 3 backgrounds")).toBeInTheDocument();
    expect(screen.getByText(/3\/3 backgrounds agree on ME; 3\/3 meet/)).toBeInTheDocument();
    expect(window.location.hash).toContain("pair=ME%3A%3AKRAS_M%3A%3ATP53_M");
  });

  it("keeps a small significant result set identical in the network and list", async () => {
    window.history.replaceState(
      null,
      "",
      "/#view=explore&cohort=TCGA__LUAD&mode=consensus&display=network&direction=all&compare=ME",
    );
    const user = userEvent.setup();
    const { container } = render(<App />);

    const network = await screen.findByRole("region", {
      name: "Significant interaction network",
    });
    expect(
      network,
    ).toBeInTheDocument();
    expect(network).toHaveTextContent("2 significant pairs");

    await user.click(screen.getByRole("button", { name: "Show list" }));
    expect(await screen.findByRole("heading", { name: "Co-occurring" })).toBeInTheDocument();
    expect(resultIds(container)).toEqual([
      "CO::EGFR_M::PIK3CA_M",
      "ME::KRAS_M::TP53_M",
    ]);
    expect(window.location.hash).toContain("display=list");
  });

  it("changes the significance model in settings and recomputes the facts and result set", async () => {
    window.history.replaceState(
      null,
      "",
      "/#view=explore&cohort=TCGA__LUAD&mode=consensus&display=list&direction=all&compare=ME",
    );
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Significant interactions" })).toBeInTheDocument();
    expectFact("Significant ME", "1");
    await user.click(screen.getByRole("button", { name: "Open Atlas settings" }));
    await user.click(screen.getByRole("radio", { name: /^Significant with CBaSE\b/ }));
    await user.click(screen.getByRole("button", { name: "Close" }));

    await waitFor(() => expect(window.location.hash).toContain("mode=cbase"));
    expectFact("Significant ME", "2");
    expectFact("Significant CO", "1");
    expect(await screen.findByText("BRAF_M")).toBeInTheDocument();
  });

  it("ignores legacy strict state and removes a non-significant consensus pair deep link", async () => {
    window.history.replaceState(
      null,
      "",
      "/#view=explore&cohort=TCGA__LUAD&mode=consensus&strict=0&pair=ME%3A%3AKRAS_M%3A%3ATP53_M&display=list&direction=all&compare=ME",
    );
    const unsupported = structuredClone(cohort);
    unsupported.models.dig.rows[0][17] = 0.02;
    installFetch(unsupported);

    render(<App />);
    expect(await screen.findByRole("heading", { name: "Significant interactions" })).toBeInTheDocument();
    await waitFor(() => {
      expect(window.location.hash).not.toContain("pair=");
      expect(window.location.hash).not.toContain("strict=");
    });
    expectFact("Significant ME", "0");
    expectFact("Significant CO", "1");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("sorts comparison evidence and opens any DIALECT-tested pair regardless of Explore mode", async () => {
    window.history.replaceState(
      null,
      "",
      "/#view=compare&cohort=TCGA__LUAD&mode=consensus&display=network&direction=all&compare=ME",
    );
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Compare methods" })).toBeInTheDocument();
    const table = screen.getByRole("table");
    await user.click(screen.getByRole("button", { name: "Sort by Fisher" }));
    const fisherHeader = screen.getByRole("columnheader", { name: /Fisher q/ });
    expect(fisherHeader).toHaveAttribute("aria-sort", "ascending");
    expect(within(table).getAllByRole("row")[1]).toHaveTextContent("ALK_M / ROS1_M");
    expect(screen.queryByRole("button", { name: "ALK_M / ROS1_M" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sort by Fisher" }));
    expect(fisherHeader).toHaveAttribute("aria-sort", "descending");
    await user.click(screen.getAllByRole("button", { name: "BRAF_M / NRAS_M" })[0]);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Not significant under all 3 backgrounds")).toBeInTheDocument();
    expect(screen.getByText(/1\/3 backgrounds agree on ME; 1\/3 meet/)).toBeInTheDocument();
    expect(window.location.hash).toContain("pair=ME%3A%3ABRAF_M%3A%3ANRAS_M");
  });

  it("shows an honest zero state and offers model recovery", async () => {
    window.history.replaceState(
      null,
      "",
      "/#view=explore&cohort=TCGA__LUAD&mode=consensus&display=list&direction=all&compare=ME",
    );
    const empty = structuredClone(cohort);
    for (const model of Object.values(empty.models)) {
      for (const row of model.rows) row[17] = 0.02;
    }
    installFetch(empty);
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText("No significant pairs in this view.")).toBeInTheDocument();
    expectFact("Significant ME", "0");
    expectFact("Significant CO", "0");
    await user.click(screen.getByRole("button", { name: "Choose another model" }));
    expect(await screen.findByRole("heading", { name: "Result definition" })).toBeInTheDocument();
    expect(window.location.hash).toContain("settings=1");
  });
});
