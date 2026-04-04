module.exports = {
  // Identity
  user: "Ɛpsilon",
  host: "3p5ilon",

  // Info rows
  info: [
    { key: "User", value: "Ɛpsilon", color: "red" },
    { key: "OS", value: "macOS · Arch Linux", color: "red" },
    { key: "Editor", value: "Neovim · Zed · VS Code", color: "peach" },
    {
      key: "Langs",
      value: "Python · TypeScript · JavaScript · C++ · C",
      color: "green",
    },
    { key: "ML", value: "PyTorch · Transformers · XGBoost", color: "green" },
    { key: "Backend", value: "FastAPI · gRPC", color: "teal" },
    { key: "Data", value: "PostgreSQL · Redis", color: "teal" },
    { key: "Infra", value: "Docker · Linux · AWS", color: "teal" },
    { key: "Focus", value: "Applied AI Systems", color: "mauve" },
    { key: "Now", value: "LLMs · Training · Inference", color: "mauve" },
    // "break", // You can uncomment this line to force a manual gap regardless of colors
    { key: "Site", value: "3p5ilon.github.io", color: "blue" },
  ],

  // Options
  options: {
    blankBetweenGroups: false, // Automatically skip a line when neighboring items have different colors
    userHostSep: "@",
    showSwatches: true,
  },

  // ASCII art
  ascii: {
    file: "ascii.txt",
    color: "sky",
  },
};
