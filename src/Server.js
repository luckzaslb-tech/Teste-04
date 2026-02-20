import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import OpenAI from "openai";

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: "gpt-4o-mini-transcribe"
    });

    fs.unlinkSync(req.file.path);

    res.json({ text: transcription.text });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro na transcrição" });
  }
});

app.listen(3001, () => {
  console.log("Servidor rodando na porta 3001");
});
