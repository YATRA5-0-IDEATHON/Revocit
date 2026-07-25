require("dotenv").config();

const express = require("express");
const path = require("path");
const apiRoutes = require("./routes/api");
const { bootstrapVectorStore, indexDocuments } = require("./services/ragService");

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "1mb" }));

const publicDir = path.resolve(__dirname, "../../frontend/public");
app.use(express.static(publicDir));

app.use("/api", apiRoutes);

app.get("*", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

async function ensureData() {
  const vectorState = await bootstrapVectorStore();
  console.log("Vector provider:", vectorState);
  if (vectorState.ready) {
    const indexing = await indexDocuments();
    console.log("PDF index status:", indexing);
  }
}

ensureData()
  .then(() => {
    app.listen(port, () => {
      console.log(`Lawyersathi running at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Startup failed:", error.message);
    process.exit(1);
  });
