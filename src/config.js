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
      value: "Python · TypeScript · JavaScript · C++ · C · Astro · Bash · Lua",
      color: "green",
    },
    { key: "ML", value: "PyTorch · Transformers · XGBoost", color: "green" },
    { key: "Backend", value: "FastAPI · gRPC", color: "teal" },
    { key: "Data", value: "PostgreSQL · Redis · Unix", color: "teal" },
    { key: "Infra", value: "Git · Docker · Linux · AWS", color: "teal" },
    { key: "Focus", value: "Applied AI Systems", color: "mauve" },
    { key: "Now", value: "LLMs · Training · Inference", color: "mauve" },
    // "break", // You can uncomment this line to force a manual gap regardless of colors
    { key: "Site", value: "3p5ilon.github.io", color: "blue" },
  ],

  options: {
    blankBetweenGroups: false, // auto-skip line when neighboring items have different colors
    userHostSep: "@",
    showSwatches: true,
  },

  // ASCII/Image config
  ascii: {
    type: "image", // Toggle: "text" | "image"

    // Config for classic ASCII text mode
    text: {
      file: "ascii.txt",
      color: "sky",
      fontSize: 0, // 0 = use theme default, or set a custom size (e.g. 10)
    },

    // Config for PNG/JPG image mode
    image: {
      path: "profile.png",
      width: 250,
      height: 250,
    },
  },
};
