/** @type {import('@lhci/cli').Config} */
module.exports = {
  ci: {
    collect: {
      url: ["https://file-picker-smoky.vercel.app/"],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.95 }],
        "categories:accessibility": ["error", { minScore: 1.0 }],
        "categories:best-practices": ["error", { minScore: 1.0 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.05 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
