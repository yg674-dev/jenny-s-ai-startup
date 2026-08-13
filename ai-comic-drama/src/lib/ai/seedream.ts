import { promises as fs } from "node:fs";
import path from "node:path";
import { ark, MODELS } from "./client";

const PUBLIC_DIR = path.join(process.cwd(), "public", "generated");

export type SupportedImageSize =
  | "864x1152"
  | "1024x1024"
  | "720x1280"
  | "1024x1536"
  | "1536x1024";

export type GenerateImageOptions = {
  prompt: string;
  scriptId: string;
  fileId: string;
  size?: SupportedImageSize;
  timeoutMs?: number;
};

export type GenerateImageResult = {
  imageUrl: string;
  remoteUrl?: string;
};

export async function generateImage({
  prompt,
  scriptId,
  fileId,
  size = "864x1152",
  timeoutMs = 45_000,
}: GenerateImageOptions): Promise<GenerateImageResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await runGenerate({ prompt, scriptId, fileId, size, controller });
  } finally {
    clearTimeout(timer);
  }
}

async function runGenerate({
  prompt,
  scriptId,
  fileId,
  size,
  controller,
}: Required<Omit<GenerateImageOptions, "timeoutMs">> & {
  controller: AbortController;
}): Promise<GenerateImageResult> {
  const resp = await ark.images.generate(
    { model: MODELS.image, prompt, size, n: 1, response_format: "url" },
    { signal: controller.signal },
  );

  const remoteUrl = resp.data?.[0]?.url;
  if (!remoteUrl) throw new Error("生图返回为空");

  const isPersistable = process.env.PERSIST_IMAGES !== "false";
  if (!isPersistable) {
    return { imageUrl: remoteUrl, remoteUrl };
  }

  const localRelative = `/generated/${scriptId}/${fileId}.png`;
  const localAbs = path.join(PUBLIC_DIR, scriptId, `${fileId}.png`);
  await fs.mkdir(path.dirname(localAbs), { recursive: true });

  const res = await fetch(remoteUrl, { signal: controller.signal });
  if (!res.ok) throw new Error(`下载生成图失败：${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(localAbs, buf);

  return { imageUrl: localRelative, remoteUrl };
}
