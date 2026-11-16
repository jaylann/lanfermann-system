import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";

addons.setConfig({
  theme: create({
    base: "light",
    brandTitle: "Lanfermann UI",
    colorPrimary: "#5f50d0",
    colorSecondary: "#5f50d0",
    appBg: "#fbfbfd",
    appContentBg: "#ffffff",
    appBorderColor: "#e3dff8",
    appBorderRadius: 8,
    textColor: "#13121c",
    textMutedColor: "#686775",
    barSelectedColor: "#5f50d0",
    fontBase: '"Sofia Sans Variable", "Sofia Sans", Arial, sans-serif',
    fontCode: '"JetBrains Mono Variable", "JetBrains Mono", monospace',
  }),
});
