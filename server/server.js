const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Express server is running successfully!");
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
