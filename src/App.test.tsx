import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
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
      ["TP53_M", "KRAS_M", 0.001, 0.9, 0.004, 0.9, 0.002, 0.8, 0.006, 0.8, 9, 0.001, 0.004, 0.003, 0.9, 0.007, 0.9],
      ["EGFR_M", "PIK3CA_M", 0.8, 0.001, 0.8, 0.004, 0.7, 0.002, 0.7, 0.006, 1, 0.2, 0.3, 0.8, 0.003, 0.8, 0.007],
      ["ALK_M", "ROS1_M", 0.0001, 0.8, 0.0002, 0.8, 0.0003, 0.7, 0.0004, 0.7, 12, 0.0002, 0.0004, 0.0005, 0.8, 0.0006, 0.8],
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

describe("Atlas critical flow", () => {
  beforeEach(() => {
    clearAtlasCache();
    window.history.replaceState(null, "", "/#view=explore&mode=consensus&compare=ME");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith("manifest.json")) return json(manifest);
        if (url.endsWith("index.json")) return json(index);
        if (url.endsWith("TCGA__LUAD.json")) return json(cohort);
        return { ok: false, status: 404, json: async () => ({}) } as Response;
      }),
    );
  });

  it("starts with a searchable choice, remains axe-clean, and opens addressable pair detail", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    expect(await screen.findByRole("heading", { name: "Choose a cancer." })).toBeInTheDocument();
    expect(window.location.hash).not.toContain("cohort=");
    // JSDOM has no canvas/layout engine, so contrast is verified in browser QA.
    const audit = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(audit.violations).toEqual([]);

    await user.type(screen.getByRole("combobox", { name: "Cancer and cohort search" }), "lung");
    await user.click(screen.getByText("Lung adenocarcinoma"));

    expect(await screen.findByRole("heading", { name: "Mutually exclusive" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Co-occurring" })).toBeInTheDocument();
    expect(screen.getByText("_M", { exact: true })).toBeInTheDocument();
    expect(screen.getByText("_N", { exact: true })).toBeInTheDocument();
    expect(window.location.hash).toContain("cohort=TCGA__LUAD");

    const gene = screen.getAllByText("TP53_M")[0];
    const resultButton = gene.closest("button");
    expect(resultButton).not.toBeNull();
    await user.click(resultButton!);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/FDR-supported at q < 0.01 in 3\/3/)).toBeInTheDocument();
    expect(screen.getByText(/1 sample had no background support/)).toBeInTheDocument();
    expect(window.location.hash).toContain("pair=ME%3A%3AKRAS_M%3A%3ATP53_M");

    await user.click(screen.getByRole("button", { name: "Close" }));
    await user.click(screen.getByRole("button", { name: "Open Atlas settings" }));
    await user.click(screen.getByRole("radio", { name: /^CBaSE\b/ }));
    await waitFor(() => expect(window.location.hash).toContain("mode=cbase"));
  });

  it("rejects a stale pair deep link when the active strict view excludes it", async () => {
    window.history.replaceState(
      null,
      "",
      "/#view=explore&cohort=TCGA__LUAD&mode=consensus&strict=1&pair=ME%3A%3AKRAS_M%3A%3ATP53_M&compare=ME",
    );
    const unsupported = structuredClone(cohort);
    unsupported.models.dig.rows[0][17] = 0.02;
    vi.mocked(fetch).mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("manifest.json")) return json(manifest);
      if (url.endsWith("index.json")) return json(index);
      if (url.endsWith("TCGA__LUAD.json")) return json(unsupported);
      return { ok: false, status: 404, json: async () => ({}) } as Response;
    });

    render(<App />);
    expect(await screen.findByRole("heading", { name: "Mutually exclusive" })).toBeInTheDocument();
    await waitFor(() => expect(window.location.hash).not.toContain("pair="));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("can rank and search comparison-only findings without inventing DIALECT evidence", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(await screen.findByRole("combobox", { name: "Cancer and cohort search" }), "lung");
    await user.click(screen.getByText("Lung adenocarcinoma"));
    await user.click(screen.getByRole("link", { name: "Compare" }));
    expect(await screen.findByRole("heading", { name: "Compare the evidence." })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Fisher" }));
    expect(await screen.findByText(/ALK_M \/ ROS1_M/)).toBeInTheDocument();
    await user.type(screen.getByRole("searchbox", { name: "Search compared gene pairs" }), "ROS1");
    expect(screen.getByText(/ALK_M \/ ROS1_M/)).toBeInTheDocument();
    expect(screen.getAllByText("not tested").length).toBeGreaterThan(0);
  });

  it("only makes comparison pairs clickable when the active consensus view can resolve them", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(await screen.findByRole("combobox", { name: "Cancer and cohort search" }), "lung");
    await user.click(screen.getByText("Lung adenocarcinoma"));
    await user.click(screen.getByRole("link", { name: "Compare" }));
    await user.click(await screen.findByRole("button", { name: "Fisher" }));

    const cbaseOnly = await screen.findByText("BRAF_M / NRAS_M");
    expect(cbaseOnly.closest("button")).toBeNull();
    expect(screen.queryByRole("button", { name: "BRAF_M / NRAS_M" })).not.toBeInTheDocument();
  });

  it("does not make another BMR's comparison pair clickable in a single-model view", async () => {
    window.history.replaceState(
      null,
      "",
      "/#view=compare&cohort=TCGA__LUAD&mode=cbase&compare=ME",
    );
    const user = userEvent.setup();
    render(<App />);
    expect(
      await screen.findByRole("button", { name: "BRAF_M / NRAS_M" }),
    ).toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: "Fisher" }));

    const cbaseOnly = await screen.findByText("BRAF_M / NRAS_M");
    const digOnly = screen.getByText("CDKN2A_M / RB1_M");
    expect(cbaseOnly.closest("button")).not.toBeNull();
    expect(digOnly.closest("button")).toBeNull();
    expect(screen.queryByRole("button", { name: "CDKN2A_M / RB1_M" })).not.toBeInTheDocument();
  });

  it("labels CBaSE-backed MutSig cells in the comparison table", async () => {
    window.history.replaceState(
      null,
      "",
      "/#view=compare&cohort=TCGA__LUAD&mode=mutsig&compare=ME",
    );
    const hybrid = structuredClone(cohort);
    hybrid.testing_universes.models.mutsig.origins.cbase_fallback = ["TP53_M"];
    vi.mocked(fetch).mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("manifest.json")) return json(manifest);
      if (url.endsWith("index.json")) return json(index);
      if (url.endsWith("TCGA__LUAD.json")) return json(hybrid);
      return { ok: false, status: 404, json: async () => ({}) } as Response;
    });

    render(<App />);
    const pair = await screen.findByRole("button", { name: "TP53_M / KRAS_M" });
    const row = pair.closest("tr");
    expect(row).not.toBeNull();
    expect(within(row!).getByText("CBaSE fallback")).toBeInTheDocument();
    expect(within(row!).getByText(/not a distinct MutSig lambda/)).toBeInTheDocument();
  });

  it("flags CBaSE-backed MutSig evidence and excludes it from consensus", async () => {
    window.history.replaceState(
      null,
      "",
      "/#view=explore&cohort=TCGA__LUAD&mode=mutsig&compare=ME",
    );
    const hybrid = structuredClone(cohort);
    hybrid.testing_universes.models.mutsig.origins.cbase_fallback = ["TP53_M"];
    vi.mocked(fetch).mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("manifest.json")) return json(manifest);
      if (url.endsWith("index.json")) return json(index);
      if (url.endsWith("TCGA__LUAD.json")) return json(hybrid);
      return { ok: false, status: 404, json: async () => ({}) } as Response;
    });

    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findAllByText(/CBaSE fallback/)).not.toHaveLength(0);
    const resultButton = screen.getAllByText("TP53_M")[0].closest("button");
    expect(resultButton).not.toBeNull();
    await user.click(resultButton!);
    expect(
      await screen.findByText(/excluded from three-background consensus/),
    ).toBeInTheDocument();
  });

  it("does not label fallback metadata when MutSig did not test the pair", async () => {
    window.history.replaceState(
      null,
      "",
      "/#view=explore&cohort=TCGA__LUAD&mode=cbase&compare=ME",
    );
    const absent = structuredClone(cohort);
    absent.testing_universes.models.mutsig.origins.cbase_fallback = ["TP53_M"];
    absent.models.mutsig.rows = absent.models.mutsig.rows.filter(
      (row) => !(row[0] === "TP53_M" && row[1] === "KRAS_M"),
    );
    vi.mocked(fetch).mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("manifest.json")) return json(manifest);
      if (url.endsWith("index.json")) return json(index);
      if (url.endsWith("TCGA__LUAD.json")) return json(absent);
      return { ok: false, status: 404, json: async () => ({}) } as Response;
    });

    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Mutually exclusive" })).toBeInTheDocument();
    expect(screen.queryByText(/MutSig → CBaSE fallback/)).not.toBeInTheDocument();

    const resultButton = screen.getAllByText("TP53_M")[0].closest("button");
    expect(resultButton).not.toBeNull();
    await user.click(resultButton!);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByText(/CBaSE fallback/)).not.toBeInTheDocument();
    expect(within(dialog).getByText("Not tested for this pair")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));
    await user.click(screen.getByRole("link", { name: "Compare" }));
    const pair = await screen.findByRole("button", { name: "TP53_M / KRAS_M" });
    const row = pair.closest("tr");
    expect(row).not.toBeNull();
    expect(within(row!).queryByText("CBaSE fallback")).not.toBeInTheDocument();
  });
});
