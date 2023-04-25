import { defineConfig } from "vite";

export default defineConfig({
    base: process.env.GITHUB_PAGES  // この行を追加
        ? "mtgshop_map"            // この行を追加
        : "./",                     // この行を追加

});
