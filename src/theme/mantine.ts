import { createTheme } from "@mantine/core";

export const docmasterTheme = createTheme({
  fontFamily: "Poppins, sans-serif",
  fontFamilyMonospace: "monospace",
  headings: {
    fontFamily: "Bricolage Grotesque, sans-serif",
    fontWeight: "700",
  },
  primaryColor: "gold",
  primaryShade: 5,
  colors: {
    gold: [
      "#FEF0DC",
      "#FDE3B8",
      "#FCD694",
      "#FBC970",
      "#D98A30",
      "#D98A30",
      "#BD7020",
      "#A05818",
      "#834010",
      "#662808",
    ],
    green: [
      "#E8F5EE",
      "#C1E8D3",
      "#9ADBB8",
      "#73CE9D",
      "#4DC182",
      "#3B7A58",
      "#2D5A42",
      "#1E3A2F",
      "#152B22",
      "#0C1C15",
    ],
  },
  defaultRadius: "md",
  components: {
    Modal: {
      defaultProps: {
        radius: "lg",
        padding: "lg",
        centered: true,
        transitionProps: { transition: "pop" },
      },
      classNames: {
        root: "max-md:items-end",
        inner: "max-md:pb-0",
        content: "max-md:rounded-t-2xl max-md:rounded-b-none max-md:min-h-[50vh]",
      },
    },
    Button: {
      defaultProps: {
        radius: "lg",
      },
    },
    Card: {
      defaultProps: {
        radius: "lg",
        padding: "lg",
      },
    },
  },
});
