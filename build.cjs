const fs = require("fs");
const path = require("path");
const webpack = require("next/dist/compiled/webpack/bundle5")().webpack;

const appRoot = path.join(__dirname, "..");
const distDir = path.join(__dirname, "dist");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(path.join(appRoot, ".env.local"));

fs.rmSync(distDir, { force: true, recursive: true });
fs.mkdirSync(distDir, { recursive: true });
fs.copyFileSync(path.join(__dirname, "index.html"), path.join(distDir, "index.html"));

const compiler = webpack({
  mode: "development",
  devtool: "eval-source-map",
  entry: path.join(__dirname, "entry.tsx"),
  output: {
    path: distDir,
    filename: "bundle.js",
    publicPath: "/",
  },
  resolve: {
    alias: {
      "lucide-react": path.join(__dirname, "lucide-react.tsx"),
    },
    extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
    modules: [path.join(appRoot, "node_modules"), "node_modules"],
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        include: [path.join(appRoot, "app"), __dirname],
        use: path.join(__dirname, "tsx-loader.cjs"),
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env.NEXT_PUBLIC_SUPABASE_URL": JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_URL || ""),
      "process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY": JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""),
    }),
  ],
});

compiler.run((error, stats) => {
  compiler.close(() => {});

  if (error) {
    console.error(error);
    process.exit(1);
  }

  const info = stats.toJson({ all: false, errors: true, warnings: true });

  if (stats.hasErrors()) {
    console.error(info.errors);
    process.exit(1);
  }

  if (stats.hasWarnings()) {
    console.warn(info.warnings);
  }

  console.log(`Preview bundle built in ${distDir}`);
});
