module.exports = {
  // Theme: Catppuccin Mocha
  theme: {
    bg: "#1e1e2e", // terminal bg
    border: "#313244", // card border

    palette: {
      text: "#cdd6f4",
      subtext: "#6c7086",
      sep: "#45475a",

      red: "#f38ba8",
      peach: "#fab387",
      yellow: "#f9e2af",
      green: "#a6e3a1",
      teal: "#94e2d5",
      sky: "#89dceb",
      blue: "#89b4fa",
      mauve: "#cba6f7",
      pink: "#f5c2e7",
      lavender: "#b4befe",
    },

    swatches: {
      normal: [
        "#45475a",
        "#f38ba8",
        "#a6e3a1",
        "#f9e2af",
        "#89b4fa",
        "#f5c2e7",
        "#94e2d5",
        "#bac2de",
      ],
      bright: [
        "#585b70",
        "#f38ba8",
        "#a6e3a1",
        "#f9e2af",
        "#89b4fa",
        "#f5c2e7",
        "#94e2d5",
        "#a6adc8",
      ],
    },
  },

  // Font
  font: {
    import:
      "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap",
    family:
      "'JetBrainsMono Nerd Font', 'JetBrains Mono', 'Courier New', monospace",
    size: 13,
    charRatio: 0.602,
  },

  // Layout
  layout: {
    width: 820, 
    paddingLeft: 32,
    paddingRight: 32,
    paddingTop: 34,
    paddingBottom: 34,
    columnGap: 48, // Spacing between ascii and columns
    lineHeight: 19, // Vertical spacing between text entries
  },
};
